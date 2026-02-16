# File Sessions

> **Never lose your workspace context again.** Automatically manage and restore groups of open files with intelligent tracking for Git branches, manual sessions, and timeline history.

[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue?style=flat-square)](https://marketplace.visualstudio.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## 🎯 Why File Sessions?

Have you ever experienced these frustrating moments?

- 😤 **Opening 20+ files** for a feature, then losing track when switching tasks
- 🔀 **Switching Git branches** and having to manually reopen all relevant files
- 🤯 **Returning to a project** after days/weeks and forgetting which files you were working on
- 🧩 **Working on multiple features** simultaneously and constantly losing your context
- 📚 **Code review overload** with dozens of files open, unable to organize them
- 🔄 **VS Code crashes** and you lose all your carefully arranged tabs

**File Sessions solves all of these problems** with three powerful features:

### ✨ Key Features

#### 📁 **1. Saved Sessions** (Manual)
Create named groups of files for different tasks or features. Perfect for organizing your work.

- 💾 Save all currently open files with one click
- 🏷️ Name sessions by feature, task, or context
- 📂 Organize files that belong together
- 🔄 Switch between different work contexts instantly
- ✏️ Rename, modify, or delete sessions anytime

#### 🌿 **2. Branch Sessions** (Automatic)
Automatically save and restore files when switching Git branches. Your context follows your branches!

- 🤖 **Fully automatic** - no manual intervention needed
- 🔀 Saves your open files when you switch branches
- 📥 Restores them when you return to that branch
- 🎯 Branch-specific context that persists across switches
- 🚀 Works seamlessly with your Git workflow

#### ⏱️ **3. Timeline** (Smart History)
Intelligent automatic snapshots of your workspace over time. Like "Undo" for your entire editor state.

- 📸 Automatic snapshots of your workspace context
- 🧠 Smart detection of significant context changes
- 📊 Visual history of your work sessions
- ⏮️ Restore your workspace to any previous state
- 🎨 Perfect for exploratory work or debugging

## 🚀 Quick Start

### Installation

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "File Sessions"
4. Click Install

Or install via command line:
```bash
code --install-extension your-publisher-name.file-sessions
```

## 📖 Complete Usage Guide

### 📁 Working with Saved Sessions

#### Creating a Session

1. Open all the files you want to group together
2. Open the **File Sessions** view from the Activity Bar (left sidebar)
3. Click the **💾 Save** icon in the "Saved Sessions" section
4. Enter a descriptive name (e.g., "User Authentication Feature")
5. Done! Your session is saved and appears in the tree view

![Save Session Demo](images/save-session.gif)
*Coming soon: GIF showing session creation*

#### Opening a Session

**Method 1: Tree View (Recommended)**
- Click the **📂 folder icon** next to a session name to restore all files
- Or right-click on the session → "Open Files"

**Method 2: Command Palette**
- Press `Ctrl+Shift+P` / `Cmd+Shift+P`
- Type "File Sessions: Save File Session"
- Select your session

![Open Session Demo](images/open-session.gif)
*Coming soon: GIF showing session restoration*

#### Managing Sessions

- **Rename**: Right-click session → "Rename Session"
- **Delete**: Right-click session → "Delete Session"
- **Remove Individual Files**: Expand session → click **✖️** next to a file
- **View Files**: Click on session name to expand and see all files
- **Open Single File**: Click on any file in the session to open just that file

**Example Use Cases:**
- 🔧 **Feature Development**: "Payment Gateway Integration" session with all API, UI, and test files
- 🐛 **Bug Fixing**: "Issue #234 - Memory Leak" session with all relevant debugging files
- 📝 **Documentation**: "API Docs Update" session with all documentation files
- 👥 **Code Review**: "PR #456 Review" session with all changed files

---

### 🌿 Working with Branch Sessions (Automatic)

Branch Sessions are **completely automatic** and require **no manual intervention**. Once enabled (default), they work seamlessly with your Git workflow.

#### How It Works

1. **Switching Away From a Branch**
   - You're on `feature/auth` with several files open
   - You run `git checkout main`
   - 🤖 File Sessions **automatically saves** your open files to `feature/auth` session
   
2. **Switching To a Branch With a Session**
   - You run `git checkout feature/auth`
   - 🤖 File Sessions **automatically restores** the files you had open
   - Your exact context is restored instantly!

3. **Creating a New Branch**
   - You run `git checkout -b feature/new-feature`
   - You open files and work on them
   - Next time you return, those files will be auto-restored

![Branch Sessions Demo](images/branch-sessions.gif)
*Coming soon: GIF showing automatic branch session behavior*

#### Managing Branch Sessions

View all branch sessions in the **"Branch Sessions"** section:
- **📂 Open**: Click folder icon to restore all files from that branch
- **🗑️ Delete**: Right-click → "Delete Branch Session" to remove
- **📄 View Files**: Expand to see all files in the session
- **✖️ Remove File**: Click X next to individual files to remove them

#### Branch Session Best Practices

✅ **Let it work automatically** - Don't overthink it, just switch branches normally  
✅ **One branch = One context** - Keep each branch focused on specific work  
✅ **Review before committing** - Branch sessions help you see all your changes  
✅ **Clean up old branches** - Delete branch sessions for merged/deleted branches

---

### ⏱️ Working with Timeline (Smart History)

Timeline automatically creates smart snapshots of your workspace context. Think of it as **version control for your editor state**.

#### How Timeline Works

The Timeline feature uses intelligent detection to create snapshots when significant context changes occur:

🎯 **Smart Triggers:**
- **Rapid file opening**: Opening 4+ files within 2 minutes
- **Significant context change**: When 60%+ of open files change
- **After inactivity**: Returning after 10+ minutes of inactivity
- **Minimum interval**: At least 2 minutes between snapshots (prevents spam)

📸 **Snapshot Contents:**
- All currently open files
- Timestamp of when the snapshot was taken
- Automatically limited to 50 most recent snapshots

#### Using Timeline

**View Timeline:**
- Open the **"Timeline"** section in File Sessions view
- Snapshots are listed with timestamps (most recent first)
- See file count and time for each snapshot

**Restore a Snapshot:**
- Click the **⏮️ restore icon** next to any snapshot
- All files from that moment are reopened
- Perfect for when you accidentally closed important files!

**Manage Timeline:**
- **Delete Single**: Right-click snapshot → "Delete Snapshot"
- **Clear All**: Click **🗑️ Clear All** button at the top of Timeline view

![Timeline Demo](images/timeline.gif)
*Coming soon: GIF showing timeline restoration*

#### Timeline Use Cases

💡 **"What was I working on yesterday?"** - Check timeline to see your context  
💡 **"I closed something important!"** - Restore recent snapshot to get it back  
💡 **"How did I approach this problem?"** - Review past snapshots to trace your exploration  
💡 **"Context switching chaos"** - Jump back to a previous focused state

---

## ⚙️ Configuration

Access settings via `File → Preferences → Settings` and search for "File Sessions", or click the ⚙️ gear icon in any File Sessions view.

### Manual Sessions

#### `fileSessions.closeExistingEditorsOnOpen`

**Type:** `boolean` | **Default:** `false`

Close all currently open editors when opening a session (except those in the session).

```json
{
  "fileSessions.closeExistingEditorsOnOpen": true
}
```

- ✅ `true`: Clean workspace with only session files
- ❌ `false`: Session files open alongside existing files

---

### Branch Sessions (Git Integration)

#### `fileSessions.gitBranchSessions.enabled`

**Type:** `boolean` | **Default:** `true`

Enable/disable automatic Git branch sessions entirely.

```json
{
  "fileSessions.gitBranchSessions.enabled": true
}
```

#### `fileSessions.gitBranchSessions.autoCreate`

**Type:** `boolean` | **Default:** `true`

Automatically save open files when switching branches.

```json
{
  "fileSessions.gitBranchSessions.autoCreate": true
}
```

#### `fileSessions.gitBranchSessions.autoRestoreOnSwitch`

**Type:** `boolean` | **Default:** `true`

Automatically restore files when switching to a branch with an existing session.

```json
{
  "fileSessions.gitBranchSessions.autoRestoreOnSwitch": true
}
```

**🎛️ Configuration Scenarios:**

| Scenario | enabled | autoCreate | autoRestoreOnSwitch | Behavior |
|----------|---------|------------|---------------------|----------|
| **Full Auto** (Default) | ✅ | ✅ | ✅ | Save & restore automatically |
| **Manual Restore** | ✅ | ✅ | ❌ | Save auto, restore manually |
| **Manual Control** | ✅ | ❌ | ❌ | Everything manual |
| **Disabled** | ❌ | N/A | N/A | Feature off |

---

### Timeline (Smart History)

#### `fileSessions.timeline.enabled`

**Type:** `boolean` | **Default:** `true`

Enable/disable automatic timeline snapshots.

```json
{
  "fileSessions.timeline.enabled": true
}
```

---

## 🎯 Real-World Use Cases

### 1. 🔄 Multi-Feature Development

**Problem:** Working on 3 features simultaneously, constantly losing context.

**Solution:**
- Create sessions: "Feature A - Payment", "Feature B - Auth", "Feature C - Reports"
- Instantly switch between contexts
- Each session has exactly the files you need

---

### 2. 🌿 Clean Git Workflow

**Problem:** Switching branches loses your carefully opened files.

**Solution:**
- Branch Sessions automatically save/restore your files
- Each branch maintains its own context
- Review all changed files before committing

---

### 3. 📚 Code Review Overload

**Problem:** PR with 50+ files, hard to organize and review.

**Solution:**
- Create session "PR #123 Review"
- Group files logically (frontend, backend, tests)
- Resume review exactly where you left off

---

### 4. 🐛 Complex Debugging

**Problem:** Debugging requires 15+ files open across multiple folders.

**Solution:**
- Open all relevant files once
- Save as "Debug - Memory Leak Issue"
- Instantly restore this context whenever needed

---

### 5. 📖 Documentation Work

**Problem:** Documentation spread across many markdown files.

**Solution:**
- Create "Docs - API Reference" session
- All docs open together
- Switch to/from code work effortlessly

---

### 6. 🔥 Emergency Hotfix

**Problem:** Must switch to hotfix branch, don't want to lose feature work.

**Solution:**
- Branch Sessions automatically save your feature context
- Switch to hotfix branch
- Return to feature branch with all files restored

---

## 💼 Multi-Root Workspace Support

File Sessions has **full support for multi-root workspaces**:

✅ Files from different workspace folders in the same session  
✅ Workspace folder stored with each file  
✅ Graceful handling when folders are removed  
✅ Separate storage per workspace

**Example Multi-Root Session:**
```
Session: "Full Stack Feature"
  ├─ [frontend] src/components/UserProfile.tsx
  ├─ [backend] src/controllers/userController.ts
  ├─ [backend] src/models/User.ts
  └─ [shared] types/user.d.ts
```

```

---

## 🎨 User Interface Overview

File Sessions adds a new Activity Bar icon with **three views**:

### 📁 Saved Sessions
Manual sessions you create for different tasks and features.

**Actions:**
- 💾 **Save** (toolbar) - Create new session from open files
- 📂 **Open** - Restore all files from session
- ✏️ **Rename** - Change session name
- 🗑️ **Delete** - Remove session
- ✖️ **Remove File** - Remove single file from session

---

### 🌿 Branch Sessions  
Automatic sessions tied to Git branches.

**Actions:**
- 📂 **Open** - Restore files from a branch session
- 🗑️ **Delete** - Remove branch session
- ✖️ **Remove File** - Remove single file from session

**Status Indicators:**
- Current branch session highlighted
- Last opened timestamp visible
- File count shown for each session

---

### ⏱️ Timeline
Smart automatic history of your workspace context.

**Actions:**
- ⏮️ **Restore** - Restore workspace to snapshot state
- 🗑️ **Delete** - Remove single snapshot
- 🗑️ **Clear All** (toolbar) - Delete all snapshots

**Information Shown:**
- Timestamp of snapshot
- Number of files in snapshot
- Chronological order (newest first)

---

## 🎹 Keyboard Shortcuts & Commands

All features accessible via **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`):

