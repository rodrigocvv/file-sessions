/**
 * UI layer: TreeView data provider
 */

import * as vscode from 'vscode';
import { FileSession } from '../domain/session';
import { SessionService } from '../application/sessionService';
import { SessionEvents } from '../events/sessionEvents';
import { SessionTreeItem, FileTreeItem } from './treeItems';

export class SessionsTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    vscode.TreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(
    private readonly sessionService: SessionService,
    private readonly events: SessionEvents
  ) {
    // Subscribe to session events
    this.events.onSessionCreated(() => this.refresh());
    this.events.onSessionDeleted(() => this.refresh());
    this.events.onSessionUpdated(() => this.refresh());
  }

  /**
   * Refresh the entire tree
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Get tree item representation
   */
  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children for a tree item
   */
  getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {
    if (!element) {
      // Root level - return all sessions
      return this.getSessionItems();
    }

    if (element instanceof SessionTreeItem) {
      // Session level - return files in session
      return this.getFileItems(element.session);
    }

    return [];
  }

  /**
   * Get parent of a tree item
   */
  getParent(element: vscode.TreeItem): vscode.TreeItem | undefined {
    if (element instanceof FileTreeItem) {
      const session = this.sessionService.getSessionById(element.sessionId);
      if (session) {
        return new SessionTreeItem(session, vscode.TreeItemCollapsibleState.Expanded);
      }
    }
    return undefined;
  }

  /**
   * Get session tree items
   */
  private getSessionItems(): SessionTreeItem[] {
    const sessions = this.sessionService.getAllSessions();

    if (sessions.length === 0) {
      return [];
    }

    return sessions.map(
      (session) =>
        new SessionTreeItem(session, vscode.TreeItemCollapsibleState.Collapsed)
    );
  }

  /**
   * Get file tree items for a session
   */
  private getFileItems(session: FileSession): FileTreeItem[] {
    return session.files.map((file) => new FileTreeItem(session.id, file));
  }
}
