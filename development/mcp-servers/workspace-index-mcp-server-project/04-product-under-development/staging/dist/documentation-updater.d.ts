import { WorkspaceSnapshot } from './drift-tracker.js';
export interface ValidationIssue {
    severity: 'critical' | 'warning' | 'info';
    category: string;
    file: string;
    line?: number;
    expected: string;
    actual: string;
    suggestion: string;
}
export interface UpdateChange {
    file: string;
    linesModified: number;
    preview: string;
    originalContent?: string;
}
export interface UpdateResult {
    applied: boolean;
    dryRun: boolean;
    backupPath?: string;
    changes: UpdateChange[];
    validation: {
        syntaxValid: boolean;
        errors: string[];
    };
}
export declare class DocumentationUpdater {
    private projectRoot;
    private backupDir;
    constructor(projectRoot: string);
    /**
     * Create backup directory if it doesn't exist
     */
    private ensureBackupDir;
    /**
     * Create backup of a file before modification
     */
    private createBackup;
    /**
     * Restore file from backup
     */
    rollback(backupPath: string, originalPath: string): Promise<void>;
    /**
     * Validate markdown syntax (basic checks)
     */
    private validateMarkdownSyntax;
    /**
     * Generate diff preview between original and updated content
     */
    private generateDiff;
    /**
     * Update MCP counts in documentation
     */
    private updateMCPCounts;
    /**
     * Update template counts in documentation
     */
    private updateTemplateCounts;
    /**
     * Update workspace documentation to match reality
     */
    updateDocumentation(options: {
        targets?: string[];
        dryRun?: boolean;
        createBackup?: boolean;
        issues?: ValidationIssue[];
        snapshot: WorkspaceSnapshot;
    }): Promise<UpdateResult>;
}