### Available Commands

- **File Sessions: Save File Session** - Create new manual session
- **File Sessions: Open Extension Settings** - Quick access to settings

**Note:** Most actions (open, rename, delete) are context-specific and available via right-click menus in the tree views.

---

## 🏗️ Architecture & Design

File Sessions follows **clean architecture principles** for maintainability and testability:

### Layered Structure

```
📦 src/
├─ 🎨 ui/                     # UI Layer
│  ├─ commands.ts             # Command handlers
│  ├─ treeProvider.ts         # Saved sessions tree
│  ├─ branchTreeProvider.ts   # Branch sessions tree
│  ├─ timelineTreeProvider.ts # Timeline tree
│  └─ *TreeItems.ts           # Tree item definitions
│
├─ 💼 application/             # Application Layer
│  ├─ sessionService.ts       # Manual session logic
│  ├─ branchSessionService.ts # Branch session logic
│  ├─ timelineService.ts      # Timeline logic
│  └─ gitBranchOrchestrator.ts# Git integration
│
├─ 🎯 domain/                  # Domain Layer
│  ├─ session.ts              # Core entities
│  └─ validators.ts           # Business rules
│
├─ 🔧 infrastructure/          # Infrastructure Layer
│  ├─ sessionRepository.ts    # Storage abstraction
│  ├─ gitAdapter.ts           # Git operations
│  ├─ vscodeAdapter.ts        # VS Code API
│  └─ storageMigrations.ts    # Data migrations
│
└─ 📡 events/                  # Event System
   └─ sessionEvents.ts        # Event emitters

```

