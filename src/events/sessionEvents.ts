/**
 * Event system: Decouples components through event-driven architecture
 */

import { FileSession, BranchSession, TimelineSnapshot } from '../domain/session';

export type SessionEventType =
  | 'sessionCreated'
  | 'sessionDeleted'
  | 'sessionUpdated'
  | 'sessionOpened';

export type BranchSessionEventType =
  | 'branchSessionCreated'
  | 'branchSessionDeleted'
  | 'branchSessionUpdated'
  | 'branchSessionRestored';

export type TimelineEventType =
  | 'timelineSnapshotCreated'
  | 'timelineSnapshotDeleted';

export interface SessionEvent {
  type: SessionEventType;
  session: FileSession;
}

export interface BranchSessionEvent {
  type: BranchSessionEventType;
  session: BranchSession;
}

export interface TimelineEvent {
  type: TimelineEventType;
  snapshot: TimelineSnapshot;
}

export type AnySessionEvent = SessionEvent | BranchSessionEvent | TimelineEvent;

type SessionEventHandler = (event: SessionEvent) => void;
type BranchSessionEventHandler = (event: BranchSessionEvent) => void;
type TimelineEventHandler = (event: TimelineEvent) => void;

/**
 * Event emitter for session-related events
 */
export class SessionEvents {
  private handlers: Map<SessionEventType, Set<SessionEventHandler>> = new Map();
  private branchHandlers: Map<BranchSessionEventType, Set<BranchSessionEventHandler>> =
    new Map();
  private timelineHandlers: Map<TimelineEventType, Set<TimelineEventHandler>> = new Map();

  /**
   * Subscribe to session created events
   */
  onSessionCreated(handler: SessionEventHandler): void {
    this.subscribe('sessionCreated', handler);
  }

  /**
   * Subscribe to session deleted events
   */
  onSessionDeleted(handler: SessionEventHandler): void {
    this.subscribe('sessionDeleted', handler);
  }

  /**
   * Subscribe to session updated events
   */
  onSessionUpdated(handler: SessionEventHandler): void {
    this.subscribe('sessionUpdated', handler);
  }

  /**
   * Subscribe to session opened events
   */
  onSessionOpened(handler: SessionEventHandler): void {
    this.subscribe('sessionOpened', handler);
  }

  /**
   * Subscribe to branch session created events
   */
  onBranchSessionCreated(handler: BranchSessionEventHandler): void {
    this.subscribeBranch('branchSessionCreated', handler);
  }

  /**
   * Subscribe to branch session deleted events
   */
  onBranchSessionDeleted(handler: BranchSessionEventHandler): void {
    this.subscribeBranch('branchSessionDeleted', handler);
  }

  /**
   * Subscribe to branch session updated events
   */
  onBranchSessionUpdated(handler: BranchSessionEventHandler): void {
    this.subscribeBranch('branchSessionUpdated', handler);
  }

  /**
   * Subscribe to branch session restored events
   */
  onBranchSessionRestored(handler: BranchSessionEventHandler): void {
    this.subscribeBranch('branchSessionRestored', handler);
  }

  /**
   * Subscribe to timeline snapshot created events
   */
  onTimelineSnapshotCreated(handler: TimelineEventHandler): void {
    this.subscribeTimeline('timelineSnapshotCreated', handler);
  }

  /**
   * Subscribe to timeline snapshot deleted events
   */
  onTimelineSnapshotDeleted(handler: TimelineEventHandler): void {
    this.subscribeTimeline('timelineSnapshotDeleted', handler);
  }

  /**
   * Emit an event to all subscribers
   */
  emit(event: AnySessionEvent): void {
    if ('snapshot' in event) {
      // Timeline event
      const timelineEvent = event as TimelineEvent;
      const handlers = this.timelineHandlers.get(timelineEvent.type);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(timelineEvent);
          } catch (error) {
            console.error(`Error in event handler for ${timelineEvent.type}:`, error);
          }
        });
      }
    } else if ('branchName' in event.session) {
      // Branch session event
      const branchEvent = event as BranchSessionEvent;
      const handlers = this.branchHandlers.get(branchEvent.type);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(branchEvent);
          } catch (error) {
            console.error(`Error in event handler for ${branchEvent.type}:`, error);
          }
        });
      }
    } else {
      // Regular session event
      const sessionEvent = event as SessionEvent;
      const handlers = this.handlers.get(sessionEvent.type);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(sessionEvent);
          } catch (error) {
            console.error(`Error in event handler for ${sessionEvent.type}:`, error);
          }
        });
      }
    }
  }

  /**
   * Subscribe to a specific event type
   */
  private subscribe(type: SessionEventType, handler: SessionEventHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  /**
   * Subscribe to a specific branch event type
   */
  private subscribeBranch(
    type: BranchSessionEventType,
    handler: BranchSessionEventHandler
  ): void {
    if (!this.branchHandlers.has(type)) {
      this.branchHandlers.set(type, new Set());
    }
    this.branchHandlers.get(type)!.add(handler);
  }

  /**
   * Subscribe to a specific timeline event type
   */
  private subscribeTimeline(
    type: TimelineEventType,
    handler: TimelineEventHandler
  ): void {
    if (!this.timelineHandlers.has(type)) {
      this.timelineHandlers.set(type, new Set());
    }
    this.timelineHandlers.get(type)!.add(handler);
  }

  /**
   * Unsubscribe from a specific event type
   */
  unsubscribe(type: SessionEventType, handler: SessionEventHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Unsubscribe from a specific branch event type
   */
  unsubscribeBranch(
    type: BranchSessionEventType,
    handler: BranchSessionEventHandler
  ): void {
    const handlers = this.branchHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Unsubscribe from a specific timeline event type
   */
  unsubscribeTimeline(
    type: TimelineEventType,
    handler: TimelineEventHandler
  ): void {
    const handlers = this.timelineHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Clear all event handlers
   */
  clear(): void {
    this.handlers.clear();
    this.branchHandlers.clear();
    this.timelineHandlers.clear();
  }
}
