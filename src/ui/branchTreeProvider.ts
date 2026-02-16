/**
 * UI layer: Branch sessions TreeView data provider
 */

import * as vscode from 'vscode';
import { BranchSession } from '../domain/session';
import { BranchSessionService } from '../application/branchSessionService';
import { SessionEvents } from '../events/sessionEvents';
import { BranchTreeItem, BranchFileTreeItem } from './branchTreeItems';

export class BranchSessionsTreeProvider
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    vscode.TreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(
    private readonly branchSessionService: BranchSessionService,
    private readonly events: SessionEvents
  ) {
    // Subscribe to branch session events
    this.events.onBranchSessionCreated(() => this.refresh());
    this.events.onBranchSessionDeleted(() => this.refresh());
    this.events.onBranchSessionUpdated(() => this.refresh());
    this.events.onBranchSessionRestored(() => this.refresh());
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
      // Root level - return all branch sessions
      return this.getBranchSessionItems();
    }

    if (element instanceof BranchTreeItem) {
      // Branch session level - return files in session
      return this.getFileItems(element.session);
    }

    return [];
  }

  /**
   * Get parent of a tree item
   */
  getParent(element: vscode.TreeItem): vscode.TreeItem | undefined {
    if (element instanceof BranchFileTreeItem) {
      const session = this.branchSessionService.getBranchSessionById(
        element.sessionId
      );
      if (session) {
        return new BranchTreeItem(
          session,
          vscode.TreeItemCollapsibleState.Expanded
        );
      }
    }
    return undefined;
  }

  /**
   * Get branch session tree items
   */
  private getBranchSessionItems(): BranchTreeItem[] {
    const sessions = this.branchSessionService.getAllBranchSessions();

    if (sessions.length === 0) {
      return [];
    }

    // Sort by last opened (most recent first)
    const sortedSessions = [...sessions].sort(
      (a, b) => b.lastOpenedAt - a.lastOpenedAt
    );

    return sortedSessions.map(
      (session) =>
        new BranchTreeItem(session, vscode.TreeItemCollapsibleState.Collapsed)
    );
  }

  /**
   * Get file tree items for a branch session
   */
  private getFileItems(session: BranchSession): BranchFileTreeItem[] {
    return session.files.map((file) => new BranchFileTreeItem(session.id, file));
  }
}
