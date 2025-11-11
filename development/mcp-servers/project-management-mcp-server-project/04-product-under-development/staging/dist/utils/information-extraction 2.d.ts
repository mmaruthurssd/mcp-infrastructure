/**
 * Information Extraction & Synthesis Utilities
 *
 * Extracts structured information from natural language user responses.
 * Uses pattern matching and AI-assisted extraction for PROJECT OVERVIEW generation.
 *
 * Created: 2025-10-27
 * Goal: 004 - Build PROJECT OVERVIEW Generation Tool
 */
/**
 * Extracted information from user responses
 */
export interface ExtractedInformation {
    projectName?: string;
    description?: string;
    problemStatement?: string;
    currentSituation?: string;
    desiredOutcome?: string;
    projectType?: ProjectType;
    vision?: {
        missionStatement?: string;
        successCriteria?: string[];
        scope?: {
            inScope?: string[];
            outOfScope?: string[];
        };
        risks?: Array<{
            description: string;
            severity: 'low' | 'medium' | 'high';
            mitigation?: string;
        }>;
    };
    constraints?: {
        timeline?: {
            estimatedDuration?: string;
            startDate?: string;
            endDate?: string;
            milestones?: Array<{
                name: string;
                targetDate: string;
                status: string;
            }>;
        };
        resources?: {
            team?: Array<{
                name: string;
                role: string;
                availability?: string;
            }>;
            tools?: string[];
            technologies?: string[];
        };
    };
    stakeholders?: Array<{
        name: string;
        role: string;
        interest: string;
        influence: string;
        communicationNeeds: string;
    }>;
    resources?: {
        existingAssets?: string[];
        neededAssets?: string[];
        externalDependencies?: string[];
    };
    components?: Array<{
        name: string;
        purpose: string;
        suggested?: boolean;
        subAreas?: string[];
    }>;
    conversationId?: string;
    confidence?: number;
}
export type ProjectType = 'software' | 'research' | 'product' | 'business' | 'infrastructure' | 'data' | 'other';
/**
 * Extract project name from text
 */
export declare function extractProjectName(text: string): string | undefined;
/**
 * Extract project type from description
 */
export declare function extractProjectType(text: string): ProjectType;
/**
 * Extract success criteria from text
 */
export declare function extractSuccessCriteria(text: string): string[];
/**
 * Extract scope (in/out) from text
 */
export declare function extractScope(text: string): {
    inScope: string[];
    outOfScope: string[];
};
/**
 * Extract timeline information
 */
export declare function extractTimeline(text: string): {
    estimatedDuration?: string;
    startDate?: string;
    endDate?: string;
    milestones?: Array<{
        name: string;
        targetDate: string;
        status: string;
    }>;
};
/**
 * Extract technologies and tools
 */
export declare function extractTechnologies(text: string): {
    tools: string[];
    technologies: string[];
};
/**
 * Extract risks
 */
export declare function extractRisks(text: string): Array<{
    description: string;
    severity: 'low' | 'medium' | 'high';
    mitigation?: string;
}>;
/**
 * Extract resources (existing/needed/dependencies)
 */
export declare function extractResources(text: string): {
    existingAssets: string[];
    neededAssets: string[];
    externalDependencies: string[];
};
/**
 * Suggest components based on project type and description
 */
export declare function suggestComponents(projectType: ProjectType, description: string): Array<{
    name: string;
    purpose: string;
    suggested: boolean;
    subAreas?: string[];
}>;
/**
 * Calculate confidence score for extracted information
 */
export declare function calculateConfidence(extracted: ExtractedInformation): number;
//# sourceMappingURL=information-extraction%202.d.ts.map