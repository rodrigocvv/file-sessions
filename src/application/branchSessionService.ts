/**
 * Application layer: Branch session business logic
 * Manages automatic sessions tied to Git branches
 */

import * as vscode from 'vscode';
import {
  BranchSession,
  createBranchSession,
  updateBranchSession,
  generateBranchSessionId,
} from '../domain/session';
import { deduplicateFiles } from '../domain/validators';
import { SessionRepository } from '../infrastructure/sessionRepository';
import { SessionEvents } from '../events/sessionEvents';
import * as vscodeAdapter from '../infrastructure/vscodeAdapter';

export class BranchSessionService {
  private branchSessions: BranchSession[] = [];
  private isRestoring: boolean = false;

  constructor(
    private readonly repository: SessionRepository,
    private readonly events: SessionEvents,
    private readonly logger: vscode.OutputChannel
  ) {}

  /**
   * Initialize service by loading branch sessions from storage
   */
  async initialize(): Promise<void> {
    try {
      this.branchSessions = await this.repository.loadBranchSessions();
      this.logger.appendLine(
        `Initialized with ${this.branchSessions.length} branch sessions`
      );
    } catch (error) {
      this.logger.appendLine(
        `Failed to initialize branch sessions: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      this.branchSessions = [];
    }
  }

  /**
   * Get all branch sessions
   */
  getAllBranchSessions(): BranchSession[] {
    return [...this.branchSessions];
  }

  /**
   * Get branch session by branch name and workspace folder
   */
  getBranchSession(
    branchName: string,
    workspaceFolder: string
  ): BranchSession | undefined {
    const id = generateBranchSessionId(branchName, workspaceFolder);
    return this.branchSessions.find((s) => s.id === id);
  }

  /**
   * Get branch session by ID
   */
  getBranchSessionById(id: string): BranchSession | undefined {
    return this.branchSessions.find((s) => s.id === id);
  }

  /**
   * Save currently open files to a branch session
   */
  async saveBranchSession(
    branchName: string,
    workspaceFolder: string
  ): Promise<BranchSession | string> {
    try {
      // Guard: Don't save while restoring (prevents loops)
      if (this.isRestoring) {
        this.logger.appendLine(
          `Skipping save for branch "${branchName}" - currently restoring`
        );
        return 'Cannot save while restoring';
      }

      // Check if enabled
      const enabled = vscodeAdapter.getConfiguration(
        'gitBranchSessions.enabled',
        true
      );
      if (!enabled) {
        return 'Branch sessions are disabled';
      }

      // Collect all open files from tabs
      const sessionFiles = vscodeAdapter.getAllOpenFiles();

      // Filter files for this workspace folder
      const workspaceFolderFiles = sessionFiles.filter(
        (f) => f.workspaceFolder === workspaceFolder
      );

      // Deduplicate files
      const deduplicatedFiles = deduplicateFiles(workspaceFolderFiles);

      // Find existing session or create new one
      const existingSession = this.getBranchSession(branchName, workspaceFolder);

      if (existingSession) {
        // Update existing session
        const updatedSession = updateBranchSession(existingSession, {
          files: deduplicatedFiles,
        });

        const index = this.branchSessions.findIndex((s) => s.id === existingSession.id);
        this.branchSessions[index] = updatedSession;

        // Persist to storage
        await this.repository.saveBranchSessions(this.branchSessions);

        // Emit event
        this.events.emit({ type: 'branchSessionUpdated', session: updatedSession });

        this.logger.appendLine(
          `Updated branch session "${branchName}" (${workspaceFolder}) with ${deduplicatedFiles.length} files`
        );

        return updatedSession;
      } else {
        // Check if autoCreate is enabled
        const autoCreate = vscodeAdapter.getConfiguration(
          'gitBranchSessions.autoCreate',
          true
        );
        if (!autoCreate) {
          return 'Auto-create is disabled';
        }

        // Create new session
        const session = createBranchSession(
          branchName,
          workspaceFolder,
          deduplicatedFiles
        );

        // Add to sessions
        this.branchSessions.push(session);

        // Persist to storage
        await this.repository.saveBranchSessions(this.branchSessions);

        // Emit event
        this.events.emit({ type: 'branchSessionCreated', session });

        this.logger.appendLine(
          `Created branch session "${branchName}" (${workspaceFolder}) with ${deduplicatedFiles.length} files`
        );

        return session;
      }
    } catch (error) {
      const message = `Failed to save branch session: ${
        error instanceof Error ? error.message : String(error)
      }`;
      this.logger.appendLine(message);
      return message;
    }
  }

  /**
   * Restore files from a branch session
   */
  async restoreBranchSession(
    branchName: string,
    workspaceFolder: string
  ): Promise<void> {
    try {
      const session = this.getBranchSession(branchName, workspaceFolder);
      if (!session) {
        this.logger.appendLine(
          `No branch session found for "${branchName}" (${workspaceFolder})`
        );
        return;
      }

      this.logger.appendLine(
        `Restoring branch session "${branchName}" (${workspaceFolder})`
      );

      // Set guard to prevent saving while restoring
      this.isRestoring = true;

      try {
        // Check configuration for closing existing editors
        const closeExisting = vscodeAdapter.getConfiguration(
          'closeExistingEditorsOnOpen',
          false
        );

        if (closeExisting) {
          // Close only editors that are not in the session
          const sessionFilePaths = session.files.map((f) => f.path);
          await vscodeAdapter.closeEditorsExcept(sessionFilePaths);
        }

        // Open files and collect missing ones
        const missingFiles: string[] = [];
        for (const file of session.files) {
          const opened = await vscodeAdapter.openFile(file.path, file.workspaceFolder);
          if (!opened) {
            missingFiles.push(file.path);
          }
        }

        // Log missing files (don't show UI warning for automatic restores)
        if (missingFiles.length > 0) {
          this.logger.appendLine(
            `Missing files in branch session: ${missingFiles.join(', ')}`
          );
        }

        // Update last opened timestamp
        const updatedSession = updateBranchSession(session, {});
        const index = this.branchSessions.findIndex((s) => s.id === session.id);
        this.branchSessions[index] = updatedSession;
        await this.repository.saveBranchSessions(this.branchSessions);

        // Emit event
        this.events.emit({ type: 'branchSessionRestored', session: updatedSession });

        this.logger.appendLine(
          `Restored branch session "${branchName}" (${workspaceFolder})`
        );
      } finally {
        // Always clear guard
        this.isRestoring = false;
      }
    } catch (error) {
      const message = `Failed to restore branch session: ${
        error instanceof Error ? error.message : String(error)
      }`;
      this.logger.appendLine(message);
      // Don't show error dialog for automatic restores
      this.isRestoring = false;
    }
  }

  /**
   * Manually open a branch session from the UI
   */
  async openBranchSession(sessionId: string): Promise<void> {
    try {
      const session = this.getBranchSessionById(sessionId);
      if (!session) {
        vscodeAdapter.showError('Branch session not found');
        return;
      }

      this.logger.appendLine(
        `Manually opening branch session "${session.branchName}" (${session.workspaceFolder})`
      );

      // Set guard to prevent saving while restoring
      this.isRestoring = true;

      try {
        // Check configuration for closing existing editors
        const closeExisting = vscodeAdapter.getConfiguration(
          'closeExistingEditorsOnOpen',
          false
        );

        if (closeExisting) {
          // Close only editors that are not in the session
          const sessionFilePaths = session.files.map((f) => f.path);
          await vscodeAdapter.closeEditorsExcept(sessionFilePaths);
        }

        // Open files and collect missing ones
        const missingFiles: string[] = [];
        for (const file of session.files) {
          const opened = await vscodeAdapter.openFile(file.path, file.workspaceFolder);
          if (!opened) {
            missingFiles.push(file.path);
          }
        }

        // Show warning for missing files
        if (missingFiles.length > 0) {
          const message =
            missingFiles.length === 1
              ? `1 file could not be opened: ${missingFiles[0]}`
              : `${missingFiles.length} files could not be opened`;
          vscodeAdapter.showWarning(message);
          this.logger.appendLine(`Missing files: ${missingFiles.join(', ')}`);
        }

        // Update last opened timestamp
        const updatedSession = updateBranchSession(session, {});
        const index = this.branchSessions.findIndex((s) => s.id === session.id);
        this.branchSessions[index] = updatedSession;
        await this.repository.saveBranchSessions(this.branchSessions);

        // Emit event
        this.events.emit({ type: 'branchSessionRestored', session: updatedSession });

        this.logger.appendLine(
          `Opened branch session "${session.branchName}" (${session.workspaceFolder})`
        );
      } finally {
        // Always clear guard
        this.isRestoring = false;
      }
    } catch (error) {
      const message = `Failed to open branch session: ${
        error instanceof Error ? error.message : String(error)
      }`;
      this.logger.appendLine(message);
      vscodeAdapter.showError(message);
      this.isRestoring = false;
    }
  }

  /**
   * Delete a branch session
   */
  async deleteBranchSession(sessionId: string): Promise<boolean> {
    try {
      const session = this.getBranchSessionById(sessionId);
      if (!session) {
        vscodeAdapter.showError('Branch session not found');
        return false;
      }

      // Remove from sessions
      this.branchSessions = this.branchSessions.filter((s) => s.id !== sessionId);

      // Persist to storage
      await this.repository.saveBranchSessions(this.branchSessions);

      // Emit event
      this.events.emit({ type: 'branchSessionDeleted', session });

      this.logger.appendLine(
        `Deleted branch session "${session.branchName}" (${session.workspaceFolder})`
      );

      return true;
    } catch (error) {
      const message = `Failed to delete branch session: ${
        error instanceof Error ? error.message : String(error)
      }`;
      this.logger.appendLine(message);
      vscodeAdapter.showError(message);
      return false;
    }
  }

  /**
   * Remove a file from a branch session
   */
  async removeFileFromBranchSession(
    sessionId: string,
    filePath: string
  ): Promise<boolean> {
    try {
      const session = this.getBranchSessionById(sessionId);
      if (!session) {
        vscodeAdapter.showError('Branch session not found');
        return false;
      }

      // Remove file
      const updatedFiles = session.files.filter((f) => f.path !== filePath);

      if (updatedFiles.length === session.files.length) {
        vscodeAdapter.showError('File not found in branch session');
        return false;
      }

      // Update session
      const updatedSession = updateBranchSession(session, { files: updatedFiles });
      const index = this.branchSessions.findIndex((s) => s.id === sessionId);
      this.branchSessions[index] = updatedSession;

      // Persist to storage
      await this.repository.saveBranchSessions(this.branchSessions);

      // Emit event
      this.events.emit({ type: 'branchSessionUpdated', session: updatedSession });

      this.logger.appendLine(
        `Removed file "${filePath}" from branch session "${session.branchName}" (${session.workspaceFolder})`
      );

      return true;
    } catch (error) {
      const message = `Failed to remove file from branch session: ${
        error instanceof Error ? error.message : String(error)
      }`;
      this.logger.appendLine(message);
      vscodeAdapter.showError(message);
      return false;
    }
  }
}
