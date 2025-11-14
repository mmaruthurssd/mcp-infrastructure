/**
 * Phase 5: Documentation Suggester
 * Auto-generates documentation entries for undocumented components
 */
import type { DocumentationSuggestion } from './types.js';
export declare class DocumentationSuggester {
    private projectRoot;
    constructor(projectRoot: string);
    suggestDocumentation(componentPath: string, analyzeContent?: boolean): Promise<DocumentationSuggestion>;
    private analyzeComponent;
    private generateBasicMetadata;
    private detectComponentDetails;
    private inferComponentType;
    private generateComponentName;
    private generateDocumentationEntries;
    private generateSystemComponentsEntry;
    private generateWorkspaceArchitectureEntry;
    private generateStartHereEntry;
    private shouldIncludeInStartHere;
    private extractPurposeFromReadme;
    private extractPurposeFromContent;
    private inferPurposeFromPath;
    private extractDependencies;
    private extractDependenciesFromContent;
    private extractQuickStart;
    private extractWorkflowCommand;
    private calculateSuggestionConfidence;
}
