/**
 * Batch Optimizer
 *
 * Optimizes task distribution across parallel agents using critical path
 * method and load balancing algorithms
 */
import { DependencyGraphBuilder } from './dependency-graph-builder.js';
export class BatchOptimizer {
    /**
     * Optimize batch distribution
     */
    static optimize(input) {
        const { tasks, dependencyGraph, maxParallelAgents, optimizationGoal } = input;
        // Fix: Convert nodes from plain object to Map (JSON serialization converts Map to object)
        const normalizedGraph = this.normalizeGraph(dependencyGraph);
        // Get topological levels from graph
        const levels = DependencyGraphBuilder.getTopologicalLevels(normalizedGraph);
        let batches;
        switch (optimizationGoal) {
            case 'minimize-time':
                batches = this.optimizeForMinTime(levels, maxParallelAgents);
                break;
            case 'balance-load':
                batches = this.optimizeForBalance(levels, maxParallelAgents);
                break;
            case 'minimize-conflicts':
                batches = this.optimizeForConflicts(levels, maxParallelAgents);
                break;
            default:
                batches = this.optimizeForMinTime(levels, maxParallelAgents);
        }
        // Calculate metrics
        const estimatedTotalTime = batches.reduce((sum, batch) => sum + batch.estimatedMinutes, 0);
        const loadBalance = this.calculateLoadBalance(batches, maxParallelAgents);
        const reasoning = this.generateReasoning(batches, tasks.length, maxParallelAgents, optimizationGoal, loadBalance);
        return {
            batches,
            estimatedTotalTime,
            loadBalance,
            reasoning,
        };
    }
    /**
     * Normalize graph to ensure nodes is a Map (handles JSON deserialization)
     */
    static normalizeGraph(graph) {
        // If nodes is already a Map, return as-is
        if (graph.nodes instanceof Map) {
            return graph;
        }
        // Convert plain object to Map
        const nodesMap = new Map();
        const nodesObj = graph.nodes;
        for (const key in nodesObj) {
            if (nodesObj.hasOwnProperty(key)) {
                nodesMap.set(key, nodesObj[key]);
            }
        }
        return {
            nodes: nodesMap,
            edges: graph.edges,
        };
    }
    /**
     * Optimize for minimum total time (critical path method)
     */
    static optimizeForMinTime(levels, maxAgents) {
        const batches = [];
        for (let i = 0; i < levels.length; i++) {
            const levelTasks = levels[i];
            // If level has more tasks than agents, split into sub-batches
            if (levelTasks.length > maxAgents) {
                const subBatches = this.splitIntoSubBatches(levelTasks, maxAgents, i, 'time-based');
                batches.push(...subBatches);
            }
            else {
                batches.push({
                    id: `batch-${batches.length + 1}`,
                    tasks: levelTasks,
                    estimatedMinutes: Math.max(...levelTasks.map((t) => t.estimatedMinutes || 10)),
                    dependsOnBatches: i > 0 ? [`batch-${batches.length}`] : [],
                });
            }
        }
        return batches;
    }
    /**
     * Optimize for balanced load distribution
     */
    static optimizeForBalance(levels, maxAgents) {
        const batches = [];
        for (let i = 0; i < levels.length; i++) {
            const levelTasks = levels[i];
            if (levelTasks.length > maxAgents) {
                // Use greedy load balancing
                const subBatches = this.balancedSplit(levelTasks, maxAgents, i);
                batches.push(...subBatches);
            }
            else {
                batches.push({
                    id: `batch-${batches.length + 1}`,
                    tasks: levelTasks,
                    estimatedMinutes: Math.max(...levelTasks.map((t) => t.estimatedMinutes || 10)),
                    dependsOnBatches: i > 0 ? [`batch-${batches.length}`] : [],
                });
            }
        }
        return batches;
    }
    /**
     * Optimize to minimize conflicts (group similar tasks)
     */
    static optimizeForConflicts(levels, maxAgents) {
        const batches = [];
        for (let i = 0; i < levels.length; i++) {
            const levelTasks = levels[i];
            // Group tasks by similarity to reduce conflicts
            const grouped = this.groupSimilarTasks(levelTasks, maxAgents);
            for (const group of grouped) {
                batches.push({
                    id: `batch-${batches.length + 1}`,
                    tasks: group,
                    estimatedMinutes: Math.max(...group.map((t) => t.estimatedMinutes || 10)),
                    dependsOnBatches: i > 0 ? [`batch-${batches.length}`] : [],
                });
            }
        }
        return batches;
    }
    /**
     * Split tasks into sub-batches
     */
    static splitIntoSubBatches(tasks, maxAgents, levelIndex, strategy) {
        const batches = [];
        if (strategy === 'time-based') {
            // Sort tasks by duration (longest first)
            const sorted = [...tasks].sort((a, b) => (b.estimatedMinutes || 10) - (a.estimatedMinutes || 10));
            // Distribute using greedy algorithm
            const agentLoads = Array.from({ length: maxAgents }, () => []);
            const agentTimes = Array(maxAgents).fill(0);
            for (const task of sorted) {
                // Find agent with minimum load
                const minIndex = agentTimes.indexOf(Math.min(...agentTimes));
                agentLoads[minIndex].push(task);
                agentTimes[minIndex] += task.estimatedMinutes || 10;
            }
            // Create batches from agent loads
            for (const load of agentLoads) {
                if (load.length > 0) {
                    batches.push({
                        id: `batch-${levelIndex + 1}-${batches.length + 1}`,
                        tasks: load,
                        estimatedMinutes: load.reduce((sum, t) => sum + (t.estimatedMinutes || 10), 0),
                        dependsOnBatches: levelIndex > 0 ? [`batch-${levelIndex}`] : [],
                    });
                }
            }
        }
        else {
            // Simple count-based split
            const batchSize = Math.ceil(tasks.length / maxAgents);
            for (let i = 0; i < tasks.length; i += batchSize) {
                const batchTasks = tasks.slice(i, i + batchSize);
                batches.push({
                    id: `batch-${levelIndex + 1}-${batches.length + 1}`,
                    tasks: batchTasks,
                    estimatedMinutes: Math.max(...batchTasks.map((t) => t.estimatedMinutes || 10)),
                    dependsOnBatches: levelIndex > 0 ? [`batch-${levelIndex}`] : [],
                });
            }
        }
        return batches;
    }
    /**
     * Balanced split using bin packing
     */
    static balancedSplit(tasks, maxAgents, levelIndex) {
        // Sort tasks by duration (longest first) for better bin packing
        const sorted = [...tasks].sort((a, b) => (b.estimatedMinutes || 10) - (a.estimatedMinutes || 10));
        const bins = Array.from({ length: maxAgents }, () => []);
        const binTimes = Array(maxAgents).fill(0);
        // First-fit decreasing bin packing
        for (const task of sorted) {
            const minIndex = binTimes.indexOf(Math.min(...binTimes));
            bins[minIndex].push(task);
            binTimes[minIndex] += task.estimatedMinutes || 10;
        }
        // Create batches from bins
        const batches = [];
        for (let i = 0; i < bins.length; i++) {
            if (bins[i].length > 0) {
                batches.push({
                    id: `batch-${levelIndex + 1}-${i + 1}`,
                    tasks: bins[i],
                    estimatedMinutes: binTimes[i],
                    dependsOnBatches: levelIndex > 0 ? [`batch-${levelIndex}`] : [],
                });
            }
        }
        return batches;
    }
    /**
     * Group similar tasks to minimize conflicts
     */
    static groupSimilarTasks(tasks, maxGroups) {
        // Simple grouping by keyword similarity
        const groups = [];
        // Extract keywords from each task
        const taskKeywords = tasks.map((task) => ({
            task,
            keywords: this.extractKeywords(task.description),
        }));
        // Create groups
        while (taskKeywords.length > 0 && groups.length < maxGroups) {
            const current = taskKeywords.shift();
            const group = [current.task];
            // Find similar tasks
            for (let i = taskKeywords.length - 1; i >= 0; i--) {
                const other = taskKeywords[i];
                const similarity = this.calculateSimilarity(current.keywords, other.keywords);
                if (similarity > 0.3) {
                    // 30% similarity threshold
                    group.push(other.task);
                    taskKeywords.splice(i, 1);
                }
            }
            groups.push(group);
        }
        // Add remaining tasks to smallest group
        if (taskKeywords.length > 0 && groups.length > 0) {
            const smallestGroup = groups.reduce((min, g) => g.length < min.length ? g : min);
            smallestGroup.push(...taskKeywords.map((tk) => tk.task));
        }
        return groups;
    }
    /**
     * Extract keywords from description
     */
    static extractKeywords(description) {
        const words = description
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/);
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on']);
        return new Set(words.filter((w) => w.length > 3 && !stopWords.has(w)));
    }
    /**
     * Calculate keyword similarity (Jaccard index)
     */
    static calculateSimilarity(keywords1, keywords2) {
        const intersection = new Set([...keywords1].filter((k) => keywords2.has(k)));
        const union = new Set([...keywords1, ...keywords2]);
        return union.size > 0 ? intersection.size / union.size : 0;
    }
    /**
     * Calculate load balance metric (0-100, higher is better)
     */
    static calculateLoadBalance(batches, maxAgents) {
        if (batches.length === 0)
            return 0;
        const batchTimes = batches.map((b) => b.estimatedMinutes);
        const maxTime = Math.max(...batchTimes);
        const minTime = Math.min(...batchTimes);
        const avgTime = batchTimes.reduce((sum, t) => sum + t, 0) / batchTimes.length;
        // Calculate variance
        const variance = batchTimes.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) /
            batchTimes.length;
        const stdDev = Math.sqrt(variance);
        // Lower standard deviation = better balance
        // Perfect balance (stdDev = 0) = 100, high variance = 0
        const balanceScore = Math.max(0, 100 - (stdDev / avgTime) * 100);
        return balanceScore;
    }
    /**
     * Generate reasoning for optimization
     */
    static generateReasoning(batches, totalTasks, maxAgents, goal, loadBalance) {
        const parts = [];
        parts.push(`Distributed ${totalTasks} tasks into ${batches.length} batches for ${maxAgents} agents`);
        parts.push(`Optimization goal: ${goal.replace('-', ' ')}`);
        if (loadBalance >= 80) {
            parts.push(`Load balance: excellent (${loadBalance.toFixed(0)}/100)`);
        }
        else if (loadBalance >= 60) {
            parts.push(`Load balance: good (${loadBalance.toFixed(0)}/100)`);
        }
        else {
            parts.push(`Load balance: moderate (${loadBalance.toFixed(0)}/100)`);
        }
        const avgBatchSize = totalTasks / batches.length;
        parts.push(`Average batch size: ${avgBatchSize.toFixed(1)} tasks`);
        return parts.join('. ') + '.';
    }
}
//# sourceMappingURL=batch-optimizer.js.map