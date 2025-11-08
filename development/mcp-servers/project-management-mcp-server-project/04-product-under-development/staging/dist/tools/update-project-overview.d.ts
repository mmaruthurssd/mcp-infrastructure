/**
 * Update Project Overview with Version Cascade
 *
 * MCP Tool: Updates PROJECT OVERVIEW.md and cascades changes to downstream documents
 *
 * Created: 2025-10-27
 * Goal: 004 - Build PROJECT OVERVIEW Generation Tool
 */
export interface UpdateProjectOverviewInput {
    projectPath: string;
    updates: Partial<ProjectOverviewUpdates>;
    versionChangeType?: 'major' | 'minor' | 'patch';
    cascadeToComponents?: boolean;
    dryRun?: boolean;
}
export interface ProjectOverviewUpdates {
    name?: string;
    description?: string;
    status?: 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';
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
    components?: string[];
    notes?: string;
}
export interface UpdateProjectOverviewOutput {
    success: boolean;
    newVersion: number;
    previousVersion: number;
    changes: VersionChange[];
    cascadedUpdates: CascadedUpdate[];
    warnings: string[];
    error?: string;
}
export interface VersionChange {
    field: string;
    previousValue: any;
    newValue: any;
    changeType: 'added' | 'removed' | 'modified';
}
export interface CascadedUpdate {
    documentType: 'component' | 'major-goal' | 'sub-goal';
    documentPath: string;
    changeDescription: string;
    executed: boolean;
}
/**
 * Update PROJECT OVERVIEW with version control and cascade
 */
export declare function updateProjectOverview(input: UpdateProjectOverviewInput): Promise<UpdateProjectOverviewOutput>;
//# sourceMappingURL=update-project-overview.d.ts.map