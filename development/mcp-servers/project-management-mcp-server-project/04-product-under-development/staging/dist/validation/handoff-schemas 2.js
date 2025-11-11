/**
 * Zod Validation Schemas for MCP Handoff Protocol v1.0
 *
 * Provides runtime validation for all handoff types to ensure
 * data integrity across MCP boundaries.
 *
 * Created: 2025-10-27
 */
import { z } from 'zod';
// ============================================================================
// SHARED SCHEMAS
// ============================================================================
const MCPIdentifierSchema = z.enum(['ai-planning', 'spec-driven', 'task-executor']);
const HandoffTypeSchema = z.enum([
    'goal-to-spec',
    'spec-to-tasks',
    'task-completion',
    'subgoal-completion',
    'progress-update'
]);
const PrioritySchema = z.enum(['high', 'medium', 'low']);
const GoalTierSchema = z.enum(['now', 'next', 'later', 'someday']);
const ImpactLevelSchema = z.enum(['high', 'medium', 'low']);
const EffortLevelSchema = z.enum(['high', 'medium', 'low']);
const GoalStatusSchema = z.enum([
    'planning',
    'not-started',
    'in-progress',
    'blocked',
    'on-hold',
    'completed',
    'cancelled'
]);
const ProgressStatusSchema = z.enum([
    'not-started',
    'planning',
    'in-progress',
    'blocked',
    'on-hold',
    'completed',
    'cancelled'
]);
/**
 * Handoff context schema
 */
const HandoffContextSchema = z.object({
    projectPath: z.string().min(1, 'Project path is required'),
    projectId: z.string().min(1, 'Project ID is required'),
    componentId: z.string().min(1, 'Component ID is required'),
    componentName: z.string().min(1, 'Component name is required'),
    majorGoalId: z.string().optional(),
    majorGoalName: z.string().optional(),
    subGoalId: z.string().optional(),
    workflowId: z.string().optional()
});
/**
 * Progress info schema
 */
const ProgressInfoSchema = z.object({
    percentage: z.number().min(0).max(100),
    status: ProgressStatusSchema,
    lastUpdated: z.string().datetime(),
    completedItems: z.number().min(0),
    totalItems: z.number().min(0),
    breakdown: z.record(z.string(), z.object({
        name: z.string(),
        progress: z.number().min(0).max(100),
        status: ProgressStatusSchema
    })).optional()
});
/**
 * Risk schema
 */
const RiskSchema = z.object({
    id: z.string(),
    description: z.string(),
    impact: z.enum(['very-high', 'high', 'medium', 'low']),
    probability: z.enum(['very-high', 'high', 'medium', 'low']),
    mitigation: z.string()
});
/**
 * Goal dependency schema
 */
