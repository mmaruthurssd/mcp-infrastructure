/**
 * Roadmap Builder
 *
 * Generate initial project roadmaps with phases and milestones from goals.
 */
// ============================================================================
// Roadmap Builder Class
// ============================================================================
export class RoadmapBuilder {
    /**
     * Build complete roadmap from goals
     */
    static buildRoadmap(goals, timeframe) {
        // Sort goals by tier and dependencies
        const sortedGoals = this.sortGoalsByDependency(goals);
        // Group goals into phases
        const phases = this.groupGoalsByPhase(sortedGoals);
        // Create milestones within each phase
        for (const phase of phases) {
            phase.milestones = this.createMilestones(phase, sortedGoals);
        }
        // Calculate timeline
        const timeline = this.generateTimeline(phases, timeframe);
        return {
            version: '1.0',
            duration: timeline.duration,
            startDate: timeline.startDate,
            endDate: timeline.endDate,
            status: 'Initial Plan',
            phaseCount: phases.length,
            milestoneCount: phases.reduce((sum, p) => sum + p.milestones.length, 0),
            phases,
        };
    }
    /**
     * Sort goals respecting dependencies
     */
    static sortGoalsByDependency(goals) {
        const sorted = [];
        const remaining = [...goals];
        const tierOrder = { 'Now': 1, 'Next': 2, 'Later': 3, 'Someday': 4 };
        // Keep processing until all goals are sorted
        while (remaining.length > 0) {
            let addedThisRound = false;
            for (let i = remaining.length - 1; i >= 0; i--) {
                const goal = remaining[i];
                // Check if all dependencies are already sorted
                const dependenciesMet = !goal.dependencies || goal.dependencies.every(depId => sorted.some(g => g.id === depId));
                if (dependenciesMet) {
                    sorted.push(goal);
                    remaining.splice(i, 1);
                    addedThisRound = true;
                }
            }
            // If nothing was added this round and items remain, break cycle by tier
            if (!addedThisRound && remaining.length > 0) {
                // Sort remaining by tier and add the first one
                remaining.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);
                sorted.push(remaining.shift());
            }
        }
        return sorted;
    }
    /**
     * Group goals into logical phases
     */
    static groupGoalsByPhase(goals) {
        const phases = [];
        const tierPhaseMap = {
            'Now': ['Foundation', 'Core Features'],
            'Next': ['Core Features', 'Enhancement'],
            'Later': ['Enhancement', 'Advanced Features'],
            'Someday': ['Future Considerations'],
        };
        // Group by tier
        const byTier = {
            'Now': [],
            'Next': [],
            'Later': [],
            'Someday': [],
        };
        for (const goal of goals) {
            byTier[goal.tier].push(goal);
        }
        let phaseNumber = 1;
        // Create phases for Now tier (usually Phase 1)
        if (byTier['Now'].length > 0) {
            phases.push({
                number: phaseNumber++,
                name: 'Foundation',
                goal: 'Establish core infrastructure and essential features',
                duration: this.calculatePhaseDuration(byTier['Now']),
                goals: byTier['Now'].map(g => g.id),
                milestones: [],
            });
        }
        // Create phases for Next tier (usually Phase 2)
        if (byTier['Next'].length > 0) {
            // Split Next tier into multiple phases if many goals
            if (byTier['Next'].length > 5) {
                const mid = Math.ceil(byTier['Next'].length / 2);
                phases.push({
                    number: phaseNumber++,
                    name: 'Core Features',
                    goal: 'Implement primary user-facing features',
                    duration: this.calculatePhaseDuration(byTier['Next'].slice(0, mid)),
                    goals: byTier['Next'].slice(0, mid).map(g => g.id),
                    milestones: [],
                });
                phases.push({
                    number: phaseNumber++,
                    name: 'Enhancement',
                    goal: 'Add supporting features and improvements',
                    duration: this.calculatePhaseDuration(byTier['Next'].slice(mid)),
                    goals: byTier['Next'].slice(mid).map(g => g.id),
                    milestones: [],
                });
            }
            else {
                phases.push({
                    number: phaseNumber++,
                    name: 'Core Features',
                    goal: 'Implement primary user-facing features',
                    duration: this.calculatePhaseDuration(byTier['Next']),
                    goals: byTier['Next'].map(g => g.id),
                    milestones: [],
                });
            }
        }
        // Create phases for Later tier (usually Phase 3-4)
        if (byTier['Later'].length > 0) {
            phases.push({
                number: phaseNumber++,
                name: 'Advanced Features',
                goal: 'Deliver advanced capabilities and optimizations',
                duration: this.calculatePhaseDuration(byTier['Later']),
                goals: byTier['Later'].map(g => g.id),
                milestones: [],
            });
        }
        // Don't create a phase for Someday - just note them
        if (byTier['Someday'].length > 0) {
            phases.push({
                number: phaseNumber++,
                name: 'Future Considerations',
                goal: 'Ideas for future development beyond initial release',
                duration: 'TBD',
                goals: byTier['Someday'].map(g => g.id),
                milestones: [],
            });
        }
        return phases;
    }
    /**
     * Create milestones within a phase
     */
    static createMilestones(phase, allGoals) {
        const milestones = [];
        const phaseGoals = allGoals.filter(g => phase.goals.includes(g.id));
        // Skip milestones for Future Considerations
        if (phase.name === 'Future Considerations') {
            return [];
        }
        // Group goals into milestones (2-4 goals per milestone typically)
        const goalsPerMilestone = Math.ceil(phaseGoals.length / Math.min(phaseGoals.length, 3));
        let milestoneCount = 1;
        for (let i = 0; i < phaseGoals.length; i += goalsPerMilestone) {
            const milestoneGoals = phaseGoals.slice(i, i + goalsPerMilestone);
            const milestoneId = `M${phase.number}.${milestoneCount}`;
            milestones.push({
                id: milestoneId,
                name: this.generateMilestoneName(milestoneGoals, phase.name),
                deadline: `Phase ${phase.number}, Milestone ${milestoneCount}`,
                deliverables: milestoneGoals.map(g => g.name),
                goals: milestoneGoals.map(g => g.id),
                dependencies: this.getMilestoneDependencies(milestoneGoals, milestones),
            });
            milestoneCount++;
        }
        return milestones;
    }
    /**
     * Generate milestone name from goals
     */
    static generateMilestoneName(goals, phaseName) {
        if (goals.length === 1) {
            return goals[0].name;
        }
        // Try to find common theme
        const names = goals.map(g => g.name.toLowerCase());
        const commonWords = ['authentication', 'database', 'api', 'ui', 'testing', 'deployment'];
        for (const word of commonWords) {
            if (names.some(n => n.includes(word))) {
                return `${word.charAt(0).toUpperCase() + word.slice(1)} & Infrastructure`;
            }
        }
        // Fallback to phase-based naming
        return `${phaseName} Deliverables`;
    }
    /**
     * Get milestone dependencies
     */
    static getMilestoneDependencies(milestoneGoals, previousMilestones) {
        const deps = [];
        // Check if any goal depends on goals from previous milestones
        for (const goal of milestoneGoals) {
            if (goal.dependencies) {
                for (const depId of goal.dependencies) {
                    // Find which milestone contains this dependency
                    const dependencyMilestone = previousMilestones.find(m => m.goals.includes(depId));
                    if (dependencyMilestone && !deps.includes(dependencyMilestone.id)) {
                        deps.push(dependencyMilestone.id);
                    }
                }
            }
        }
        return deps;
    }
    /**
     * Calculate phase duration based on effort
     */
    static calculatePhaseDuration(goals) {
        const effortPoints = {
            'Very Low': 1,
            'Low': 2,
            'Medium': 3,
            'High': 5,
            'Very High': 8,
        };
        const totalEffort = goals.reduce((sum, g) => sum + effortPoints[g.effort], 0);
        // Apply 1.5x buffer for uncertainty
        const adjustedEffort = Math.ceil(totalEffort * 1.5);
        // Convert to weeks (assuming 1 point = 1 week)
        const weeks = adjustedEffort;
        if (weeks <= 4) {
            return `${weeks} weeks`;
        }
        else if (weeks <= 8) {
            return `${Math.ceil(weeks / 4)} months`;
        }
        else {
            const months = Math.ceil(weeks / 4);
            return `${months} months`;
        }
    }
    /**
     * Generate timeline with dates
     */
    static generateTimeline(phases, timeframe) {
        const now = new Date();
        const startDate = this.formatDate(now);
        // Calculate total duration
        let totalWeeks = 0;
        for (const phase of phases) {
            if (phase.duration === 'TBD')
                continue;
            const weeks = this.parseDuration(phase.duration);
            totalWeeks += weeks;
        }
        // If timeframe provided, use it; otherwise calculate from effort
        let duration;
        let endDate;
        if (timeframe) {
            duration = timeframe;
            const weeks = this.parseDuration(timeframe);
            const end = new Date(now);
            end.setDate(end.getDate() + weeks * 7);
            endDate = this.formatDate(end);
        }
        else {
            if (totalWeeks <= 4) {
                duration = `${totalWeeks} weeks`;
            }
            else {
                const months = Math.ceil(totalWeeks / 4);
                duration = `${months} months`;
            }
            const end = new Date(now);
            end.setDate(end.getDate() + totalWeeks * 7);
            endDate = this.formatDate(end);
        }
        return { duration, startDate, endDate };
    }
    /**
     * Parse duration string to weeks
     */
    static parseDuration(duration) {
        const weekMatch = duration.match(/(\d+)\s*weeks?/i);
        if (weekMatch) {
            return parseInt(weekMatch[1]);
        }
        const monthMatch = duration.match(/(\d+)\s*months?/i);
        if (monthMatch) {
            return parseInt(monthMatch[1]) * 4;
        }
        const yearMatch = duration.match(/(\d+)\s*years?/i);
        if (yearMatch) {
            return parseInt(yearMatch[1]) * 52;
        }
        // Default to 12 weeks if can't parse
        return 12;
    }
    /**
     * Format date as MMM YYYY
     */
    static formatDate(date) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }
}
//# sourceMappingURL=roadmap-builder.js.map