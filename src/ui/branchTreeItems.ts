/**
 * UI layer: Branch session TreeView item definitions
 */

import * as vscode from 'vscode';
import { BranchSession, SessionFile } from '../domain/session';
import { getBasename } from '../utils/pathUtils';

/**
 * Tree item representing a branch session
 */
export class BranchTreeItem extends vscode.TreeItem {
  constructor(
    public readonly session: BranchSession,
    public override readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(
      `${session.branchName} (${session.workspaceFolder})`,
      collapsibleState
    );

    this.id = session.id;
    this.contextValue = 'branchSession';
    this.iconPath = new vscode.ThemeIcon('git-branch');
    this.tooltip = this.buildTooltip();
  }

  private buildTooltip(): string {
    const fileCount = this.session.files.length;
    const fileText = fileCount === 1 ? 'file' : 'files';
    const date = new Date(this.session.lastOpenedAt).toLocaleString();
    return `Branch: ${this.session.branchName}\nWorkspace: ${this.session.workspaceFolder}\n${fileCount} ${fileText}\nLast opened: ${date}`;
  }
}

/**
 * Tree item representing a file within a branch session
 */
export class BranchFileTreeItem extends vscode.TreeItem {
  constructor(
    public readonly sessionId: string,
    public readonly file: SessionFile
  ) {
    super(getBasename(file.path), vscode.TreeItemCollapsibleState.None);

    this.id = `${sessionId}-${file.path}`;
    this.contextValue = 'branchSessionFile';
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
