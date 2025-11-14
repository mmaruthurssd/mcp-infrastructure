/**
 * Phase 5: System Component Detection - Type Definitions
 */
export type ComponentType = 'infrastructure' | 'automation' | 'integration' | 'protection' | 'monitoring';
export interface ComponentPattern {
    type: ComponentType;
    patterns: string[];
    indicators: string[];
    minimumAge?: number;
}
export interface DetectedComponent {
    name: string;
    type: ComponentType;
    location: string;
    createdDate: Date;
    ageInDays: number;
    isPermanent: boolean;
    isDocumented: boolean;
    documentationStatus: {
        inSystemComponents: boolean;
        inWorkspaceArchitecture: boolean;
        inStartHere: boolean;
    };
    confidence: number;
    indicators: string[];
}
export interface DetectionResult {
    components: DetectedComponent[];
    summary: {
        total: number;
        documented: number;
        undocumented: number;
        byType: Record<ComponentType, number>;
    };
}
export interface DocumentationViolation {
    file: string;
    severity: 'error' | 'warning';
    message: string;
    expectedPattern: string;
    autoFixable: boolean;
}
export interface ValidationResult {
    component: string;
    isFullyDocumented: boolean;
    violations: DocumentationViolation[];
    warnings: string[];
    suggestions: string[];
}
export interface DocumentationSuggestion {
    component: DetectedComponent;
    suggestedEntries: {
        systemComponents: string;
        workspaceArchitecture?: string;
        startHere?: string;
    };
    metadata: {
        estimatedPurpose: string;
        suggestedStatus: string;
        dependencies: string[];
        quickStartCommand?: string;
    };
    confidence: number;
}
export interface DocumentationRequirement {
    file: string;
    required: boolean;
    conditions?: {
        componentType?: ComponentType[];
        isPermanent?: boolean;
        isCritical?: boolean;
    };
    validationMethod: 'keyword-match' | 'section-exists' | 'yaml-frontmatter';
    searchPatterns: string[];
}
