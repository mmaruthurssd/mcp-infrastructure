/**
 * Task Status Manager - Tracks task execution state
 *
 * Inspired by Taskmaster AI's task state tracking
 */
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
export declare class TaskStatusManager {
    /**
     * Get task state file path
     */
    private static getStateFilePath;
    /**
     * Initialize task state file from tasks.md
     */
    static initialize(projectPath: string, featureId: string, featureName: string, taskIds: string[]): TaskStateFile;
    /**
     * Load task state file
     */
    static load(projectPath: string, featureId: string): TaskStateFile | null;
    /**
     * Save task state file
     */
    static save(projectPath: string, stateFile: TaskStateFile): void;
    /**
     * Update task status
     */
    static updateTaskStatus(projectPath: string, featureId: string, taskId: string, newStatus: TaskStatus, notes?: string, blockedReason?: string): TaskStateFile | null;
    /**
     * Get task status
     */
    static getTaskStatus(projectPath: string, featureId: string, taskId: string): TaskState | null;
    /**
     * Get all tasks by status
     */
    static getTasksByStatus(projectPath: string, featureId: string, status: TaskStatus): TaskState[];
    /**
     * Get progress summary
     */
    static getProgressSummary(projectPath: string, featureId: string): TaskStateFile['metadata'] | null;
    /**
     * Update metadata calculations
     */
    private static updateMetadata;
    /**
     * Get status symbol for display
     */
    static getStatusSymbol(status: TaskStatus): string;
    /**
     * Get status emoji for display
     */
    static getStatusEmoji(status: TaskStatus): string;
}
//# sourceMappingURL=task-status-manager.d.ts.map