/**
 * Documentation Generation Tools (Goal 012)
 *
 * Automatically generates comprehensive documentation from the hierarchical
 * planning structure.
 *
 * Tools:
 * - generate_quick_start_guide: 10-minute getting started guide
 * - generate_user_guide: Complete feature reference
 * - generate_api_reference: Auto-generated API documentation
 * - generate_migration_guide: v0.8.0 to v1.0.0 migration
 * - export_project_summary: Executive summary for stakeholders
 */
import { z } from 'zod';
declare const GenerateQuickStartGuideSchema: z.ZodObject<{
    projectPath: z.ZodString;
    includeExamples: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    outputPath: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const GenerateUserGuideSchema: z.ZodObject<{
    projectPath: z.ZodString;
    sections: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        components: "components";
        overview: "overview";
        "project-setup": "project-setup";
        "mcp-integration": "mcp-integration";
        "progress-tracking": "progress-tracking";
        workflows: "workflows";
        goals: "goals";
        troubleshooting: "troubleshooting";
    }>>>;
    outputPath: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const GenerateAPIReferenceSchema: z.ZodObject<{
    projectPath: z.ZodString;
    format: z.ZodDefault<z.ZodEnum<{
        markdown: "markdown";
        json: "json";
        html: "html";
    }>>;
    includeExamples: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    outputPath: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const GenerateMigrationGuideSchema: z.ZodObject<{
    projectPath: z.ZodString;
    fromVersion: z.ZodDefault<z.ZodString>;
    toVersion: z.ZodDefault<z.ZodString>;
    outputPath: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const ExportProjectSummarySchema: z.ZodObject<{
    projectPath: z.ZodString;
    format: z.ZodDefault<z.ZodEnum<{
        markdown: "markdown";
        json: "json";
        html: "html";
        pdf: "pdf";
    }>>;
    audience: z.ZodDefault<z.ZodEnum<{
        stakeholder: "stakeholder";
        technical: "technical";
        executive: "executive";
    }>>;
    includeDiagrams: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    outputPath: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare function generateQuickStartGuide(params: z.infer<typeof GenerateQuickStartGuideSchema>): Promise<{
    success: boolean;
    outputPath: string;
    wordCount: number;
    estimatedReadingTime: string;
    performance: {
        generationTimeMs: number;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    outputPath?: undefined;
    wordCount?: undefined;
    estimatedReadingTime?: undefined;
    performance?: undefined;
}>;
export declare function generateUserGuide(params: z.infer<typeof GenerateUserGuideSchema>): Promise<{
    success: boolean;
    outputPath: string;
    sectionsGenerated: number;
    wordCount: number;
    estimatedReadingTime: string;
    performance: {
        generationTimeMs: number;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    outputPath?: undefined;
    sectionsGenerated?: undefined;
    wordCount?: undefined;
    estimatedReadingTime?: undefined;
    performance?: undefined;
}>;
export declare function generateAPIReference(params: z.infer<typeof GenerateAPIReferenceSchema>): Promise<{
    success: boolean;
    outputPath: string;
    format: "markdown" | "json" | "html";
    toolsDocumented: number;
    performance: {
        generationTimeMs: number;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    outputPath?: undefined;
    format?: undefined;
    toolsDocumented?: undefined;
    performance?: undefined;
}>;
export declare function generateMigrationGuide(params: z.infer<typeof GenerateMigrationGuideSchema>): Promise<{
    success: boolean;
    outputPath: string;
    fromVersion: string;
    toVersion: string;
    wordCount: number;
    performance: {
        generationTimeMs: number;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    outputPath?: undefined;
    fromVersion?: undefined;
    toVersion?: undefined;
    wordCount?: undefined;
    performance?: undefined;
}>;
export declare function exportProjectSummary(params: z.infer<typeof ExportProjectSummarySchema>): Promise<{
    success: boolean;
    outputPath: string;
    format: "markdown" | "json" | "html" | "pdf";
    audience: "stakeholder" | "technical" | "executive";
    summary: {
        componentsCount: number;
        goalsCount: number;
        overallProgress: number;
    };
    performance: {
        generationTimeMs: number;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    outputPath?: undefined;
    format?: undefined;
    audience?: undefined;
    summary?: undefined;
    performance?: undefined;
}>;
export {};
//# sourceMappingURL=documentation-tools%202.d.ts.map