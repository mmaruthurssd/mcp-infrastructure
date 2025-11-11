/**
 * Audit trail types for HIPAA compliance
 *
 * HIPAA requires 6-year retention of audit logs with:
 * - User identity
 * - Date/time of access
 * - Type of access
 * - Outcome (success/failure)
 * - PHI accessed (if applicable)
 */
/**
 * Audit event types
 */
export type AuditEventType = 'credential_scan_started' | 'credential_scan_completed' | 'credential_violation_detected' | 'allowlist_entry_added' | 'allowlist_entry_removed' | 'phi_scan_started' | 'phi_scan_completed' | 'phi_violation_detected' | 'secret_encrypted' | 'secret_decrypted' | 'secret_rotated' | 'secret_deleted' | 'secret_rotation_warning' | 'pre_commit_hook_installed' | 'pre_commit_hook_uninstalled' | 'pre_commit_hook_triggered' | 'pre_commit_hook_blocked' | 'audit_log_tampered' | 'audit_log_exported' | 'audit_log_pruned';
/**
 * Audit event severity
 */
export type AuditSeverity = 'info' | 'warning' | 'critical';
/**
 * Audit event outcome
 */
export type AuditOutcome = 'success' | 'failure' | 'blocked';
/**
 * Audit event entry
 */
export interface AuditEvent {
    /**
     * Unique event ID
     */
    id: string;
    /**
     * Event timestamp (ISO 8601)
     */
    timestamp: string;
    /**
     * Event type
     */
    eventType: AuditEventType;
    /**
     * Severity level
     */
    severity: AuditSeverity;
    /**
     * Event outcome
     */
    outcome: AuditOutcome;
    /**
     * User or system component that triggered event
     */
    actor: string;
    /**
     * Target of the action (file, secret key, etc.)
     */
    target?: string;
    /**
     * Additional event details
     */
    details: Record<string, any>;
    /**
     * PHI accessed flag (for HIPAA compliance)
     */
    phiAccessed: boolean;
    /**
     * Session/request ID for correlation
     */
    correlationId?: string;
    /**
     * Tamper-detection checksum (SHA-256 of previous entry + current entry)
     */
    checksum: string;
}
/**
 * Audit log metadata
 */
export interface AuditLogMetadata {
    /**
     * Log file creation timestamp
     */
    createdAt: string;
    /**
     * Last updated timestamp
     */
    lastUpdated: string;
    /**
     * Total event count
     */
    eventCount: number;
    /**
     * Retention policy end date (6 years from creation)
     */
    retentionUntil: string;
    /**
     * Log file version
     */
    version: string;
    /**
     * Checksum chain validation status
     */
    chainValid: boolean;
}
/**
 * Audit query filter
 */
export interface AuditQueryFilter {
    /**
     * Start date (ISO 8601)
     */
    startDate?: string;
    /**
     * End date (ISO 8601)
     */
    endDate?: string;
    /**
     * Event types to include
     */
    eventTypes?: AuditEventType[];
    /**
     * Severity levels to include
     */
    severities?: AuditSeverity[];
    /**
     * Outcomes to include
     */
    outcomes?: AuditOutcome[];
    /**
     * Actor filter (user/system component)
     */
    actor?: string;
    /**
     * Only events with PHI access
     */
    phiAccessedOnly?: boolean;
    /**
     * Correlation ID for related events
     */
    correlationId?: string;
    /**
     * Maximum results to return
     */
    limit?: number;
}
/**
 * Audit query result
 */
export interface AuditQueryResult {
    /**
     * Matching events
     */
    events: AuditEvent[];
    /**
     * Total matching events (before limit)
     */
    totalCount: number;
    /**
     * Query execution time (ms)
     */
    executionTime: number;
    /**
     * Chain validation status
     */
    chainValid: boolean;
}
/**
 * Audit export format
 */
export type AuditExportFormat = 'json' | 'csv' | 'pdf';
/**
 * Audit export options
 */
export interface AuditExportOptions {
    /**
     * Export format
     */
    format: AuditExportFormat;
    /**
     * Output file path
     */
    outputPath: string;
    /**
     * Query filter
     */
    filter?: AuditQueryFilter;
    /**
     * Include metadata
     */
    includeMetadata?: boolean;
    /**
     * Include checksum verification report
     */
    includeChecksumReport?: boolean;
}
//# sourceMappingURL=audit.d.ts.map