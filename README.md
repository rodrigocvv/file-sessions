# File Sessions

A production-grade Visual Studio Code extension for managing and restoring groups of open files within your workspace.

## Features

### Save File Sessions
Quickly save all currently open files (tabs) as a named session. Perfect for:
- Switching between different features or tasks
- Managing context when reviewing code
- Organizing files for different workflows
- Team collaboration scenarios

### Restore Sessions
Restore a previously saved session with a single click. All files from the session will be opened in the same order they were saved.

### Manage Sessions
- **Rename**: Update session names as your work evolves
- **Delete**: Remove sessions you no longer need
- **Remove Files**: Clean up individual files from a session

### Smart Session Handling
- **Deduplication**: Automatically removes duplicate files when saving
- **Validation**: Prevents empty or invalid session names
- **Missing File Detection**: Gracefully handles files that have been moved or deleted
- **Multi-root Workspace Support**: Works seamlessly with multi-root workspaces

## Installation

1. Open VS Code
2. Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (macOS)
3. Type `ext install file-sessions`
4. Press Enter

## Usage

### Creating a Session

1. Open the files you want to save as a session (they will appear as tabs)
2. Click the save icon in the File Sessions view (Activity Bar)
   - Or press `Ctrl+Shift+P` and run "File Sessions: Save File Session"
3. Enter a name for your session
4. All open files (tabs) are saved and the session appears in the File Sessions view

### Opening a Session

**From Tree View:**
- Click on a session name to expand and see its files
- Click the folder icon next to the session name to restore all files
- Right-click on a session and select "Open Files" to open all files from the session

**Individual Files:**
- Click on any file in the session to open just that file

### Renaming a Session

1. Right-click on a session in the File Sessions view
2. Select "Rename Session"
3. Enter the new name
4. Press Enter

### Deleting a Session

1. Right-click on a session in the File Sessions view
2. Select "Delete Session"
3. Confirm the deletion

### Removing Files from a Session

1. Expand a session in the File Sessions view
2. Right-click on a file
3. Select "Remove File from Session"

## Configuration

### `fileSessions.closeExistingEditorsOnOpen`

**Type:** `boolean`  
**Default:** `false`

When enabled, opening a session will close all currently open editors **except those that are part of the session being opened**. This ensures a clean workspace with only the session files visible.

**Behavior:**
- `false` (default): Session files are opened alongside any currently open files
- `true`: All open files not in the session are closed, then session files are opened

**Example:**
```json
{
  "fileSessions.closeExistingEditorsOnOpen": true
}
```

## Multi-root Workspace Support

File Sessions fully supports multi-root workspaces. Each file in a session stores its workspace folder name, ensuring files are correctly resolved even when workspace structure changes.

**Behavior:**
- Files from different workspace folders can coexist in the same session
- If a workspace folder is removed, files from that folder will be skipped with a warning
- Session data is stored per workspace, not globally

## Architecture

This extension follows a layered architecture for maintainability and testability:

- **UI Layer**: TreeView, Commands
- **Application Layer**: Business logic orchestration
- **Domain Layer**: Core entities and validation
- **Infrastructure Layer**: VS Code API and storage

## Keyboard Shortcuts

The extension respects VS Code's standard keyboard accessibility. All actions are available through:
- Context menus (right-click)
- Command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
- Tree view navigation

## Troubleshooting

### Session not appearing after save

Check the "File Sessions" output channel (View → Output → File Sessions) for error messages.

### Files not opening from session

Possible causes:
- Files have been moved or deleted since the session was saved
- Workspace folder has been removed or renamed in multi-root workspace
- File system permissions issues

The extension will show a warning message for any files that cannot be opened.

### Session data location

Session data is stored in VS Code's workspace state. If you need to reset:
1. Close VS Code
2. Delete workspace storage (location varies by OS)
3. Reopen workspace

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch
```

### Running Extension

1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. Test the extension in the new window

## Technical Details

- **Storage**: Uses VS Code's `ExtensionContext.workspaceState` API
- **Storage Versioning**: Built-in migration system for future schema changes
- **Event System**: Internal event-driven architecture for component decoupling
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Logging**: Detailed logging to Output Channel for debugging

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Changelog

### 1.0.0

Initial release with core features:
- Save and restore file sessions
- Session management (rename, delete)
- File management within sessions
- Multi-root workspace support
- Configurable behavior for closing editors
