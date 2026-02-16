/**
 * UI layer: Timeline TreeView data provider
 */

import * as vscode from 'vscode';
import { TimelineSnapshot } from '../domain/session';
import { TimelineService } from '../application/timelineService';
import { SessionEvents } from '../events/sessionEvents';
import { TimelineSnapshotTreeItem, TimelineFileTreeItem } from './timelineTreeItems';

export class TimelineTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    vscode.TreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(
    private readonly timelineService: TimelineService,
    private readonly events: SessionEvents
  ) {
    // Subscribe to timeline events
    this.events.onTimelineSnapshotCreated(() => this.refresh());
    this.events.onTimelineSnapshotDeleted(() => this.refresh());
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
      // Root level - return all snapshots
      return this.getSnapshotItems();
    }

    if (element instanceof TimelineSnapshotTreeItem) {
      // Snapshot level - return files in snapshot
      return this.getFileItems(element.snapshot);
    }

    return [];
  }

  /**
   * Get parent of a tree item
   */
  getParent(element: vscode.TreeItem): vscode.TreeItem | undefined {
    if (element instanceof TimelineFileTreeItem) {
      const snapshot = this.timelineService.getSnapshotById(element.snapshotId);
      if (snapshot) {
        return new TimelineSnapshotTreeItem(
          snapshot,
          vscode.TreeItemCollapsibleState.Expanded
        );
      }
    }
    return undefined;
  }

  /**
   * Get snapshot tree items (sorted by timestamp descending)
   */
  private getSnapshotItems(): TimelineSnapshotTreeItem[] {
    const snapshots = this.timelineService.getAllSnapshots();

    if (snapshots.length === 0) {
      return [];
    }

    // Snapshots are already sorted by getAllSnapshots (newest first)
    return snapshots.map(
      (snapshot) =>
        new TimelineSnapshotTreeItem(
          snapshot,
          vscode.TreeItemCollapsibleState.Collapsed
        )
    );
  }

  /**
   * Get file tree items for a snapshot
   */
  private getFileItems(snapshot: TimelineSnapshot): TimelineFileTreeItem[] {
    return snapshot.files.map((file) => new TimelineFileTreeItem(snapshot.id, file));
  }
}
