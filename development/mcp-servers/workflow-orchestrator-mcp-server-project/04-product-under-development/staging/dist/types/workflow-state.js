/**
 * Generic Workflow State Interface
 *
 * Defines the common structure for all workflow orchestration state.
 * The generic type T allows for workflow-specific custom data.
 */
/**
 * Create a new WorkflowState with default values
 */
export function createDefaultWorkflowState(workflowType, name, phases, initialCustomData) {
    const now = new Date().toISOString();
    const phaseNames = Object.keys(phases);
    const firstPhase = phaseNames[0];
    const phaseStatuses = {};
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
//# sourceMappingURL=workflow-state.js.map