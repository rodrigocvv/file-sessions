# Changelog

All notable changes to the "File Sessions" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-17

### Added
- **Add File to Session**: New inline button (➕ add icon) on each saved session that allows you to add the currently open editor file to that session
  - Appears next to the "Open Session" button in the tree view
  - Works with the currently active file in the editor
  - Automatically validates that the file is within the workspace
  - Prevents duplicate files from being added
  - Shows helpful messages for edge cases (no file open, file already in session, etc.)
- New `getActiveEditorFile()` helper function in vscodeAdapter for getting the current editor file
- New `addFileToSession()` method in SessionService for programmatically adding files to sessions

### Changed
- Updated UI tree view to include the new add file action button
- Enhanced session management workflow to support incremental file additions

## [1.0.0] - 2026-02-17

### Added
- **Saved Sessions**: Manually create and manage named groups of files
  - Save all currently open files as a session
  - Open, rename, and delete sessions
  - Remove individual files from sessions
  - Visual tree view interface
  
- **Branch Sessions**: Automatic file sessions tied to Git branches
  - Automatically save open files when switching branches
  - Automatically restore files when returning to a branch
  - Configurable auto-save and auto-restore behavior
  - Visual tree view with branch status
  
- **Timeline**: Smart automatic snapshots of workspace context
  - Intelligent detection of significant context changes
  - Restore workspace to any previous snapshot
  - Automatic cleanup (maintains 50 most recent snapshots)
  - Visual timeline view with timestamps
  
- **Configuration Options**:
  - `fileSessions.closeExistingEditorsOnOpen`: Close existing editors when opening a session
  - `fileSessions.gitBranchSessions.enabled`: Enable/disable branch sessions
  - `fileSessions.gitBranchSessions.autoCreate`: Auto-save on branch switch
  - `fileSessions.gitBranchSessions.autoRestoreOnSwitch`: Auto-restore on branch switch
  - `fileSessions.timeline.enabled`: Enable/disable timeline snapshots
  
- **Multi-root Workspace Support**: Full support for workspaces with multiple folders
- **Event System**: Event-driven architecture for loose coupling
- **Clean Architecture**: Layered design (domain, application, infrastructure, UI)
- **Type Safety**: Full TypeScript implementation with strict mode
- **Comprehensive Documentation**: Detailed README with examples and use cases

### Technical
- Storage via VS Code's workspace state (local only)
- No external dependencies or network requests
- No telemetry or data collection
- Open source with MIT license

[1.1.0]: https://github.com/rodrigocvv/file-sessions/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/rodrigocvv/file-sessions/releases/tag/v1.0.0
