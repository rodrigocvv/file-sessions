/**
 * Application layer: Git branch change orchestrator
 * Coordinates branch switching with automatic session save/restore
 */

import * as vscode from 'vscode';
import { GitAdapter, GitBranchInfo } from '../infrastructure/gitAdapter';
import { BranchSessionService } from './branchSessionService';
import { TimelineService } from './timelineService';
import * as vscodeAdapter from '../infrastructure/vscodeAdapter';

export class GitBranchOrchestrator implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  private readonly previousBranches = new Map<string, string>(); // workspaceFolderUri -> branchName
  private isWatching: boolean = false;

  constructor(
    private readonly gitAdapter: GitAdapter,
    private readonly branchSessionService: BranchSessionService,
    private readonly timelineService: TimelineService,
    private readonly logger: vscode.OutputChannel
  ) {}

  /**
   * Start watching for branch changes
   */
  startWatching(): void {
    if (this.isWatching) {
      return;
    }

    // Check if enabled
    const enabled = vscodeAdapter.getConfiguration('gitBranchSessions.enabled', true);
    if (!enabled) {
      this.logger.appendLine('Git branch sessions are disabled');
      return;
    }

    this.logger.appendLine('Starting Git branch change monitoring');

    // Initialize current branches for all workspace folders
    const workspaceFolders = vscode.workspace.workspaceFolders || [];
    for (const folder of workspaceFolders) {
      const currentBranch = this.gitAdapter.getCurrentBranch(folder);
      if (currentBranch) {
        this.previousBranches.set(folder.uri.toString(), currentBranch);
        this.logger.appendLine(
          `Initialized current branch for ${folder.name}: ${currentBranch}`
        );
      }
    }

    // Subscribe to branch changes
    const subscription = this.gitAdapter.onBranchChange((info) =>
      this.handleBranchChange(info)
    );
    this.disposables.push(subscription);

    this.isWatching = true;
  }

  /**
   * Stop watching for branch changes
   */
  stopWatching(): void {
    if (!this.isWatching) {
      return;
    }

    this.logger.appendLine('Stopping Git branch change monitoring');

    // Dispose all subscriptions
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables.length = 0;

    this.previousBranches.clear();
    this.isWatching = false;
  }

  /**
   * Handle branch change event
   */
  private async handleBranchChange(info: GitBranchInfo): Promise<void> {
    try {
      // Check if enabled (reactive to config changes)
      const enabled = vscodeAdapter.getConfiguration('gitBranchSessions.enabled', true);
      if (!enabled) {
        return;
      }

      const folderUri = info.workspaceFolder.uri.toString();
      const previousBranch = this.previousBranches.get(folderUri);
      const newBranch = info.branchName;

      // Skip if branch hasn't actually changed
      if (previousBranch === newBranch) {
        return;
      }

      this.logger.appendLine(
        `Branch changed in ${info.workspaceFolder.name}: ${previousBranch || '(none)'} -> ${newBranch}`
      );

      // Step 1: Save current files to the previous branch session
      if (previousBranch) {
        await this.savePreviousBranchSession(
          previousBranch,
          info.workspaceFolder.name
        );
      }

      // Step 2: Update tracked branch
      this.previousBranches.set(folderUri, newBranch);

      // Step 3: Check if auto-restore is enabled
      const autoRestore = vscodeAdapter.getConfiguration(
        'gitBranchSessions.autoRestoreOnSwitch',
        true
      );

      if (autoRestore) {
        // Try to restore the new branch session
        const session = this.branchSessionService.getBranchSession(
          newBranch,
          info.workspaceFolder.name
        );

        if (session) {
          this.logger.appendLine(
            `Auto-restoring session for branch "${newBranch}"`
          );
          await this.branchSessionService.restoreBranchSession(
            newBranch,
            info.workspaceFolder.name
          );
        } else {
          // Session doesn't exist - check if we should create it
          const autoCreate = vscodeAdapter.getConfiguration(
            'gitBranchSessions.autoCreate',
            true
          );

          if (autoCreate) {
            this.logger.appendLine(
              `Creating new session for branch "${newBranch}"`
            );
            await this.branchSessionService.saveBranchSession(
              newBranch,
              info.workspaceFolder.name
            );
          } else {
            this.logger.appendLine(
              `No session found for branch "${newBranch}" and auto-create is disabled`
            );
          }
        }
      } else {
        this.logger.appendLine(
          `Auto-restore is disabled, not restoring session for branch "${newBranch}"`
        );

        // Even if auto-restore is disabled, we might want to create the session
        const session = this.branchSessionService.getBranchSession(
          newBranch,
          info.workspaceFolder.name
        );

        if (!session) {
          const autoCreate = vscodeAdapter.getConfiguration(
            'gitBranchSessions.autoCreate',
            true
          );

          if (autoCreate) {
            this.logger.appendLine(
              `Creating new session for branch "${newBranch}"`
            );
            await this.branchSessionService.saveBranchSession(
              newBranch,
              info.workspaceFolder.name
            );
          }
        }
      }

      // Step 4: Create timeline snapshot after branch switch completes
      await this.timelineService.notifyBranchChange();
    } catch (error) {
      this.logger.appendLine(
        `Error handling branch change: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Save files to the previous branch session
   */
  private async savePreviousBranchSession(
    branchName: string,
    workspaceFolder: string
  ): Promise<void> {
    try {
      this.logger.appendLine(
        `Saving current files to session for branch "${branchName}"`
      );

      const result = await this.branchSessionService.saveBranchSession(
        branchName,
        workspaceFolder
      );

      if (typeof result === 'string') {
        // Error occurred
        this.logger.appendLine(`Failed to save previous branch session: ${result}`);
      }
    } catch (error) {
      this.logger.appendLine(
        `Error saving previous branch session: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Reconfigure based on settings change
   */
  reconfigure(): void {
    const enabled = vscodeAdapter.getConfiguration('gitBranchSessions.enabled', true);

    if (enabled && !this.isWatching) {
      this.startWatching();
    } else if (!enabled && this.isWatching) {
      this.stopWatching();
    }
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.stopWatching();
  }
}
