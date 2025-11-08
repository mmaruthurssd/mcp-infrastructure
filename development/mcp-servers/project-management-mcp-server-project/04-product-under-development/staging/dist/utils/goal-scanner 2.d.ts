/**
 * Goal Scanner Utility
 *
 * Scans goal directories and parses goal files to extract metadata.
 */
export interface GoalSummary {
    id?: string;
    name: string;
    tier: string;
    impactScore: string;
    effortScore: string;
    priority?: string;
    status?: string;
    owner?: string;
    targetDate?: string;
    progress?: number;
    lastUpdated: string;
    file: string;
    createdDate?: string;
}
export interface ScannedGoals {
    potentialGoals: GoalSummary[];
    selectedGoals: GoalSummary[];
    completedGoals: GoalSummary[];
    shelvedGoals: GoalSummary[];
}
/**
 * Scan all goal directories and return summaries
 */
export declare function scanAllGoals(projectPath: string): ScannedGoals;
/**
 * Scan potential-goals directory
 */
export declare function scanPotentialGoals(baseDir: string): GoalSummary[];
/**
 * Scan SELECTED-GOALS.md for selected goals
 */
export declare function scanSelectedGoals(baseDir: string): GoalSummary[];
/**
 * Scan archive directory (implemented or shelved)
 */
export declare function scanArchivedGoals(baseDir: string, type: 'implemented' | 'shelved'): GoalSummary[];
export interface FilterOptions {
    tier?: string;
    priority?: string;
    status?: string;
    owner?: string;
}
/**
 * Filter goals by criteria
 */
export declare function filterGoals(goals: GoalSummary[], filters: FilterOptions): GoalSummary[];
/**
 * Sort goals by specified criteria
 */
export declare function sortGoals(goals: GoalSummary[], sortBy: string): GoalSummary[];
export interface GoalStatistics {
    totalPotential: number;
    totalSelected: number;
    totalCompleted: number;
    totalShelved: number;
    byTier: {
        Now: number;
        Next: number;
        Later: number;
        Someday: number;
    };
    byPriority: {
        High: number;
        Medium: number;
        Low: number;
    };
    byStatus: {
        Planning: number;
        'Not Started': number;
        'In Progress': number;
        Blocked: number;
        'On Hold': number;
    };
}
/**
 * Calculate statistics from scanned goals
 */
export declare function calculateStatistics(scanned: ScannedGoals): GoalStatistics;
//# sourceMappingURL=goal-scanner%202.d.ts.map