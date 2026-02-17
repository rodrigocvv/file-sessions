/**
 * Application layer: Business logic orchestration
 * Coordinates between domain, infrastructure, and events
 */

import * as vscode from 'vscode';
import { FileSession, SessionFile, createSession, updateSession } from '../domain/session';
import {
  validateSessionName,
  isSessionNameDuplicate,
  deduplicateFiles,
} from '../domain/validators';
import { SessionRepository } from '../infrastructure/sessionRepository';
import { SessionEvents } from '../events/sessionEvents';
import * as vscodeAdapter from '../infrastructure/vscodeAdapter';

export class SessionService {
  private sessions: FileSession[] = [];

  constructor(
    private readonly repository: SessionRepository,
    private readonly events: SessionEvents,
    private readonly logger: vscode.OutputChannel
  ) {}

  /**
   * Initialize service by loading sessions from storage
   */
  async initialize(): Promise<void> {
    try {
      this.sessions = await this.repository.loadSessions();
      this.logger.appendLine(`Initialized with ${this.sessions.length} sessions`);
    } catch (error) {
      this.logger.appendLine(
        `Failed to initialize: ${error instanceof Error ? error.message : String(error)}`
      );
      this.sessions = [];
    }
  }

  /**
   * Get all sessions
   */
  getAllSessions(): FileSession[] {
    return [...this.sessions];
  }

  /**
   * Get session by ID
   */
  getSessionById(id: string): FileSession | undefined {
    return this.sessions.find((s) => s.id === id);
  }

  /**
   * Save all currently open files as a new session
   */
  async saveSession(name: string): Promise<FileSession | string> {
    try {
      // Validate session name
      const validation = validateSessionName(name);
      if (!validation.valid) {
        return validation.error!;
      }

      // Check for duplicate name
      if (isSessionNameDuplicate(name, this.sessions)) {
        return 'A session with this name already exists';
      }

      // Collect all open files from tabs
      const sessionFiles = vscodeAdapter.getAllOpenFiles();
      
      if (sessionFiles.length === 0) {
        return 'No files are currently open';
      }

      // Deduplicate files
      const deduplicatedFiles = deduplicateFiles(sessionFiles);

      // Create session
      const session = createSession(name, deduplicatedFiles);

      // Add to sessions
      this.sessions.push(session);

      // Persist to storage
      await this.repository.saveSessions(this.sessions);

      // Emit event
      this.events.emit({ type: 'sessionCreated', session });

      this.logger.appendLine(
        `Created session "${name}" with ${session.files.length} files`
      );

      return session;
    } catch (error) {
      const message = `Failed to save session: ${
        error instanceof Error ? error.message : String(error)
      }`;
      this.logger.appendLine(message);
      return message;
    }
  }

  /**
   * Open a session (restore files)
   */
  async openSession(sessionId: string): Promise<void> {
    return this.openFiles(sessionId);
  }

  /**
   * Open all files from a session
   */
  async openFiles(sessionId: string): Promise<void> {
    try {
      const session = this.getSessionById(sessionId);
      if (!session) {
        vscodeAdapter.showError('Session not found');
        return;
      }

      this.logger.appendLine(`Opening session "${session.name}"`);

      // Check configuration for closing existing editors
      const closeExisting = vscodeAdapter.getConfiguration(
        'closeExistingEditorsOnOpen',
        false
      );

      if (closeExisting) {
        // Close only editors that are not in the session
        const sessionFilePaths = session.files.map(f => f.path);
        await vscodeAdapter.closeEditorsExcept(sessionFilePaths);
      }

      // Open files and collect missing ones
      const missingFiles: string[] = [];
      for (const file of session.files) {
        const opened = await vscodeAdapter.openFile(file.path, file.workspaceFolder);
        if (!opened) {
          missingFiles.push(file.path);
        }
      }

      // Show warning for missing files
      if (missingFiles.length > 0) {
        const message =
          missingFiles.length === 1
            ? `1 file could not be opened: ${missingFiles[0]}`
            : `${missingFiles.length} files could not be opened`;
        vscodeAdapter.showWarning(message);
        this.logger.appendLine(`Missing files: ${missingFiles.join(', ')}`);
      }

      // Emit event
      this.events.emit({ type: 'sessionOpened', session });

      this.logger.appendLine(`Opened session "${session.name}"`);
    } catch (error) {
      const message = `Failed to open session: ${
        error instanceof Error ? error.message : String(error)
      }`;
      this.logger.appendLine(message);
      vscodeAdapter.showError(message);
    }
  }

