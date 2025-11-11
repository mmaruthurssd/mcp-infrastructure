/**
 * HIPAA-compliant audit logger with tamper detection
 *
 * Features:
 * - Tamper-evident checksum chain
 * - 6-year retention enforcement
 * - Comprehensive event tracking
 * - Query and export capabilities
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import * as os from 'os';
import type {
  AuditEvent,
  AuditEventType,
  AuditSeverity,
  AuditOutcome,
  AuditLogMetadata,
  AuditQueryFilter,
  AuditQueryResult,
  AuditExportOptions,
} from '../types/audit.js';

const AUDIT_LOG_VERSION = '1.0.0';
const RETENTION_YEARS = 6;
const GENESIS_CHECKSUM = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Audit logger with tamper detection
 */
export class AuditLogger {
  private logDir: string;
  private currentLogFile: string;
  private metadataFile: string;
  private previousChecksum: string = GENESIS_CHECKSUM;
  private metadata: AuditLogMetadata | null = null;

  constructor(logDir?: string) {
    this.logDir = logDir || path.join(os.homedir(), '.security-compliance-mcp', 'audit-logs');
    this.currentLogFile = path.join(this.logDir, 'audit-events.json');
    this.metadataFile = path.join(this.logDir, 'audit-metadata.json');
  }

  /**
   * Initialize audit log
   */
  async initialize(): Promise<void> {
    // Ensure directory exists
    await fs.mkdir(this.logDir, { recursive: true });

    // Load or create metadata
    try {
      const metaData = await fs.readFile(this.metadataFile, 'utf-8');
      this.metadata = JSON.parse(metaData);

      // Load last checksum
      const events = await this.loadEvents();
      if (events.length > 0) {
        this.previousChecksum = events[events.length - 1].checksum;
      }
    } catch {
      // Create new metadata
      const now = new Date().toISOString();
      const retentionUntil = new Date();
      retentionUntil.setFullYear(retentionUntil.getFullYear() + RETENTION_YEARS);

      this.metadata = {
        createdAt: now,
        lastUpdated: now,
        eventCount: 0,
        retentionUntil: retentionUntil.toISOString(),
        version: AUDIT_LOG_VERSION,
        chainValid: true,
      };

      await this.saveMetadata();
    }
  }

