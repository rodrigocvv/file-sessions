/**
 * Infrastructure layer: Storage schema versioning and migrations
 */

import { FileSession, BranchSession, TimelineSnapshot } from '../domain/session';
import { isValidTimelineSnapshot } from '../domain/validators';

export interface PersistedDataV1 {
  version: 1;
  sessions: FileSession[];
}

export interface PersistedDataV2 {
  version: 2;
  sessions: FileSession[];
  branchSessions: BranchSession[];
}

export interface PersistedDataV3 {
  version: 3;
  sessions: FileSession[];
  branchSessions: BranchSession[];
  timelineSnapshots: TimelineSnapshot[];
}

export type PersistedData = PersistedDataV3;

const CURRENT_VERSION = 3;

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
  if (version === 3) {
    return migrateFromV3(dataObj);
  }

  // Migrate from V2 to V3
  if (version === 2) {
    const v2Data = migrateFromV2(dataObj);
    return upgradeV2ToV3(v2Data);
  }

  // Migrate from V1 to V2 to V3
  if (version === 1) {
    const v1Data = migrateFromV1(dataObj);
    const v2Data = upgradeV1ToV2(v1Data);
    return upgradeV2ToV3(v2Data);
  }

  // Unknown version - start fresh
  return createEmptyStorage();
}

/**
 * Validate and migrate V1 data
 */
function migrateFromV1(data: Record<string, unknown>): PersistedDataV1 {
  if (!Array.isArray(data.sessions)) {
    return {
      version: 1,
      sessions: [],
    };
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
 * Upgrade V1 data to V2
 */
function upgradeV1ToV2(v1Data: PersistedDataV1): PersistedDataV2 {
  return {
    version: 2,
    sessions: v1Data.sessions,
    branchSessions: [], // Initialize empty branch sessions array
  };
}

/**
 * Validate and migrate V2 data (don't upgrade, just validate)
 */
function migrateFromV2(data: Record<string, unknown>): PersistedDataV2 {
  if (!Array.isArray(data.sessions)) {
    return createEmptyStorageV2();
  }

  // Validate manual sessions
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

  // Validate branch sessions
  const branchSessions = Array.isArray(data.branchSessions) ? data.branchSessions : [];
  const validBranchSessions = branchSessions.filter((session: unknown) => {
    if (!session || typeof session !== 'object') {
      return false;
    }

    const s = session as Record<string, unknown>;
    return (
      typeof s.id === 'string' &&
      typeof s.branchName === 'string' &&
      typeof s.workspaceFolder === 'string' &&
      Array.isArray(s.files) &&
      typeof s.lastOpenedAt === 'number'
    );
  }) as BranchSession[];

  return {
    version: 2,
    sessions: validSessions,
    branchSessions: validBranchSessions,
  };
}

/**
 * Create empty V2 storage (for intermediate migration step)
 */
function createEmptyStorageV2(): PersistedDataV2 {
  return {
    version: 2,
    sessions: [],
    branchSessions: [],
  };
}

/**
 * Upgrade V2 data to V3
 */
function upgradeV2ToV3(v2Data: PersistedDataV2): PersistedDataV3 {
  return {
    version: 3,
    sessions: v2Data.sessions,
    branchSessions: v2Data.branchSessions,
    timelineSnapshots: [], // Initialize empty timeline snapshots array
  };
}

/**
 * Validate and migrate V3 data
 */
function migrateFromV3(data: Record<string, unknown>): PersistedDataV3 {
  if (!Array.isArray(data.sessions)) {
    return createEmptyStorage();
  }

  // Validate manual sessions
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

  // Validate branch sessions
  const branchSessions = Array.isArray(data.branchSessions) ? data.branchSessions : [];
  const validBranchSessions = branchSessions.filter((session: unknown) => {
    if (!session || typeof session !== 'object') {
      return false;
    }

    const s = session as Record<string, unknown>;
    return (
      typeof s.id === 'string' &&
      typeof s.branchName === 'string' &&
      typeof s.workspaceFolder === 'string' &&
      Array.isArray(s.files) &&
      typeof s.lastOpenedAt === 'number'
    );
  }) as BranchSession[];

  // Validate timeline snapshots
  const timelineSnapshots = Array.isArray(data.timelineSnapshots) ? data.timelineSnapshots : [];
  const validTimelineSnapshots = timelineSnapshots.filter(isValidTimelineSnapshot) as TimelineSnapshot[];

  return {
    version: 3,
    sessions: validSessions,
    branchSessions: validBranchSessions,
    timelineSnapshots: validTimelineSnapshots,
  };
}

/**
 * Create empty storage with current version
 */
export function createEmptyStorage(): PersistedDataV3 {
  return {
    version: CURRENT_VERSION,
    sessions: [],
    branchSessions: [],
    timelineSnapshots: [],
  };
}
