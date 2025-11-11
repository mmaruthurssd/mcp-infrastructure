/**
 * Progress Persistence Layer
 *
 * Persists progress snapshots to markdown files and maintains progress history.
 * Integrates with the automatic update system to keep file-based data in sync.
 *
 * Created: 2025-10-27
 */
import { writeFile, readFile, mkdir, appendFile } from 'fs/promises';
import { join, dirname } from 'path';
const DEFAULT_PERSISTENCE_OPTIONS = {
    persistGoalStatus: true,
    persistHistory: true,
    persistSnapshots: false,
    historyRetentionDays: 90,
    snapshotRetentionDays: 30,
    historyDir: '.mcp-progress/history',
    snapshotsDir: '.mcp-progress/snapshots',
    batchSize: 10,
    enableCompression: false,
};
// ============================================================================
// PROGRESS PERSISTER
// ============================================================================
export class ProgressPersister {
    projectPath;
    options;
    historyBuffer = [];
    snapshotBuffer = [];
    flushInterval;
    constructor(projectPath, options = {}) {
        this.projectPath = projectPath;
        this.options = { ...DEFAULT_PERSISTENCE_OPTIONS, ...options };
        // Auto-flush every 30 seconds
        this.flushInterval = setInterval(() => this.flush(), 30 * 1000);
    }
    // ==========================================================================
    // PERSIST PROGRESS UPDATES
    // ==========================================================================
    /**
     * Persist progress update event
     */
    async persistUpdateEvent(event) {
        const persistPromises = [];
        for (const entity of event.affectedEntities) {
            // Persist to GOAL-STATUS.md (if applicable)
            if (this.options.persistGoalStatus && this.isGoalEntity(entity.entityType)) {
                persistPromises.push(this.updateGoalStatusFile(entity.entityType, entity.entityId));
            }
            // Add to history buffer
            if (this.options.persistHistory) {
                this.addToHistoryBuffer({
                    timestamp: event.timestamp,
                    entityType: entity.entityType,
                    entityId: entity.entityId,
                    percentage: entity.newProgress,
                    status: this.calculateStatus(entity.newProgress),
                    triggeredBy: event.triggeredBy,
                });
            }
            // Add to snapshot buffer
            if (this.options.persistSnapshots) {
                const progress = event.updatedProgress.get(`${entity.entityType}:${entity.entityId}`);
                if (progress) {
                    this.addToSnapshotBuffer({
                        snapshotId: `${entity.entityType}-${entity.entityId}-${Date.now()}`,
                        timestamp: event.timestamp,
                        entityType: entity.entityType,
                        entityId: entity.entityId,
                        progress,
                        triggeredBy: event.triggeredBy,
                        metadata: {
                            previousProgress: entity.previousProgress,
                            progressDelta: entity.progressChange,
                            changeReason: event.triggeredBy,
                        },
                    });
                }
            }
        }
        // Execute all persist operations
        await Promise.all(persistPromises);
        // Flush buffers if they're full
        if (this.historyBuffer.length >= this.options.batchSize ||
            this.snapshotBuffer.length >= this.options.batchSize) {
            await this.flush();
        }
    }
    // ==========================================================================
    // GOAL STATUS FILE UPDATES
    // ==========================================================================
    /**
     * Update GOAL-STATUS.md file for a goal
     */
    async updateGoalStatusFile(entityType, entityId) {
        try {
            const statusFilePath = this.getGoalStatusFilePath(entityType, entityId);
            if (!statusFilePath)
                return;
            // Read existing status file
            let content;
            try {
                content = await readFile(statusFilePath, 'utf-8');
            }
            catch (error) {
                // File doesn't exist, create new
                content = this.createNewStatusFile(entityType, entityId);
            }
            // Update progress section
            const updatedContent = await this.updateProgressSection(content, entityType, entityId);
            // Write back
            await mkdir(dirname(statusFilePath), { recursive: true });
            await writeFile(statusFilePath, updatedContent, 'utf-8');
        }
        catch (error) {
            console.error(`Failed to update status file for ${entityType} ${entityId}:`, error);
        }
    }
    /**
     * Get path to GOAL-STATUS.md file
     */
    getGoalStatusFilePath(entityType, entityId) {
        switch (entityType) {
            case 'major-goal':
                // Assumes folder structure: components/{componentId}/major-goals/{goalId}/GOAL-STATUS.md
                // This is simplified - production would query the hierarchy for actual path
                return join(this.projectPath, 'components', '*', 'major-goals', entityId, 'GOAL-STATUS.md');
            case 'sub-goal':
                return join(this.projectPath, 'components', '*', 'major-goals', '*', 'sub-goals', entityId, 'STATUS.md');
            default:
                return null;
        }
    }
    /**
     * Create new status file template
     */
    createNewStatusFile(entityType, entityId) {
        const now = new Date().toISOString();
        return `# ${entityType.toUpperCase()} STATUS

**ID:** ${entityId}
**Last Updated:** ${now}

## Progress

- **Percentage:** 0%
- **Status:** not-started
- **Completed Items:** 0
- **Total Items:** 0

## History

| Date | Progress | Status | Notes |
|------|----------|--------|-------|
| ${now.split('T')[0]} | 0% | not-started | Initial creation |
`;
    }
    /**
     * Update progress section in status file
     */
    async updateProgressSection(content, entityType, entityId) {
        // This is a simplified implementation
        // Production would parse markdown properly and update specific sections
        const now = new Date().toISOString();
        // Just append to history table for now
        const historyLine = `| ${now.split('T')[0]} | Updated | in-progress | Auto-updated from handoff |`;
        if (content.includes('## History')) {
            return content.replace(/(## History.*?\n.*?\n.*?\n)/s, `$1${historyLine}\n`);
        }
        return content + `\n${historyLine}\n`;
    }
    // ==========================================================================
    // HISTORY PERSISTENCE
    // ==========================================================================
    /**
     * Add entry to history buffer
     */
    addToHistoryBuffer(entry) {
        this.historyBuffer.push(entry);
    }
    /**
     * Flush history buffer to disk
     */
    async flushHistory() {
        if (this.historyBuffer.length === 0)
            return;
        const historyDir = join(this.projectPath, this.options.historyDir);
        await mkdir(historyDir, { recursive: true });
        // Get current history file (daily rotation)
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const historyFile = join(historyDir, `progress-history-${date}.ndjson`);
        // Convert entries to NDJSON
        const lines = this.historyBuffer
            .map(entry => JSON.stringify(entry))
            .join('\n') + '\n';
        // Append to file
        await appendFile(historyFile, lines, 'utf-8');
        // Clear buffer
        this.historyBuffer = [];
    }
    // ==========================================================================
    // SNAPSHOT PERSISTENCE
    // ==========================================================================
    /**
     * Add snapshot to buffer
     */
    addToSnapshotBuffer(snapshot) {
        this.snapshotBuffer.push(snapshot);
    }
    /**
     * Flush snapshot buffer to disk
     */
    async flushSnapshots() {
        if (this.snapshotBuffer.length === 0)
            return;
        const snapshotsDir = join(this.projectPath, this.options.snapshotsDir);
        await mkdir(snapshotsDir, { recursive: true });
        for (const snapshot of this.snapshotBuffer) {
            const date = new Date(snapshot.timestamp).toISOString().split('T')[0];
            const snapshotFile = join(snapshotsDir, `${snapshot.entityType}-${snapshot.entityId}-${date}.json`);
            try {
                // Read existing snapshots
                let snapshots = [];
                try {
                    const content = await readFile(snapshotFile, 'utf-8');
                    snapshots = JSON.parse(content);
                }
                catch {
                    // File doesn't exist
                }
                // Add new snapshot
                snapshots.push(snapshot);
                // Write back
                await writeFile(snapshotFile, JSON.stringify(snapshots, null, 2), 'utf-8');
            }
            catch (error) {
                console.error(`Failed to write snapshot ${snapshot.snapshotId}:`, error);
            }
        }
        // Clear buffer
        this.snapshotBuffer = [];
    }
    // ==========================================================================
    // BUFFER MANAGEMENT
    // ==========================================================================
    /**
     * Flush all buffers to disk
     */
    async flush() {
        await Promise.all([
            this.flushHistory(),
            this.flushSnapshots(),
        ]);
    }
    // ==========================================================================
    // QUERY OPERATIONS
    // ==========================================================================
    /**
     * Get progress history for entity
     */
    async getProgressHistory(entityType, entityId, options = {}) {
        const historyDir = join(this.projectPath, this.options.historyDir);
        const entries = [];
        try {
            const { readdir } = await import('fs/promises');
            const files = await readdir(historyDir);
            for (const file of files) {
                if (file.endsWith('.ndjson')) {
                    const filePath = join(historyDir, file);
                    const content = await readFile(filePath, 'utf-8');
                    const lines = content.trim().split('\n');
                    for (const line of lines) {
                        if (line) {
                            try {
                                const entry = JSON.parse(line);
                                // Filter by entity
                                if (entry.entityType === entityType && entry.entityId === entityId) {
                                    // Filter by date range
                                    if (options.startDate || options.endDate) {
                                        const entryDate = new Date(entry.timestamp);
                                        if (options.startDate && entryDate < options.startDate)
                                            continue;
                                        if (options.endDate && entryDate > options.endDate)
                                            continue;
                                    }
                                    entries.push(entry);
                                }
                            }
                            catch (error) {
                                console.warn(`Failed to parse history line: ${line}`);
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('Failed to read progress history:', error);
            return [];
        }
        // Sort by timestamp descending
        entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        // Apply limit
        if (options.limit) {
            return entries.slice(0, options.limit);
        }
        return entries;
    }
    /**
     * Get progress snapshots for entity
     */
    async getProgressSnapshots(entityType, entityId) {
        const snapshotsDir = join(this.projectPath, this.options.snapshotsDir);
        const snapshots = [];
        try {
            const { readdir } = await import('fs/promises');
            const files = await readdir(snapshotsDir);
            for (const file of files) {
                if (file.startsWith(`${entityType}-${entityId}-`) && file.endsWith('.json')) {
                    const filePath = join(snapshotsDir, file);
                    const content = await readFile(filePath, 'utf-8');
                    const fileSnapshots = JSON.parse(content);
                    snapshots.push(...fileSnapshots);
                }
            }
        }
        catch (error) {
            console.error('Failed to read snapshots:', error);
            return [];
        }
        // Sort by timestamp descending
        snapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return snapshots;
    }
    // ==========================================================================
    // UTILITIES
    // ==========================================================================
    /**
     * Check if entity type has a goal status file
     */
    isGoalEntity(entityType) {
        return entityType === 'major-goal' || entityType === 'sub-goal';
    }
    /**
     * Calculate status from percentage
     */
    calculateStatus(percentage) {
        if (percentage === 0)
            return 'not-started';
        if (percentage === 100)
            return 'completed';
        return 'in-progress';
    }
    /**
     * Cleanup
     */
    async destroy() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        await this.flush();
    }
}
// ============================================================================
// GLOBAL PERSISTER INSTANCE
// ============================================================================
let globalPersister = null;
/**
 * Initialize global persister
 */
export function initializeProgressPersister(projectPath, options) {
    if (globalPersister) {
        globalPersister.destroy();
    }
    globalPersister = new ProgressPersister(projectPath, options);
    return globalPersister;
}
/**
 * Get global persister
 */
export function getProgressPersister() {
    if (!globalPersister) {
        throw new Error('Progress persister not initialized. Call initializeProgressPersister first.');
    }
    return globalPersister;
}
/**
 * Destroy global persister
 */
export function destroyProgressPersister() {
    if (globalPersister) {
        globalPersister.destroy();
        globalPersister = null;
    }
}
//# sourceMappingURL=progress-persister.js.map