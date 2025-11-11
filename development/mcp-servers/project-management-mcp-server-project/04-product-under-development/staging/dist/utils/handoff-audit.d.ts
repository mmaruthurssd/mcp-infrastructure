/**
 * MCP Handoff Audit Trail
 *
 * Provides comprehensive audit logging and querying for handoff operations
 */
import { HandoffAuditEntry, Handoff } from '../types/handoff.js';
/**
 * Audit query filters
 */
export interface AuditQueryFilter {
    handoffId?: string;
    handoffType?: string;
    sourceMcp?: string;
    targetMcp?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
}
/**
 * Audit statistics
 */
export interface AuditStatistics {
    totalHandoffs: number;
    successfulHandoffs: number;
    failedHandoffs: number;
    retriedHandoffs: number;
    rolledBackHandoffs: number;
    averageRetries: number;
    handoffsByType: Record<string, number>;
    handoffsBySource: Record<string, number>;
    handoffsByTarget: Record<string, number>;
    recentActivity: Array<{
        date: string;
        count: number;
    }>;
}
/**
 * AuditTrail manages audit logging and querying
 */
export declare class AuditTrail {
    private projectPath;
    private auditDir;
    private indexPath;
    constructor(projectPath: string);
    private ensureAuditDir;
    /**
     * Log a handoff audit entry
     */
    log(entry: HandoffAuditEntry): void;
    /**
     * Log handoff creation
     */
    logCreated(handoff: Handoff, details?: string): void;
    /**
     * Log handoff sent
     */
    logSent(handoff: Handoff, details?: string): void;
    /**
     * Log handoff received
     */
    logReceived(handoff: Handoff, details?: string): void;
    /**
     * Log handoff completed
     */
    logCompleted(handoff: Handoff, details?: string): void;
    /**
     * Log handoff failed
     */
    logFailed(handoff: Handoff, error: any, details?: string): void;
    /**
     * Log handoff retry
     */
    logRetried(handoff: Handoff, attempt: number, details?: string): void;
    /**
     * Log handoff rollback
     */
    logRolledBack(handoff: Handoff, reason: string): void;
    /**
     * Query audit trail with filters
     */
    query(filter?: AuditQueryFilter): HandoffAuditEntry[];
    /**
     * Get audit trail for a specific handoff
     */
    getHandoffTrail(handoffId: string): HandoffAuditEntry[];
    /**
     * Get recent audit entries
     */
    getRecent(limit?: number): HandoffAuditEntry[];
    /**
     * Get failed handoffs
     */
    getFailedHandoffs(limit?: number): HandoffAuditEntry[];
    /**
     * Calculate audit statistics
     */
    getStatistics(startDate?: string, endDate?: string): AuditStatistics;
    /**
     * Update audit index for fast lookups
     */
    private updateIndex;
    /**
     * Clean up old audit logs (older than specified days)
     */
    cleanup(daysToKeep?: number): number;
    /**
     * Export audit trail to JSON
     */
    export(outputPath: string, filter?: AuditQueryFilter): void;
}
/**
 * Create a new audit trail instance
 */
export declare function createAuditTrail(projectPath: string): AuditTrail;
export declare class HandoffAuditLogger {
    private auditTrail;
    constructor(projectPath: string);
    log(message: string): void;
}
export declare class AuditLogQuery {
    private auditTrail;
    constructor(projectPath: string);
    query(filter?: AuditQueryFilter): HandoffAuditEntry[];
}
//# sourceMappingURL=handoff-audit.d.ts.map