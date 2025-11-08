/**
 * BackupScheduler - Manages scheduled backups with node-cron
 */

import cron from 'node-cron';
import { writeFile, readFile, access } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { BackupEngine } from './BackupEngine.js';
import {
  BackupSchedule,
  CreateBackupParams,
  ScheduleBackupParams,
  ScheduleBackupResult
} from '../types/backup.types.js';

interface ScheduleRegistry {
  version: string;
  schedules: BackupSchedule[];
}

export class BackupScheduler {
  private backupEngine: BackupEngine;
  private schedulePath: string;
  private registry: ScheduleRegistry;
  private activeCronJobs: Map<string, cron.ScheduledTask>;

  constructor(
    compressionLevel: number = 6,
    backupDirectory: string = '~/.backup-dr/backups'
  ) {
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
  async initialize(): Promise<void> {
    await this.loadRegistry();
    await this.startAllSchedules();
  }

  /**
   * Create a new backup schedule
   */
  async createSchedule(params: ScheduleBackupParams): Promise<ScheduleBackupResult> {
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
    const schedule: BackupSchedule = {
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
  async listSchedules(filter?: { enabled?: boolean }): Promise<BackupSchedule[]> {
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
  async getSchedule(scheduleId: string): Promise<BackupSchedule | null> {
    await this.loadRegistry();
    return this.registry.schedules.find(s => s.scheduleId === scheduleId) || null;
  }

  /**
   * Update a schedule
   */
  async updateSchedule(
    scheduleId: string,
    updates: Partial<Omit<ScheduleBackupParams, 'scheduleId'>>
  ): Promise<ScheduleBackupResult> {
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
    const updatedSchedule: BackupSchedule = {
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
  async deleteSchedule(scheduleId: string): Promise<void> {
    await this.loadRegistry();

    // Stop cron job
    await this.stopSchedule(scheduleId);

    // Remove from registry
    this.registry.schedules = this.registry.schedules.filter(
      s => s.scheduleId !== scheduleId
    );

    await this.saveRegistry();
  }

  /**
   * Enable a schedule
   */
  async enableSchedule(scheduleId: string): Promise<void> {
    await this.updateSchedule(scheduleId, { enabled: true });
  }

  /**
   * Disable a schedule
   */
  async disableSchedule(scheduleId: string): Promise<void> {
    await this.updateSchedule(scheduleId, { enabled: false });
  }

  /**
   * Start a specific schedule's cron job
   */
  private async startSchedule(scheduleId: string): Promise<void> {
    const schedule = this.registry.schedules.find(s => s.scheduleId === scheduleId);
    if (!schedule || !schedule.enabled) {
      return;
    }

    // Stop existing job if running
    if (this.activeCronJobs.has(scheduleId)) {
      this.activeCronJobs.get(scheduleId)!.stop();
      this.activeCronJobs.delete(scheduleId);
    }

    // Create and start cron job
    const task = cron.schedule(
      schedule.cronExpression,
      async () => {
        await this.executeScheduledBackup(scheduleId);
      },
      {
        scheduled: true,
        timezone: 'America/New_York' // Default timezone, could be configurable
      }
    );

    this.activeCronJobs.set(scheduleId, task);
  }

  /**
   * Stop a specific schedule's cron job
   */
  private async stopSchedule(scheduleId: string): Promise<void> {
    if (this.activeCronJobs.has(scheduleId)) {
      this.activeCronJobs.get(scheduleId)!.stop();
      this.activeCronJobs.delete(scheduleId);
    }
  }

  /**
   * Start all enabled schedules
   */
  private async startAllSchedules(): Promise<void> {
    for (const schedule of this.registry.schedules) {
      if (schedule.enabled) {
        await this.startSchedule(schedule.scheduleId);
      }
    }
  }

  /**
   * Stop all schedules
   */
  async stopAllSchedules(): Promise<void> {
    for (const scheduleId of this.activeCronJobs.keys()) {
      await this.stopSchedule(scheduleId);
    }
  }

  /**
   * Execute a scheduled backup
   */
  private async executeScheduledBackup(scheduleId: string): Promise<void> {
    const schedule = this.registry.schedules.find(s => s.scheduleId === scheduleId);
    if (!schedule) {
      return;
    }

    try {
      // Create backup params
      const backupParams: CreateBackupParams = {
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
    } catch (error) {
      console.error(`Scheduled backup failed for ${scheduleId}:`, error);
      // Continue - don't stop the schedule on error
    }
  }

  /**
   * Manually trigger a scheduled backup
   */
  async triggerSchedule(scheduleId: string): Promise<void> {
    const schedule = this.registry.schedules.find(s => s.scheduleId === scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    await this.executeScheduledBackup(scheduleId);
  }

  /**
   * Get next run time for a cron expression
   */
  private getNextRunTime(_cronExpression: string): string {
    try {
      // Parse cron expression and calculate next run
      // This is a simplified implementation
      // In production, you'd use a library like cron-parser
      const now = new Date();
      const nextRun = new Date(now.getTime() + 60 * 60 * 1000); // Placeholder: 1 hour from now
      return nextRun.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  /**
   * Create empty registry
   */
  private createEmptyRegistry(): ScheduleRegistry {
    return {
      version: '1.0.0',
      schedules: []
    };
  }

  /**
   * Load schedule registry from disk
   */
  private async loadRegistry(): Promise<void> {
    try {
      await access(this.schedulePath);
      const content = await readFile(this.schedulePath, 'utf-8');
      this.registry = JSON.parse(content);
    } catch {
      // Registry doesn't exist, use empty registry
      this.registry = this.createEmptyRegistry();
    }
  }

  /**
   * Save schedule registry to disk
   */
  private async saveRegistry(): Promise<void> {
    const content = JSON.stringify(this.registry, null, 2);
    await writeFile(this.schedulePath, content, 'utf-8');
  }

  /**
   * Get scheduler status
   */
  async getStatus(): Promise<{
    totalSchedules: number;
    enabledSchedules: number;
    disabledSchedules: number;
    activeJobs: number;
    schedules: BackupSchedule[];
  }> {
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
