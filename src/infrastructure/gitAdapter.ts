/**
 * Infrastructure layer: Git integration adapter
 * Abstracts Git operations using VS Code Git extension API with file watcher fallback
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface GitBranchInfo {
  workspaceFolder: vscode.WorkspaceFolder;
  branchName: string;
}

type BranchChangeCallback = (info: GitBranchInfo) => void;

export class GitAdapter implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  private readonly branchChangeCallbacks: BranchChangeCallback[] = [];
  private readonly currentBranches = new Map<string, string>(); // workspaceFolderUri -> branchName
  private readonly debounceTimers = new Map<string, NodeJS.Timeout>();
  private gitExtension: any;
  private fileWatchers = new Map<string, vscode.FileSystemWatcher>();

  constructor(private readonly logger: vscode.OutputChannel) {
    this.initializeGitExtension();
  }

  /**
   * Initialize Git extension API
   */
  private async initializeGitExtension(): Promise<void> {
    try {
      const extension = vscode.extensions.getExtension('vscode.git');
      if (extension) {
        if (!extension.isActive) {
          await extension.activate();
        }
        this.gitExtension = extension.exports;
        this.logger.appendLine('Git extension API initialized');
        this.setupGitListeners();
      } else {
        this.logger.appendLine('Git extension not found, using file watcher fallback');
        this.setupFileWatcherFallback();
      }
    } catch (error) {
      this.logger.appendLine(
        `Failed to initialize Git extension: ${error instanceof Error ? error.message : String(error)}`
      );
      this.setupFileWatcherFallback();
    }
  }

  /**
   * Setup Git extension event listeners
   */
  private setupGitListeners(): void {
    if (!this.gitExtension?.getAPI) {
      this.setupFileWatcherFallback();
      return;
    }

    try {
      const api = this.gitExtension.getAPI(1);
      
      // Listen to repository changes
      const onDidOpenRepository = api.onDidOpenRepository?.((repo: any) => {
        this.setupRepositoryListener(repo);
      });
      if (onDidOpenRepository) {
        this.disposables.push(onDidOpenRepository);
      }

      // Setup listeners for existing repositories
      for (const repo of api.repositories || []) {
        this.setupRepositoryListener(repo);
      }
    } catch (error) {
      this.logger.appendLine(
        `Failed to setup Git listeners: ${error instanceof Error ? error.message : String(error)}`
      );
      this.setupFileWatcherFallback();
    }
  }

  /**
   * Setup listener for a specific Git repository
   */
  private setupRepositoryListener(repo: any): void {
    try {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(repo.rootUri);
      if (!workspaceFolder) {
        return;
      }

      // Listen to HEAD changes (branch switches)
      const onDidRunGitStatus = repo.state?.onDidChange?.(() => {
        this.handleBranchChange(workspaceFolder, repo);
      });

      if (onDidRunGitStatus) {
        this.disposables.push(onDidRunGitStatus);
      }

      // Initialize current branch
      this.handleBranchChange(workspaceFolder, repo);
    } catch (error) {
      this.logger.appendLine(
        `Failed to setup repository listener: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Handle branch change from Git API
   */
  private handleBranchChange(workspaceFolder: vscode.WorkspaceFolder, repo: any): void {
    const folderUri = workspaceFolder.uri.toString();
    
    // Debounce rapid changes
    const existingTimer = this.debounceTimers.get(folderUri);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(folderUri);
      
      try {
        const branchName = repo.state?.HEAD?.name;
        if (!branchName || repo.state?.HEAD?.type !== 0) {
          // Detached HEAD or no branch
          return;
        }

        const previousBranch = this.currentBranches.get(folderUri);
        if (previousBranch !== branchName) {
          this.currentBranches.set(folderUri, branchName);
          this.logger.appendLine(
            `Branch changed in ${workspaceFolder.name}: ${previousBranch || '(none)'} -> ${branchName}`
          );
          
          // Notify callbacks
          for (const callback of this.branchChangeCallbacks) {
            try {
              callback({ workspaceFolder, branchName });
            } catch (error) {
              this.logger.appendLine(
                `Error in branch change callback: ${error instanceof Error ? error.message : String(error)}`
              );
            }
          }
        }
      } catch (error) {
        this.logger.appendLine(
          `Error handling branch change: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }, 500); // 500ms debounce

    this.debounceTimers.set(folderUri, timer);
  }

  /**
   * Setup file watcher fallback for .git/HEAD
   */
  private setupFileWatcherFallback(): void {
    const workspaceFolders = vscode.workspace.workspaceFolders || [];
    
    for (const folder of workspaceFolders) {
      const gitHeadPath = path.join(folder.uri.fsPath, '.git', 'HEAD');
      
      // Check if .git/HEAD exists
      if (!fs.existsSync(gitHeadPath)) {
        continue;
      }

      const pattern = new vscode.RelativePattern(folder, '.git/HEAD');
      const watcher = vscode.workspace.createFileSystemWatcher(pattern, false, false, false);

      watcher.onDidChange(() => this.handleFileWatcherChange(folder));
      watcher.onDidCreate(() => this.handleFileWatcherChange(folder));
      
      this.fileWatchers.set(folder.uri.toString(), watcher);
      this.disposables.push(watcher);

      // Initialize current branch
      this.handleFileWatcherChange(folder);
    }
  }

  /**
   * Handle file watcher change for .git/HEAD
   */
  private handleFileWatcherChange(workspaceFolder: vscode.WorkspaceFolder): void {
    const folderUri = workspaceFolder.uri.toString();
    
    // Debounce rapid changes
    const existingTimer = this.debounceTimers.get(folderUri);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(folderUri);
      
      try {
        const gitHeadPath = path.join(workspaceFolder.uri.fsPath, '.git', 'HEAD');
        const headContent = fs.readFileSync(gitHeadPath, 'utf8').trim();
        
        // Parse branch name from "ref: refs/heads/branch-name"
        const match = headContent.match(/^ref:\s*refs\/heads\/(.+)$/);
        if (!match) {
          // Detached HEAD
          return;
        }

        const branchName = match[1];
        const previousBranch = this.currentBranches.get(folderUri);
        
        if (previousBranch !== branchName) {
          this.currentBranches.set(folderUri, branchName);
          this.logger.appendLine(
            `Branch changed in ${workspaceFolder.name}: ${previousBranch || '(none)'} -> ${branchName}`
          );
          
          // Notify callbacks
          for (const callback of this.branchChangeCallbacks) {
            try {
              callback({ workspaceFolder, branchName });
            } catch (error) {
              this.logger.appendLine(
                `Error in branch change callback: ${error instanceof Error ? error.message : String(error)}`
              );
            }
          }
        }
      } catch (error) {
        this.logger.appendLine(
          `Error reading .git/HEAD: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }, 500); // 500ms debounce

    this.debounceTimers.set(folderUri, timer);
  }

  /**
   * Get current branch for a workspace folder
   */
  getCurrentBranch(workspaceFolder: vscode.WorkspaceFolder): string | undefined {
    try {
      // Try Git API first
      if (this.gitExtension?.getAPI) {
        const api = this.gitExtension.getAPI(1);
        const repo = api.repositories?.find((r: any) => {
          const repoFolder = vscode.workspace.getWorkspaceFolder(r.rootUri);
          return repoFolder?.uri.toString() === workspaceFolder.uri.toString();
        });

        if (repo?.state?.HEAD?.name && repo.state.HEAD.type === 0) {
          return repo.state.HEAD.name;
        }
      }

      // Fallback to file read
      const gitHeadPath = path.join(workspaceFolder.uri.fsPath, '.git', 'HEAD');
      if (!fs.existsSync(gitHeadPath)) {
        return undefined;
      }

      const headContent = fs.readFileSync(gitHeadPath, 'utf8').trim();
      const match = headContent.match(/^ref:\s*refs\/heads\/(.+)$/);
      return match ? match[1] : undefined;
    } catch (error) {
      this.logger.appendLine(
        `Error getting current branch: ${error instanceof Error ? error.message : String(error)}`
      );
      return undefined;
    }
  }

  /**
   * Subscribe to branch change events
   */
  onBranchChange(callback: BranchChangeCallback): vscode.Disposable {
    this.branchChangeCallbacks.push(callback);
    
    return {
      dispose: () => {
        const index = this.branchChangeCallbacks.indexOf(callback);
        if (index >= 0) {
          this.branchChangeCallbacks.splice(index, 1);
        }
      },
    };
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Dispose all disposables
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables.length = 0;

    // Clear state
    this.branchChangeCallbacks.length = 0;
    this.currentBranches.clear();
    this.fileWatchers.clear();
  }
}
