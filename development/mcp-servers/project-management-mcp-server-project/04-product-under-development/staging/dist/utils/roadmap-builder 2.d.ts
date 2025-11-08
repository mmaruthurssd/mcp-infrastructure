/**
 * Roadmap Builder
 *
 * Generate initial project roadmaps with phases and milestones from goals.
 */
export interface GoalSummary {
    id: string;
    name: string;
    tier: 'Now' | 'Next' | 'Later' | 'Someday';
    effort: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
    dependencies?: string[];
}
export interface Milestone {
    id: string;
    name: string;
    deadline: string;
    deliverables: string[];
    goals: string[];
    dependencies: string[];
}
export interface Phase {
    number: number;
    name: string;
    goal: string;
    duration: string;
    goals: string[];
    milestones: Milestone[];
}
export interface RoadmapStructure {
    version: string;
    duration: string;
    startDate: string;
    endDate: string;
    status: string;
    phaseCount: number;
    milestoneCount: number;
    phases: Phase[];
}
export declare class RoadmapBuilder {
    /**
     * Build complete roadmap from goals
     */
    static buildRoadmap(goals: GoalSummary[], timeframe?: string): RoadmapStructure;
    /**
     * Sort goals respecting dependencies
     */
    private static sortGoalsByDependency;
    /**
     * Group goals into logical phases
     */
    private static groupGoalsByPhase;
    /**
     * Create milestones within a phase
     */
    private static createMilestones;
    /**
     * Generate milestone name from goals
     */
    private static generateMilestoneName;
    /**
     * Get milestone dependencies
     */
    private static getMilestoneDependencies;
    /**
     * Calculate phase duration based on effort
     */
    private static calculatePhaseDuration;
    /**
     * Generate timeline with dates
     */
    private static generateTimeline;
    /**
     * Parse duration string to weeks
     */
    private static parseDuration;
    /**
     * Format date as MMM YYYY
     */
    private static formatDate;
}
//# sourceMappingURL=roadmap-builder%202.d.ts.map