### Key Design Principles

- **Separation of Concerns**: Each layer has a single responsibility
- **Dependency Injection**: Services receive dependencies via constructor
- **Event-Driven**: Loose coupling via event system
- **Testability**: Logic separated from VS Code API
- **Type Safety**: Full TypeScript with strict mode

---

## 🔍 Troubleshooting

### Session not appearing after save

1. Check the **Output panel**: `View → Output → File Sessions`
2. Look for error messages or warnings
3. Verify you had files open when saving
4. Ensure workspace is a valid folder (not empty workspace)

### Files not opening from session

**Common causes:**

❌ **Files moved/deleted** - File paths no longer valid  
**Solution:** Remove these files from session or restore them

❌ **Workspace folder removed** (multi-root)  
**Solution:** Re-add workspace folder or delete session

❌ **File permissions issues**  
**Solution:** Check file system permissions

❌ **Corrupted session data**  
**Solution:** Delete and recreate session

### Branch sessions not working

**Checklist:**

✅ Is Git repository initialized?  
✅ Is `gitBranchSessions.enabled` set to `true`?  
✅ Are you switching branches via Git commands?  
✅ Check Output panel for error messages

### Timeline not creating snapshots

**Verify:**

✅ Is `timeline.enabled` set to `true`?  
✅ Are you opening/closing files? (triggers detection)  
✅ Has 2+ minutes passed since last snapshot?  
✅ Check Output panel for timeline logs

