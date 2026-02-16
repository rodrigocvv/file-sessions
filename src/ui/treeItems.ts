/**
 * UI layer: TreeView item definitions
 */

import * as vscode from 'vscode';
import { FileSession, SessionFile } from '../domain/session';
import { getBasename } from '../utils/pathUtils';

/**
 * Tree item representing a session
 */
export class SessionTreeItem extends vscode.TreeItem {
  constructor(
    public readonly session: FileSession,
    public override readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(session.name, collapsibleState);

    this.id = session.id;
    this.contextValue = 'session';
    this.iconPath = new vscode.ThemeIcon('folder-library');
    this.tooltip = this.buildTooltip();
  }

  private buildTooltip(): string {
    const fileCount = this.session.files.length;
    const fileText = fileCount === 1 ? 'file' : 'files';
    const date = new Date(this.session.updatedAt).toLocaleString();
    return `${this.session.name}\n${fileCount} ${fileText}\nLast updated: ${date}`;
  }
}

/**
 * Tree item representing a file within a session
 */
export class FileTreeItem extends vscode.TreeItem {
  constructor(
    public readonly sessionId: string,
    public readonly file: SessionFile
  ) {
    super(getBasename(file.path), vscode.TreeItemCollapsibleState.None);

    this.id = `${sessionId}-${file.path}`;
    this.contextValue = 'sessionFile';
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
