/**
 * State Detector
 *
 * Auto-detects project state from file system and syncs with state file
 * Prevents state drift by detecting actual project changes
 */
import * as fs from 'fs';
import * as path from 'path';
/**
 * State Detector - scans project and detects actual state
 */
export class StateDetector {
    /**
     * Detect project state from file system
     */
    static detectState(projectPath) {
        const goalsDetected = this.detectGoals(projectPath);
        const workflowsDetected = this.detectWorkflows(projectPath);
        const filesDetected = this.detectKeyFiles(projectPath);
        return {
            goalsDetected,
            workflowsDetected,
            filesDetected,
            mismatches: [], // Will be populated by compareWithState
        };
    }
    /**
     * Compare detected state with stored state and identify mismatches
     */
    static compareWithState(projectPath, state) {
        const detected = this.detectState(projectPath);
        const mismatches = [];
        // Check potential goals mismatch
        const potentialMismatch = this.arrayDifference(detected.goalsDetected.potential, state.goals.potential);
        if (potentialMismatch.added.length > 0 || potentialMismatch.removed.length > 0) {
            mismatches.push({
                type: 'goals',
                severity: 'warning',
                message: `Potential goals mismatch: ${potentialMismatch.added.length} added, ${potentialMismatch.removed.length} removed`,
                currentState: state.goals.potential,
                detectedState: detected.goalsDetected.potential,
            });
        }
        // Check selected goals mismatch
        const selectedMismatch = this.arrayDifference(detected.goalsDetected.selected, state.goals.selected);
        if (selectedMismatch.added.length > 0 || selectedMismatch.removed.length > 0) {
            mismatches.push({
                type: 'goals',
                severity: 'warning',
                message: `Selected goals mismatch: ${selectedMismatch.added.length} added, ${selectedMismatch.removed.length} removed`,
                currentState: state.goals.selected,
                detectedState: detected.goalsDetected.selected,
            });
        }
        // Check workflows mismatch
        const workflowsMismatch = this.arrayDifference(detected.workflowsDetected.active, state.integrations.taskExecutor.activeWorkflows);
        if (workflowsMismatch.added.length > 0 || workflowsMismatch.removed.length > 0) {
            mismatches.push({
                type: 'workflows',
                severity: 'warning',
                message: `Active workflows mismatch: ${workflowsMismatch.added.length} added, ${workflowsMismatch.removed.length} removed`,
                currentState: state.integrations.taskExecutor.activeWorkflows,
                detectedState: detected.workflowsDetected.active,
            });
        }
        // Check key files for phase validation
        if (state.currentPhase === 'initialization') {
            if (detected.filesDetected.constitution && detected.filesDetected.stakeholders) {
                mismatches.push({
                    type: 'phase',
                    severity: 'warning',
                    message: 'Key initialization files exist but phase still in initialization',
                    currentState: state.currentPhase,
                    detectedState: 'ready for goal-development',
                });
            }
        }
        detected.mismatches = mismatches;
        return detected;
    }
    /**
     * Auto-sync state with detected changes
     */
    static syncState(projectPath, state) {
        const detected = this.detectState(projectPath);
        const changes = [];
        let updated = false;
        // Sync potential goals
        if (!this.arraysEqual(detected.goalsDetected.potential, state.goals.potential)) {
            state.goals.potential = detected.goalsDetected.potential;
            changes.push(`Updated potential goals: ${detected.goalsDetected.potential.length} found`);
            updated = true;
        }
        // Sync selected goals
        if (!this.arraysEqual(detected.goalsDetected.selected, state.goals.selected)) {
            state.goals.selected = detected.goalsDetected.selected;
            changes.push(`Updated selected goals: ${detected.goalsDetected.selected.length} found`);
            updated = true;
        }
        // Sync completed goals (from archived goals)
        if (!this.arraysEqual(detected.goalsDetected.completed, state.goals.completed)) {
            state.goals.completed = detected.goalsDetected.completed;
            changes.push(`Updated completed goals: ${detected.goalsDetected.completed.length} found`);
            updated = true;
        }
        // Sync active workflows
        if (!this.arraysEqual(detected.workflowsDetected.active, state.integrations.taskExecutor.activeWorkflows)) {
            state.integrations.taskExecutor.activeWorkflows = detected.workflowsDetected.active;
            changes.push(`Updated active workflows: ${detected.workflowsDetected.active.length} found`);
            updated = true;
        }
        // Update spec-driven integration tracking
        const specsDetected = this.detectSpecifications(projectPath);
        if (specsDetected.length > 0 && !state.integrations.specDriven.used) {
            state.integrations.specDriven.used = true;
            state.integrations.specDriven.goalsWithSpecs = specsDetected;
            changes.push('Detected Spec-Driven MCP usage');
            updated = true;
        }
        return { updated, changes };
    }
    /**
     * Detect goals from file system
     */
    static detectGoals(projectPath) {
        const potential = [];
        const selected = [];
        const completed = [];
        // Detect potential goals
        const potentialGoalsPath = path.join(projectPath, 'brainstorming/future-goals/potential-goals');
        if (fs.existsSync(potentialGoalsPath)) {
            const files = fs.readdirSync(potentialGoalsPath);
            files.forEach(file => {
                if (file.endsWith('.md') && file !== 'README.md') {
                    potential.push(file.replace('.md', ''));
                }
            });
        }
        // Detect selected goals
        const selectedGoalsPath = path.join(projectPath, '02-goals-and-roadmap/selected-goals');
        if (fs.existsSync(selectedGoalsPath)) {
            const entries = fs.readdirSync(selectedGoalsPath);
            entries.forEach(entry => {
                const fullPath = path.join(selectedGoalsPath, entry);
                if (fs.statSync(fullPath).isDirectory()) {
                    selected.push(entry);
                }
            });
        }
        // Detect completed goals (from archived goals)
        const archivedGoalsPath = path.join(projectPath, 'brainstorming/future-goals/archived-goals');
        if (fs.existsSync(archivedGoalsPath)) {
            const entries = fs.readdirSync(archivedGoalsPath);
            entries.forEach(entry => {
                const fullPath = path.join(archivedGoalsPath, entry);
                if (fs.statSync(fullPath).isDirectory()) {
                    completed.push(entry);
                }
            });
        }
        return { potential, selected, completed };
    }
    /**
     * Detect workflows from file system
     */
    static detectWorkflows(projectPath) {
        const active = [];
        const archived = [];
        // Detect active workflows
        const tempWorkflowsPath = path.join(projectPath, 'temp/workflows');
        if (fs.existsSync(tempWorkflowsPath)) {
            const entries = fs.readdirSync(tempWorkflowsPath);
            entries.forEach(entry => {
                const fullPath = path.join(tempWorkflowsPath, entry);
                if (fs.statSync(fullPath).isDirectory()) {
                    active.push(entry);
                }
            });
        }
        // Detect archived workflows
        const archivedWorkflowsPath = path.join(projectPath, 'archive/workflows');
        if (fs.existsSync(archivedWorkflowsPath)) {
            const entries = fs.readdirSync(archivedWorkflowsPath);
            entries.forEach(entry => {
                const fullPath = path.join(archivedWorkflowsPath, entry);
                if (fs.statSync(fullPath).isDirectory()) {
                    archived.push(entry);
                }
            });
        }
        return { active, archived };
    }
    /**
     * Detect key project files
     */
    static detectKeyFiles(projectPath) {
        return {
            constitution: fs.existsSync(path.join(projectPath, 'brainstorming/future-goals/CONSTITUTION.md')),
            stakeholders: fs.existsSync(path.join(projectPath, '03-resources-docs-assets-tools/STAKEHOLDERS.md')),
            roadmap: fs.existsSync(path.join(projectPath, '02-goals-and-roadmap/ROADMAP.md')),
        };
    }
    /**
     * Detect specifications (for Spec-Driven integration tracking)
     */
    static detectSpecifications(projectPath) {
        const goalsWithSpecs = [];
        const selectedGoalsPath = path.join(projectPath, '02-goals-and-roadmap/selected-goals');
        if (!fs.existsSync(selectedGoalsPath)) {
            return goalsWithSpecs;
        }
        const entries = fs.readdirSync(selectedGoalsPath);
        entries.forEach(entry => {
            const specPath = path.join(selectedGoalsPath, entry, 'spec/specification.md');
            if (fs.existsSync(specPath)) {
                goalsWithSpecs.push(entry);
            }
        });
        return goalsWithSpecs;
    }
    /**
     * Compare two arrays and find differences
     */
    static arrayDifference(detected, stored) {
        const added = detected.filter(item => !stored.includes(item));
        const removed = stored.filter(item => !detected.includes(item));
        return { added, removed };
    }
    /**
     * Check if two arrays are equal (ignoring order)
     */
    static arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length)
            return false;
        const sorted1 = [...arr1].sort();
        const sorted2 = [...arr2].sort();
        return sorted1.every((val, index) => val === sorted2[index]);
    }
}
//# sourceMappingURL=state-detector.js.map