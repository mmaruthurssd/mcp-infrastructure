/**
 * Pattern Management Tool
 * Supports add, update, delete, and list operations for patterns
 */
interface PatternApproach {
    id: string;
    approach: string;
    description: string;
    steps: string[];
    estimatedDuration: number;
    confidence: number;
}
interface Pattern {
    id: string;
    name: string;
    regex: string;
    type: 'broken' | 'missing' | 'improvement';
    severity: 'low' | 'medium' | 'high' | 'critical';
    baseConfidence: number;
    confidenceMultiplier?: number;
    suggestedApproaches: PatternApproach[];
    requiresApproval?: boolean;
    successRate: number | null;
    usageCount: number;
    lastUsed: string | null;
    createdAt: string;
    updatedAt: string;
}
interface ManagePatternsParams {
    action: 'add' | 'update' | 'delete' | 'list';
    pattern?: Partial<Pattern>;
    patternId?: string;
    filterType?: 'broken' | 'missing' | 'improvement';
    filterSeverity?: 'low' | 'medium' | 'high' | 'critical';
}
/**
 * Main tool handler
 */
export declare function managePatterns(params: ManagePatternsParams): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export {};
//# sourceMappingURL=manage-patterns.d.ts.map