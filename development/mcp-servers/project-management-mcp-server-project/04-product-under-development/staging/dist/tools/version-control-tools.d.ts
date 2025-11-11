/**
 * Version Control Tools for Hierarchical Planning System
 *
 * MCP Tools: Complete version-aware document management
 *
 * Created: 2025-10-28
 * Goal: 002 - Implement Version-Aware Document System
 */
import { z } from 'zod';
export declare const DocumentTypeSchema: z.ZodEnum<{
    component: "component";
    roadmap: "roadmap";
    "major-goal": "major-goal";
    "sub-goal": "sub-goal";
    "project-overview": "project-overview";
}>;
export type DocumentType = z.infer<typeof DocumentTypeSchema>;
export declare const VersionHistoryEntrySchema: z.ZodObject<{
    version: z.ZodNumber;
    date: z.ZodString;
    changes: z.ZodString;
    author: z.ZodString;
}, z.core.$strip>;
export type VersionHistoryEntry = z.infer<typeof VersionHistoryEntrySchema>;
export declare const ImpactedDocumentSchema: z.ZodObject<{
    documentType: z.ZodEnum<{
        component: "component";
        roadmap: "roadmap";
        "major-goal": "major-goal";
        "sub-goal": "sub-goal";
        "project-overview": "project-overview";
    }>;
    documentPath: z.ZodString;
    currentVersion: z.ZodNumber;
    impactLevel: z.ZodEnum<{
        high: "high";
        medium: "medium";
        low: "low";
    }>;
    impactReason: z.ZodString;
    requiresReview: z.ZodBoolean;
}, z.core.$strip>;
export type ImpactedDocument = z.infer<typeof ImpactedDocumentSchema>;
export interface AnalyzeVersionImpactInput {
    projectPath: string;
    documentType: DocumentType;
    documentPath: string;
    proposedChanges: Record<string, any>;
    changeType: 'major' | 'minor' | 'patch';
}
export interface AnalyzeVersionImpactOutput {
    success: boolean;
    currentVersion: number;
    proposedVersion: number;
    impactSummary: {
        totalDocumentsAffected: number;
        highImpactCount: number;
        mediumImpactCount: number;
        lowImpactCount: number;
        requiresReviewCount: number;
    };
    impactedDocuments: ImpactedDocument[];
    recommendations: string[];
    warnings: string[];
    error?: string;
}
/**
 * Analyze impact of proposed version changes before committing
 */
export declare function analyzeVersionImpact(input: AnalyzeVersionImpactInput): Promise<AnalyzeVersionImpactOutput>;
export interface GetVersionHistoryInput {
    projectPath: string;
    documentType: DocumentType;
    documentPath: string;
    limit?: number;
}
export interface GetVersionHistoryOutput {
    success: boolean;
    documentPath: string;
    currentVersion: number;
    totalVersions: number;
    history: VersionHistoryEntry[];
    error?: string;
}
/**
 * Get version history for a document
 */
export declare function getVersionHistory(input: GetVersionHistoryInput): Promise<GetVersionHistoryOutput>;
export interface RollbackVersionInput {
    projectPath: string;
    documentType: DocumentType;
    documentPath: string;
    targetVersion: number;
    cascadeRollback?: boolean;
    createBackup?: boolean;
    reason: string;
}
export interface RollbackVersionOutput {
    success: boolean;
    previousVersion: number;
    restoredVersion: number;
    backupPath?: string;
    cascadedRollbacks: Array<{
        documentPath: string;
        previousVersion: number;
        restoredVersion: number;
    }>;
    warnings: string[];
    error?: string;
}
/**
 * Rollback document to a previous version
 */
export declare function rollbackVersion(input: RollbackVersionInput): Promise<RollbackVersionOutput>;
export interface UpdateComponentVersionInput {
    projectPath: string;
    componentId: string;
    updates: Record<string, any>;
    versionChangeType?: 'major' | 'minor' | 'patch';
    cascadeToGoals?: boolean;
    dryRun?: boolean;
}
export interface UpdateComponentVersionOutput {
    success: boolean;
    componentPath: string;
    previousVersion: number;
    newVersion: number;
    changes: Array<{
        field: string;
        previousValue: any;
        newValue: any;
    }>;
    cascadedUpdates: Array<{
        documentPath: string;
        updateDescription: string;
        executed: boolean;
    }>;
    warnings: string[];
    error?: string;
}
/**
 * Update component with version tracking and cascade
 */
export declare function updateComponentVersion(input: UpdateComponentVersionInput): Promise<UpdateComponentVersionOutput>;
export declare const analyzeVersionImpactTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        documentType: z.ZodEnum<{
            component: "component";
            roadmap: "roadmap";
            "major-goal": "major-goal";
            "sub-goal": "sub-goal";
            "project-overview": "project-overview";
        }>;
        documentPath: z.ZodString;
        proposedChanges: z.ZodRecord<z.ZodString, z.ZodAny>;
        changeType: z.ZodEnum<{
            minor: "minor";
            major: "major";
            patch: "patch";
        }>;
    }, z.core.$strip>;
};
export declare const getVersionHistoryTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        documentType: z.ZodEnum<{
            component: "component";
            roadmap: "roadmap";
            "major-goal": "major-goal";
            "sub-goal": "sub-goal";
            "project-overview": "project-overview";
        }>;
        documentPath: z.ZodString;
        limit: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
};
export declare const rollbackVersionTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        documentType: z.ZodEnum<{
            component: "component";
            roadmap: "roadmap";
            "major-goal": "major-goal";
            "sub-goal": "sub-goal";
            "project-overview": "project-overview";
        }>;
        documentPath: z.ZodString;
        targetVersion: z.ZodNumber;
        cascadeRollback: z.ZodOptional<z.ZodBoolean>;
        createBackup: z.ZodOptional<z.ZodBoolean>;
        reason: z.ZodString;
    }, z.core.$strip>;
};
export declare const updateComponentVersionTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        componentId: z.ZodString;
        updates: z.ZodRecord<z.ZodString, z.ZodAny>;
        versionChangeType: z.ZodOptional<z.ZodEnum<{
            minor: "minor";
            major: "major";
            patch: "patch";
        }>>;
        cascadeToGoals: z.ZodOptional<z.ZodBoolean>;
        dryRun: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
};
//# sourceMappingURL=version-control-tools.d.ts.map