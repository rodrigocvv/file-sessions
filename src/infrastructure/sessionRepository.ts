/**
 * Infrastructure layer: Storage repository
 * Encapsulates all access to VS Code workspaceState
 */

import * as vscode from 'vscode';
import { FileSession, BranchSession, TimelineSnapshot } from '../domain/session';
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
      // Load existing data to preserve branch sessions and timeline
      const rawData = this.storage.get<unknown>(STORAGE_KEY);
      const existingData = migrateStorage(rawData);

      const data: PersistedData = {
        version: 3,
        sessions,
        branchSessions: existingData.branchSessions,
        timelineSnapshots: existingData.timelineSnapshots,
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
   * Load all branch sessions from storage
   */
  async loadBranchSessions(): Promise<BranchSession[]> {
    try {
      const rawData = this.storage.get<unknown>(STORAGE_KEY);
      const data = migrateStorage(rawData);
      this.logger.appendLine(`Loaded ${data.branchSessions.length} branch sessions from storage`);
      return data.branchSessions;
    } catch (error) {
      this.logger.appendLine(
        `Error loading branch sessions: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  /**
   * Save all branch sessions to storage
   */
  async saveBranchSessions(branchSessions: BranchSession[]): Promise<void> {
    try {
      // Load existing data to preserve manual sessions and timeline
      const rawData = this.storage.get<unknown>(STORAGE_KEY);
      const existingData = migrateStorage(rawData);

      const data: PersistedData = {
        version: 3,
        sessions: existingData.sessions,
        branchSessions,
        timelineSnapshots: existingData.timelineSnapshots,
      };
      await this.storage.update(STORAGE_KEY, data);
      this.logger.appendLine(`Saved ${branchSessions.length} branch sessions to storage`);
    } catch (error) {
      this.logger.appendLine(
        `Error saving branch sessions: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Load all timeline snapshots from storage
   */
  async loadTimelineSnapshots(): Promise<TimelineSnapshot[]> {
    try {
      const rawData = this.storage.get<unknown>(STORAGE_KEY);
      const data = migrateStorage(rawData);
      this.logger.appendLine(`Loaded ${data.timelineSnapshots.length} timeline snapshots from storage`);
      return data.timelineSnapshots;
    } catch (error) {
      this.logger.appendLine(
        `Error loading timeline snapshots: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  /**
   * Save all timeline snapshots to storage
   */
  async saveTimelineSnapshots(timelineSnapshots: TimelineSnapshot[]): Promise<void> {
    try {
      // Load existing data to preserve manual sessions and branch sessions
      const rawData = this.storage.get<unknown>(STORAGE_KEY);
      const existingData = migrateStorage(rawData);

      const data: PersistedData = {
        version: 3,
        sessions: existingData.sessions,
        branchSessions: existingData.branchSessions,
        timelineSnapshots,
      };
      await this.storage.update(STORAGE_KEY, data);
      this.logger.appendLine(`Saved ${timelineSnapshots.length} timeline snapshots to storage`);
    } catch (error) {
      this.logger.appendLine(
        `Error saving timeline snapshots: ${error instanceof Error ? error.message : String(error)}`
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
