/**
 * schedule_backup tool - Manage backup schedules (CRUD operations)
 */

import { BackupScheduler } from '../engines/BackupScheduler.js';
import { BackupSchedule } from '../types/backup.types.js';

export interface ScheduleBackupToolParams {
  action: 'create' | 'list' | 'update' | 'delete' | 'enable' | 'disable' | 'trigger';
  scheduleId?: string;
  cronExpression?: string;
  sources?: string[];
  type?: 'full' | 'incremental';
  label?: string;
  compression?: boolean;
  verify?: boolean;
  excludePatterns?: string[];
  enabled?: boolean;
  filter?: {
    enabled?: boolean;
  };
}

export interface ScheduleBackupToolResult {
  success: boolean;
  action: string;
  scheduleId?: string;
  schedule?: BackupSchedule;
  schedules?: BackupSchedule[];
  message?: string;
}

export class ScheduleBackupTool {
  private scheduler: BackupScheduler;

  constructor(compressionLevel: number = 6, backupDirectory: string = '~/.backup-dr/backups') {
    this.scheduler = new BackupScheduler(compressionLevel, backupDirectory);
  }

  async execute(params: ScheduleBackupToolParams): Promise<ScheduleBackupToolResult> {
    // Initialize scheduler
    await this.scheduler.initialize();

    switch (params.action) {
      case 'create':
        return await this.createSchedule(params);

      case 'list':
        return await this.listSchedules(params);

      case 'update':
        return await this.updateSchedule(params);

      case 'delete':
        return await this.deleteSchedule(params);

      case 'enable':
        return await this.enableSchedule(params);

      case 'disable':
        return await this.disableSchedule(params);

      case 'trigger':
        return await this.triggerSchedule(params);

      default:
        throw new Error(`Invalid action: ${params.action}`);
    }
  }

  private async createSchedule(params: ScheduleBackupToolParams): Promise<ScheduleBackupToolResult> {
    if (!params.scheduleId || !params.cronExpression || !params.sources) {
      throw new Error('scheduleId, cronExpression, and sources are required for create action');
    }

    const result = await this.scheduler.createSchedule({
      scheduleId: params.scheduleId,
      cronExpression: params.cronExpression,
      sources: params.sources,
      type: params.type,
      label: params.label,
      compression: params.compression,
      verify: params.verify,
      excludePatterns: params.excludePatterns,
      enabled: params.enabled
    });

    return {
      success: true,
      action: 'create',
      scheduleId: result.scheduleId,
      schedule: result.schedule,
      message: `Schedule created successfully: ${result.scheduleId}`
    };
  }

  private async listSchedules(params: ScheduleBackupToolParams): Promise<ScheduleBackupToolResult> {
    const schedules = await this.scheduler.listSchedules(params.filter);

    return {
      success: true,
      action: 'list',
      schedules,
      message: `Found ${schedules.length} schedule(s)`
    };
  }

  private async updateSchedule(params: ScheduleBackupToolParams): Promise<ScheduleBackupToolResult> {
    if (!params.scheduleId) {
      throw new Error('scheduleId is required for update action');
    }

    const updates: any = {};
    if (params.cronExpression !== undefined) updates.cronExpression = params.cronExpression;
    if (params.sources !== undefined) updates.sources = params.sources;
    if (params.type !== undefined) updates.type = params.type;
    if (params.label !== undefined) updates.label = params.label;
    if (params.compression !== undefined) updates.compression = params.compression;
    if (params.verify !== undefined) updates.verify = params.verify;
    if (params.excludePatterns !== undefined) updates.excludePatterns = params.excludePatterns;
    if (params.enabled !== undefined) updates.enabled = params.enabled;

    const result = await this.scheduler.updateSchedule(params.scheduleId, updates);

    return {
      success: true,
      action: 'update',
      scheduleId: result.scheduleId,
      schedule: result.schedule,
      message: `Schedule updated successfully: ${result.scheduleId}`
    };
  }

  private async deleteSchedule(params: ScheduleBackupToolParams): Promise<ScheduleBackupToolResult> {
    if (!params.scheduleId) {
      throw new Error('scheduleId is required for delete action');
    }

    await this.scheduler.deleteSchedule(params.scheduleId);

    return {
      success: true,
      action: 'delete',
      scheduleId: params.scheduleId,
      message: `Schedule deleted successfully: ${params.scheduleId}`
    };
  }

  private async enableSchedule(params: ScheduleBackupToolParams): Promise<ScheduleBackupToolResult> {
    if (!params.scheduleId) {
      throw new Error('scheduleId is required for enable action');
    }

    await this.scheduler.enableSchedule(params.scheduleId);

    return {
      success: true,
      action: 'enable',
      scheduleId: params.scheduleId,
      message: `Schedule enabled successfully: ${params.scheduleId}`
    };
  }

  private async disableSchedule(params: ScheduleBackupToolParams): Promise<ScheduleBackupToolResult> {
    if (!params.scheduleId) {
      throw new Error('scheduleId is required for disable action');
    }

    await this.scheduler.disableSchedule(params.scheduleId);

    return {
      success: true,
      action: 'disable',
      scheduleId: params.scheduleId,
      message: `Schedule disabled successfully: ${params.scheduleId}`
    };
  }

  private async triggerSchedule(params: ScheduleBackupToolParams): Promise<ScheduleBackupToolResult> {
    if (!params.scheduleId) {
      throw new Error('scheduleId is required for trigger action');
    }

    await this.scheduler.triggerSchedule(params.scheduleId);

    return {
      success: true,
      action: 'trigger',
      scheduleId: params.scheduleId,
      message: `Schedule triggered successfully: ${params.scheduleId}`
    };
  }
}
