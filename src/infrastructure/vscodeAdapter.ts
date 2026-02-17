/**
 * Infrastructure layer: VS Code API adapter
 * Isolates all VS Code API calls from business logic
 */

import * as vscode from 'vscode';
import { SessionFile } from '../domain/session';

/**
 * Get all currently open files from all tab groups
 */
export function getAllOpenFiles(): SessionFile[] {
  const openFiles: SessionFile[] = [];

  // Iterate through all tab groups and tabs
  for (const tabGroup of vscode.window.tabGroups.all) {
    for (const tab of tabGroup.tabs) {
      const tabInput = tab.input;
      
      // Check if tab is a text document
      if (tabInput instanceof vscode.TabInputText) {
        const uri = tabInput.uri;
        
        // Only include file scheme URIs (not untitled, git, etc.)
        if (uri.scheme === 'file') {
          const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
          
          if (workspaceFolder) {
            openFiles.push({
              path: uri.fsPath,
              workspaceFolder: workspaceFolder.name,
            });
          }
        }
      }
    }
  }

  return openFiles;
}

/**
 * Get the currently active editor file
 * @returns SessionFile if a valid file is active, undefined otherwise
 */
export function getActiveEditorFile(): SessionFile | undefined {
  const activeEditor = vscode.window.activeTextEditor;
  
  if (!activeEditor) {
    return undefined;
  }

  const uri = activeEditor.document.uri;
  
  // Only include file scheme URIs (not untitled, git, etc.)
  if (uri.scheme !== 'file') {
    return undefined;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
  
  if (!workspaceFolder) {
    return undefined;
  }

  return {
    path: uri.fsPath,
    workspaceFolder: workspaceFolder.name,
  };
}

/**
 * Open a file in the editor
 */
export async function openFile(
  filePath: string,
  workspaceFolderName: string
): Promise<boolean> {
  try {
    // Find the workspace folder by name
    const workspaceFolder = vscode.workspace.workspaceFolders?.find(
      (folder) => folder.name === workspaceFolderName
    );

    if (!workspaceFolder) {
      return false;
    }

    // Create URI from file path
    const uri = vscode.Uri.file(filePath);

    // Check if file exists
    try {
      await vscode.workspace.fs.stat(uri);
    } catch {
      return false;
    }

    // Open the document
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document, {
      preview: false,
      preserveFocus: false,
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Close all open editors
 */
export async function closeAllEditors(): Promise<void> {
  // Use the TabGroups API to properly close all tabs
  const tabGroups = vscode.window.tabGroups.all;
  for (const group of tabGroups) {
    for (const tab of group.tabs) {
      await vscode.window.tabGroups.close(tab);
    }
  }
}

/**
 * Close all open editors except those in the specified list
 */
export async function closeEditorsExcept(filePaths: string[]): Promise<void> {
  const pathSet = new Set(filePaths.map(p => p.toLowerCase()));
  const tabGroups = vscode.window.tabGroups.all;
  
  for (const group of tabGroups) {
    for (const tab of group.tabs) {
      const tabInput = tab.input;
      
      if (tabInput instanceof vscode.TabInputText) {
        const uri = tabInput.uri;
        
        if (uri.scheme === 'file') {
          const filePath = uri.fsPath.toLowerCase();
          
          // Close if not in the list
          if (!pathSet.has(filePath)) {
            await vscode.window.tabGroups.close(tab);
          }
        }
      }
    }
  }
}

/**
 * Get configuration value
 */
export function getConfiguration<T>(key: string, defaultValue: T): T {
  return vscode.workspace.getConfiguration('fileSessions').get<T>(key, defaultValue);
}

/**
 * Show information message
 */
export function showInfo(message: string): void {
  vscode.window.showInformationMessage(message);
}

/**
 * Show warning message
 */
export function showWarning(message: string): void {
  vscode.window.showWarningMessage(message);
}

/**
 * Show error message
 */
export function showError(message: string): void {
  vscode.window.showErrorMessage(message);
}

/**
 * Show input box for user input
 */
export async function showInputBox(options: vscode.InputBoxOptions): Promise<string | undefined> {
  return vscode.window.showInputBox(options);
}
