/**
 * Identify Components Tool
 *
 * MCP Tool: Analyzes PROJECT OVERVIEW and suggests logical components
 *
 * Created: 2025-10-27
 * Goal: 005 - Build Component Management Tools
 */
export interface IdentifyComponentsInput {
    projectPath: string;
    maxComponents?: number;
    analysisDepth?: 'quick' | 'thorough';
}
export interface IdentifyComponentsOutput {
    success: boolean;
    components: ComponentSuggestion[];
    analysisMethod: string;
    confidence: number;
    warnings: string[];
    error?: string;
}
export interface ComponentSuggestion {
    name: string;
    purpose: string;
    suggestedSubAreas: string[];
    reasoning: string;
    confidence: number;
    priority: 'high' | 'medium' | 'low';
}
/**
 * Identify components from PROJECT OVERVIEW
 */
export declare function identifyComponents(input: IdentifyComponentsInput): Promise<IdentifyComponentsOutput>;
//# sourceMappingURL=identify-components%202.d.ts.map