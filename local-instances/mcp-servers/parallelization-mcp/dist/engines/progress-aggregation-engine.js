/**
 * Progress Aggregation Engine
 *
 * Aggregates progress from multiple parallel agents with bottleneck detection
 */
export class ProgressAggregationEngine {
    /**
     * Aggregate progress from agents
     */
    static aggregate(input) {
        const { agentProgresses, aggregationStrategy } = input;
        let overallProgress = 0;
        let criticalPath;
        switch (aggregationStrategy) {
            case 'simple-average':
                overallProgress = this.simpleAverage(agentProgresses);
                break;
            case 'weighted':
                overallProgress = this.weightedAverage(agentProgresses);
                break;
            case 'critical-path':
                const cpResult = this.criticalPathProgress(agentProgresses);
                overallProgress = cpResult.progress;
                criticalPath = cpResult.path;
                break;
        }
        // Detect bottlenecks
        const bottlenecks = this.detectBottlenecks(agentProgresses);
        // Estimate completion time
        const estimatedCompletion = this.estimateCompletion(agentProgresses, overallProgress);
        return {
            overallProgress,
            method: aggregationStrategy,
            agentStatuses: new Map(agentProgresses.map((p) => [p.agentId, p])),
            bottlenecks,
            estimatedCompletion,
            criticalPath,
        };
    }
    /**
     * Simple average aggregation
     */
    static simpleAverage(progresses) {
        if (progresses.length === 0)
            return 0;
        const total = progresses.reduce((sum, p) => sum + p.percentComplete, 0);
        return total / progresses.length;
    }
    /**
     * Weighted average aggregation
     */
    static weightedAverage(progresses) {
        if (progresses.length === 0)
            return 0;
        const totalWeight = progresses.reduce((sum, p) => sum + (p.taskWeight || 1), 0);
        if (totalWeight === 0)
            return 0;
        const weightedSum = progresses.reduce((sum, p) => sum + p.percentComplete * (p.taskWeight || 1), 0);
        return weightedSum / totalWeight;
    }
    /**
     * Critical path aggregation
     */
    static criticalPathProgress(progresses) {
        if (progresses.length === 0) {
            return { progress: 0, path: [] };
        }
        // Find agents on critical path (those with longest estimated time remaining)
        const sortedByTimeRemaining = [...progresses].sort((a, b) => (b.estimatedTimeRemaining || 0) - (a.estimatedTimeRemaining || 0));
        // Critical path = agents that will finish last
        const criticalAgents = sortedByTimeRemaining.slice(0, Math.ceil(progresses.length * 0.3)); // Top 30%
        const criticalPath = criticalAgents.map((a) => a.currentTask);
        // Progress = average of critical path agents
        const criticalProgress = criticalAgents.reduce((sum, a) => sum + a.percentComplete, 0) /
            criticalAgents.length;
        return { progress: criticalProgress, path: criticalPath };
    }
    /**
     * Detect bottlenecks (agents blocking others or running slow)
     */
    static detectBottlenecks(progresses) {
        const bottlenecks = [];
        if (progresses.length === 0)
            return bottlenecks;
        // Calculate average progress
        const avgProgress = progresses.reduce((sum, p) => sum + p.percentComplete, 0) /
            progresses.length;
        // Bottleneck 1: Agents significantly behind average
        for (const progress of progresses) {
            if (progress.percentComplete < avgProgress * 0.5 && avgProgress > 20) {
                bottlenecks.push({
                    agentId: progress.agentId,
                    taskId: progress.currentTask,
                    reason: `Agent is ${Math.round(avgProgress - progress.percentComplete)}% behind average`,
                    impact: this.assessBottleneckImpact(progress.percentComplete, avgProgress),
                    suggestion: `Consider reassigning tasks from faster agents to ${progress.agentId}`,
                });
            }
        }
        // Bottleneck 2: Blocked agents
        const blockedAgents = progresses.filter((p) => p.status === 'blocked');
        for (const blocked of blockedAgents) {
            bottlenecks.push({
                agentId: blocked.agentId,
                taskId: blocked.currentTask,
                reason: 'Agent is blocked waiting for dependency',
                impact: 'high',
                suggestion: 'Prioritize unblocking this agent or reassign task',
            });
        }
        // Bottleneck 3: Agents taking much longer than estimated
        const avgTimeRemaining = progresses
            .filter((p) => p.estimatedTimeRemaining)
            .reduce((sum, p) => sum + (p.estimatedTimeRemaining || 0), 0) /
            progresses.filter((p) => p.estimatedTimeRemaining).length;
        if (!isNaN(avgTimeRemaining)) {
            for (const progress of progresses) {
                if (progress.estimatedTimeRemaining &&
                    progress.estimatedTimeRemaining > avgTimeRemaining * 2) {
                    bottlenecks.push({
                        agentId: progress.agentId,
                        taskId: progress.currentTask,
                        reason: `Taking ${Math.round(progress.estimatedTimeRemaining / avgTimeRemaining)}x longer than average`,
                        impact: 'medium',
                        suggestion: 'Task may be more complex than estimated - consider splitting',
                    });
                }
            }
        }
        // Bottleneck 4: Idle agents while others are working
        const workingCount = progresses.filter((p) => p.status === 'working').length;
        const idleCount = progresses.filter((p) => p.status === 'idle').length;
        if (idleCount > 0 && workingCount > 0) {
            // Don't report idle at start/end
            const avgProgressAll = progresses.reduce((sum, p) => sum + p.percentComplete, 0) /
                progresses.length;
            if (avgProgressAll > 10 && avgProgressAll < 90) {
                const idleAgents = progresses.filter((p) => p.status === 'idle');
                for (const idle of idleAgents) {
                    bottlenecks.push({
                        agentId: idle.agentId,
                        taskId: idle.currentTask || 'none',
                        reason: 'Agent is idle while others are working',
                        impact: 'low',
                        suggestion: 'Rebalance workload to utilize idle agent',
                    });
                }
            }
        }
        return bottlenecks;
    }
    /**
     * Assess bottleneck impact
     */
    static assessBottleneckImpact(agentProgress, avgProgress) {
        const gap = avgProgress - agentProgress;
        if (gap > 50)
            return 'high';
        if (gap > 30)
            return 'medium';
        return 'low';
    }
    /**
     * Estimate completion time
     */
    static estimateCompletion(progresses, overallProgress) {
        if (progresses.length === 0 || overallProgress >= 100) {
            return new Date();
        }
        // Calculate average time remaining from agents that provide it
        const withTimeEstimates = progresses.filter((p) => p.estimatedTimeRemaining && p.estimatedTimeRemaining > 0);
        let estimatedMinutes;
        if (withTimeEstimates.length > 0) {
            // Use the maximum estimated time remaining (critical path)
            estimatedMinutes = Math.max(...withTimeEstimates.map((p) => p.estimatedTimeRemaining || 0));
        }
        else {
            // Fallback: extrapolate from current progress
            // If 50% complete, assume 50% more time
            const remainingPercent = 100 - overallProgress;
            const avgMinutesPerPercent = 1; // Assume 1 minute per percent (rough estimate)
            estimatedMinutes = remainingPercent * avgMinutesPerPercent;
        }
        return new Date(Date.now() + estimatedMinutes * 60000);
    }
    /**
     * Format progress report (for debugging/logging)
     */
    static formatProgressReport(output) {
        const lines = [];
        lines.push(`Overall Progress: ${output.overallProgress.toFixed(1)}%`);
        lines.push(`Method: ${output.method}`);
        lines.push(`Estimated Completion: ${output.estimatedCompletion.toLocaleTimeString()}`);
        if (output.criticalPath && output.criticalPath.length > 0) {
            lines.push(`Critical Path: ${output.criticalPath.slice(0, 3).join(' → ')}${output.criticalPath.length > 3 ? '...' : ''}`);
        }
        if (output.bottlenecks.length > 0) {
            lines.push(`\nBottlenecks (${output.bottlenecks.length}):`);
            for (const bottleneck of output.bottlenecks) {
                lines.push(`  - ${bottleneck.agentId}: ${bottleneck.reason} (${bottleneck.impact} impact)`);
            }
        }
        lines.push(`\nAgent Status:`);
        for (const [agentId, progress] of output.agentStatuses) {
            lines.push(`  - ${agentId}: ${progress.percentComplete.toFixed(0)}% (${progress.status})`);
        }
        return lines.join('\n');
    }
}
//# sourceMappingURL=progress-aggregation-engine.js.map