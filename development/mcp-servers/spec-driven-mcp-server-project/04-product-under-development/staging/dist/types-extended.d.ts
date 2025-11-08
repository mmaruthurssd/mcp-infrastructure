/**
 * Extended type definitions for Spec-Driven Development MCP Server
 * Integrates with workflow-orchestrator-mcp-server
 */
import { WorkflowState } from 'workflow-orchestrator-mcp-server/dist/types/workflow-state.js';
import type { Scenario, WorkflowStep } from './types.js';
/**
 * Spec-Driven Workflow Data
 * Custom data structure for spec-driven workflows
 */
export interface SpecDrivenWorkflowData {
    scenario: Scenario;
    currentStep: WorkflowStep;
    currentQuestionIndex: number;
    featureName?: string;
    featureId?: string;
    projectType?: string;
    answers: Map<string, any>;
    templateContext: Record<string, any>;
}
/**
 * Complete Spec-Driven Workflow State
 * Extends generic WorkflowState with spec-driven specific data
 */
export type SpecDrivenWorkflowState = WorkflowState<SpecDrivenWorkflowData>;
export type { Scenario, WorkflowStep } from './types.js';
//# sourceMappingURL=types-extended.d.ts.map