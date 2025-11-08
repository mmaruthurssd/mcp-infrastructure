/**
 * Task Status Manager - Tracks task execution state
 *
 * Inspired by Taskmaster AI's task state tracking
 */

import * as fs from 'fs';
import * as path from 'path';

export type TaskStatus = 'backlog' | 'in-progress' | 'done' | 'blocked';

export interface TaskState {
  id: string;
  status: TaskStatus;
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
  blockedReason?: string;
}

export interface TaskStateFile {
  featureId: string;
  featureName: string;
  lastUpdated: Date;
  tasks: TaskState[];
  metadata: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    percentComplete: number;
  };
}

export class TaskStatusManager {
  /**
   * Get task state file path
   */
  private static getStateFilePath(projectPath: string, featureId: string): string {
    const specDir = path.join(projectPath, 'specs');
    const stateDir = path.join(specDir, '.specify', 'state');

    // Ensure directory exists
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }

    return path.join(stateDir, `${featureId}-tasks.json`);
  }

  /**
   * Initialize task state file from tasks.md
   */
  static initialize(
    projectPath: string,
    featureId: string,
    featureName: string,
    taskIds: string[]
  ): TaskStateFile {
    const stateFile: TaskStateFile = {
      featureId,
      featureName,
      lastUpdated: new Date(),
      tasks: taskIds.map(id => ({
        id,
        status: 'backlog'
      })),
      metadata: {
        totalTasks: taskIds.length,
        completedTasks: 0,
        inProgressTasks: 0,
        blockedTasks: 0,
        percentComplete: 0
      }
    };

    this.save(projectPath, stateFile);
    return stateFile;
  }

  /**
   * Load task state file
   */
  static load(projectPath: string, featureId: string): TaskStateFile | null {
    const filePath = this.getStateFilePath(projectPath, featureId);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Parse dates
      data.lastUpdated = new Date(data.lastUpdated);
      data.tasks.forEach((task: TaskState) => {
        if (task.startedAt) task.startedAt = new Date(task.startedAt);
        if (task.completedAt) task.completedAt = new Date(task.completedAt);
      });

      return data;
    } catch (error) {
      console.error('Error loading task state:', error);
      return null;
    }
  }

  /**
   * Save task state file
   */
  static save(projectPath: string, stateFile: TaskStateFile): void {
    const filePath = this.getStateFilePath(projectPath, stateFile.featureId);
    fs.writeFileSync(filePath, JSON.stringify(stateFile, null, 2), 'utf-8');
  }

  /**
   * Update task status
   */
  static updateTaskStatus(
    projectPath: string,
    featureId: string,
    taskId: string,
    newStatus: TaskStatus,
    notes?: string,
    blockedReason?: string
  ): TaskStateFile | null {
    const stateFile = this.load(projectPath, featureId);

    if (!stateFile) {
      throw new Error(`Task state file not found for feature ${featureId}`);
    }

    const task = stateFile.tasks.find(t => t.id === taskId);

    if (!task) {
      throw new Error(`Task ${taskId} not found in state file`);
    }

    const oldStatus = task.status;
    task.status = newStatus;

    // Update timestamps
    if (newStatus === 'in-progress' && oldStatus === 'backlog') {
      task.startedAt = new Date();
    } else if (newStatus === 'done') {
      task.completedAt = new Date();
    }

    // Update notes and blocked reason
    if (notes) task.notes = notes;
    if (blockedReason) task.blockedReason = blockedReason;

    // Recalculate metadata
    this.updateMetadata(stateFile);

    // Save
    this.save(projectPath, stateFile);

    return stateFile;
  }

  /**
   * Get task status
   */
  static getTaskStatus(projectPath: string, featureId: string, taskId: string): TaskState | null {
    const stateFile = this.load(projectPath, featureId);

    if (!stateFile) {
      return null;
    }

    return stateFile.tasks.find(t => t.id === taskId) || null;
  }

  /**
   * Get all tasks by status
   */
  static getTasksByStatus(
    projectPath: string,
    featureId: string,
    status: TaskStatus
  ): TaskState[] {
    const stateFile = this.load(projectPath, featureId);

    if (!stateFile) {
      return [];
    }

    return stateFile.tasks.filter(t => t.status === status);
  }

  /**
   * Get progress summary
   */
  static getProgressSummary(projectPath: string, featureId: string): TaskStateFile['metadata'] | null {
    const stateFile = this.load(projectPath, featureId);

    if (!stateFile) {
      return null;
    }

    return stateFile.metadata;
  }

  /**
   * Update metadata calculations
   */
  private static updateMetadata(stateFile: TaskStateFile): void {
    stateFile.metadata.completedTasks = stateFile.tasks.filter(t => t.status === 'done').length;
    stateFile.metadata.inProgressTasks = stateFile.tasks.filter(t => t.status === 'in-progress').length;
    stateFile.metadata.blockedTasks = stateFile.tasks.filter(t => t.status === 'blocked').length;
    stateFile.metadata.totalTasks = stateFile.tasks.length;
    stateFile.metadata.percentComplete = stateFile.metadata.totalTasks > 0
      ? Math.round((stateFile.metadata.completedTasks / stateFile.metadata.totalTasks) * 100)
      : 0;
    stateFile.lastUpdated = new Date();
  }

  /**
   * Get status symbol for display
   */
  static getStatusSymbol(status: TaskStatus): string {
    switch (status) {
      case 'backlog': return '[ ]';
      case 'in-progress': return '[~]';
      case 'done': return '[x]';
      case 'blocked': return '[!]';
    }
  }

  /**
   * Get status emoji for display
   */
  static getStatusEmoji(status: TaskStatus): string {
    switch (status) {
      case 'backlog': return '⬜';
      case 'in-progress': return '🔄';
      case 'done': return '✅';
      case 'blocked': return '🚫';
    }
  }
}
