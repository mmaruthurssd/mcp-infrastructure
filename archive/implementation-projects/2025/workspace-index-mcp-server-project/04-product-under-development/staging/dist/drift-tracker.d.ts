export interface WorkspaceSnapshot {
    timestamp: string;
    mcpCount: {
        active: number;
        library: number;
        total: number;
        names: string[];
    };
    templateCount: {
        total: number;
        names: string[];
    };
    projectCount: {
        development: number;
        names: string[];
    };
}
export interface DriftChange {
    category: 'mcps' | 'templates' | 'projects' | 'documentation';
    type: 'added' | 'removed' | 'modified' | 'renamed';
    path: string;
    details: string;
}
export interface DriftResult {
    driftDetected: boolean;
    since: string;
    changes: DriftChange[];
    affectedDocumentation: string[];
    recommendedAction: string;
}
export declare class DriftTracker {
    private projectRoot;
    private stateFilePath;
    constructor(projectRoot: string);
    /**
     * Save current workspace state as baseline
     */
    saveBaseline(): Promise<WorkspaceSnapshot>;
    /**
     * Load last saved baseline
     */
    loadBaseline(): Promise<WorkspaceSnapshot | null>;
    /**
     * Capture current workspace state
     */
    private captureSnapshot;
    /**
     * Track documentation drift since last baseline
     */
    trackDrift(options?: {
        since?: string | 'last-validation';
        categories?: Array<'mcps' | 'templates' | 'projects' | 'all'>;
        includeMinorChanges?: boolean;
    }): Promise<DriftResult>;
}
