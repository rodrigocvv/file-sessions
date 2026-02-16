/**
 * Domain layer: Core entities and business objects
 * No VS Code API dependencies
 */

export interface SessionFile {
  path: string;
  workspaceFolder: string;
}

export interface FileSession {
  id: string;
  name: string;
  files: SessionFile[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Create a new file session with generated ID and timestamps
 */
export function createSession(name: string, files: SessionFile[]): FileSession {
  const now = Date.now();
  return {
    id: generateSessionId(),
    name,
    files,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update an existing session with new data
 */
export function updateSession(
  session: FileSession,
  updates: Partial<Pick<FileSession, 'name' | 'files'>>
): FileSession {
  return {
    ...session,
    ...updates,
    updatedAt: Date.now(),
  };
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Branch session - automatically managed per Git branch
 */
export interface BranchSession {
  id: string;
  branchName: string;
  workspaceFolder: string;
  files: SessionFile[];
  lastOpenedAt: number;
}

/**
 * Generate a deterministic ID for a branch session
 */
export function generateBranchSessionId(branchName: string, workspaceFolder: string): string {
  // Use deterministic ID so we can find the session without iteration
  const safeBranchName = branchName.replace(/[^a-zA-Z0-9-_]/g, '-');
  const safeWorkspaceFolder = workspaceFolder.replace(/[^a-zA-Z0-9-_]/g, '-');
  return `branch-${safeWorkspaceFolder}-${safeBranchName}`;
}

/**
 * Create a new branch session
 */
export function createBranchSession(
  branchName: string,
  workspaceFolder: string,
  files: SessionFile[]
): BranchSession {
  return {
    id: generateBranchSessionId(branchName, workspaceFolder),
    branchName,
    workspaceFolder,
    files,
    lastOpenedAt: Date.now(),
  };
}

/**
 * Update an existing branch session
 */
export function updateBranchSession(
  session: BranchSession,
  updates: Partial<Pick<BranchSession, 'files'>>
): BranchSession {
  return {
    ...session,
    ...updates,
    lastOpenedAt: Date.now(),
  };
}

/**
 * Timeline snapshot - automatic read-only history of workspace context
 */
export interface TimelineSnapshot {
  id: string;
  timestamp: number;
  files: SessionFile[];
}

/**
 * Generate a unique timeline snapshot ID
 */
function generateTimelineSnapshotId(): string {
  return `timeline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new timeline snapshot
 */
export function createTimelineSnapshot(files: SessionFile[]): TimelineSnapshot {
  return {
    id: generateTimelineSnapshotId(),
    timestamp: Date.now(),
    files,
  };
}

/**
 * Format timestamp as US locale date-time string: MM/DD/YYYY, hh:mm AM/PM
 */
export function formatTimelineTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
