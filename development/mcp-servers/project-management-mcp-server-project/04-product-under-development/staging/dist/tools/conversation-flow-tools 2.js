/**
 * Conversation Flow Orchestration Tools (Goal 010)
 *
 * Provides intelligent next-step suggestions, workflow phase advancement,
 * and natural conversation flow for the v1.0.0 hierarchical planning system.
 *
 * Tools:
 * - suggest_next_steps: Intelligent recommendations based on project state
 * - get_project_phase: Determine current workflow phase
 * - advance_workflow_phase: Move to next phase with validation
 * - get_conversation_context: Build context for natural conversation
 */
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
// ============================================================================
// SCHEMAS
// ============================================================================
const SuggestNextStepsSchema = z.object({
    projectPath: z.string().describe('Absolute path to project directory'),
    includeDetails: z.boolean().optional().default(true).describe('Include detailed reasoning for suggestions'),
    maxSuggestions: z.number().optional().default(5).describe('Maximum number of suggestions to return'),
});
const GetProjectPhaseSchema = z.object({
    projectPath: z.string().describe('Absolute path to project directory'),
});
const AdvanceWorkflowPhaseSchema = z.object({
    projectPath: z.string().describe('Absolute path to project directory'),
    targetPhase: z.enum(['planning', 'execution', 'monitoring', 'completion']).optional()
        .describe('Target phase to advance to (optional, auto-detect if not provided)'),
    force: z.boolean().optional().default(false).describe('Force advancement even if validation fails'),
});
const GetConversationContextSchema = z.object({
    projectPath: z.string().describe('Absolute path to project directory'),
    contextType: z.enum(['overview', 'detailed', 'specific-entity']).optional().default('overview')
        .describe('Type of context to build'),
    entityId: z.string().optional().describe('Specific entity ID if contextType is specific-entity'),
});
// ============================================================================
// TOOL 1: SUGGEST NEXT STEPS
// ============================================================================
export async function suggestNextSteps(params) {
    const startTime = Date.now();
    try {
        const { projectPath, includeDetails, maxSuggestions } = SuggestNextStepsSchema.parse(params);
        // Read project state
        const projectState = await analyzeProjectState(projectPath);
        // Generate intelligent suggestions based on state
        const suggestions = await generateSuggestions(projectState, maxSuggestions);
        // Add details if requested
        if (includeDetails) {
            for (const suggestion of suggestions) {
                suggestion.reasoning = await generateDetailedReasoning(projectState, suggestion);
            }
        }
        const duration = Date.now() - startTime;
        return {
            success: true,
            suggestions,
            projectPhase: projectState.phase,
            overallProgress: projectState.overallProgress,
            nextRecommendedAction: suggestions[0],
            performance: {
                analysisTimeMs: duration,
                suggestionsGenerated: suggestions.length,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
// ============================================================================
// TOOL 2: GET PROJECT PHASE
// ============================================================================
export async function getProjectPhase(params) {
    const startTime = Date.now();
    try {
        const { projectPath } = GetProjectPhaseSchema.parse(params);
        // Read project overview
        const overviewPath = path.join(projectPath, '01-planning', 'PROJECT-OVERVIEW.md');
        const overviewExists = await fileExists(overviewPath);
        if (!overviewExists) {
            return {
                success: false,
                error: 'PROJECT-OVERVIEW.md not found. Project may not be initialized.',
            };
        }
        // Analyze phase
        const phaseInfo = await determineProjectPhase(projectPath);
        const duration = Date.now() - startTime;
        return {
            success: true,
            phaseInfo,
            performance: {
                analysisTimeMs: duration,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
// ============================================================================
// TOOL 3: ADVANCE WORKFLOW PHASE
// ============================================================================
export async function advanceWorkflowPhase(params) {
    const startTime = Date.now();
    try {
        const { projectPath, targetPhase, force } = AdvanceWorkflowPhaseSchema.parse(params);
        // Get current phase
        const currentPhaseInfo = await determineProjectPhase(projectPath);
        // Determine target phase
        const target = targetPhase || getNextPhase(currentPhaseInfo.currentPhase);
        // Validate readiness
        if (!force && currentPhaseInfo.readinessForNext < 80) {
            return {
                success: false,
                error: `Not ready to advance to ${target}. Readiness: ${currentPhaseInfo.readinessForNext}%`,
                blockers: currentPhaseInfo.blockers,
                recommendations: currentPhaseInfo.recommendations,
            };
        }
        // Perform phase transition
        const transitionResult = await performPhaseTransition(projectPath, currentPhaseInfo.currentPhase, target);
        const duration = Date.now() - startTime;
        return {
            success: true,
            previousPhase: currentPhaseInfo.currentPhase,
            newPhase: target,
            transitionActions: transitionResult.actions,
            recommendations: transitionResult.recommendations,
            performance: {
                transitionTimeMs: duration,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
// ============================================================================
// TOOL 4: GET CONVERSATION CONTEXT
// ============================================================================
export async function getConversationContext(params) {
    const startTime = Date.now();
    try {
        const { projectPath, contextType, entityId } = GetConversationContextSchema.parse(params);
        let context;
        if (contextType === 'specific-entity' && entityId) {
            context = await buildSpecificEntityContext(projectPath, entityId);
        }
        else if (contextType === 'detailed') {
            context = await buildDetailedContext(projectPath);
        }
        else {
            context = await buildOverviewContext(projectPath);
        }
        const duration = Date.now() - startTime;
        return {
            success: true,
            context,
            performance: {
                buildTimeMs: duration,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
async function analyzeProjectState(projectPath) {
    const state = {
        phase: 'planning',
        overallProgress: 0,
        hasProjectOverview: false,
        componentCount: 0,
        componentsWithGoals: 0,
        totalGoals: 0,
        goalsInProgress: 0,
        goalsCompleted: 0,
        blockedGoals: 0,
        recentActivity: [],
        missingElements: [],
    };
    // Check PROJECT OVERVIEW
    const overviewPath = path.join(projectPath, '01-planning', 'PROJECT-OVERVIEW.md');
    state.hasProjectOverview = await fileExists(overviewPath);
    if (!state.hasProjectOverview) {
        state.missingElements.push('PROJECT-OVERVIEW.md');
        return state;
    }
    // Check components
    const componentsDir = path.join(projectPath, '02-goals-and-roadmap', 'components');
    if (await fileExists(componentsDir)) {
        const componentFolders = await fs.readdir(componentsDir);
        state.componentCount = componentFolders.filter(f => !f.startsWith('.')).length;
        // Count goals across components
        for (const componentFolder of componentFolders) {
            if (componentFolder.startsWith('.'))
                continue;
            const goalsDir = path.join(componentsDir, componentFolder, 'major-goals');
            if (await fileExists(goalsDir)) {
                const goalFiles = await fs.readdir(goalsDir);
                const mdFiles = goalFiles.filter(f => f.endsWith('.md') && !f.includes('COMPONENT'));
                if (mdFiles.length > 0) {
                    state.componentsWithGoals++;
                    state.totalGoals += mdFiles.length;
                    // Analyze goal statuses
                    for (const goalFile of mdFiles) {
                        const goalPath = path.join(goalsDir, goalFile);
                        const content = await fs.readFile(goalPath, 'utf-8');
                        if (content.includes('Status:** Complete') || content.includes('Status:** ✅')) {
                            state.goalsCompleted++;
                        }
                        else if (content.includes('Status:** In Progress') || content.includes('Status:** in-progress')) {
                            state.goalsInProgress++;
                        }
                        else if (content.includes('Status:** Blocked')) {
                            state.blockedGoals++;
                        }
                    }
                }
            }
        }
    }
    // Calculate progress
    if (state.totalGoals > 0) {
        state.overallProgress = Math.round((state.goalsCompleted / state.totalGoals) * 100);
    }
    // Determine phase
    if (state.goalsCompleted === state.totalGoals && state.totalGoals > 0) {
        state.phase = 'completion';
    }
    else if (state.goalsInProgress > 0) {
        state.phase = 'execution';
    }
    else if (state.totalGoals > 0) {
        state.phase = 'planning';
    }
    return state;
}
async function generateSuggestions(state, maxSuggestions) {
    const suggestions = [];
    // Suggestion logic based on project state
    if (!state.hasProjectOverview) {
        suggestions.push({
            action: 'Create PROJECT OVERVIEW',
            reasoning: 'Project lacks a PROJECT OVERVIEW.md, which is the foundation for hierarchical planning',
            priority: 'high',
            estimatedTime: '15-30 minutes',
            mcpTool: 'start_project_overview_conversation',
            prerequisites: [],
            impact: 'Establishes project vision, components, and structure',
        });
    }
    if (state.hasProjectOverview && state.componentCount === 0) {
        suggestions.push({
            action: 'Create components',
            reasoning: 'PROJECT OVERVIEW exists but no components have been created',
            priority: 'high',
            estimatedTime: '10-20 minutes',
            mcpTool: 'identify_components',
            prerequisites: ['PROJECT OVERVIEW complete'],
            impact: 'Organizes project into logical domain areas',
        });
    }
    if (state.componentCount > 0 && state.totalGoals === 0) {
        suggestions.push({
            action: 'Define major goals',
            reasoning: 'Components exist but no major goals have been defined',
            priority: 'high',
            estimatedTime: '30-60 minutes',
            mcpTool: 'create_major_goal',
            prerequisites: ['Components created'],
            impact: 'Establishes strategic objectives for each component',
        });
    }
    if (state.totalGoals > 0 && state.goalsInProgress === 0 && state.goalsCompleted < state.totalGoals) {
        suggestions.push({
            action: 'Start executing a goal',
            reasoning: 'Goals are defined but none are in progress',
            priority: 'high',
            estimatedTime: 'Varies by goal',
            mcpTool: 'handoff_to_spec_driven',
            prerequisites: ['Major goal selected'],
            impact: 'Moves project from planning to execution',
        });
    }
    if (state.blockedGoals > 0) {
        suggestions.push({
            action: `Resolve ${state.blockedGoals} blocked goal${state.blockedGoals > 1 ? 's' : ''}`,
            reasoning: 'Some goals are blocked and preventing progress',
            priority: 'high',
            estimatedTime: 'Varies by blocker',
            mcpTool: 'update_major_goal_progress',
            prerequisites: [],
            impact: 'Unblocks progress and maintains momentum',
        });
    }
    if (state.goalsInProgress > 0) {
        suggestions.push({
            action: 'Update progress on in-progress goals',
            reasoning: `${state.goalsInProgress} goal${state.goalsInProgress > 1 ? 's are' : ' is'} currently in progress`,
            priority: 'medium',
            estimatedTime: '5-10 minutes',
            mcpTool: 'update_major_goal_progress',
            prerequisites: [],
            impact: 'Keeps progress tracking accurate and visible',
        });
    }
    if (state.overallProgress >= 30 && state.overallProgress < 100) {
        suggestions.push({
            action: 'Generate progress visualization',
            reasoning: 'Project has made significant progress; visualization would help track status',
            priority: 'medium',
            estimatedTime: '5 minutes',
            mcpTool: 'generate_goals_diagram',
            prerequisites: [],
            impact: 'Provides visual overview of project health',
        });
    }
    if (state.goalsCompleted > 0 && state.goalsCompleted < state.totalGoals) {
        suggestions.push({
            action: 'Review completed goals',
            reasoning: `${state.goalsCompleted} goal${state.goalsCompleted > 1 ? 's have' : ' has'} been completed`,
            priority: 'low',
            estimatedTime: '10-15 minutes',
            mcpTool: 'get_major_goal_status',
            prerequisites: [],
            impact: 'Celebrate wins and extract learnings',
        });
    }
    // Sort by priority and limit
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    return suggestions.slice(0, maxSuggestions);
}
async function generateDetailedReasoning(state, suggestion) {
    const details = [suggestion.reasoning];
    // Add context-specific details
    if (suggestion.action.includes('blocked')) {
        details.push(`Current blockers are preventing ${state.blockedGoals} goals from progressing.`);
        details.push('Resolving these will improve team velocity and morale.');
    }
    if (state.overallProgress > 0) {
        details.push(`Project is ${state.overallProgress}% complete overall.`);
    }
    if (state.componentsWithGoals > 0) {
        details.push(`${state.componentsWithGoals} of ${state.componentCount} components have defined goals.`);
    }
    return details.join(' ');
}
async function determineProjectPhase(projectPath) {
    const state = await analyzeProjectState(projectPath);
    const phaseInfo = {
        currentPhase: state.phase,
        phaseProgress: 0,
        phaseDescription: '',
        nextPhase: '',
        readinessForNext: 0,
        blockers: [],
        recommendations: [],
    };
    // Phase-specific logic
    switch (state.phase) {
        case 'planning':
            phaseInfo.phaseDescription = 'Defining project structure, components, and goals';
            phaseInfo.nextPhase = 'execution';
            // Calculate planning phase progress
            let planningChecklist = 0;
            if (state.hasProjectOverview)
                planningChecklist += 33;
            if (state.componentCount > 0)
                planningChecklist += 33;
            if (state.totalGoals > 0)
                planningChecklist += 34;
            phaseInfo.phaseProgress = planningChecklist;
            // Readiness for execution
            phaseInfo.readinessForNext = planningChecklist;
            if (!state.hasProjectOverview) {
                phaseInfo.blockers.push('PROJECT OVERVIEW not created');
                phaseInfo.recommendations.push('Use start_project_overview_conversation to create PROJECT OVERVIEW');
            }
            if (state.componentCount === 0) {
                phaseInfo.blockers.push('No components defined');
                phaseInfo.recommendations.push('Use identify_components to create component structure');
            }
            if (state.totalGoals === 0) {
                phaseInfo.blockers.push('No major goals defined');
                phaseInfo.recommendations.push('Use create_major_goal to define strategic objectives');
            }
            break;
        case 'execution':
            phaseInfo.phaseDescription = 'Actively working on goals and sub-goals';
            phaseInfo.nextPhase = 'monitoring';
            phaseInfo.phaseProgress = state.overallProgress;
            // Readiness for monitoring (when 70%+ complete)
            phaseInfo.readinessForNext = state.overallProgress >= 70 ? 100 : Math.round((state.overallProgress / 70) * 100);
            if (state.blockedGoals > 0) {
                phaseInfo.blockers.push(`${state.blockedGoals} goals are blocked`);
                phaseInfo.recommendations.push('Resolve blockers to maintain momentum');
            }
            if (state.goalsInProgress === 0) {
                phaseInfo.blockers.push('No goals currently in progress');
                phaseInfo.recommendations.push('Start work on high-priority goals');
            }
            break;
        case 'monitoring':
            phaseInfo.phaseDescription = 'Most goals complete, monitoring remaining work';
            phaseInfo.nextPhase = 'completion';
            phaseInfo.phaseProgress = state.overallProgress;
            // Readiness for completion (when 100% complete)
            phaseInfo.readinessForNext = state.overallProgress;
            if (state.goalsInProgress > 0) {
                phaseInfo.blockers.push(`${state.goalsInProgress} goals still in progress`);
                phaseInfo.recommendations.push('Complete remaining goals');
            }
            break;
        case 'completion':
            phaseInfo.phaseDescription = 'All goals complete, project wrap-up';
            phaseInfo.nextPhase = 'archived';
            phaseInfo.phaseProgress = 100;
            phaseInfo.readinessForNext = 100;
            phaseInfo.recommendations.push('Document lessons learned');
            phaseInfo.recommendations.push('Archive project documentation');
            break;
    }
    return phaseInfo;
}
function getNextPhase(currentPhase) {
    const sequence = [
        'planning',
        'execution',
        'monitoring',
        'completion',
    ];
    const currentIndex = sequence.indexOf(currentPhase);
    return sequence[Math.min(currentIndex + 1, sequence.length - 1)];
}
async function performPhaseTransition(projectPath, fromPhase, toPhase) {
    const actions = [];
    const recommendations = [];
    // Update project overview with phase transition
    actions.push(`Transitioning from ${fromPhase} to ${toPhase}`);
    // Phase-specific actions
    if (toPhase === 'execution') {
        actions.push('Ready to start goal execution');
        recommendations.push('Use handoff_to_spec_driven to begin breaking down goals');
        recommendations.push('Prioritize high-impact goals first');
    }
    if (toPhase === 'monitoring') {
        actions.push('Entering monitoring phase');
        recommendations.push('Generate regular progress reports');
        recommendations.push('Focus on completing remaining goals');
    }
    if (toPhase === 'completion') {
        actions.push('Project approaching completion');
        recommendations.push('Conduct project retrospective');
        recommendations.push('Archive completed goals');
        recommendations.push('Update final documentation');
    }
    return { actions, recommendations };
}
async function buildOverviewContext(projectPath) {
    const state = await analyzeProjectState(projectPath);
    return {
        projectName: path.basename(projectPath),
        projectPhase: state.phase,
        overallProgress: state.overallProgress,
        activeComponents: state.componentsWithGoals,
        totalComponents: state.componentCount,
        activeGoals: state.goalsInProgress,
        totalGoals: state.totalGoals,
        recentActivity: state.recentActivity,
        upcomingMilestones: [],
        currentBlockers: state.blockedGoals > 0 ? [`${state.blockedGoals} goals blocked`] : [],
        suggestedTopics: [
            'What should I work on next?',
            'Show me project progress',
            'What goals are blocked?',
            'Generate progress visualization',
        ],
    };
}
async function buildDetailedContext(projectPath) {
    const overview = await buildOverviewContext(projectPath);
    // Add more detailed information
    // This would include recent commits, updated files, etc.
    return overview;
}
async function buildSpecificEntityContext(projectPath, entityId) {
    const overview = await buildOverviewContext(projectPath);
    // Add entity-specific context
    overview.suggestedTopics = [
        `What is the status of ${entityId}?`,
        `What are the dependencies for ${entityId}?`,
        `What sub-goals exist for ${entityId}?`,
    ];
    return overview;
}
// ============================================================================
// UTILITIES
// ============================================================================
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=conversation-flow-tools%202.js.map