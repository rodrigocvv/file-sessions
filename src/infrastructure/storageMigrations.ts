/**
 * Infrastructure layer: Storage schema versioning and migrations
 */

import { FileSession } from '../domain/session';

export interface PersistedDataV1 {
  version: 1;
  sessions: FileSession[];
}

export type PersistedData = PersistedDataV1;

const CURRENT_VERSION = 1;

/**
 * Migrate storage data to the current version
 */
export function migrateStorage(data: unknown): PersistedData {
  // Handle null, undefined, or invalid data
  if (!data || typeof data !== 'object') {
    return createEmptyStorage();
  }

  const dataObj = data as Record<string, unknown>;

  // Check if data has version property
  if (!('version' in dataObj) || typeof dataObj.version !== 'number') {
    // Legacy data without version - treat as corrupted
    return createEmptyStorage();
  }

  const version = dataObj.version;

  // Current version - validate and return
  if (version === 1) {
    return migrateFromV1(dataObj);
  }

  // Future versions would be handled here
  // if (version === 2) {
  //   return migrateFromV2(dataObj);
  // }

  // Unknown version - start fresh
  return createEmptyStorage();
}

/**
 * Validate and migrate V1 data
 */
function migrateFromV1(data: Record<string, unknown>): PersistedDataV1 {
  if (!Array.isArray(data.sessions)) {
    return createEmptyStorage();
  }

  // Validate each session has required properties
  const validSessions = data.sessions.filter((session: unknown) => {
    if (!session || typeof session !== 'object') {
      return false;
    }

    const s = session as Record<string, unknown>;
    return (
      typeof s.id === 'string' &&
      typeof s.name === 'string' &&
      Array.isArray(s.files) &&
      typeof s.createdAt === 'number' &&
      typeof s.updatedAt === 'number'
    );
  }) as FileSession[];

  return {
    version: 1,
    sessions: validSessions,
  };
}

/**
 * Create empty storage with current version
 */
export function createEmptyStorage(): PersistedDataV1 {
  return {
    version: CURRENT_VERSION,
    sessions: [],
  };
}