  /**
   * Calculate checksum for event
   */
  private calculateChecksum(event: Omit<AuditEvent, 'checksum'>, previousChecksum: string): string {
    // Combine previous checksum + event data
    const data = JSON.stringify({
      previous: previousChecksum,
      event: {
        id: event.id,
        timestamp: event.timestamp,
        eventType: event.eventType,
        severity: event.severity,
        outcome: event.outcome,
        actor: event.actor,
        target: event.target,
        details: event.details,
        phiAccessed: event.phiAccessed,
        correlationId: event.correlationId,
      },
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Log an audit event
   */
  async logEvent(
    eventType: AuditEventType,
    severity: AuditSeverity,
    outcome: AuditOutcome,
    actor: string,
    details: Record<string, any>,
    options?: {
      target?: string;
      phiAccessed?: boolean;
      correlationId?: string;
    }
  ): Promise<string> {
    if (!this.metadata) {
      await this.initialize();
    }

    // Generate event ID
    const eventId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Create event without checksum
    const eventData: Omit<AuditEvent, 'checksum'> = {
      id: eventId,
      timestamp,
      eventType,
      severity,
      outcome,
      actor,
      target: options?.target,
      details,
      phiAccessed: options?.phiAccessed || false,
      correlationId: options?.correlationId,
    };

    // Calculate checksum
    const checksum = this.calculateChecksum(eventData, this.previousChecksum);

    // Create complete event
    const event: AuditEvent = {
      ...eventData,
      checksum,
    };

    // Append to log file
    await this.appendEvent(event);

    // Update state
    this.previousChecksum = checksum;
    this.metadata!.eventCount++;
    this.metadata!.lastUpdated = timestamp;
    await this.saveMetadata();

    return eventId;
  }

  /**
   * Load all events from log file
   */
  private async loadEvents(): Promise<AuditEvent[]> {
    try {
      const data = await fs.readFile(this.currentLogFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  /**
   * Append event to log file
   */
  private async appendEvent(event: AuditEvent): Promise<void> {
    const events = await this.loadEvents();
    events.push(event);
    await fs.writeFile(this.currentLogFile, JSON.stringify(events, null, 2), { mode: 0o600 });
  }

  /**
   * Save metadata
   */
  private async saveMetadata(): Promise<void> {
    await fs.writeFile(this.metadataFile, JSON.stringify(this.metadata, null, 2), { mode: 0o600 });
  }

  /**
   * Verify checksum chain integrity
   */
  async verifyChain(): Promise<{ valid: boolean; errors: string[] }> {
    const events = await this.loadEvents();
    const errors: string[] = [];

    if (events.length === 0) {
      return { valid: true, errors: [] };
    }

    let previousChecksum = GENESIS_CHECKSUM;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const expectedChecksum = this.calculateChecksum(
        {
          id: event.id,
          timestamp: event.timestamp,
          eventType: event.eventType,
          severity: event.severity,
          outcome: event.outcome,
          actor: event.actor,
          target: event.target,
          details: event.details,
          phiAccessed: event.phiAccessed,
          correlationId: event.correlationId,
        },
        previousChecksum
      );

      if (event.checksum !== expectedChecksum) {
        errors.push(
          `Checksum mismatch at event ${i} (ID: ${event.id}). Expected: ${expectedChecksum}, Got: ${event.checksum}`
        );
      }

      previousChecksum = event.checksum;
    }

    const valid = errors.length === 0;

    // Update metadata
    if (this.metadata) {
      this.metadata.chainValid = valid;
      await this.saveMetadata();
    }

    return { valid, errors };
  }

  /**
   * Query audit events
   */
  async query(filter?: AuditQueryFilter): Promise<AuditQueryResult> {
    const startTime = Date.now();
    const events = await this.loadEvents();

    // Filter events
    let filteredEvents = events;

    if (filter?.startDate) {
      const startDate = new Date(filter.startDate);
      filteredEvents = filteredEvents.filter((e) => new Date(e.timestamp) >= startDate);
    }

    if (filter?.endDate) {
      const endDate = new Date(filter.endDate);
      filteredEvents = filteredEvents.filter((e) => new Date(e.timestamp) <= endDate);
    }

    if (filter?.eventTypes && filter.eventTypes.length > 0) {
      filteredEvents = filteredEvents.filter((e) => filter.eventTypes!.includes(e.eventType));
    }

    if (filter?.severities && filter.severities.length > 0) {
      filteredEvents = filteredEvents.filter((e) => filter.severities!.includes(e.severity));
    }

    if (filter?.outcomes && filter.outcomes.length > 0) {
      filteredEvents = filteredEvents.filter((e) => filter.outcomes!.includes(e.outcome));
    }

    if (filter?.actor) {
      filteredEvents = filteredEvents.filter((e) => e.actor === filter.actor);
    }

    if (filter?.phiAccessedOnly) {
      filteredEvents = filteredEvents.filter((e) => e.phiAccessed);
    }

    if (filter?.correlationId) {
      filteredEvents = filteredEvents.filter((e) => e.correlationId === filter.correlationId);
    }

    const totalCount = filteredEvents.length;

    // Apply limit
    if (filter?.limit && filter.limit > 0) {
      filteredEvents = filteredEvents.slice(0, filter.limit);
    }

    // Verify chain
    const { valid: chainValid } = await this.verifyChain();

    const executionTime = Date.now() - startTime;

    return {
      events: filteredEvents,
      totalCount,
      executionTime,
      chainValid,
    };
  }

  /**
   * Export audit log
   */
  async export(options: AuditExportOptions): Promise<{ success: boolean; outputPath: string; message: string }> {
    // Query events
    const queryResult = await this.query(options.filter);

    switch (options.format) {
      case 'json':
        return await this.exportJSON(options.outputPath, queryResult, options);

      case 'csv':
        return await this.exportCSV(options.outputPath, queryResult, options);

      case 'pdf':
        return await this.exportPDF(options.outputPath, queryResult, options);

      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export as JSON
   */
  private async exportJSON(
    outputPath: string,
    queryResult: AuditQueryResult,
    options: AuditExportOptions
  ): Promise<{ success: boolean; outputPath: string; message: string }> {
    const exportData: any = {
      exportedAt: new Date().toISOString(),
      events: queryResult.events,
      summary: {
        totalEvents: queryResult.totalCount,
        exportedEvents: queryResult.events.length,
      },
    };

    if (options.includeMetadata) {
      exportData.metadata = this.metadata;
    }

    if (options.includeChecksumReport) {
      const verification = await this.verifyChain();
      exportData.checksumVerification = verification;
    }

    await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));

    return {
      success: true,
      outputPath,
      message: `Exported ${queryResult.events.length} events to ${outputPath}`,
    };
  }

  /**
   * Export as CSV
   */
  private async exportCSV(
    outputPath: string,
    queryResult: AuditQueryResult,
    _options: AuditExportOptions
  ): Promise<{ success: boolean; outputPath: string; message: string }> {
    const lines: string[] = [];

    // Header
    lines.push('ID,Timestamp,Event Type,Severity,Outcome,Actor,Target,PHI Accessed,Checksum');

    // Events
    for (const event of queryResult.events) {
      lines.push(
        [
          event.id,
          event.timestamp,
          event.eventType,
          event.severity,
          event.outcome,
          event.actor,
          event.target || '',
          event.phiAccessed ? 'Yes' : 'No',
          event.checksum,
        ]
          .map((v) => `"${v}"`)
          .join(',')
      );
    }

    await fs.writeFile(outputPath, lines.join('\n'));

    return {
      success: true,
      outputPath,
      message: `Exported ${queryResult.events.length} events to ${outputPath}`,
    };
  }

  /**
   * Export as PDF (placeholder - requires PDF library)
   */
  private async exportPDF(
    _outputPath: string,
    _queryResult: AuditQueryResult,
    _options: AuditExportOptions
  ): Promise<{ success: boolean; outputPath: string; message: string }> {
    throw new Error('PDF export not yet implemented. Use JSON or CSV format.');
  }

  /**
   * Get metadata
   */
  async getMetadata(): Promise<AuditLogMetadata | null> {
    if (!this.metadata) {
      await this.initialize();
    }
    return this.metadata;
  }

  /**
   * Prune old events (enforce retention policy)
   */
  async pruneOldEvents(): Promise<{ pruned: number; retained: number }> {
    const events = await this.loadEvents();
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - RETENTION_YEARS);

    const retained = events.filter((e) => new Date(e.timestamp) >= cutoffDate);
    const pruned = events.length - retained.length;

    if (pruned > 0) {
      // Log pruning event before actually pruning
      await this.logEvent(
        'audit_log_pruned',
        'info',
        'success',
        'system',
        {
          eventsPruned: pruned,
          eventsRetained: retained.length,
          cutoffDate: cutoffDate.toISOString(),
        }
      );

      // Save retained events
      await fs.writeFile(this.currentLogFile, JSON.stringify(retained, null, 2), { mode: 0o600 });

      // Update metadata
      if (this.metadata) {
        this.metadata.eventCount = retained.length;
        await this.saveMetadata();
      }
    }

    return { pruned, retained: retained.length };
  }
}