### Performance issues with many sessions

**Tips:**

- Delete old unused sessions
- Clear timeline history regularly
- Disable timeline if not needed
- Close File Sessions views when not in use

### Reset extension data

If you need to start fresh:

**Option 1: Delete individual data**
- Delete sessions one by one from tree view

**Option 2: Reset all workspace data**
1. Close VS Code
2. Navigate to workspace storage directory (varies by OS)
3. Delete workspace state files
4. Reopen workspace

**Note:** This will reset ALL extension data for that workspace, not just File Sessions.

---

## 📊 Storage & Privacy

### Where is data stored?

File Sessions stores all data in **VS Code's workspace state** (local only):

- **Location**: VS Code's built-in storage mechanism
- **Scope**: Per-workspace (each workspace has separate sessions)
- **Format**: JSON (easily inspectable)
- **Privacy**: Never sent to external servers

### What is stored?

✅ Session names  
✅ File paths (absolute)  
✅ Workspace folder names  
✅ Timestamps  

❌ **NOT stored:**  
- File contents
- Git credentials
- Personal information
- Any data outside workspace

### Data security

- All data stored locally
- No network requests
- No telemetry
- No external dependencies
- Open source code (auditable)

---

## 🎓 Tips & Best Practices

### 💡 Naming Conventions

