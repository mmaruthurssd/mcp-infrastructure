/**
 * RetentionEngine - Manages backup retention policies and cleanup
 */
import { rm } from 'fs/promises';
import { BackupStorage } from '../storage/BackupStorage.js';
import { BackupIndex } from '../storage/BackupIndex.js';
export class RetentionEngine {
    storage;
    index;
    policy;
    constructor(policy, backupDirectory = '~/.backup-dr/backups') {
        this.storage = new BackupStorage(backupDirectory);
        this.index = new BackupIndex(backupDirectory);
        this.policy = policy;
    }
    /**
     * Apply retention policy and cleanup old backups
     */
    async applyRetentionPolicy(dryRun = false) {
        const startTime = Date.now();
        // Load all backups
        const allBackups = await this.index.getAllBackups();
        // Categorize backups by age
        const categorized = this.categorizeBackups(allBackups);
        // Select backups to keep
        const toKeep = this.selectBackupsToKeep(categorized);
        // Determine backups to delete
        const toDelete = allBackups.filter(backup => !toKeep.some(keep => keep.backupId === backup.backupId));
        // Calculate space to be reclaimed
        const spaceReclaimed = toDelete.reduce((sum, b) => sum + b.compressedSize, 0);
        // If dry-run, return preview
        if (dryRun) {
            return {
                success: true,
                backupsDeleted: 0,
                backupsKept: toKeep.length,
                spaceReclaimed: 0,
                duration: Date.now() - startTime,
                dryRun: true,
                preview: {
                    toDelete: toDelete.map(b => ({
                        backupId: b.backupId,
                        created: b.created,
                        type: b.type,
                        size: b.compressedSize
                    })),
                    toKeep: toKeep.map(b => ({
                        backupId: b.backupId,
                        created: b.created,
                        type: b.type,
                        category: this.getBackupCategory(b)
                    })),
                    estimatedSpaceReclaimed: spaceReclaimed
                }
            };
        }
        // Execute cleanup
        const deletedBackups = [];
        for (const backup of toDelete) {
            try {
                await this.deleteBackup(backup.backupId);
                deletedBackups.push(backup.backupId);
            }
            catch (error) {
                // Log error but continue with other deletions
                console.error(`Failed to delete backup ${backup.backupId}:`, error);
            }
        }
        const duration = Date.now() - startTime;
        return {
            success: true,
            backupsDeleted: deletedBackups.length,
            backupsKept: toKeep.length,
            spaceReclaimed,
            duration,
            dryRun: false,
            deletedBackupIds: deletedBackups
        };
    }
    /**
     * Categorize backups by age
     */
    categorizeBackups(backups) {
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        // const _oneWeekMs = 7 * oneDayMs;
        // const _oneMonthMs = 30 * oneDayMs;
        const category = {
            daily: [],
            weekly: [],
            monthly: [],
            expired: []
        };
        for (const backup of backups) {
            const age = now - new Date(backup.created).getTime();
            const ageInDays = age / oneDayMs;
            if (ageInDays <= this.policy.dailyRetention) {
                category.daily.push(backup);
            }
            else if (ageInDays <= this.policy.dailyRetention + (this.policy.weeklyRetention * 7)) {
                category.weekly.push(backup);
            }
            else if (ageInDays <= this.policy.dailyRetention + (this.policy.weeklyRetention * 7) + (this.policy.monthlyRetention * 30)) {
                category.monthly.push(backup);
            }
            else {
                category.expired.push(backup);
            }
        }
        return category;
    }
    /**
     * Select backups to keep based on retention policy
     */
    selectBackupsToKeep(categorized) {
        const toKeep = [];
        // Keep all daily backups (up to dailyRetention days)
        toKeep.push(...categorized.daily);
        // Keep weekly backups (one per week, preferring full backups)
        const weeklyBackups = this.selectWeeklyBackups(categorized.weekly, this.policy.weeklyRetention);
        toKeep.push(...weeklyBackups);
        // Keep monthly backups (one per month, preferring full backups)
        const monthlyBackups = this.selectMonthlyBackups(categorized.monthly, this.policy.monthlyRetention);
        toKeep.push(...monthlyBackups);
        // Expired backups are not kept
        // (they're older than the retention policy allows)
        return toKeep;
    }
    /**
     * Select weekly backups (one per week)
     */
    selectWeeklyBackups(backups, weekCount) {
        // Group backups by week
        const weekGroups = this.groupBackupsByWeek(backups);
        // Sort weeks descending (most recent first)
        const sortedWeeks = Array.from(weekGroups.keys()).sort((a, b) => b - a);
        // Take the most recent N weeks
        const selected = [];
        for (let i = 0; i < Math.min(weekCount, sortedWeeks.length); i++) {
            const weekBackups = weekGroups.get(sortedWeeks[i]);
            // Prefer full backups over incremental
            const backup = this.preferFullBackup(weekBackups);
            selected.push(backup);
        }
        return selected;
    }
    /**
     * Select monthly backups (one per month)
     */
    selectMonthlyBackups(backups, monthCount) {
        // Group backups by month
        const monthGroups = this.groupBackupsByMonth(backups);
        // Sort months descending (most recent first)
        const sortedMonths = Array.from(monthGroups.keys()).sort((a, b) => b - a);
        // Take the most recent N months
        const selected = [];
        for (let i = 0; i < Math.min(monthCount, sortedMonths.length); i++) {
            const monthBackups = monthGroups.get(sortedMonths[i]);
            // Prefer full backups over incremental
            const backup = this.preferFullBackup(monthBackups);
            selected.push(backup);
        }
        return selected;
    }
    /**
     * Group backups by week number
     */
    groupBackupsByWeek(backups) {
        const groups = new Map();
        for (const backup of backups) {
            const date = new Date(backup.created);
            const weekNumber = this.getWeekNumber(date);
            if (!groups.has(weekNumber)) {
                groups.set(weekNumber, []);
            }
            groups.get(weekNumber).push(backup);
        }
        return groups;
    }
    /**
     * Group backups by month
     */
    groupBackupsByMonth(backups) {
        const groups = new Map();
        for (const backup of backups) {
            const date = new Date(backup.created);
            const monthKey = date.getFullYear() * 12 + date.getMonth();
            if (!groups.has(monthKey)) {
                groups.set(monthKey, []);
            }
            groups.get(monthKey).push(backup);
        }
        return groups;
    }
    /**
     * Get week number for a date
     */
    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000);
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }
    /**
     * Prefer full backup over incremental
     */
    preferFullBackup(backups) {
        // Sort by: full backups first, then by date descending
        const sorted = [...backups].sort((a, b) => {
            // Prefer full backups
            if (a.type === 'full' && b.type === 'incremental')
                return -1;
            if (a.type === 'incremental' && b.type === 'full')
                return 1;
            // If same type, prefer more recent
            return new Date(b.created).getTime() - new Date(a.created).getTime();
        });
        return sorted[0];
    }
    /**
     * Get backup category for display
     */
    getBackupCategory(backup) {
        const now = Date.now();
        const age = now - new Date(backup.created).getTime();
        const ageInDays = age / (24 * 60 * 60 * 1000);
        if (ageInDays <= this.policy.dailyRetention) {
            return 'daily';
        }
        else if (ageInDays <= this.policy.dailyRetention + (this.policy.weeklyRetention * 7)) {
            return 'weekly';
        }
        else if (ageInDays <= this.policy.dailyRetention + (this.policy.weeklyRetention * 7) + (this.policy.monthlyRetention * 30)) {
            return 'monthly';
        }
        else {
            return 'expired';
        }
    }
    /**
     * Delete a backup (files and index entry)
     */
    async deleteBackup(backupId) {
        // Delete backup directory
        const backupPath = this.storage.getBackupPath(backupId);
        await rm(backupPath, { recursive: true, force: true });
        // Remove from index
        await this.index.removeBackup(backupId);
    }
    /**
     * Get retention policy preview (what would be kept/deleted)
     */
    async getRetentionPreview() {
        const allBackups = await this.index.getAllBackups();
        const categorized = this.categorizeBackups(allBackups);
        const toKeep = this.selectBackupsToKeep(categorized);
        const toDelete = allBackups.filter(backup => !toKeep.some(keep => keep.backupId === backup.backupId));
        return {
            ...categorized,
            toKeep,
            toDelete
        };
    }
}
//# sourceMappingURL=RetentionEngine.js.map