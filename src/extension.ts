/**
 * Extension entry point
 */

import * as vscode from 'vscode';
import { SessionRepository } from './infrastructure/sessionRepository';
import { SessionEvents } from './events/sessionEvents';
import { SessionService } from './application/sessionService';
import { SessionsTreeProvider } from './ui/treeProvider';
import { CommandManager } from './ui/commands';

let outputChannel: vscode.OutputChannel;

/**
 * Extension activation
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  // Create output channel for logging
  outputChannel = vscode.window.createOutputChannel('File Sessions');
  context.subscriptions.push(outputChannel);

  outputChannel.appendLine('File Sessions extension activating...');

  try {
    // Build dependency graph
    const repository = new SessionRepository(context.workspaceState, outputChannel);
    const events = new SessionEvents();
    const sessionService = new SessionService(repository, events, outputChannel);

    // Initialize service
    await sessionService.initialize();

    // Create tree view
    const treeProvider = new SessionsTreeProvider(sessionService, events);
    const treeView = vscode.window.createTreeView('fileSessions.sessionsView', {
      treeDataProvider: treeProvider,
      showCollapseAll: true,
    });
    context.subscriptions.push(treeView);

    // Register commands
    const commandManager = new CommandManager(sessionService, context);
    commandManager.registerCommands();

    // Watch for configuration changes
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('fileSessions')) {
          outputChannel.appendLine('Configuration changed');
        }
      })
    );

    outputChannel.appendLine('File Sessions extension activated successfully');
  } catch (error) {
    const message = `Failed to activate extension: ${
      error instanceof Error ? error.message : String(error)
    }`;
    outputChannel.appendLine(message);
    vscode.window.showErrorMessage(message);
  }
}

/**
 * Extension deactivation
 */
export function deactivate(): void {
  if (outputChannel) {
    outputChannel.appendLine('File Sessions extension deactivating...');
    outputChannel.dispose();
  }
}
