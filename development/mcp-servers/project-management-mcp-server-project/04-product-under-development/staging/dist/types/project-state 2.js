/**
 * Project State Type Definitions
 *
 * Defines the structure of .ai-planning/project-state.json
 */
/**
 * Default phase definitions with step sequences
 */
export const PHASE_DEFINITIONS = {
    initialization: {
        steps: [
            'create-structure',
            'generate-constitution',
            'identify-stakeholders',
            'identify-resources',
            'generate-roadmap',
        ],
    },
    'goal-development': {
        steps: [
            'brainstorm-ideas',
            'evaluate-goals',
            'create-potential-goals',
            'promote-to-selected',
        ],
    },
    execution: {
        steps: [
            'create-specification',
            'create-tasks',
            'execute-workflow',
            'update-progress',
        ],
    },
    completion: {
        steps: [
            'validate-deliverables',
            'complete-documentation',
            'archive-goals',
            'wrap-up-project',
        ],
    },
};
/**
 * Create a new ProjectState with default values
 */
export function createDefaultState(projectName) {
    const now = new Date().toISOString();
    return {
        version: '1.0',
        projectName,
        created: now,
        lastUpdated: now,
        currentPhase: 'initialization',
        currentStep: 'create-structure',
        phases: {
            initialization: {
                status: 'in-progress',
                startedAt: now,
                steps: PHASE_DEFINITIONS.initialization.steps.map((name, index) => ({
                    name,
                    status: index === 0 ? 'in-progress' : 'pending',
                })),
            },
            'goal-development': {
                status: 'pending',
                steps: PHASE_DEFINITIONS['goal-development'].steps.map(name => ({
                    name,
                    status: 'pending',
                })),
            },
            execution: {
                status: 'pending',
                steps: PHASE_DEFINITIONS.execution.steps.map(name => ({
                    name,
                    status: 'pending',
                })),
            },
            completion: {
                status: 'pending',
                steps: PHASE_DEFINITIONS.completion.steps.map(name => ({
                    name,
                    status: 'pending',
                })),
            },
        },
        goals: {
            potential: [],
            selected: [],
            completed: [],
        },
        integrations: {
            specDriven: {
                used: false,
                lastHandoff: null,
                goalsWithSpecs: [],
            },
            taskExecutor: {
                activeWorkflows: [],
                lastCreated: null,
                totalWorkflowsCreated: 0,
            },
        },
    };
}
//# sourceMappingURL=project-state%202.js.map