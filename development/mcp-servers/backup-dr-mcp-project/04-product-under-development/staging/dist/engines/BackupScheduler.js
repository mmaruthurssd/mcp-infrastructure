/**
 * BackupScheduler - Manages scheduled backups with node-cron
 */
import cron from 'node-cron';
import { writeFile, readFile, access } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { BackupEngine } from './BackupEngine.js';
export class BackupScheduler {
    backupEngine;
    schedulePath;
    registry;
    activeCronJobs;
    constructor(compressionLevel = 6, backupDirectory = '~/.backup-dr/backups') {
        this.backupEngine = new BackupEngine(compressionLevel, backupDirectory);
        const resolvedDir = backupDirectory.startsWith('~')
            ? join(homedir(), backupDirectory.slice(2))
            : backupDirectory;
        this.schedulePath = join(resolvedDir, '..', 'schedules.json');
        this.registry = this.createEmptyRegistry();
        this.activeCronJobs = new Map();
    }
    /**
     * Initialize scheduler (load schedules and start cron jobs)
     */
    async initialize() {
        await this.loadRegistry();
        await this.startAllSchedules();
    }
    /**
     * Create a new backup schedule
     */
    async createSchedule(params) {
        // Validate cron expression
        if (!cron.validate(params.cronExpression)) {
            throw new Error(`Invalid cron expression: ${params.cronExpression}`);
        }
        // Load current registry
        await this.loadRegistry();
        // Check for duplicate schedule ID
        if (this.registry.schedules.some(s => s.scheduleId === params.scheduleId)) {
            throw new Error(`Schedule already exists: ${params.scheduleId}`);
        }
        // Create schedule
        const schedule = {
            scheduleId: params.scheduleId,
            cronExpression: params.cronExpression,
            sources: params.sources,
            type: params.type || 'incremental',
            label: params.label,
            compression: params.compression ?? true,
            verify: params.verify ?? false,
            excludePatterns: params.excludePatterns || [],
            enabled: params.enabled ?? true,
            lastRun: undefined,
            nextRun: this.getNextRunTime(params.cronExpression),
            createdAt: new Date().toISOString()
        };
        // Add to registry
        this.registry.schedules.push(schedule);
        await this.saveRegistry();
        // Start cron job if enabled
        if (schedule.enabled) {
            await this.startSchedule(schedule.scheduleId);
        }
        return {
            success: true,
            scheduleId: schedule.scheduleId,
            schedule
        };
    }
    /**
     * List all schedules
     */
    async listSchedules(filter) {
        await this.loadRegistry();
        let schedules = [...this.registry.schedules];
        if (filter?.enabled !== undefined) {
            schedules = schedules.filter(s => s.enabled === filter.enabled);
        }
        return schedules;
    }
    /**
     * Get a specific schedule
     */
    async getSchedule(scheduleId) {
        await this.loadRegistry();
        return this.registry.schedules.find(s => s.scheduleId === scheduleId) || null;
    }
    /**
     * Update a schedule
     */
    async updateSchedule(scheduleId, updates) {
        await this.loadRegistry();
        const index = this.registry.schedules.findIndex(s => s.scheduleId === scheduleId);
        if (index === -1) {
            throw new Error(`Schedule not found: ${scheduleId}`);
        }
        const schedule = this.registry.schedules[index];
        // Validate cron expression if provided
        if (updates.cronExpression && !cron.validate(updates.cronExpression)) {
            throw new Error(`Invalid cron expression: ${updates.cronExpression}`);
        }
        // Stop existing cron job
        await this.stopSchedule(scheduleId);
        // Apply updates
        const updatedSchedule = {
            ...schedule,
            ...updates,
            nextRun: updates.cronExpression
                ? this.getNextRunTime(updates.cronExpression)
                : schedule.nextRun
        };
        this.registry.schedules[index] = updatedSchedule;
        await this.saveRegistry();
        // Restart cron job if enabled
        if (updatedSchedule.enabled) {
            await this.startSchedule(scheduleId);
        }
        return {
            success: true,
            scheduleId,
            schedule: updatedSchedule
        };
    }
    /**
     * Delete a schedule
     */
    async deleteSchedule(scheduleId) {
        await this.loadRegistry();
        // Stop cron job
        await this.stopSchedule(scheduleId);
        // Remove from registry
        this.registry.schedules = this.registry.schedules.filter(s => s.scheduleId !== scheduleId);
        await this.saveRegistry();
    }
    /**
     * Enable a schedule
     */
    async enableSchedule(scheduleId) {
        await this.updateSchedule(scheduleId, { enabled: true });
    }
    /**
     * Disable a schedule
     */
    async disableSchedule(scheduleId) {
        await this.updateSchedule(scheduleId, { enabled: false });
    }
    /**
     * Start a specific schedule's cron job
     */
    async startSchedule(scheduleId) {
        const schedule = this.registry.schedules.find(s => s.scheduleId === scheduleId);
        if (!schedule || !schedule.enabled) {
            return;
        }
        // Stop existing job if running
        if (this.activeCronJobs.has(scheduleId)) {
            this.activeCronJobs.get(scheduleId).stop();
            this.activeCronJobs.delete(scheduleId);
        }
        // Create and start cron job
        const task = cron.schedule(schedule.cronExpression, async () => {
            await this.executeScheduledBackup(scheduleId);
        }, {
            scheduled: true,
            timezone: 'America/New_York' // Default timezone, could be configurable
        });
        this.activeCronJobs.set(scheduleId, task);
    }
    /**
     * Stop a specific schedule's cron job
     */
    async stopSchedule(scheduleId) {
        if (this.activeCronJobs.has(scheduleId)) {
            this.activeCronJobs.get(scheduleId).stop();
            this.activeCronJobs.delete(scheduleId);
        }
    }
    /**
     * Start all enabled schedules
     */
    async startAllSchedules() {
        for (const schedule of this.registry.schedules) {
            if (schedule.enabled) {
                await this.startSchedule(schedule.scheduleId);
            }
        }
    }
    /**
     * Stop all schedules
     */
    async stopAllSchedules() {
        for (const scheduleId of this.activeCronJobs.keys()) {
            await this.stopSchedule(scheduleId);
        }
    }
    /**
     * Execute a scheduled backup
     */
    async executeScheduledBackup(scheduleId) {
        const schedule = this.registry.schedules.find(s => s.scheduleId === scheduleId);
        if (!schedule) {
            return;
        }
        try {
            // Create backup params
            const backupParams = {
                sources: schedule.sources,
                type: schedule.type,
                label: schedule.label,
                compression: schedule.compression,
                verify: schedule.verify,
                excludePatterns: schedule.excludePatterns
            };
            // Execute backup
            await this.backupEngine.createBackup(backupParams);
            // Update schedule last run time
            schedule.lastRun = new Date().toISOString();
            schedule.nextRun = this.getNextRunTime(schedule.cronExpression);
            await this.saveRegistry();
        }
        catch (error) {
            console.error(`Scheduled backup failed for ${scheduleId}:`, error);
            // Continue - don't stop the schedule on error
        }
    }
    /**
     * Manually trigger a scheduled backup
     */
    async triggerSchedule(scheduleId) {
        const schedule = this.registry.schedules.find(s => s.scheduleId === scheduleId);
        if (!schedule) {
            throw new Error(`Schedule not found: ${scheduleId}`);
        }
        await this.executeScheduledBackup(scheduleId);
    }
    /**
     * Get next run time for a cron expression
     */
    getNextRunTime(_cronExpression) {
        try {
            // Parse cron expression and calculate next run
            // This is a simplified implementation
            // In production, you'd use a library like cron-parser
            const now = new Date();
            const nextRun = new Date(now.getTime() + 60 * 60 * 1000); // Placeholder: 1 hour from now
            return nextRun.toISOString();
        }
        catch {
            return new Date().toISOString();
        }
    }
    /**
     * Create empty registry
     */
    createEmptyRegistry() {
        return {
            version: '1.0.0',
            schedules: []
        };
    }
    /**
     * Load schedule registry from disk
     */
    async loadRegistry() {
        try {
            await access(this.schedulePath);
            const content = await readFile(this.schedulePath, 'utf-8');
            this.registry = JSON.parse(content);
        }
        catch {
            // Registry doesn't exist, use empty registry
            this.registry = this.createEmptyRegistry();
        }
    }
    /**
     * Save schedule registry to disk
     */
    async saveRegistry() {
        const content = JSON.stringify(this.registry, null, 2);
        await writeFile(this.schedulePath, content, 'utf-8');
    }
    /**
     * Get scheduler status
     */
    async getStatus() {
        await this.loadRegistry();
        return {
            totalSchedules: this.registry.schedules.length,
            enabledSchedules: this.registry.schedules.filter(s => s.enabled).length,
            disabledSchedules: this.registry.schedules.filter(s => !s.enabled).length,
            activeJobs: this.activeCronJobs.size,
            schedules: this.registry.schedules
        };
    }
}
//# sourceMappingURL=BackupScheduler.js.map