const GoalDependencySchema = z.object({
    goalId: z.string(),
    goalName: z.string(),
    dependencyType: z.enum(['blocks', 'influences']),
    description: z.string()
});
// ============================================================================
// BASE HANDOFF SCHEMA
// ============================================================================
const BaseHandoffSchema = z.object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver format (e.g., 1.0.0)'),
    handoffId: z.string().uuid('Handoff ID must be a valid UUID'),
    timestamp: z.string().datetime('Timestamp must be ISO 8601 format'),
    sourceMCP: MCPIdentifierSchema,
    targetMCP: MCPIdentifierSchema,
    handoffType: HandoffTypeSchema,
    context: HandoffContextSchema,
    payload: z.any(), // Type-specific, validated separately
    retryAttempt: z.number().min(0).optional(),
    maxRetries: z.number().min(1).max(10).optional(),
    previousHandoffId: z.string().uuid().optional()
});
// ============================================================================
// GOAL-TO-SPEC PAYLOAD SCHEMA
// ============================================================================
const GoalToSpecPayloadSchema = z.object({
    majorGoal: z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        description: z.string().min(1),
        priority: PrioritySchema,
        tier: GoalTierSchema,
        impact: ImpactLevelSchema,
        effort: EffortLevelSchema
    }),
    details: z.object({
        problem: z.string().min(1),
        expectedValue: z.string().min(1),
        successCriteria: z.array(z.string()).min(1, 'At least one success criterion required'),
        acceptanceCriteria: z.array(z.string()).optional(),
        technicalConstraints: z.array(z.string()).optional()
    }),
    dependencies: z.array(GoalDependencySchema),
    risks: z.array(RiskSchema),
    componentContext: z.object({
        componentId: z.string(),
        componentName: z.string(),
        componentPurpose: z.string(),
        subAreaId: z.string().optional(),
        subAreaName: z.string().optional()
    }),
    timeframe: z.object({
        estimate: z.string().min(1),
        targetDate: z.string().datetime().optional()
    }),
    targetPaths: z.object({
        subGoalsFolder: z.string().min(1),
        specsFolder: z.string().optional()
    }),
    preferences: z.object({
        numberOfSubGoals: z.number().min(1).max(20).optional(),
        decompositionStrategy: z.enum(['sequential', 'parallel', 'mixed']).optional(),
        specificationDepth: z.enum(['light', 'medium', 'comprehensive']).optional()
    }).optional()
});
export const GoalToSpecHandoffSchema = BaseHandoffSchema.extend({
    handoffType: z.literal('goal-to-spec'),
    sourceMCP: z.literal('ai-planning'),
    targetMCP: z.literal('spec-driven'),
    payload: GoalToSpecPayloadSchema
});
// ============================================================================
// SPEC-TO-TASKS PAYLOAD SCHEMA
// ============================================================================
const SpecToTasksPayloadSchema = z.object({
    subGoal: z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        description: z.string().min(1),
        parentGoalId: z.string().min(1),
        parentGoalName: z.string().min(1)
    }),
    specification: z.object({
        acceptanceCriteria: z.array(z.string()).min(1),
        technicalRequirements: z.array(z.string()).optional(),
        constraints: z.array(z.string()).optional(),
        deliverables: z.array(z.string()).min(1)
    }),
    taskGuidance: z.object({
        estimatedTaskCount: z.number().min(1).max(50).optional(),
        complexity: z.enum(['simple', 'moderate', 'complex']),
        workflowType: z.enum(['bug-fix', 'feature', 'refactor', 'deployment', 'research']).optional()
    }),
    timeframe: z.object({
        estimate: z.string().min(1),
        urgency: z.enum(['low', 'medium', 'high', 'urgent']).optional()
    }),
    targetPaths: z.object({
        workflowFolder: z.string().min(1),
        relatedFiles: z.array(z.string()).optional()
    }),
    dependencies: z.object({
        blockedBy: z.array(z.string()).optional(),
        relatedWorkflows: z.array(z.string()).optional()
    })
});
export const SpecToTasksHandoffSchema = BaseHandoffSchema.extend({
    handoffType: z.literal('spec-to-tasks'),
    sourceMCP: z.literal('spec-driven'),
    targetMCP: z.literal('task-executor'),
    payload: SpecToTasksPayloadSchema
});
// ============================================================================
// TASK-COMPLETION PAYLOAD SCHEMA
// ============================================================================
const TaskCompletionPayloadSchema = z.object({
    workflow: z.object({
        workflowId: z.string().min(1),
        workflowName: z.string().min(1),
        subGoalId: z.string().min(1),
        majorGoalId: z.string().min(1)
    }),
    completion: z.object({
        completedTaskId: z.string().optional(),
        allTasksComplete: z.boolean(),
        completedAt: z.string().datetime(),
        completedBy: z.string().optional()
    }),
    progress: z.object({
        tasksCompleted: z.number().min(0),
        totalTasks: z.number().min(1),
        percentage: z.number().min(0).max(100),
        currentStatus: z.enum(['in-progress', 'completed', 'blocked'])
    }),
    verification: z.object({
        verified: z.boolean(),
        verificationMethod: z.string().optional(),
        verificationNotes: z.string().optional()
    }).optional(),
    deliverables: z.object({
        filesCreated: z.array(z.string()).optional(),
        filesModified: z.array(z.string()).optional(),
        testsAdded: z.number().min(0).optional(),
        documentation: z.array(z.string()).optional()
    }).optional(),
    issues: z.object({
        blockers: z.array(z.string()).optional(),
        warnings: z.array(z.string()).optional(),
        technicalDebt: z.array(z.string()).optional()
    }).optional()
});
export const TaskCompletionHandoffSchema = BaseHandoffSchema.extend({
    handoffType: z.literal('task-completion'),
    sourceMCP: z.literal('task-executor'),
    targetMCP: z.literal('spec-driven'),
    payload: TaskCompletionPayloadSchema
});
// ============================================================================
// SUBGOAL-COMPLETION PAYLOAD SCHEMA
// ============================================================================
const SubgoalCompletionPayloadSchema = z.object({
    subGoal: z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        majorGoalId: z.string().min(1),
        majorGoalName: z.string().min(1)
    }),
    completion: z.object({
        completedAt: z.string().datetime(),
        allCriteriaMetStatus: z.boolean(),
        totalWorkflows: z.number().min(1),
        completedWorkflows: z.number().min(0)
    }),
    majorGoalProgress: z.object({
        subGoalsCompleted: z.number().min(0),
        totalSubGoals: z.number().min(1),
        percentage: z.number().min(0).max(100),
        suggestedStatus: GoalStatusSchema
    }),
    outcomes: z.object({
        deliverables: z.array(z.string()),
        successCriteriaMet: z.array(z.string()),
        learnings: z.array(z.string()).optional()
    }),
    quality: z.object({
        testsAdded: z.number().min(0).optional(),
        testsPassing: z.number().min(0).optional(),
        codeReviewStatus: z.enum(['pending', 'approved', 'changes-requested']).optional(),
        documentationComplete: z.boolean().optional()
    }).optional()
});
export const SubgoalCompletionHandoffSchema = BaseHandoffSchema.extend({
    handoffType: z.literal('subgoal-completion'),
    sourceMCP: z.literal('spec-driven'),
    targetMCP: z.literal('ai-planning'),
    payload: SubgoalCompletionPayloadSchema
});
// ============================================================================
// PROGRESS-UPDATE PAYLOAD SCHEMA
// ============================================================================
const ProgressUpdatePayloadSchema = z.object({
    entity: z.object({
        type: z.enum(['task-workflow', 'sub-goal', 'major-goal', 'component', 'project']),
        id: z.string().min(1),
        name: z.string().min(1)
    }),
    progress: ProgressInfoSchema,
    trigger: z.object({
        event: z.enum(['task-completed', 'workflow-completed', 'status-changed', 'manual-update']),
        triggeredBy: z.string().optional(),
        relatedEntityId: z.string().optional()
    }),
    propagation: z.object({
        shouldBubbleUp: z.boolean(),
        parentEntityType: z.enum(['sub-goal', 'major-goal', 'component']).optional(),
        parentEntityId: z.string().optional()
    })
});
export const ProgressUpdateHandoffSchema = BaseHandoffSchema.extend({
    handoffType: z.literal('progress-update'),
    payload: ProgressUpdatePayloadSchema
});
// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================
export const HandoffResultSchema = z.object({
    created: z.array(z.object({
        entityType: z.string(),
        entityId: z.string(),
        filePath: z.string().optional()
    })).optional(),
    updated: z.array(z.object({
        entityType: z.string(),
        entityId: z.string(),
        changes: z.array(z.string())
    })).optional(),
    nextSteps: z.array(z.object({
        description: z.string(),
        suggestedAction: z.string().optional(),
        nextHandoffType: HandoffTypeSchema.optional()
    })).optional(),
    metadata: z.record(z.string(), z.unknown()).optional()
});
export const HandoffErrorSchema = z.object({
    code: z.string(),
    message: z.string(),
    details: z.string().optional(),
    recoverable: z.boolean(),
    suggestedFix: z.string().optional()
});
export const HandoffResponseSchema = z.object({
    handoffId: z.string().uuid(),
    receivedAt: z.string().datetime(),
    success: z.boolean(),
    status: z.enum(['accepted', 'processing', 'completed', 'failed', 'rejected']),
    result: HandoffResultSchema.optional(),
    error: HandoffErrorSchema.optional(),
    processedBy: MCPIdentifierSchema,
    processingTime: z.number().min(0).optional()
});
// ============================================================================
// VALIDATION RESULT SCHEMAS
// ============================================================================
export const ValidationErrorSchema = z.object({
    field: z.string(),
    message: z.string(),
    code: z.string()
});
export const ValidationWarningSchema = z.object({
    field: z.string(),
    message: z.string(),
    severity: z.enum(['low', 'medium', 'high'])
});
export const HandoffValidationResultSchema = z.object({
    valid: z.boolean(),
    errors: z.array(ValidationErrorSchema),
    warnings: z.array(ValidationWarningSchema)
});
// ============================================================================
// UNION SCHEMA FOR ALL HANDOFF TYPES
// ============================================================================
export const AnyHandoffSchema = z.discriminatedUnion('handoffType', [
    GoalToSpecHandoffSchema,
    SpecToTasksHandoffSchema,
    TaskCompletionHandoffSchema,
    SubgoalCompletionHandoffSchema,
    ProgressUpdateHandoffSchema
]);
//# sourceMappingURL=handoff-schemas.js.map