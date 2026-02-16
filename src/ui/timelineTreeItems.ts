/**
 * UI layer: Timeline TreeView item definitions
 */

import * as vscode from 'vscode';
import { TimelineSnapshot, SessionFile, formatTimelineTimestamp } from '../domain/session';
import { getBasename } from '../utils/pathUtils';

/**
 * Tree item representing a timeline snapshot
 */
export class TimelineSnapshotTreeItem extends vscode.TreeItem {
  constructor(
    public readonly snapshot: TimelineSnapshot,
    public override readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    // Display formatted timestamp as label
    super(formatTimelineTimestamp(snapshot.timestamp), collapsibleState);

    this.id = snapshot.id;
    this.contextValue = 'timelineSnapshot';
    this.iconPath = new vscode.ThemeIcon('history');
    this.tooltip = this.buildTooltip();
  }

  private buildTooltip(): string {
    const fileCount = this.snapshot.files.length;
    const fileText = fileCount === 1 ? 'file' : 'files';
    const formattedTime = formatTimelineTimestamp(this.snapshot.timestamp);
    return `${formattedTime}\n${fileCount} ${fileText}`;
  }
}

/**
 * Tree item representing a file within a timeline snapshot
 */
export class TimelineFileTreeItem extends vscode.TreeItem {
  constructor(
    public readonly snapshotId: string,
    public readonly file: SessionFile
  ) {
    super(getBasename(file.path), vscode.TreeItemCollapsibleState.None);

    this.id = `${snapshotId}-${file.path}`;
    this.contextValue = 'timelineFile';
    this.iconPath = vscode.ThemeIcon.File;
    this.tooltip = file.path;
    this.description = file.workspaceFolder;
    this.resourceUri = vscode.Uri.file(file.path);

    // Make file clickable
    this.command = {
      command: 'vscode.open',
      title: 'Open File',
      arguments: [this.resourceUri],
    };
  }
}
