/**
 * Generic Workflow State Interface
 *
 * Defines the common structure for all workflow orchestration state.
 * The generic type T allows for workflow-specific custom data.
 */

export interface WorkflowState<T = any> {
  version: string;
  workflowType: string; // e.g., "project-planning", "deployment", "approval"
  name: string; // Workflow instance name
  created: string; // ISO 8601 timestamp
  lastUpdated: string; // ISO 8601 timestamp

  currentPhase: string;
  currentStep: string;

  phases: Record<string, PhaseInfo>;
  customData: T; // Workflow-specific data
}

export type PhaseStatus = 'pending' | 'in-progress' | 'complete';
export type StepStatus = 'pending' | 'in-progress' | 'complete' | 'skipped';

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

/**
 * Workflow Definition Schema
 *
 * Defines the structure and phases for a workflow type.
 */
export interface WorkflowDefinition {
  type: string;
  version: string;
  phases: PhaseDefinition[];
}

export interface PhaseDefinition {
  name: string;
  steps: string[];
}

/**
 * Create a new WorkflowState with default values
 */
export function createDefaultWorkflowState<T>(
  workflowType: string,
  name: string,
  phases: Record<string, PhaseDefinition>,
  initialCustomData: T
): WorkflowState<T> {
  const now = new Date().toISOString();
  const phaseNames = Object.keys(phases);
  const firstPhase = phaseNames[0];

  const phaseStatuses: Record<string, PhaseInfo> = {};

  phaseNames.forEach((phaseName, index) => {
    const phaseDefinition = phases[phaseName];
    const isFirst = index === 0;

    phaseStatuses[phaseName] = {
      status: isFirst ? 'in-progress' : 'pending',
      startedAt: isFirst ? now : undefined,
      steps: phaseDefinition.steps.map((stepName, stepIndex) => ({
        name: stepName,
        status: isFirst && stepIndex === 0 ? 'in-progress' : 'pending',
      })),
    };
  });

  return {
    version: '1.0',
    workflowType,
    name,
    created: now,
    lastUpdated: now,
    currentPhase: firstPhase,
    currentStep: phases[firstPhase].steps[0],
    phases: phaseStatuses,
    customData: initialCustomData,
  };
}
