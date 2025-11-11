/**
 * Tasks Parser Utility
 *
 * Parses tasks.md files from spec-driven MCP to count completed/total tasks.
 */
export interface TaskCounts {
    completed: number;
    total: number;
    percentage: number;
}
/**
 * Parse tasks.md file and count checkboxes
 */
export declare function parseTasksFile(tasksFilePath: string): TaskCounts;
/**
 * Parse tasks content and count checkboxes
 */
export declare function parseTasksContent(content: string): TaskCounts;
/**
 * Parse spec directory to find tasks.md and calculate progress
 */
export declare function parseSpecDirectory(specPath: string): TaskCounts;
//# sourceMappingURL=tasks-parser.d.ts.map