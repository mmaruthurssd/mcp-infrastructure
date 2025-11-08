/**
 * Project Planning Workflow Rules
 *
 * Defines the 11 rules for project planning workflow orchestration.
 * Extracted from RuleEngine to make them configurable.
 */
import * as fs from 'fs';
import * as path from 'path';
/**
 * Helper function to check if file exists
 */
function fileExists(projectPath, relativePath) {
    const fullPath = path.join(projectPath, relativePath);
    return fs.existsSync(fullPath);
}
/**
 * All project planning rules
 */
export const PROJECT_PLANNING_RULES = [
    // ============================================================
    // INITIALIZATION PHASE RULES
    // ============================================================
    {
        id: 'init-start-project-setup',
        priority: 90,
        phase: 'initialization',
        conditions: [
            {
                description: 'No constitution file exists',
                check: ctx => !fileExists(ctx.projectPath, 'brainstorming/future-goals/CONSTITUTION.md'),
            },
            {
                description: 'Not in create-structure step',
                check: ctx => ctx.state.currentStep !== 'create-structure',
            },
        ],
        action: {
            message: 'Start project setup to create constitution and structure',
            reason: 'Project initialization requires constitution and folder structure',
            tool: 'start_project_setup',
            paramBuilder: ctx => ({
                projectPath: ctx.projectPath,
                projectName: ctx.state.projectName,
            }),
        },
    },
    // ============================================================
    // GOAL DEVELOPMENT PHASE RULES
    // ============================================================
    {
        id: 'goal-extract-ideas',
        priority: 70,
        phase: 'goal-development',
        conditions: [
            {
                description: 'Brainstorming file exists',
                check: ctx => fileExists(ctx.projectPath, 'brainstorming/future-goals/brainstorming/ongoing-brainstorming-discussion.md'),
            },
            {
                description: 'No potential goals created yet',
                check: ctx => ctx.state.goals.potential.length === 0,
            },
        ],
        action: {
            message: 'Extract ideas from brainstorming discussion',
            reason: 'Brainstorming file exists but no goals extracted yet',
            tool: 'extract_ideas',
            paramBuilder: ctx => ({
                projectPath: ctx.projectPath,
            }),
        },
    },
    {
        id: 'goal-evaluate-potential',
        priority: 80,
        phase: 'goal-development',
        conditions: [
            {
                description: 'Potential goals exist',
                check: ctx => ctx.state.goals.potential.length > 0,
            },
            {
                description: 'No selected goals yet',
                check: ctx => ctx.state.goals.selected.length === 0,
            },
        ],
        action: {
            message: 'Review and promote potential goal to selected',
            reason: (ctx) => {
                const count = ctx.state.goals.potential.length;
                return `${count} potential goal${count === 1 ? '' : 's'} ready for evaluation`;
            },
            tool: 'promote_to_selected',
            paramBuilder: ctx => {
                const firstGoal = ctx.state.goals.potential[0];
                return {
                    projectPath: ctx.projectPath,
                    potentialGoalFile: `brainstorming/future-goals/potential-goals/${firstGoal}.md`,
                    priority: 'High', // User can adjust
                };
            },
        },
    },
    // ============================================================
    // EXECUTION PHASE RULES
    // ============================================================
    {
        id: 'exec-create-spec',
        priority: 85,
        phase: 'execution',
        conditions: [
            {
                description: 'Selected goals exist',
                check: ctx => ctx.state.goals.selected.length > 0,
            },
            {
                description: 'Goal has no spec folder yet',
                check: ctx => {
                    const firstGoal = ctx.state.goals.selected[0];
                    return !fileExists(ctx.projectPath, `02-goals-and-roadmap/selected-goals/${firstGoal}/spec/specification.md`);
                },
            },
            {
                description: 'Spec-Driven not used yet for this goal',
                check: ctx => {
                    const firstGoal = ctx.state.goals.selected[0];
                    return !ctx.state.integrations.specDriven.goalsWithSpecs.includes(firstGoal);
                },
            },
        ],
        action: {
            message: 'Create specification with Spec-Driven MCP',
            reason: 'Selected goal needs specification before implementation',
            tool: 'prepare_spec_handoff',
            paramBuilder: ctx => ({
                projectPath: ctx.projectPath,
                goalId: '01', // Extract from goal folder if possible
            }),
        },
    },
    {
        id: 'exec-create-workflow',
        priority: 80,
        phase: 'execution',
        conditions: [
            {
                description: 'Goal has specification',
                check: ctx => {
                    const firstGoal = ctx.state.goals.selected[0];
                    if (!firstGoal)
                        return false;
                    return fileExists(ctx.projectPath, `02-goals-and-roadmap/selected-goals/${firstGoal}/spec/specification.md`);
                },
            },
            {
                description: 'No active workflow for this goal',
                check: ctx => ctx.state.integrations.taskExecutor.activeWorkflows.length === 0,
            },
        ],
        action: {
            message: 'Create task workflow with Task Executor MCP',
            reason: 'Specification complete, ready to break down into tasks',
            tool: 'prepare_task_executor_handoff',
            paramBuilder: ctx => ({
                projectPath: ctx.projectPath,
                goalId: '01',
            }),
        },
    },
    {
        id: 'exec-update-progress',
        priority: 60,
        phase: 'execution',
        conditions: [
            {
                description: 'Active workflows exist',
                check: ctx => ctx.state.integrations.taskExecutor.activeWorkflows.length > 0,
            },
            {
                description: 'Goals in progress',
                check: ctx => ctx.state.goals.selected.length > 0,
            },
        ],
        action: {
            message: 'Update goal progress based on completed tasks',
            reason: 'Active workflows running - keep goal progress updated',
            tool: 'update_goal_progress',
            paramBuilder: ctx => ({
                projectPath: ctx.projectPath,
                goalId: '01',
            }),
        },
    },
    // ============================================================
    // COMPLETION PHASE RULES
    // ============================================================
    {
        id: 'complete-validate-readiness',
        priority: 90,
        phase: 'completion',
        conditions: [
            {
                description: 'All selected goals completed',
                check: ctx => ctx.state.goals.selected.length === 0 && ctx.state.goals.completed.length > 0,
            },
            {
                description: 'No active workflows',
                check: ctx => ctx.state.integrations.taskExecutor.activeWorkflows.length === 0,
            },
        ],
        action: {
            message: 'Validate project readiness for completion',
            reason: 'All goals completed - time to validate deliverables',
            tool: 'validate_project_readiness',
            paramBuilder: ctx => ({
                projectPath: ctx.projectPath,
            }),
        },
    },
    {
        id: 'complete-generate-checklist',
        priority: 85,
        phase: 'completion',
        conditions: [
            {
                description: 'In validate-deliverables step',
                check: ctx => ctx.state.currentStep === 'validate-deliverables',
            },
        ],
        action: {
            message: 'Generate completion checklist',
            reason: 'Create comprehensive checklist to ensure nothing is missed',
            tool: 'generate_completion_checklist',
            paramBuilder: ctx => ({
                projectPath: ctx.projectPath,
            }),
        },
    },
    {
        id: 'complete-wrap-up',
        priority: 95,
        phase: 'completion',
        conditions: [
            {
                description: 'In wrap-up-project step',
                check: ctx => ctx.state.currentStep === 'wrap-up-project',
            },
            {
                description: 'All documentation complete',
                check: ctx => fileExists(ctx.projectPath, 'PROJECT-WRAP-UP-CHECKLIST.md'),
            },
        ],
        action: {
            message: 'Wrap up project and create completion report',
            reason: 'All deliverables validated - ready to finalize',
            tool: 'wrap_up_project',
            paramBuilder: ctx => ({
                projectPath: ctx.projectPath,
            }),
        },
    },
    // ============================================================
    // CROSS-PHASE RULES (Always applicable)
    // ============================================================
    {
        id: 'cross-archive-completed-goal',
        priority: 75,
        conditions: [
            {
                description: 'Goal completed but not archived',
                check: ctx => {
                    // Check if there are workflows in archive but goals still in selected
                    const archivePath = path.join(ctx.projectPath, 'archive/workflows');
                    if (!fs.existsSync(archivePath))
                        return false;
                    const archivedWorkflows = fs.readdirSync(archivePath).filter(f => fs.statSync(path.join(archivePath, f)).isDirectory());
                    return archivedWorkflows.length > 0 && ctx.state.goals.selected.length > 0;
                },
            },
        ],
        action: {
            message: 'Archive completed goal with retrospective',
            reason: 'Goal implementation complete - archive with lessons learned',
            tool: 'archive_goal',
            paramBuilder: ctx => ({
                projectPath: ctx.projectPath,
                goalId: '01',
                archiveType: 'implemented',
            }),
        },
    },
];
/**
 * Load project planning rules into RuleEngine
 */
export function loadProjectPlanningRules() {
    return PROJECT_PLANNING_RULES;
}
//# sourceMappingURL=project-planning-rules.js.map