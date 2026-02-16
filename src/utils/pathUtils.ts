/**
 * Utility functions for path manipulation
 */

import * as path from 'path';

/**
 * Normalize path separators for the current platform
 */
export function normalizePath(filePath: string): string {
  return path.normalize(filePath);
}

/**
 * Get relative path from workspace folder to file
 */
export function getRelativePath(workspacePath: string, filePath: string): string {
  return path.relative(workspacePath, filePath);
}

/**
 * Join path segments
 */
export function joinPaths(...segments: string[]): string {
  return path.join(...segments);
}

/**
 * Get file basename
 */
export function getBasename(filePath: string): string {
  return path.basename(filePath);
}

/**
 * Get directory name
 */
export function getDirname(filePath: string): string {
  return path.dirname(filePath);
}

/**
 * Compare paths (case-insensitive on Windows)
 */
export function pathsEqual(path1: string, path2: string): boolean {
  const normalized1 = normalizePath(path1);
  const normalized2 = normalizePath(path2);

  if (process.platform === 'win32') {
    return normalized1.toLowerCase() === normalized2.toLowerCase();
  }

  return normalized1 === normalized2;
}
