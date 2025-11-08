/**
 * Generic State Manager for Workflow Orchestration
 *
 * Handles reading, writing, and validating workflow state files.
 * Supports both generic WorkflowState<T> and backwards-compatible ProjectState.
 */
import * as fs from 'fs';
import * as path from 'path';
import { createDefaultState } from '../types/project-state.js';
const STATE_DIR = '.ai-planning';
const STATE_FILE = 'project-state.json';
export class StateManager {
    // ============================================================================
    // Generic Workflow State Methods
    // ============================================================================
    /**
     * Read generic workflow state from disk
     */
    static readWorkflow(projectPath) {
        try {
            const statePath = this.getStatePath(projectPath);
            if (!fs.existsSync(statePath)) {
                return null;
            }
            const content = fs.readFileSync(statePath, 'utf8');
            const state = JSON.parse(content);
            return state;
        }
        catch (error) {
            console.error('Error reading workflow state:', error);
            return null;
        }
    }
    /**
     * Write generic workflow state to disk
     */
    static writeWorkflow(projectPath, state) {
        try {
            // Ensure .ai-planning directory exists
            const stateDir = this.getStateDir(projectPath);
            if (!fs.existsSync(stateDir)) {
                fs.mkdirSync(stateDir, { recursive: true });
            }
            // Update lastUpdated timestamp
            state.lastUpdated = new Date().toISOString();
            // Write state file
            const statePath = this.getStatePath(projectPath);
            fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
            return true;
        }
        catch (error) {
            console.error('Error writing workflow state:', error);
            return false;
        }
    }
    // ============================================================================
    // Backwards Compatible ProjectState Methods
    // ============================================================================
    /**
     * Get the full path to the state file
     */
    static getStatePath(projectPath) {
        return path.join(projectPath, STATE_DIR, STATE_FILE);
    }
    /**
     * Get the state directory path
     */
    static getStateDir(projectPath) {
        return path.join(projectPath, STATE_DIR);
    }
    /**
     * Check if state file exists
     */
    static exists(projectPath) {
        return fs.existsSync(this.getStatePath(projectPath));
    }
    /**
     * Read project state
     * Returns null if state doesn't exist or is invalid
     */
    static read(projectPath) {
        try {
            const statePath = this.getStatePath(projectPath);
            if (!fs.existsSync(statePath)) {
                return null;
            }
            const content = fs.readFileSync(statePath, 'utf8');
            const state = JSON.parse(content);
            // Validate state structure
            if (!this.validate(state)) {
                console.error('Invalid state structure');
                return null;
            }
            return state;
        }
        catch (error) {
            console.error('Error reading state:', error);
            return null;
        }
    }
    /**
     * Write project state
     */
    static write(projectPath, state) {
        try {
            // Ensure .ai-planning directory exists
            const stateDir = this.getStateDir(projectPath);
            if (!fs.existsSync(stateDir)) {
                fs.mkdirSync(stateDir, { recursive: true });
            }
            // Update lastUpdated timestamp
            state.lastUpdated = new Date().toISOString();
            // Write state file
            const statePath = this.getStatePath(projectPath);
            fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
            return true;
        }
        catch (error) {
            console.error('Error writing state:', error);
            return false;
        }
    }
    /**
     * Initialize state with default values
     */
    static initialize(projectPath, projectName) {
        const state = createDefaultState(projectName);
        this.write(projectPath, state);
        return state;
    }
    /**
     * Get or initialize state
     * Returns existing state or creates new one if it doesn't exist
     */
    static getOrInitialize(projectPath, projectName) {
        const existing = this.read(projectPath);
        if (existing) {
            return existing;
        }
        // Need project name for initialization
        if (!projectName) {
            // Try to infer from path
            projectName = path.basename(projectPath);
        }
        return this.initialize(projectPath, projectName);
    }
    /**
     * Update a field in the state
     */
    static update(projectPath, updater) {
        const state = this.read(projectPath);
        if (!state) {
            return null;
        }
        const updated = updater(state);
        this.write(projectPath, updated);
        return updated;
    }
    /**
     * Validate state structure
     */
    static validate(state) {
        if (!state || typeof state !== 'object') {
            return false;
        }
        // Check required fields
        const requiredFields = ['version', 'projectName', 'created', 'lastUpdated', 'currentPhase', 'phases', 'goals', 'integrations'];
        for (const field of requiredFields) {
            if (!(field in state)) {
                console.error(`Missing required field: ${field}`);
                return false;
            }
        }
        // Check phases structure
        if (!state.phases || typeof state.phases !== 'object') {
            return false;
        }
        const requiredPhases = ['initialization', 'goal-development', 'execution', 'completion'];
        for (const phase of requiredPhases) {
            if (!(phase in state.phases)) {
                console.error(`Missing required phase: ${phase}`);
                return false;
            }
        }
        // Check goals structure
        if (!state.goals || !Array.isArray(state.goals.potential) || !Array.isArray(state.goals.selected)) {
            return false;
        }
        return true;
    }
    /**
     * Reset state to default
     */
    static reset(projectPath) {
        const existing = this.read(projectPath);
        const projectName = existing?.projectName || path.basename(projectPath);
        return this.initialize(projectPath, projectName);
    }
    /**
     * Delete state file
     */
    static delete(projectPath) {
        try {
            const statePath = this.getStatePath(projectPath);
            if (fs.existsSync(statePath)) {
                fs.unlinkSync(statePath);
            }
            return true;
        }
        catch (error) {
            console.error('Error deleting state:', error);
            return false;
        }
    }
    /**
     * Create a backup of the state file
     */
    static backup(projectPath) {
        try {
            const statePath = this.getStatePath(projectPath);
            if (!fs.existsSync(statePath)) {
                return null;
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = statePath + `.backup.${timestamp}`;
            fs.copyFileSync(statePath, backupPath);
            return backupPath;
        }
        catch (error) {
            console.error('Error creating backup:', error);
            return null;
        }
    }
}
//# sourceMappingURL=state-manager.js.map