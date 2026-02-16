/**
 * Extension entry point
 */

import * as vscode from 'vscode';
import { SessionRepository } from './infrastructure/sessionRepository';
import { GitAdapter } from './infrastructure/gitAdapter';
import { SessionEvents } from './events/sessionEvents';
import { SessionService } from './application/sessionService';
import { BranchSessionService } from './application/branchSessionService';
import { TimelineService } from './application/timelineService';
import { GitBranchOrchestrator } from './application/gitBranchOrchestrator';
import { SessionsTreeProvider } from './ui/treeProvider';
import { BranchSessionsTreeProvider } from './ui/branchTreeProvider';
import { TimelineTreeProvider } from './ui/timelineTreeProvider';
import { CommandManager } from './ui/commands';

let outputChannel: vscode.OutputChannel;
let orchestrator: GitBranchOrchestrator | undefined;

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

    // Create tree view for manual sessions
    const treeProvider = new SessionsTreeProvider(sessionService, events);
    const treeView = vscode.window.createTreeView('fileSessions.sessionsView', {
      treeDataProvider: treeProvider,
      showCollapseAll: true,
    });
    context.subscriptions.push(treeView);

    // Create Git integration components
    const gitAdapter = new GitAdapter(outputChannel);
    context.subscriptions.push(gitAdapter);

    const branchSessionService = new BranchSessionService(
      repository,
      events,
      outputChannel
    );
    await branchSessionService.initialize();

    // Create tree view for branch sessions
    const branchTreeProvider = new BranchSessionsTreeProvider(
      branchSessionService,
      events
    );
    const branchTreeView = vscode.window.createTreeView(
      'fileSessions.branchSessionsView',
      {
        treeDataProvider: branchTreeProvider,
        showCollapseAll: true,
      }
    );
    context.subscriptions.push(branchTreeView);

    // Create timeline service and tree view
    const timelineService = new TimelineService(repository, events, outputChannel);
    await timelineService.initialize();
    context.subscriptions.push(timelineService);

    const timelineTreeProvider = new TimelineTreeProvider(timelineService, events);
    const timelineTreeView = vscode.window.createTreeView(
      'fileSessions.timelineView',
      {
        treeDataProvider: timelineTreeProvider,
        showCollapseAll: true,
      }
    );
    context.subscriptions.push(timelineTreeView);

    // Create and start Git branch orchestrator
    orchestrator = new GitBranchOrchestrator(
      gitAdapter,
      branchSessionService,
      timelineService,
      outputChannel
    );
    context.subscriptions.push(orchestrator);
    orchestrator.startWatching();

    // Register commands
    const commandManager = new CommandManager(
      sessionService,
      branchSessionService,
      timelineService,
      context
    );
    commandManager.registerCommands();

    // Watch for configuration changes
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('fileSessions')) {
          outputChannel.appendLine('Configuration changed');
          
          // Reconfigure orchestrator based on settings
          if (event.affectsConfiguration('fileSessions.gitBranchSessions.enabled')) {
            if (orchestrator) {
              orchestrator.reconfigure();
            }
          }
          
          // Reconfigure timeline based on settings
          if (event.affectsConfiguration('fileSessions.timeline.enabled')) {
            timelineService.reconfigure();
          }
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
