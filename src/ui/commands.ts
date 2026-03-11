/**
 * UI layer: Command handlers
 */

import * as vscode from 'vscode';
import { SessionService } from '../application/sessionService';
import { BranchSessionService } from '../application/branchSessionService';
import { TimelineService } from '../application/timelineService';
import { SessionTreeItem, FileTreeItem } from './treeItems';
import { BranchTreeItem, BranchFileTreeItem } from './branchTreeItems';
import { TimelineSnapshotTreeItem } from './timelineTreeItems';
import * as vscodeAdapter from '../infrastructure/vscodeAdapter';

export class CommandManager {
  constructor(
    private readonly sessionService: SessionService,
    private readonly branchSessionService: BranchSessionService,
    private readonly timelineService: TimelineService,
    private readonly context: vscode.ExtensionContext
  ) {}

  /**
   * Register all commands
   */
  registerCommands(): void {
    this.registerCommand('fileSessions.saveSession', () => this.handleSaveSession());
    this.registerCommand('fileSessions.openSession', (item: SessionTreeItem) =>
      this.handleOpenSession(item)
    );
    this.registerCommand('fileSessions.openFiles', (item: SessionTreeItem) =>
      this.handleOpenFiles(item)
    );
    this.registerCommand('fileSessions.renameSession', (item: SessionTreeItem) =>
      this.handleRenameSession(item)
    );
    this.registerCommand('fileSessions.deleteSession', (item: SessionTreeItem) =>
      this.handleDeleteSession(item)
    );
    this.registerCommand('fileSessions.addFileToSession', (item: SessionTreeItem) =>
      this.handleAddFileToSession(item)
    );
    this.registerCommand(
      'fileSessions.removeFileFromSession',
      (item: FileTreeItem, allSelected: FileTreeItem[]) =>
        this.handleRemoveFileFromSession(item, allSelected)
    );
    this.registerCommand(
      'fileSessions.openSelectedFiles',
      (item: FileTreeItem, allSelected: FileTreeItem[]) =>
        this.handleOpenSelectedFiles(item, allSelected)
    );

    // Branch session commands
    this.registerCommand('fileSessions.openBranchSession', (item: BranchTreeItem) =>
      this.handleOpenBranchSession(item)
    );
    this.registerCommand('fileSessions.deleteBranchSession', (item: BranchTreeItem) =>
      this.handleDeleteBranchSession(item)
    );
    this.registerCommand(
      'fileSessions.removeFileFromBranchSession',
      (item: BranchFileTreeItem) => this.handleRemoveFileFromBranchSession(item)
    );

    // Timeline commands
    this.registerCommand(
      'fileSessions.restoreTimelineSnapshot',
      (item: TimelineSnapshotTreeItem) => this.handleRestoreTimelineSnapshot(item)
    );
    this.registerCommand(
      'fileSessions.deleteTimelineSnapshot',
      (item: TimelineSnapshotTreeItem) => this.handleDeleteTimelineSnapshot(item)
    );
    this.registerCommand('fileSessions.clearAllTimelineSnapshots', () =>
      this.handleClearAllTimelineSnapshots()
    );

    // Settings command
    this.registerCommand('fileSessions.openSettings', () =>
      this.handleOpenSettings()
    );
  }

  /**
   * Register a command
   */
  private registerCommand(command: string, callback: (...args: any[]) => any): void {
    const disposable = vscode.commands.registerCommand(command, callback);
    this.context.subscriptions.push(disposable);
  }

  /**
   * Handle save session command
   */
  private async handleSaveSession(): Promise<void> {
    try {
      const name = await vscodeAdapter.showInputBox({
        prompt: 'Enter a name for the session',
        placeHolder: 'My Session',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Session name cannot be empty';
          }
          return undefined;
        },
      });

      if (!name) {
        return; // User cancelled
      }

      const result = await this.sessionService.saveSession(name.trim());

