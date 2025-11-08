/**
 * HIPAA-compliant audit logger with tamper detection
 *
 * Features:
 * - Tamper-evident checksum chain
 * - 6-year retention enforcement
 * - Comprehensive event tracking
 * - Query and export capabilities
 */
import type { AuditEventType, AuditSeverity, AuditOutcome, AuditLogMetadata, AuditQueryFilter, AuditQueryResult, AuditExportOptions } from '../types/audit.js';
/**
 * Audit logger with tamper detection
 */
export declare class AuditLogger {
    private logDir;
    private currentLogFile;
    private metadataFile;
    private previousChecksum;
    private metadata;
    constructor(logDir?: string);
    /**
     * Initialize audit log
     */
    initialize(): Promise<void>;
    /**
     * Calculate checksum for event
     */
    private calculateChecksum;
    /**
     * Log an audit event
     */
    logEvent(eventType: AuditEventType, severity: AuditSeverity, outcome: AuditOutcome, actor: string, details: Record<string, any>, options?: {
        target?: string;
        phiAccessed?: boolean;
        correlationId?: string;
    }): Promise<string>;
    /**
     * Load all events from log file
     */
    private loadEvents;
    /**
     * Append event to log file
     */
    private appendEvent;
    /**
     * Save metadata
     */
    private saveMetadata;
    /**
     * Verify checksum chain integrity
     */
    verifyChain(): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    /**
     * Query audit events
     */
    query(filter?: AuditQueryFilter): Promise<AuditQueryResult>;
    /**
     * Export audit log
     */
    export(options: AuditExportOptions): Promise<{
        success: boolean;
        outputPath: string;
        message: string;
    }>;
    /**
     * Export as JSON
     */
    private exportJSON;
    /**
     * Export as CSV
     */
    private exportCSV;
    /**
     * Export as PDF (placeholder - requires PDF library)
     */
    private exportPDF;
    /**
     * Get metadata
     */
    getMetadata(): Promise<AuditLogMetadata | null>;
    /**
     * Prune old events (enforce retention policy)
     */
    pruneOldEvents(): Promise<{
        pruned: number;
        retained: number;
    }>;
}
//# sourceMappingURL=audit-logger.d.ts.map