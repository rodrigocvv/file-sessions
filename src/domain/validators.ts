/**
 * Domain layer: Validation rules for entities
 * No VS Code API dependencies
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const MAX_SESSION_NAME_LENGTH = 100;

/**
 * Validate session name
 */
export function validateSessionName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Session name cannot be empty' };
  }

  if (name.length > MAX_SESSION_NAME_LENGTH) {
    return {
      valid: false,
      error: `Session name cannot exceed ${MAX_SESSION_NAME_LENGTH} characters`,
    };
  }

  return { valid: true };
}

/**
 * Check if session name already exists (case-insensitive)
 */
export function isSessionNameDuplicate(
  name: string,
  existingSessions: Array<{ name: string }>,
  excludeId?: string
): boolean {
  const normalizedName = name.toLowerCase().trim();
  return existingSessions.some(
    (session: { name: string; id?: string }) =>
      session.name.toLowerCase().trim() === normalizedName &&
      (!excludeId || (session as { id?: string }).id !== excludeId)
  );
}

/**
 * Validate file path
 */
export function validateFilePath(path: string): ValidationResult {
  if (!path || path.trim().length === 0) {
    return { valid: false, error: 'File path cannot be empty' };
  }

  return { valid: true };
}

/**
 * Deduplicate files by path (case-insensitive on Windows, case-sensitive on Unix)
 */
export function deduplicateFiles<T extends { path: string }>(files: T[]): T[] {
  const seen = new Map<string, T>();
  const isWindows = process.platform === 'win32';

  for (const file of files) {
    const key = isWindows ? file.path.toLowerCase() : file.path;
    if (!seen.has(key)) {
      seen.set(key, file);
    }
  }

  return Array.from(seen.values());
}
