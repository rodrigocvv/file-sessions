/**
 * Application layer: Timeline snapshot business logic
 * Manages automatic timeline history of workspace context
 */

import * as vscode from 'vscode';
import {
  TimelineSnapshot,
  createTimelineSnapshot,
} from '../domain/session';
import { deduplicateFiles } from '../domain/validators';
import { SessionRepository } from '../infrastructure/sessionRepository';
import { SessionEvents } from '../events/sessionEvents';
import * as vscodeAdapter from '../infrastructure/vscodeAdapter';

const MAX_SNAPSHOTS = 50;
const MIN_SNAPSHOT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
const DEBOUNCE_DELAY_MS = 1000; // 1 second
const INACTIVITY_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const RAPID_FILE_OPEN_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const RAPID_FILE_OPEN_THRESHOLD = 4; // 4+ files
const CONTEXT_CHANGE_THRESHOLD = 0.6; // 60% change

interface FileOpenEvent {
  path: string;
  timestamp: number;
}

export class TimelineService {
  private snapshots: TimelineSnapshot[] = [];
  private isRestoring: boolean = false;
  private lastSnapshotTime: number = 0;
  private lastActivityTime: number = Date.now();
  private recentFileOpens: FileOpenEvent[] = [];
  private debounceTimer: NodeJS.Timeout | undefined;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly repository: SessionRepository,
    private readonly events: SessionEvents,
    private readonly logger: vscode.OutputChannel
  ) {}

  /**
   * Initialize service by loading snapshots and starting monitoring
   */
  async initialize(): Promise<void> {
    try {
      this.snapshots = await this.repository.loadTimelineSnapshots();
      this.logger.appendLine(
        `Initialized timeline with ${this.snapshots.length} snapshots`
      );

      // Start monitoring file events if enabled
      const enabled = vscodeAdapter.getConfiguration('timeline.enabled', true);
      if (enabled) {
        this.startMonitoring();
      } else {
        this.logger.appendLine('Timeline is disabled');
      }
    } catch (error) {
      this.logger.appendLine(
        `Failed to initialize timeline: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      this.snapshots = [];
    }
  }

  /**
   * Get all timeline snapshots, sorted by timestamp descending
   */
  getAllSnapshots(): TimelineSnapshot[] {
    return [...this.snapshots].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get snapshot by ID
   */
  getSnapshotById(id: string): TimelineSnapshot | undefined {
    return this.snapshots.find((s) => s.id === id);
  }

  /**
   * Create a new timeline snapshot from current open files
   */
  async createSnapshot(): Promise<TimelineSnapshot | string> {
    try {
      // Guard: Don't create snapshot while restoring
      if (this.isRestoring) {
        return 'Cannot create snapshot during restore';
      }

      // Enforce minimum interval between snapshots
      const now = Date.now();
      const timeSinceLastSnapshot = now - this.lastSnapshotTime;
      if (timeSinceLastSnapshot < MIN_SNAPSHOT_INTERVAL_MS) {
        const remainingSeconds = Math.ceil(
          (MIN_SNAPSHOT_INTERVAL_MS - timeSinceLastSnapshot) / 1000
        );
        return `Please wait ${remainingSeconds} seconds before creating another snapshot`;
      }

      // Collect all open files
      const openFiles = vscodeAdapter.getAllOpenFiles();

      if (openFiles.length === 0) {
        return 'No files are currently open';
      }

      // Deduplicate files
      const deduplicatedFiles = deduplicateFiles(openFiles);

      // Create snapshot
      const snapshot = createTimelineSnapshot(deduplicatedFiles);
      this.snapshots.push(snapshot);
      this.lastSnapshotTime = now;

      // Enforce retention policy (keep max 50 snapshots)
      this.enforceRetentionPolicy();

      // Save to storage
      await this.repository.saveTimelineSnapshots(this.snapshots);

      // Emit event
      this.events.emit({ type: 'timelineSnapshotCreated', snapshot });

      this.logger.appendLine(
        `Created timeline snapshot with ${deduplicatedFiles.length} files`
      );

      return snapshot;
    } catch (error) {
      const message = `Failed to create snapshot: ${
        error instanceof Error ? error.message : String(error)
      }`;
      this.logger.appendLine(message);
      return message;
    }
  }

  /**
   * Delete a timeline snapshot
   */
  async deleteSnapshot(snapshotId: string): Promise<boolean | string> {
    try {
      const index = this.snapshots.findIndex((s) => s.id === snapshotId);
      if (index === -1) {
        return 'Snapshot not found';
      }

      const snapshot = this.snapshots[index];
      this.snapshots.splice(index, 1);

      // Save to storage
      await this.repository.saveTimelineSnapshots(this.snapshots);

      // Emit event
      this.events.emit({ type: 'timelineSnapshotDeleted', snapshot });

      this.logger.appendLine(`Deleted timeline snapshot ${snapshotId}`);

      return true;
    } catch (error) {
      const message = `Failed to delete snapshot: ${
        error instanceof Error ? error.message : String(error)
      }`;
      this.logger.appendLine(message);
      return message;
    }
  }

  /**
   * Delete all timeline snapshots
   */
  async clearAllSnapshots(): Promise<void> {
    try {
      const count = this.snapshots.length;
      this.snapshots = [];

      // Save to storage
      await this.repository.saveTimelineSnapshots(this.snapshots);

      this.logger.appendLine(`Cleared ${count} timeline snapshots`);
    } catch (error) {
      this.logger.appendLine(
        `Failed to clear snapshots: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  /**
   * Restore a timeline snapshot (open all files from snapshot)
   */
  async restoreSnapshot(snapshotId: string): Promise<void> {
    try {
      const snapshot = this.getSnapshotById(snapshotId);
      if (!snapshot) {
        vscodeAdapter.showError('Snapshot not found');
        return;
      }

      // Set restoring flag to prevent snapshot creation during restore
      this.isRestoring = true;

      this.logger.appendLine(`Restoring timeline snapshot ${snapshotId}`);

      // Check configuration for closing existing editors
      const closeExisting = vscodeAdapter.getConfiguration(
        'closeExistingEditorsOnOpen',
        false
      );

      if (closeExisting) {
        // Close only editors that are not in the snapshot
        const snapshotFilePaths = snapshot.files.map((f) => f.path);
        await vscodeAdapter.closeEditorsExcept(snapshotFilePaths);
      }

      // Open files and collect missing ones (silently skip)
      const missingFiles: string[] = [];
      for (const file of snapshot.files) {
        const opened = await vscodeAdapter.openFile(
          file.path,
          file.workspaceFolder
        );
        if (!opened) {
          missingFiles.push(file.path);
        }
      }

      // Log missing files silently (no user notification)
      if (missingFiles.length > 0) {
        this.logger.appendLine(
          `Skipped ${missingFiles.length} missing files: ${missingFiles.join(', ')}`
        );
      }

      this.logger.appendLine(`Restored timeline snapshot ${snapshotId}`);
    } catch (error) {
      const message = `Failed to restore snapshot: ${
        error instanceof Error ? error.message : String(error)
      }`;
      this.logger.appendLine(message);
      vscodeAdapter.showError(message);
    } finally {
      // Clear restoring flag after a delay to ensure restore is complete
      setTimeout(() => {
        this.isRestoring = false;
      }, 500);
    }
  }

  /**
   * Enforce retention policy (keep only the latest 50 snapshots)
   */
  private enforceRetentionPolicy(): void {
    if (this.snapshots.length > MAX_SNAPSHOTS) {
      // Sort by timestamp ascending and remove oldest
      this.snapshots.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = this.snapshots.length - MAX_SNAPSHOTS;
      this.snapshots.splice(0, toRemove);

      this.logger.appendLine(
        `Enforced retention policy: removed ${toRemove} oldest snapshots`
      );
    }
  }

  /**
   * Start monitoring file events for automatic snapshot triggers
   */
  private startMonitoring(): void {
    // Check if already monitoring
    if (this.disposables.length > 0) {
      return;
    }

    this.logger.appendLine('Starting timeline monitoring');

    // Monitor text document open events
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((document) => {
        if (document.uri.scheme === 'file') {
          this.handleFileActivity(document.uri.fsPath);
        }
      })
    );

    // Monitor text document close events
    this.disposables.push(
      vscode.workspace.onDidCloseTextDocument((document) => {
        if (document.uri.scheme === 'file') {
          this.handleFileActivity(document.uri.fsPath);
        }
      })
    );

    // Monitor visible text editors change
    this.disposables.push(
      vscode.window.onDidChangeVisibleTextEditors(() => {
        this.handleFileActivity();
      })
    );
  }

  /**
   * Stop monitoring file events
   */
  private stopMonitoring(): void {
    this.logger.appendLine('Stopping timeline monitoring');

    // Dispose all event subscriptions
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];

    // Clear any pending debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
  }

  /**
   * Reconfigure based on settings change
   */
  reconfigure(): void {
    const enabled = vscodeAdapter.getConfiguration('timeline.enabled', true);

    if (enabled && this.disposables.length === 0) {
      this.startMonitoring();
    } else if (!enabled && this.disposables.length > 0) {
      this.stopMonitoring();
    }
  }

  /**
   * Handle file activity event
   */
  private handleFileActivity(filePath?: string): void {
    // Update activity timestamp
    this.lastActivityTime = Date.now();

    // Track file opens
    if (filePath) {
      this.recentFileOpens.push({
        path: filePath,
        timestamp: Date.now(),
      });

      // Clean old file open events (older than window)
      const cutoff = Date.now() - RAPID_FILE_OPEN_WINDOW_MS;
      this.recentFileOpens = this.recentFileOpens.filter(
        (event) => event.timestamp > cutoff
      );
    }

    // Debounce: delay evaluation to batch rapid changes
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.evaluateTriggers();
    }, DEBOUNCE_DELAY_MS);
  }

  /**
   * Evaluate snapshot triggers and create snapshot if conditions are met
   */
  private async evaluateTriggers(): Promise<void> {
    // Skip if restoring
    if (this.isRestoring) {
      return;
    }

    // Skip if too soon since last snapshot
    const now = Date.now();
    const timeSinceLastSnapshot = now - this.lastSnapshotTime;
    if (timeSinceLastSnapshot < MIN_SNAPSHOT_INTERVAL_MS) {
      return;
    }

    // Get current open files
    const currentFiles = vscodeAdapter.getAllOpenFiles();
    const currentPaths = new Set(currentFiles.map((f) => f.path.toLowerCase()));

    // Trigger 1: 60%+ file change
    if (this.snapshots.length > 0) {
      const lastSnapshot = this.snapshots[this.snapshots.length - 1];
      const lastPaths = new Set(
        lastSnapshot.files.map((f) => f.path.toLowerCase())
      );

      const overlapCount = Array.from(currentPaths).filter((path) =>
        lastPaths.has(path)
      ).length;
      const totalCount = Math.max(currentPaths.size, lastPaths.size);

      if (totalCount > 0) {
        const changePercentage = 1 - overlapCount / totalCount;
        if (changePercentage >= CONTEXT_CHANGE_THRESHOLD) {
          this.logger.appendLine(
            `Trigger: ${Math.round(changePercentage * 100)}% context change`
          );
          await this.createSnapshot();
          return;
        }
      }
    }

    // Trigger 2: 4+ files opened within 2 minutes
    if (this.recentFileOpens.length >= RAPID_FILE_OPEN_THRESHOLD) {
      this.logger.appendLine(
        `Trigger: ${this.recentFileOpens.length} files opened rapidly`
      );
      await this.createSnapshot();
      this.recentFileOpens = []; // Clear after creating snapshot
      return;
    }

    // Trigger 3: 10 minutes of inactivity + different file set
    const timeSinceLastActivity = now - this.lastActivityTime;
    if (timeSinceLastActivity >= INACTIVITY_THRESHOLD_MS) {
      if (this.snapshots.length > 0) {
        const lastSnapshot = this.snapshots[this.snapshots.length - 1];
        const lastPaths = new Set(
          lastSnapshot.files.map((f) => f.path.toLowerCase())
        );

        // Check if current file set is different
        const isDifferent =
          currentPaths.size !== lastPaths.size ||
          !Array.from(currentPaths).every((path) => lastPaths.has(path));

        if (isDifferent) {
          this.logger.appendLine(
            `Trigger: inactivity (${Math.round(timeSinceLastActivity / 60000)} min) + context change`
          );
          await this.createSnapshot();
          return;
        }
      }
    }
  }

  /**
   * Notify the service about a branch change (external trigger)
   */
  async notifyBranchChange(): Promise<void> {
    // Check if enabled
    const enabled = vscodeAdapter.getConfiguration('timeline.enabled', true);
    if (!enabled) {
      return;
    }

    // Skip if restoring or too soon since last snapshot
    const now = Date.now();
    const timeSinceLastSnapshot = now - this.lastSnapshotTime;
    if (this.isRestoring || timeSinceLastSnapshot < MIN_SNAPSHOT_INTERVAL_MS) {
      return;
    }

    this.logger.appendLine('Trigger: Git branch change');
    await this.createSnapshot();
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.stopMonitoring();
  }
}
