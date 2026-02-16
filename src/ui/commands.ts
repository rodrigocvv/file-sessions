/**
 * UI layer: Command handlers
 */

import * as vscode from 'vscode';
import { SessionService } from '../application/sessionService';
import { SessionTreeItem, FileTreeItem } from './treeItems';
import * as vscodeAdapter from '../infrastructure/vscodeAdapter';

export class CommandManager {
  constructor(
    private readonly sessionService: SessionService,
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
    this.registerCommand('fileSessions.removeFileFromSession', (item: FileTreeItem) =>
      this.handleRemoveFileFromSession(item)
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
   * Handle remove file from session command
   */
  private async handleRemoveFileFromSession(item: FileTreeItem): Promise<void> {
    if (!item || !item.file) {
      vscodeAdapter.showError('Invalid file');
      return;
    }

    try {
      const success = await this.sessionService.removeFileFromSession(
        item.sessionId,
        item.file.path
      );

      if (success) {
        vscodeAdapter.showInfo('File removed from session');
      }
    } catch (error) {
      vscodeAdapter.showError(
        `Failed to remove file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
