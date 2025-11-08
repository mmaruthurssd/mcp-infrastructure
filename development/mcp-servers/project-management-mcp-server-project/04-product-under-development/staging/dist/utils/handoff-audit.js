/**
 * MCP Handoff Audit Trail
 *
 * Provides comprehensive audit logging and querying for handoff operations
 */
import * as fs from 'fs';
import * as path from 'path';
const AUDIT_DIR = '.handoffs/audit';
const AUDIT_INDEX = 'audit-index.json';
/**
 * AuditTrail manages audit logging and querying
 */
export class AuditTrail {
    projectPath;
    auditDir;
    indexPath;
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.auditDir = path.join(projectPath, AUDIT_DIR);
        this.indexPath = path.join(this.auditDir, AUDIT_INDEX);
        this.ensureAuditDir();
    }
    ensureAuditDir() {
        if (!fs.existsSync(this.auditDir)) {
            fs.mkdirSync(this.auditDir, { recursive: true });
        }
    }
    /**
     * Log a handoff audit entry
     */
    log(entry) {
        // Append to daily audit log file
        const date = new Date(entry.timestamp);
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const logFile = path.join(this.auditDir, `audit-${dateStr}.jsonl`);
        const logLine = JSON.stringify(entry) + '\n';
        fs.appendFileSync(logFile, logLine, 'utf8');
        // Update index
        this.updateIndex(entry);
    }
    /**
     * Log handoff creation
     */
    logCreated(handoff, details) {
        const entry = {
            handoffId: handoff.metadata.handoffId,
            timestamp: new Date().toISOString(),
            action: 'created',
            metadata: handoff.metadata,
            details,
        };
        this.log(entry);
    }
    /**
     * Log handoff sent
     */
    logSent(handoff, details) {
        const entry = {
            handoffId: handoff.metadata.handoffId,
            timestamp: new Date().toISOString(),
            action: 'sent',
            metadata: handoff.metadata,
            details,
        };
        this.log(entry);
    }
    /**
     * Log handoff received
     */
    logReceived(handoff, details) {
        const entry = {
            handoffId: handoff.metadata.handoffId,
            timestamp: new Date().toISOString(),
            action: 'received',
            metadata: handoff.metadata,
            details,
        };
        this.log(entry);
    }
    /**
     * Log handoff completed
     */
    logCompleted(handoff, details) {
        const entry = {
            handoffId: handoff.metadata.handoffId,
            timestamp: new Date().toISOString(),
            action: 'completed',
            metadata: handoff.metadata,
            details,
        };
        this.log(entry);
    }
    /**
     * Log handoff failed
     */
    logFailed(handoff, error, details) {
        const entry = {
            handoffId: handoff.metadata.handoffId,
            timestamp: new Date().toISOString(),
            action: 'failed',
            metadata: handoff.metadata,
            error: {
                message: error.message || 'Unknown error',
                code: error.code,
                stack: error.stack,
            },
            details,
        };
        this.log(entry);
    }
    /**
     * Log handoff retry
     */
    logRetried(handoff, attempt, details) {
        const entry = {
            handoffId: handoff.metadata.handoffId,
            timestamp: new Date().toISOString(),
            action: 'retried',
            metadata: handoff.metadata,
            details: `Retry attempt ${attempt}. ${details || ''}`,
        };
        this.log(entry);
    }
    /**
     * Log handoff rollback
     */
    logRolledBack(handoff, reason) {
        const entry = {
            handoffId: handoff.metadata.handoffId,
            timestamp: new Date().toISOString(),
            action: 'rolled_back',
            metadata: handoff.metadata,
            details: reason,
        };
        this.log(entry);
    }
    /**
     * Query audit trail with filters
     */
    query(filter = {}) {
        const entries = [];
        // Get all audit log files
        const files = fs.readdirSync(this.auditDir);
        const logFiles = files
            .filter(f => f.startsWith('audit-') && f.endsWith('.jsonl'))
            .sort()
            .reverse(); // Most recent first
        for (const file of logFiles) {
            const filePath = path.join(this.auditDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.trim().split('\n');
            for (const line of lines) {
                if (!line.trim())
                    continue;
                try {
                    const entry = JSON.parse(line);
                    // Apply filters
                    if (filter.handoffId && entry.handoffId !== filter.handoffId)
                        continue;
                    if (filter.handoffType && entry.metadata.handoffType !== filter.handoffType)
                        continue;
                    if (filter.sourceMcp && entry.metadata.sourceMcp !== filter.sourceMcp)
                        continue;
                    if (filter.targetMcp && entry.metadata.targetMcp !== filter.targetMcp)
                        continue;
                    if (filter.action && entry.action !== filter.action)
                        continue;
                    if (filter.startDate && entry.timestamp < filter.startDate)
                        continue;
                    if (filter.endDate && entry.timestamp > filter.endDate)
                        continue;
                    entries.push(entry);
                    // Check limit
                    if (filter.limit && entries.length >= filter.limit) {
                        return entries;
                    }
                }
                catch (error) {
                    console.error(`Error parsing audit entry:`, error);
                }
            }
        }
        return entries;
    }
    /**
     * Get audit trail for a specific handoff
     */
    getHandoffTrail(handoffId) {
        return this.query({ handoffId });
    }
    /**
     * Get recent audit entries
     */
    getRecent(limit = 50) {
        return this.query({ limit });
    }
    /**
     * Get failed handoffs
     */
    getFailedHandoffs(limit) {
        return this.query({ action: 'failed', limit });
    }
    /**
     * Calculate audit statistics
     */
    getStatistics(startDate, endDate) {
        const entries = this.query({ startDate, endDate });
        const stats = {
            totalHandoffs: 0,
            successfulHandoffs: 0,
            failedHandoffs: 0,
            retriedHandoffs: 0,
            rolledBackHandoffs: 0,
            averageRetries: 0,
            handoffsByType: {},
            handoffsBySource: {},
            handoffsByTarget: {},
            recentActivity: [],
        };
        const handoffIds = new Set();
        const retryCount = {};
        const dailyActivity = {};
        for (const entry of entries) {
            handoffIds.add(entry.handoffId);
            // Count by action
            if (entry.action === 'completed') {
                stats.successfulHandoffs++;
            }
            else if (entry.action === 'failed') {
                stats.failedHandoffs++;
            }
            else if (entry.action === 'retried') {
                stats.retriedHandoffs++;
                retryCount[entry.handoffId] = (retryCount[entry.handoffId] || 0) + 1;
            }
            else if (entry.action === 'rolled_back') {
                stats.rolledBackHandoffs++;
            }
            // Count by type
            const type = entry.metadata.handoffType;
            stats.handoffsByType[type] = (stats.handoffsByType[type] || 0) + 1;
            // Count by source
            const source = entry.metadata.sourceMcp;
            stats.handoffsBySource[source] = (stats.handoffsBySource[source] || 0) + 1;
            // Count by target
            const target = entry.metadata.targetMcp;
            stats.handoffsByTarget[target] = (stats.handoffsByTarget[target] || 0) + 1;
            // Daily activity
            const date = entry.timestamp.split('T')[0];
            dailyActivity[date] = (dailyActivity[date] || 0) + 1;
        }
        stats.totalHandoffs = handoffIds.size;
        // Calculate average retries
        const retryValues = Object.values(retryCount);
        if (retryValues.length > 0) {
            stats.averageRetries = retryValues.reduce((a, b) => a + b, 0) / retryValues.length;
        }
        // Recent activity (last 7 days)
        const dates = Object.keys(dailyActivity).sort().reverse().slice(0, 7);
        stats.recentActivity = dates.map(date => ({
            date,
            count: dailyActivity[date],
        }));
        return stats;
    }
    /**
     * Update audit index for fast lookups
     */
    updateIndex(entry) {
        let index = {};
        // Load existing index
        if (fs.existsSync(this.indexPath)) {
            try {
                const content = fs.readFileSync(this.indexPath, 'utf8');
                index = JSON.parse(content);
            }
            catch (error) {
                console.error('Error loading audit index:', error);
            }
        }
        // Update index
        if (!index.handoffs) {
            index.handoffs = {};
        }
        if (!index.handoffs[entry.handoffId]) {
            index.handoffs[entry.handoffId] = {
                handoffId: entry.handoffId,
                handoffType: entry.metadata.handoffType,
                sourceMcp: entry.metadata.sourceMcp,
                targetMcp: entry.metadata.targetMcp,
                firstSeen: entry.timestamp,
                lastSeen: entry.timestamp,
                actions: [],
            };
        }
        const handoffIndex = index.handoffs[entry.handoffId];
        handoffIndex.lastSeen = entry.timestamp;
        if (!handoffIndex.actions.includes(entry.action)) {
            handoffIndex.actions.push(entry.action);
        }
        // Save index
        fs.writeFileSync(this.indexPath, JSON.stringify(index, null, 2), 'utf8');
    }
    /**
     * Clean up old audit logs (older than specified days)
     */
    cleanup(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];
        const files = fs.readdirSync(this.auditDir);
        let cleaned = 0;
        for (const file of files) {
            if (!file.startsWith('audit-') || !file.endsWith('.jsonl')) {
                continue;
            }
            // Extract date from filename: audit-YYYY-MM-DD.jsonl
            const dateMatch = file.match(/audit-(\d{4}-\d{2}-\d{2})\.jsonl/);
            if (!dateMatch)
                continue;
            const fileDate = dateMatch[1];
            if (fileDate < cutoffStr) {
                const filePath = path.join(this.auditDir, file);
                fs.unlinkSync(filePath);
                cleaned++;
            }
        }
        return cleaned;
    }
    /**
     * Export audit trail to JSON
     */
    export(outputPath, filter) {
        const entries = this.query(filter);
        const exportData = {
            exportDate: new Date().toISOString(),
            filter,
            entryCount: entries.length,
            entries,
        };
        fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf8');
    }
}
/**
 * Create a new audit trail instance
 */
export function createAuditTrail(projectPath) {
    return new AuditTrail(projectPath);
}
// Legacy exports for compatibility
export class HandoffAuditLogger {
    auditTrail;
    constructor(projectPath) {
        this.auditTrail = new AuditTrail(projectPath);
    }
    log(message) {
        // Legacy method - just log to console
        console.log(`[AUDIT] ${message}`);
    }
}
export class AuditLogQuery {
    auditTrail;
    constructor(projectPath) {
        this.auditTrail = new AuditTrail(projectPath);
    }
    query(filter) {
        return this.auditTrail.query(filter || {});
    }
}
//# sourceMappingURL=handoff-audit.js.map