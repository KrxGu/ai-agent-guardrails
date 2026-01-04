import type { AuditEvent, AuditSink } from './types.js';

/**
 * In-memory audit sink that stores events in an array
 */
export class InMemoryAuditSink implements AuditSink {
  private events: AuditEvent[] = [];

  emit(event: AuditEvent): void {
    this.events.push(event);
  }

  /**
   * Get all stored events
   */
  getEvents(): ReadonlyArray<AuditEvent> {
    return this.events;
  }

  /**
   * Clear all stored events
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Get events for a specific request
   */
  getEventsForRequest(requestId: string): AuditEvent[] {
    return this.events.filter(e => e.requestId === requestId);
  }
}

/**
 * Console audit sink that logs events to console
 */
export class ConsoleAuditSink implements AuditSink {
  private prefix: string;

  constructor(prefix = '[audit]') {
    this.prefix = prefix;
  }

  emit(event: AuditEvent): void {
    console.log(this.prefix, JSON.stringify(event, null, 2));
  }
}

/**
 * File audit sink that writes events to a JSONL file
 * Note: This is for Node.js environments only
 */
export class FileAuditSink implements AuditSink {
  private writeStream: any;

  constructor(filePath: string) {
    // Dynamic import for Node.js fs
    import('node:fs').then(fs => {
      this.writeStream = fs.createWriteStream(filePath, { flags: 'a' });
    });
  }

  emit(event: AuditEvent): void {
    if (this.writeStream) {
      this.writeStream.write(JSON.stringify(event) + '\n');
    }
  }

  /**
   * Close the file stream
   */
  close(): void {
    this.writeStream?.end();
  }
}
