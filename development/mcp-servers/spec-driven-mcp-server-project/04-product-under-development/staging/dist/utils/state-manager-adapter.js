/**
 * State Manager Adapter
 * Adapts workflow-orchestrator StateManager for spec-driven workflows
 * Maintains backward compatibility with existing StateManager API
 */
import * as fs from 'fs';
import * as path from 'path';
/**
 * Adapter class that provides the same interface as the original StateManager
 * but uses workflow-orchestrator types under the hood
 */
export class StateManager {
    stateDir;
    constructor(baseDir) {
        // Use ~/.sdd-mcp-data/workflows/ by default (same as original)
        this.stateDir = baseDir || path.join(process.env.HOME || process.env.USERPROFILE || '', '.sdd-mcp-data', 'workflows');
        this.ensureStateDir();
    }
    ensureStateDir() {
        if (!fs.existsSync(this.stateDir)) {
            fs.mkdirSync(this.stateDir, { recursive: true });
        }
    }
    getStateFilePath(projectPath) {
        // Create a safe filename from project path
        const safeName = projectPath.replace(/[^a-zA-Z0-9]/g, '_');
        return path.join(this.stateDir, `${safeName}.json`);
    }
    /**
     * Convert SpecDrivenWorkflowState to legacy WorkflowState
     */
    toLegacyState(state) {
        return {
            projectPath: state.name,
            scenario: state.customData.scenario,
            currentStep: state.customData.currentStep,
            currentQuestionIndex: state.customData.currentQuestionIndex,
            featureName: state.customData.featureName,
            featureId: state.customData.featureId,
            projectType: state.customData.projectType,
            answers: state.customData.answers,
            templateContext: state.customData.templateContext,
            createdAt: new Date(state.created),
            lastUpdated: new Date(state.lastUpdated)
        };
    }
    /**
     * Convert legacy WorkflowState to SpecDrivenWorkflowState structure
     */
    fromLegacyState(legacyState) {
        const now = new Date();
        const createdAt = legacyState.createdAt || now;
        const lastUpdated = legacyState.lastUpdated || now;
        return {
            version: '1.0',
            workflowType: 'spec-driven',
            name: legacyState.projectPath,
            created: createdAt.toISOString(),
            lastUpdated: lastUpdated.toISOString(),
            currentPhase: this.getPhaseFromStep(legacyState.currentStep),
            currentStep: legacyState.currentStep,
            phases: {
                'initialization': {
                    status: legacyState.currentStep === 'complete' ? 'complete' : 'in-progress',
                    startedAt: createdAt.toISOString(),
                    completedAt: legacyState.currentStep === 'complete' ? now.toISOString() : undefined,
                    steps: []
                }
            },
            customData: {
                scenario: legacyState.scenario,
                currentStep: legacyState.currentStep,
                currentQuestionIndex: legacyState.currentQuestionIndex,
                featureName: legacyState.featureName,
                featureId: legacyState.featureId,
                projectType: legacyState.projectType,
                answers: legacyState.answers,
                templateContext: legacyState.templateContext
            }
        };
    }
    /**
     * Map workflow step to phase
     */
    getPhaseFromStep(step) {
        const phaseMap = {
            'setup': 'initialization',
            'constitution': 'planning',
            'specification': 'planning',
            'planning': 'planning',
            'tasks': 'execution',
            'complete': 'completion'
        };
        return phaseMap[step] || 'initialization';
    }
    /**
     * Save workflow state to disk
     */
    save(state) {
        const filePath = this.getStateFilePath(state.projectPath);
        const woState = this.fromLegacyState(state);
        // Serialize Map to array for JSON
        const serialized = {
            ...woState,
            customData: {
                ...woState.customData,
                answers: Array.from(woState.customData.answers.entries())
            },
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(filePath, JSON.stringify(serialized, null, 2), 'utf-8');
    }
    /**
     * Load workflow state from disk
     */
    load(projectPath) {
        const filePath = this.getStateFilePath(projectPath);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            // Deserialize answers array back to Map
            if (data.customData && data.customData.answers) {
                data.customData.answers = new Map(data.customData.answers);
            }
            // Data already has ISO string dates from disk, no conversion needed
            const woState = data;
            return this.toLegacyState(woState);
        }
        catch (error) {
            console.error(`Failed to load state for ${projectPath}:`, error);
            return null;
        }
    }
    /**
     * Check if state exists for a project
     */
    exists(projectPath) {
        const filePath = this.getStateFilePath(projectPath);
        return fs.existsSync(filePath);
    }
    /**
     * Delete workflow state
     */
    delete(projectPath) {
        const filePath = this.getStateFilePath(projectPath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    }
    /**
     * List all active workflows
     */
    listWorkflows() {
        if (!fs.existsSync(this.stateDir)) {
            return [];
        }
        const files = fs.readdirSync(this.stateDir).filter(f => f.endsWith('.json'));
        const workflows = [];
        for (const file of files) {
            const filePath = path.join(this.stateDir, file);
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const data = JSON.parse(content);
                // Deserialize answers array back to Map
                if (data.customData && data.customData.answers) {
                    data.customData.answers = new Map(data.customData.answers);
                }
                // Data already has ISO string dates from disk, no conversion needed
                const woState = data;
                const legacyState = this.toLegacyState(woState);
                workflows.push({ projectPath: legacyState.projectPath, state: legacyState });
            }
            catch (error) {
                console.error(`Failed to load workflow from ${file}:`, error);
            }
        }
        return workflows;
    }
    /**
     * Create a new workflow state
     */
    createNew(projectPath, scenario) {
        return {
            projectPath,
            scenario,
            currentStep: 'setup',
            currentQuestionIndex: 0,
            answers: new Map(),
            templateContext: {},
            createdAt: new Date(),
            lastUpdated: new Date()
        };
    }
    /**
     * Update state answers
     */
    updateAnswer(state, questionId, answer) {
        state.answers.set(questionId, answer);
        state.lastUpdated = new Date();
        return state;
    }
    /**
     * Advance to next step
     */
    advanceStep(state, nextStep) {
        state.currentStep = nextStep;
        state.currentQuestionIndex = 0;
        state.lastUpdated = new Date();
        return state;
    }
}
//# sourceMappingURL=state-manager-adapter.js.map