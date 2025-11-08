/**
 * State Manager - Persists workflow state to disk
 */
import * as fs from 'fs';
import * as path from 'path';
export class StateManager {
    stateDir;
    constructor(baseDir) {
        // Use ~/.sdd-mcp-data/workflows/ by default
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
     * Save workflow state to disk
     */
    save(state) {
        const filePath = this.getStateFilePath(state.projectPath);
        const serialized = {
            ...state,
            answers: Array.from(state.answers.entries()),
            createdAt: state.createdAt.toISOString(),
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
            return {
                ...data,
                answers: new Map(data.answers),
                createdAt: new Date(data.createdAt),
                lastUpdated: new Date(data.lastUpdated)
            };
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
                const state = {
                    ...data,
                    answers: new Map(data.answers),
                    createdAt: new Date(data.createdAt),
                    lastUpdated: new Date(data.lastUpdated)
                };
                workflows.push({ projectPath: state.projectPath, state });
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
//# sourceMappingURL=state-manager.js.map