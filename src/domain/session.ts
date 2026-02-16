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