  /**
   * Rename a session
   */
  async renameSession(sessionId: string, newName: string): Promise<boolean | string> {
    try {
      const session = this.getSessionById(sessionId);
      if (!session) {
        return 'Session not found';
      }

      // Validate new name
      const validation = validateSessionName(newName);
      if (!validation.valid) {
        return validation.error!;
      }

      // Check for duplicate name (excluding current session)
      if (isSessionNameDuplicate(newName, this.sessions, sessionId)) {
        return 'A session with this name already exists';
      }

      // Update session
      const updatedSession = updateSession(session, { name: newName });
      const index = this.sessions.findIndex((s) => s.id === sessionId);
      this.sessions[index] = updatedSession;

      // Persist to storage
      await this.repository.saveSessions(this.sessions);

      // Emit event
      this.events.emit({ type: 'sessionUpdated', session: updatedSession });

      this.logger.appendLine(`Renamed session to "${newName}"`);

      return true;
    } catch (error) {
      const message = `Failed to rename session: ${
        error instanceof Error ? error.message : String(error)
      }`;
      this.logger.appendLine(message);
      return message;
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const session = this.getSessionById(sessionId);
      if (!session) {
        vscodeAdapter.showError('Session not found');
        return false;
      }

      // Remove from sessions
      this.sessions = this.sessions.filter((s) => s.id !== sessionId);

      // Persist to storage
      await this.repository.saveSessions(this.sessions);

      // Emit event
      this.events.emit({ type: 'sessionDeleted', session });

      this.logger.appendLine(`Deleted session "${session.name}"`);

      return true;
    } catch (error) {
      const message = `Failed to delete session: ${
        error instanceof Error ? error.message : String(error)
      }`;
      this.logger.appendLine(message);
      vscodeAdapter.showError(message);
      return false;
    }
  }

  /**
   * Add a file to an existing session
   */
  async addFileToSession(sessionId: string, file: SessionFile): Promise<boolean> {
    try {
      const session = this.getSessionById(sessionId);
      if (!session) {
        vscodeAdapter.showError('Session not found');
        return false;
      }

      // Check if file already exists in session
      const fileExists = session.files.some((f) => f.path === file.path);
      if (fileExists) {
        vscodeAdapter.showInfo(`File is already in session "${session.name}"`);
        return false;
      }

      // Add file to session
      const updatedFiles = [...session.files, file];
      const deduplicatedFiles = deduplicateFiles(updatedFiles);

      // Update session
      const updatedSession = updateSession(session, { files: deduplicatedFiles });
      const index = this.sessions.findIndex((s) => s.id === sessionId);
      this.sessions[index] = updatedSession;

      // Persist to storage
      await this.repository.saveSessions(this.sessions);

      // Emit event
      this.events.emit({ type: 'sessionUpdated', session: updatedSession });

      this.logger.appendLine(
        `Added file "${file.path}" to session "${session.name}"`
      );

      return true;
    } catch (error) {
      const message = `Failed to add file: ${
        error instanceof Error ? error.message : String(error)
      }`;
      this.logger.appendLine(message);
      vscodeAdapter.showError(message);
      return false;
    }
  }

  /**
   * Remove a file from a session
   */
  async removeFileFromSession(sessionId: string, filePath: string): Promise<boolean> {
    try {
      const session = this.getSessionById(sessionId);
      if (!session) {
        vscodeAdapter.showError('Session not found');
        return false;
      }

      // Remove file
      const updatedFiles = session.files.filter((f) => f.path !== filePath);

      if (updatedFiles.length === session.files.length) {
        vscodeAdapter.showError('File not found in session');
        return false;
      }

      // Update session
      const updatedSession = updateSession(session, { files: updatedFiles });
      const index = this.sessions.findIndex((s) => s.id === sessionId);
      this.sessions[index] = updatedSession;

      // Persist to storage
      await this.repository.saveSessions(this.sessions);

      // Emit event
      this.events.emit({ type: 'sessionUpdated', session: updatedSession });

      this.logger.appendLine(
        `Removed file "${filePath}" from session "${session.name}"`
      );

      return true;
    } catch (error) {
      const message = `Failed to remove file: ${
        error instanceof Error ? error.message : String(error)
      }`;
      this.logger.appendLine(message);
      vscodeAdapter.showError(message);
      return false;
    }
  }
}
