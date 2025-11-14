/**
 * Phase 5: System Component Detection
 */
import type { DetectionResult } from './types.js';
export declare class ComponentDetector {
    private projectRoot;
    private readonly minimumAge;
    constructor(projectRoot: string, minimumAge?: number);
    detectComponents(includeRecent?: boolean, minConfidence?: number): Promise<DetectionResult>;
    private detectByPattern;
    private analyzeComponent;
    private readFileContent;
    private findMatchedIndicators;
    private calculateConfidence;
    private checkDocumentationStatus;
    private generateComponentName;
    private getTypeSuffix;
    private calculateSummary;
}
