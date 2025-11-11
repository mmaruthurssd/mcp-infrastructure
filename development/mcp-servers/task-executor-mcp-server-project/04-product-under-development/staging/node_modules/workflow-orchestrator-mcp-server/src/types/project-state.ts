/**
 * Project State Type Definitions
 *
 * Defines the structure of .ai-planning/project-state.json
 */

export interface ProjectState {
  version: string;
  workflowType?: string; // NEW: Type of workflow (for generic support)
  projectName: string;
  created: string; // ISO 8601 timestamp
  lastUpdated: string; // ISO 8601 timestamp

  currentPhase: WorkflowPhase;
  currentStep: string;

  phases: PhaseStatuses;
  goals: GoalTracking;
  integrations: IntegrationTracking;
}

export type WorkflowPhase = 'initialization' | 'goal-development' | 'execution' | 'completion';

export type PhaseStatus = 'pending' | 'in-progress' | 'complete';
export type StepStatus = 'pending' | 'in-progress' | 'complete' | 'skipped';

export interface PhaseStatuses {
  initialization: PhaseInfo;
  'goal-development': PhaseInfo;
  execution: PhaseInfo;
  completion: PhaseInfo;
}

export interface PhaseInfo {
  status: PhaseStatus;
  startedAt?: string;
  completedAt?: string;
  steps: StepInfo[];
}

export interface StepInfo {
  name: string;
  status: StepStatus;
  completedAt?: string;
}

export interface GoalTracking {
  potential: string[]; // goal folder names
  selected: string[]; // goal folder names
  completed: string[]; // goal folder names
}

export interface IntegrationTracking {
  specDriven: {
    used: boolean;
    lastHandoff: string | null; // ISO timestamp
    goalsWithSpecs: string[]; // goal names
  };
  taskExecutor: {
    activeWorkflows: string[]; // workflow names
    lastCreated: string | null; // ISO timestamp
    totalWorkflowsCreated: number;
  };
}

/**
 * Default phase definitions with step sequences
 */
export const PHASE_DEFINITIONS: Record<WorkflowPhase, { steps: string[] }> = {
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
export function createDefaultState(projectName: string): ProjectState {
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
