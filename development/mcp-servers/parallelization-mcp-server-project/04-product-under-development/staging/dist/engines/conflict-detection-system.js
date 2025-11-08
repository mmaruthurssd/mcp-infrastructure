/**
 * Conflict Detection System
 *
 * Detects conflicts from parallel agent execution
 * - File-level: Same file modified by multiple agents
 * - Semantic: Logically incompatible changes
 * - Dependency: Violated implicit dependencies
 */
import { ConflictType, } from '../types.js';
export class ConflictDetectionSystem {
    /**
     * Detect conflicts from agent results
     */
    static detect(input) {
        const conflicts = [];
        // Step 1: File-level conflict detection
        const fileConflicts = this.detectFileLevelConflicts(input.agentResults);
        conflicts.push(...fileConflicts);
        // Step 2: Semantic conflict detection (pattern-based)
        const semanticConflicts = this.detectSemanticConflicts(input.agentResults);
        conflicts.push(...semanticConflicts);
        // Step 3: Dependency violation detection
        if (input.dependencyGraph) {
            const depConflicts = this.detectDependencyViolations(input.agentResults, input.dependencyGraph);
            conflicts.push(...depConflicts);
        }
        // Step 4: Resource contention detection
        const resourceConflicts = this.detectResourceContention(input.agentResults);
        conflicts.push(...resourceConflicts);
        // Step 5: Determine resolution strategy
        const resolutionStrategy = this.determineResolutionStrategy(conflicts);
        return {
            hasConflicts: conflicts.length > 0,
            conflicts,
            resolutionStrategy,
            mergedResult: undefined, // Would be populated by merge logic
        };
    }
    /**
     * Detect file-level conflicts (easiest)
     */
    static detectFileLevelConflicts(results) {
        const conflicts = [];
        const fileMap = new Map();
        // Track which agents modified which files
        for (const result of results) {
            for (const file of result.filesModified) {
                if (!fileMap.has(file)) {
                    fileMap.set(file, []);
                }
                fileMap.get(file).push(result.agentId);
            }
        }
        // Find files modified by multiple agents
        for (const [file, agents] of fileMap.entries()) {
            if (agents.length > 1) {
                const severity = this.assessFileLevelSeverity(file, agents.length);
                conflicts.push({
                    type: ConflictType.FILE_LEVEL,
                    severity,
                    agents,
                    description: `File ${file} modified by ${agents.length} agents (${agents.join(', ')})`,
                    affectedResources: [file],
                    detectionMethod: 'file-tracking',
                    resolutionOptions: this.generateFileLevelResolutions(file, agents),
                });
            }
        }
        return conflicts;
    }
    /**
     * Detect semantic conflicts (pattern-based heuristics)
     */
    static detectSemanticConflicts(results) {
        const conflicts = [];
        // Pattern 1: Function signature changes vs function calls
        const signatureChanges = results.filter((r) => r.changes?.some((c) => c.content?.match(/function\s+\w+\s*\([^)]*\)/)));
        const functionCalls = results.filter((r) => r.changes?.some((c) => c.content?.match(/\w+\s*\([^)]*\)/)));
        if (signatureChanges.length > 0 && functionCalls.length > 0) {
            // Check if they're modifying the same function
            for (const sigChange of signatureChanges) {
                for (const call of functionCalls) {
                    if (sigChange.agentId !== call.agentId) {
                        conflicts.push({
                            type: ConflictType.SEMANTIC,
                            severity: 'high',
                            agents: [sigChange.agentId, call.agentId],
                            description: `${sigChange.agentId} modified function signature while ${call.agentId} called it`,
                            affectedResources: [],
                            detectionMethod: 'pattern-matching',
                            resolutionOptions: [
                                {
                                    strategy: 'sequential-retry',
                                    description: 'Re-execute calls after signature change',
                                    automatic: true,
                                    risk: 'medium',
                                },
                                {
                                    strategy: 'manual',
                                    description: 'Manually review and merge changes',
                                    automatic: false,
                                    risk: 'low',
                                },
                            ],
                        });
                    }
                }
            }
        }
        // Pattern 2: Type definition changes
        const typeChanges = results.filter((r) => r.changes?.some((c) => c.content?.match(/interface|type|class\s+\w+/)));
        if (typeChanges.length > 1) {
            const agents = typeChanges.map((r) => r.agentId);
            conflicts.push({
                type: ConflictType.SEMANTIC,
                severity: 'medium',
                agents,
                description: `Multiple agents modified type definitions: ${agents.join(', ')}`,
                affectedResources: [],
                detectionMethod: 'pattern-matching',
                resolutionOptions: [
                    {
                        strategy: 'merge',
                        description: 'Merge type definitions (requires validation)',
                        automatic: false,
                        risk: 'medium',
                    },
                ],
            });
        }
        return conflicts;
    }
    /**
     * Detect dependency violations
     */
    static detectDependencyViolations(results, graph) {
        const conflicts = [];
        // Check if tasks were executed in dependency order
        const completionOrder = results.map((r) => r.taskId);
        const edges = graph.edges || [];
        for (const edge of edges) {
            const fromIndex = completionOrder.indexOf(edge.from);
            const toIndex = completionOrder.indexOf(edge.to);
            // If 'to' task completed before 'from' task, it's a violation
            if (fromIndex > toIndex && fromIndex !== -1 && toIndex !== -1) {
                conflicts.push({
                    type: ConflictType.DEPENDENCY,
                    severity: 'high',
                    agents: [
                        results.find((r) => r.taskId === edge.from)?.agentId || 'unknown',
                        results.find((r) => r.taskId === edge.to)?.agentId || 'unknown',
                    ],
                    description: `Task ${edge.to} completed before its dependency ${edge.from}`,
                    affectedResources: [edge.from, edge.to],
                    detectionMethod: 'dependency-order-check',
                    resolutionOptions: [
                        {
                            strategy: 'rollback',
                            description: 'Rollback and re-execute in correct order',
                            automatic: true,
                            risk: 'low',
                        },
                    ],
                });
            }
        }
        return conflicts;
    }
    /**
     * Detect resource contention
     */
    static detectResourceContention(results) {
        const conflicts = [];
        // Check for database/API contention patterns
        const dbOperations = results.filter((r) => r.changes?.some((c) => c.content?.match(/database|db\.|sql|query/i)));
        if (dbOperations.length > 3) {
            // Many concurrent database operations
            conflicts.push({
                type: ConflictType.RESOURCE,
                severity: 'low',
                agents: dbOperations.map((r) => r.agentId),
                description: `${dbOperations.length} agents accessing database concurrently - potential contention`,
                affectedResources: ['database'],
                detectionMethod: 'resource-pattern-matching',
                resolutionOptions: [
                    {
                        strategy: 'sequential-retry',
                        description: 'Serialize database operations',
                        automatic: false,
                        risk: 'low',
                    },
                ],
            });
        }
        return conflicts;
    }
    /**
     * Assess file-level conflict severity
     */
    static assessFileLevelSeverity(file, agentCount) {
        // Critical files = high severity
        if (file.match(/package\.json|tsconfig\.json|config\./)) {
            return 'critical';
        }
        // Many agents = higher severity
        if (agentCount > 3)
            return 'high';
        if (agentCount > 2)
            return 'medium';
        return 'low';
    }
    /**
     * Generate file-level resolution options
     */
    static generateFileLevelResolutions(file, agents) {
        const options = [];
        // Option 1: Three-way merge
        options.push({
            strategy: 'merge',
            description: 'Attempt automatic three-way merge',
            automatic: agents.length === 2, // Only auto for 2 agents
            risk: agents.length > 2 ? 'high' : 'medium',
        });
        // Option 2: Prefer specific agent
        for (const agent of agents) {
            options.push({
                strategy: 'prefer-agent',
                description: `Keep changes from ${agent}, discard others`,
                automatic: false,
                risk: 'medium',
            });
        }
        // Option 3: Rollback
        options.push({
            strategy: 'rollback',
            description: 'Rollback all changes to this file',
            automatic: true,
            risk: 'low',
        });
        // Option 4: Sequential retry
        options.push({
            strategy: 'sequential-retry',
            description: 'Re-execute tasks sequentially',
            automatic: true,
            risk: 'low',
        });
        return options;
    }
    /**
     * Determine overall resolution strategy
     */
    static determineResolutionStrategy(conflicts) {
        if (conflicts.length === 0)
            return 'auto';
        // Critical conflicts = manual review
        if (conflicts.some((c) => c.severity === 'critical')) {
            return 'manual';
        }
        // Many conflicts = manual review
        if (conflicts.length > 5) {
            return 'manual';
        }
        // High severity conflicts = rollback
        if (conflicts.some((c) => c.severity === 'high')) {
            return 'rollback';
        }
        // Low/medium conflicts with automatic resolutions
        const hasAutoResolution = conflicts.every((c) => c.resolutionOptions.some((opt) => opt.automatic && opt.risk === 'low'));
        return hasAutoResolution ? 'auto' : 'manual';
    }
    /**
     * Attempt automatic conflict resolution
     */
    static resolveAutomatically(conflict) {
        // Find an automatic, low-risk resolution option
        const autoOption = conflict.resolutionOptions.find((opt) => opt.automatic && opt.risk === 'low');
        if (!autoOption)
            return null;
        switch (autoOption.strategy) {
            case 'rollback':
                return { action: 'rollback', targets: conflict.affectedResources };
            case 'sequential-retry':
                return {
                    action: 'sequential-retry',
                    agents: conflict.agents,
                    tasks: conflict.affectedResources,
                };
            case 'prefer-agent':
                return {
                    action: 'prefer-agent',
                    preferredAgent: conflict.agents[0],
                };
            default:
                return null;
        }
    }
}
//# sourceMappingURL=conflict-detection-system.js.map