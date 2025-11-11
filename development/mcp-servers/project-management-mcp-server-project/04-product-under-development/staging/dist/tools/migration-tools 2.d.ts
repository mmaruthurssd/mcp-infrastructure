/**
 * Migration Tools for v0.8.0 → v1.0.0 Hierarchical Structure
 *
 * Tools for detecting, analyzing, and migrating existing v0.8.0 projects
 * to the new v1.0.0 hierarchical multi-level planning structure.
 *
 * Created: 2025-10-28
 */
import { z } from 'zod';
/**
 * Schema for analyze_project_for_migration tool
 */
export declare const AnalyzeProjectForMigrationSchema: z.ZodObject<{
    projectPath: z.ZodString;
    includeArchived: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
/**
 * Schema for suggest_goal_clustering tool
 */
export declare const SuggestGoalClusteringSchema: z.ZodObject<{
    projectPath: z.ZodString;
    goals: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        status: z.ZodString;
    }, z.core.$strip>>;
    targetComponents: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
/**
 * Schema for migrate_to_hierarchical tool
 */
export declare const MigrateToHierarchicalSchema: z.ZodObject<{
    projectPath: z.ZodString;
    clustering: z.ZodObject<{
        components: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            goalIds: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    createBackup: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    dryRun: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
/**
 * Schema for validate_migration tool
 */
export declare const ValidateMigrationSchema: z.ZodObject<{
    projectPath: z.ZodString;
    originalGoalCount: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
/**
 * Schema for rollback_migration tool
 */
export declare const RollbackMigrationSchema: z.ZodObject<{
    projectPath: z.ZodString;
    backupPath: z.ZodOptional<z.ZodString>;
    confirm: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
interface V080Goal {
    id: string;
    name: string;
    description: string;
    status: string;
    tier?: string;
    impact?: string;
    effort?: string;
    filePath: string;
    content: string;
}
interface ProjectAnalysis {
    isV080: boolean;
    version: string;
    structure: {
        hasBrainstorming: boolean;
        hasPotentialGoals: boolean;
        hasSelectedGoals: boolean;
        hasArchive: boolean;
    };
    goals: {
        potential: V080Goal[];
        selected: V080Goal[];
        archived: V080Goal[];
        total: number;
    };
    suggestedMigration: {
        needsMigration: boolean;
        confidence: 'high' | 'medium' | 'low';
        warnings: string[];
        recommendations: string[];
    };
}
interface Component {
    name: string;
    description: string;
    goals: V080Goal[];
    confidence: number;
    reasoning: string;
}
interface ClusteringResult {
    components: Component[];
    unclassified: V080Goal[];
    confidence: number;
    algorithm: string;
    metadata: {
        totalGoals: number;
        clusteredGoals: number;
        targetComponents: number;
        actualComponents: number;
    };
}
interface MigrationResult {
    success: boolean;
    backupPath?: string;
    changes: {
        foldersCreated: string[];
        filesMoved: string[];
        filesCreated: string[];
    };
    validation: {
        goalsAccounted: boolean;
        structureValid: boolean;
        metadataIntact: boolean;
    };
    warnings: string[];
    errors: string[];
}
/**
 * Analyze a project to determine if it's v0.8.0 and needs migration
 */
export declare function analyzeProjectForMigration(params: z.infer<typeof AnalyzeProjectForMigrationSchema>): Promise<ProjectAnalysis>;
/**
 * Suggest intelligent clustering of goals into components using AI algorithm
 */
export declare function suggestGoalClustering(params: z.infer<typeof SuggestGoalClusteringSchema>): Promise<ClusteringResult>;
/**
 * Execute migration from v0.8.0 to v1.0.0 hierarchical structure
 */
export declare function migrateToHierarchical(params: z.infer<typeof MigrateToHierarchicalSchema>): Promise<MigrationResult>;
/**
 * Validate that migration completed successfully
 */
export declare function validateMigration(params: z.infer<typeof ValidateMigrationSchema>): Promise<{
    valid: boolean;
    checks: {
        structureExists: boolean;
        goalsAccounted: boolean;
        metadataValid: boolean;
        noDataLoss: boolean;
    };
    goalCount: {
        expected: number;
        found: number;
        missing: number;
    };
    issues: string[];
    warnings: string[];
}>;
/**
 * Rollback a migration by restoring from backup
 */
export declare function rollbackMigration(params: z.infer<typeof RollbackMigrationSchema>): Promise<{
    success: boolean;
    restored: string[];
    removed: string[];
    message: string;
}>;
export declare const analyzeProjectForMigrationTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        includeArchived: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>;
};
export declare const suggestGoalClusteringTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        goals: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodString;
            status: z.ZodString;
        }, z.core.$strip>>;
        targetComponents: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, z.core.$strip>;
};
export declare const migrateToHierarchicalTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        clustering: z.ZodObject<{
            components: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                goalIds: z.ZodArray<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        createBackup: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        dryRun: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>;
};
export declare const validateMigrationTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        originalGoalCount: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
};
export declare const rollbackMigrationTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        backupPath: z.ZodOptional<z.ZodString>;
        confirm: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>;
};
export {};
//# sourceMappingURL=migration-tools%202.d.ts.map