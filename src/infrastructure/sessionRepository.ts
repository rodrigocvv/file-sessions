/**
 * Infrastructure layer: Storage repository
 * Encapsulates all access to VS Code workspaceState
 */

import * as vscode from 'vscode';
import { FileSession } from '../domain/session';
import {
  migrateStorage,
  createEmptyStorage,
  PersistedData,
} from './storageMigrations';

const STORAGE_KEY = 'fileSessions.data';

export class SessionRepository {
  constructor(
    private readonly storage: vscode.Memento,
    private readonly logger: vscode.OutputChannel
  ) {}

  /**
   * Load all sessions from storage
   */
  async loadSessions(): Promise<FileSession[]> {
    try {
      const rawData = this.storage.get<unknown>(STORAGE_KEY);
      const data = migrateStorage(rawData);
      this.logger.appendLine(`Loaded ${data.sessions.length} sessions from storage`);
      return data.sessions;
    } catch (error) {
      this.logger.appendLine(
        `Error loading sessions: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  /**
   * Save all sessions to storage
   */
  async saveSessions(sessions: FileSession[]): Promise<void> {
    try {
      const data: PersistedData = {
        version: 1,
        sessions,
      };
      await this.storage.update(STORAGE_KEY, data);
      this.logger.appendLine(`Saved ${sessions.length} sessions to storage`);
    } catch (error) {
      this.logger.appendLine(
        `Error saving sessions: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Clear all data from storage
   */
  async clear(): Promise<void> {
    try {
      await this.storage.update(STORAGE_KEY, createEmptyStorage());
      this.logger.appendLine('Cleared storage');
    } catch (error) {
      this.logger.appendLine(
        `Error clearing storage: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