      if (typeof result === 'string') {
        // Error message
        vscodeAdapter.showError(result);
      } else {
        // Success
        vscodeAdapter.showInfo(`Session "${result.name}" saved successfully`);
      }
    } catch (error) {
      vscodeAdapter.showError(
        `Failed to save session: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Handle open session command
   */
  private async handleOpenSession(item: SessionTreeItem): Promise<void> {
    if (!item || !item.session) {
      vscodeAdapter.showError('Invalid session');
      return;
    }

    await this.sessionService.openSession(item.session.id);
  }

  /**
   * Handle open files command
   */
  private async handleOpenFiles(item: SessionTreeItem): Promise<void> {
    if (!item || !item.session) {
      vscodeAdapter.showError('Invalid session');
      return;
    }

    await this.sessionService.openFiles(item.session.id);
  }

  /**
   * Handle rename session command
   */
  private async handleRenameSession(item: SessionTreeItem): Promise<void> {
    if (!item || !item.session) {
      vscodeAdapter.showError('Invalid session');
      return;
    }

    try {
      const newName = await vscodeAdapter.showInputBox({
        prompt: 'Enter a new name for the session',
        value: item.session.name,
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Session name cannot be empty';
          }
          return undefined;
        },
      });

      if (!newName) {
        return; // User cancelled
      }

      const result = await this.sessionService.renameSession(
        item.session.id,
        newName.trim()
      );

      if (typeof result === 'string') {
        // Error message
        vscodeAdapter.showError(result);
      } else {
        // Success
        vscodeAdapter.showInfo('Session renamed successfully');
      }
    } catch (error) {
      vscodeAdapter.showError(
        `Failed to rename session: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Handle delete session command
   */
  private async handleDeleteSession(item: SessionTreeItem): Promise<void> {
    if (!item || !item.session) {
      vscodeAdapter.showError('Invalid session');
      return;
    }

    try {
      const confirmation = await vscode.window.showWarningMessage(
        `Delete session "${item.session.name}"?`,
        { modal: true },
        'Delete'
      );

      if (confirmation !== 'Delete') {
        return; // User cancelled
      }

      const success = await this.sessionService.deleteSession(item.session.id);

      if (success) {
        vscodeAdapter.showInfo('Session deleted successfully');
      }
    } catch (error) {
      vscodeAdapter.showError(
        `Failed to delete session: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Handle add file to session command
   */
  private async handleAddFileToSession(item: SessionTreeItem): Promise<void> {
    if (!item || !item.session) {
      vscodeAdapter.showError('Invalid session');
      return;
    }

    try {
      // Get the currently active editor file
      const activeFile = vscodeAdapter.getActiveEditorFile();
      
      if (!activeFile) {
        vscodeAdapter.showWarning('No file is currently open in the editor');
        return;
      }

      // Add file to session
      const success = await this.sessionService.addFileToSession(
        item.session.id,
        activeFile
      );

      if (success) {
        vscodeAdapter.showInfo(`File added to session "${item.session.name}"`);
      }
    } catch (error) {
      vscodeAdapter.showError(
        `Failed to add file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Handle remove file(s) from session command (supports multi-select)
   */
  private async handleRemoveFileFromSession(
    item: FileTreeItem,
    allSelected: FileTreeItem[]
  ): Promise<void> {
    if (!item || !item.file) {
      vscodeAdapter.showError('Invalid file');
      return;
    }

    try {
      const items =
        allSelected && allSelected.length > 1 ? allSelected : [item];

      // Group by sessionId (all selected items should be from the same session,
      // but handle gracefully if not)
      const bySession = new Map<string, string[]>();
      for (const fileItem of items) {
        if (!(fileItem instanceof FileTreeItem)) {
          continue;
        }
        const paths = bySession.get(fileItem.sessionId) ?? [];
        paths.push(fileItem.file.path);
        bySession.set(fileItem.sessionId, paths);
      }

      let success = true;
      for (const [sessionId, paths] of bySession) {
        const result = await this.sessionService.removeFilesFromSession(sessionId, paths);
        if (!result) {
          success = false;
        }
      }

      if (success) {
        const count = items.length;
        vscodeAdapter.showInfo(
          count === 1 ? 'File removed from session' : `${count} files removed from session`
        );
      }
    } catch (error) {
      vscodeAdapter.showError(
        `Failed to remove file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Handle open selected file(s) command (supports multi-select)
   */
  private async handleOpenSelectedFiles(
    item: FileTreeItem,
    allSelected: FileTreeItem[]
  ): Promise<void> {
    if (!item || !item.file) {
      vscodeAdapter.showError('Invalid file');
      return;
    }

    try {
      const items =
        allSelected && allSelected.length > 1 ? allSelected : [item];

      for (const fileItem of items) {
        if (!(fileItem instanceof FileTreeItem)) {
          continue;
        }
        await vscode.commands.executeCommand(
          'vscode.open',
          vscode.Uri.file(fileItem.file.path)
        );
      }
    } catch (error) {
      vscodeAdapter.showError(
        `Failed to open files: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Handle open branch session command
   */
  private async handleOpenBranchSession(item: BranchTreeItem): Promise<void> {
    if (!item || !item.session) {
      vscodeAdapter.showError('Invalid branch session');
      return;
    }

    await this.branchSessionService.openBranchSession(item.session.id);
  }

  /**
   * Handle delete branch session command
   */
  private async handleDeleteBranchSession(item: BranchTreeItem): Promise<void> {
    if (!item || !item.session) {
      vscodeAdapter.showError('Invalid branch session');
      return;
    }

    try {
      const confirmation = await vscode.window.showWarningMessage(
        `Delete branch session for "${item.session.branchName}" (${item.session.workspaceFolder})?`,
        { modal: true },
        'Delete'
      );

      if (confirmation !== 'Delete') {
        return; // User cancelled
      }

      const success = await this.branchSessionService.deleteBranchSession(
        item.session.id
      );

      if (success) {
        vscodeAdapter.showInfo('Branch session deleted successfully');
      }
    } catch (error) {
      vscodeAdapter.showError(
        `Failed to delete branch session: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Handle remove file from branch session command
   */
  private async handleRemoveFileFromBranchSession(
    item: BranchFileTreeItem
  ): Promise<void> {
    if (!item || !item.file) {
      vscodeAdapter.showError('Invalid file');
      return;
    }

    try {
      const success = await this.branchSessionService.removeFileFromBranchSession(
        item.sessionId,
        item.file.path
      );

      if (success) {
        vscodeAdapter.showInfo('File removed from branch session');
      }
    } catch (error) {
      vscodeAdapter.showError(
        `Failed to remove file from branch session: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Handle restore timeline snapshot command
   */
  private async handleRestoreTimelineSnapshot(
    item: TimelineSnapshotTreeItem
  ): Promise<void> {
    if (!item || !item.snapshot) {
      vscodeAdapter.showError('Invalid snapshot');
      return;
    }

    try {
      await this.timelineService.restoreSnapshot(item.snapshot.id);
    } catch (error) {
      vscodeAdapter.showError(
        `Failed to restore snapshot: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Handle delete timeline snapshot command
   */
  private async handleDeleteTimelineSnapshot(
    item: TimelineSnapshotTreeItem
  ): Promise<void> {
    if (!item || !item.snapshot) {
      vscodeAdapter.showError('Invalid snapshot');
      return;
    }

    try {
      const confirmation = await vscode.window.showWarningMessage(
        `Delete this timeline snapshot?`,
        { modal: true },
        'Delete'
      );

      if (confirmation !== 'Delete') {
        return; // User cancelled
      }

      const result = await this.timelineService.deleteSnapshot(item.snapshot.id);

      if (result === true) {
        vscodeAdapter.showInfo('Timeline snapshot deleted successfully');
      } else if (typeof result === 'string') {
        vscodeAdapter.showError(result);
      }
    } catch (error) {
      vscodeAdapter.showError(
        `Failed to delete snapshot: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Handle clear all timeline snapshots command
   */
  private async handleClearAllTimelineSnapshots(): Promise<void> {
    try {
      const snapshots = this.timelineService.getAllSnapshots();

      if (snapshots.length === 0) {
        vscodeAdapter.showInfo('Timeline is already empty');
        return;
      }

      const confirmation = await vscode.window.showWarningMessage(
        `Clear all ${snapshots.length} timeline snapshots?`,
        { modal: true },
        'Clear All'
      );

      if (confirmation !== 'Clear All') {
        return; // User cancelled
      }

      await this.timelineService.clearAllSnapshots();
      vscodeAdapter.showInfo('All timeline snapshots cleared successfully');
    } catch (error) {
      vscodeAdapter.showError(
        `Failed to clear timeline: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Handle open settings command
   */
  private async handleOpenSettings(): Promise<void> {
    await vscode.commands.executeCommand(
      'workbench.action.openSettings',
      '@ext:rodrigocvv.file-sessions'
    );
  }
}