**Good session names:**
- ✅ "Feature - User Authentication"
- ✅ "Bug #234 - Memory Leak"
- ✅ "Refactor - Payment Module"
- ✅ "Review PR #456"

**Avoid:**
- ❌ "Session 1" (not descriptive)
- ❌ "Files" (too generic)
- ❌ "Temp" (temporary things become permanent)

### 💡 Session Organization

- Keep sessions focused (10-20 files max)
- Delete sessions when task is complete
- Use branch sessions for feature work
- Use manual sessions for cross-branch work

### 💡 Git Branch Workflow

1. Create feature branch
2. Open relevant files
3. Let branch sessions auto-save on switch
4. Return later → files auto-restore
5. Delete branch session after merge

### 💡 Timeline Usage

- Use for exploratory work
- Check before major refactoring
- Clear timeline weekly to save space
- Great for "what was I doing?" moments

### 💡 Performance Optimization

- Limit sessions to relevant files only
- Clean up old sessions regularly
- Disable timeline if not needed
- Close tree views when not in use

---

## 🐛 Known Limitations

- **Git only**: Branch sessions require Git repository (not SVN, Mercurial, etc.)
- **Local files**: Only local files supported (not remote SSH/WSL files via remote extensions)
- **Open editors only**: Only saves visible tabs, not editor groups layout
- **No file contents**: Doesn't save file changes (use Git for that!)
- **Timeline cap**: Maximum 50 snapshots (oldest auto-deleted)

---

## 🚀 Coming Soon

Vote on features at our [GitHub Issues](https://github.com/your-username/file-sessions/issues)!

- 🎨 Custom session icons/colors
- 📤 Export/import sessions (share with team)
- 🔄 Sync sessions across machines
- 📐 Editor group layout preservation
- 🏷️ Session tags and filtering
- 📊 Session analytics and insights
- ⌨️ Custom keyboard shortcuts
- 🌐 Remote file support (SSH/WSL)

---

## 🤝 Contributing

Contributions are welcome! This is an open-source project.

### Development Setup

```bash
# Clone repository
git clone https://github.com/your-username/file-sessions.git
cd file-sessions

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-compile on save)
npm run watch

# Open in VS Code
code .

# Press F5 to launch Extension Development Host
```

### Project Structure

See **Architecture & Design** section above for detailed structure.

### Guidelines

- Follow existing code style
- Add tests for new features
- Update README for user-facing changes
- Use conventional commits
- Create issues before major changes

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 💬 Support & Feedback

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-username/file-sessions/issues)
- 💡 **Feature Requests**: [GitHub Issues](https://github.com/your-username/file-sessions/issues)
- ⭐ **Rate & Review**: [VS Code Marketplace](https://marketplace.visualstudio.com/)
- 📧 **Contact**: your-email@example.com

---

## 🙏 Acknowledgments

Built with ❤️ for developers who are tired of losing their workspace context.

Special thanks to:
- VS Code team for excellent extension API
- Open source community for inspiration
- All contributors and users

---

## 📸 Screenshots

> **Note to publisher**: Add GIF/screenshots at these locations:
> - `images/save-session.gif` - Creating and saving a session
> - `images/open-session.gif` - Opening and restoring a session
> - `images/branch-sessions.gif` - Automatic branch session behavior
> - `images/timeline.gif` - Timeline restoration in action

---

<div align="center">

**[⬆ Back to Top](#file-sessions)**

Made with ⚡ by developers, for developers.

If this extension helps your workflow, please ⭐ **star** and ✍️ **review** it!

</div>
