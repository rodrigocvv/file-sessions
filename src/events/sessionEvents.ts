/**
 * Event system: Decouples components through event-driven architecture
 */

import { FileSession } from '../domain/session';

export type SessionEventType =
  | 'sessionCreated'
  | 'sessionDeleted'
  | 'sessionUpdated'
  | 'sessionOpened';

export interface SessionEvent {
  type: SessionEventType;
  session: FileSession;
}

type SessionEventHandler = (event: SessionEvent) => void;

/**
 * Event emitter for session-related events
 */
export class SessionEvents {
  private handlers: Map<SessionEventType, Set<SessionEventHandler>> = new Map();

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
   * Emit an event to all subscribers
   */
  emit(event: SessionEvent): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      });
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
   * Unsubscribe from a specific event type
   */
  unsubscribe(type: SessionEventType, handler: SessionEventHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Clear all event handlers
   */
  clear(): void {
    this.handlers.clear();
  }
}
