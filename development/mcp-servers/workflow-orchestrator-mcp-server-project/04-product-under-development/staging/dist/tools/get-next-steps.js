/**
 * Get Next Steps Tool
 *
 * Analyzes project state and suggests next actions with ready-to-execute tool calls
 *
 * NOTE: Currently supports project-planning workflow type.
 * StateDetector and progress calculation are coupled to ProjectState structure.
 * Future enhancement: Make these components workflow-agnostic via configuration.
 */
import { StateManager } from '../core/state-manager.js';
import { RuleEngine } from '../core/rule-engine.js';
import { StateDetector } from '../core/state-detector.js';
export class GetNextStepsTool {
    static execute(input) {
        const { projectPath, maxSuggestions = 5, skipSync = false } = input;
        // Read project state
        let state = StateManager.read(projectPath);
        if (!state) {
            return {
                success: false,
                currentPhase: 'unknown',
                currentStep: 'unknown',
                progress: '0%',
                nextActions: [],
                blockers: ['No orchestration state found. Run initialize_project_orchestration first.'],
                warnings: [],
                message: 'Project orchestration not initialized',
            };
        }
        // Auto-sync state with file system (unless skipped)
        let syncedChanges = [];
        if (!skipSync) {
            const syncResult = StateDetector.syncState(projectPath, state);
            if (syncResult.updated) {
                StateManager.write(projectPath, state);
                syncedChanges = syncResult.changes;
            }
        }
        // Create rule engine and evaluate
        const ruleEngine = new RuleEngine();
        const matches = ruleEngine.evaluate({ projectPath, state });
        // Convert matches to suggestions with priority buckets
        const nextActions = matches
            .slice(0, maxSuggestions)
            .map(match => this.matchToSuggestion(match));
        // Calculate progress
        const progress = this.calculateProgress(state);
        // Detect blockers
        const blockers = this.detectBlockers(state, projectPath);
        // Detect warnings
        const warnings = this.detectWarnings(state, projectPath);
        return {
            success: true,
            currentPhase: state.currentPhase,
            currentStep: state.currentStep,
            progress,
            nextActions,
            blockers,
            warnings,
            syncedChanges: syncedChanges.length > 0 ? syncedChanges : undefined,
        };
    }
    /**
     * Convert rule match to suggestion with priority categorization
     */
    static matchToSuggestion(match) {
        let priority;
        if (match.priority >= 80) {
            priority = 'high';
        }
        else if (match.priority >= 60) {
            priority = 'medium';
        }
        else {
            priority = 'low';
        }
        return {
            priority,
            action: match.action,
            reason: match.reason,
            tool: match.tool,
            params: match.params,
            ruleId: match.ruleId,
        };
    }
    /**
     * Calculate overall progress percentage
     *
     * NOTE: Hardcoded for project-planning workflow phases.
     * To support other workflows, phase names should come from workflow configuration.
     */
    static calculateProgress(state) {
        const phases = ['initialization', 'goal-development', 'execution', 'completion'];
        let completedPhases = 0;
        for (const phase of phases) {
            if (state.phases[phase]?.status === 'complete') {
                completedPhases++;
            }
        }
        // Calculate percentage based on phase completion
        const phaseProgress = (completedPhases / phases.length) * 100;
        // Add partial credit for current phase
        const currentPhaseInfo = state.phases[state.currentPhase];
        if (currentPhaseInfo && currentPhaseInfo.status === 'in-progress') {
            const totalSteps = currentPhaseInfo.steps.length;
            const completedSteps = currentPhaseInfo.steps.filter(s => s.status === 'complete').length;
            const stepProgress = (completedSteps / totalSteps) * (100 / phases.length);
            return `${Math.round(phaseProgress + stepProgress)}%`;
        }
        return `${Math.round(phaseProgress)}%`;
    }
    /**
     * Detect project blockers
     *
     * NOTE: ProjectState-specific - checks goals and integrations fields.
     * For other workflows, blocker detection logic would need to be configured.
     */
    static detectBlockers(state, projectPath) {
        const blockers = [];
        // Check for goals marked as blocked (if that status exists)
        if (state.goals.selected) {
            // Would need to read goal files to check status - simplified for now
        }
        // Check for missing required files in current phase
        if (state.currentPhase === 'initialization') {
            // Could check for required initialization files
        }
        return blockers;
    }
    /**
     * Detect warnings
     *
     * NOTE: ProjectState-specific - checks goals and integrations fields.
     * For other workflows, warning detection logic would need to be configured.
     */
    static detectWarnings(state, projectPath) {
        const warnings = [];
        // Warn if no actions suggested
        // (Will be checked by caller)
        // Warn if stuck in same step for too long
        // (Would need step history - future enhancement)
        // Warn if goals exist but no recent activity
        if (state.goals.selected.length > 0 && state.integrations.taskExecutor.activeWorkflows.length === 0) {
            warnings.push('Selected goals exist but no active workflows');
        }
        return warnings;
    }
    static formatResult(result) {
        let output = '='.repeat(70) + '\n';
        output += '  NEXT STEPS ANALYSIS\n';
        output += '='.repeat(70) + '\n\n';
        if (!result.success) {
            output += `❌ Error: ${result.message}\n`;
            if (result.blockers.length > 0) {
                output += '\n🚫 Blockers:\n';
                result.blockers.forEach(blocker => {
                    output += `   - ${blocker}\n`;
                });
            }
            return output;
        }
        // Status section
        output += `📍 Current Phase: ${result.currentPhase}\n`;
        output += `📌 Current Step: ${result.currentStep}\n`;
        output += `📊 Overall Progress: ${result.progress}\n`;
        output += '\n' + '─'.repeat(70) + '\n\n';
        // Next actions
        if (result.nextActions.length > 0) {
            output += '🎯 SUGGESTED NEXT ACTIONS\n\n';
            result.nextActions.forEach((action, index) => {
                const priorityEmoji = action.priority === 'high' ? '🔴' : action.priority === 'medium' ? '🟡' : '🟢';
                output += `${index + 1}. ${priorityEmoji} [${action.priority.toUpperCase()}] ${action.action}\n`;
                output += `   Why: ${action.reason}\n`;
                output += `   Tool: ${action.tool}\n`;
                output += `   Params: ${JSON.stringify(action.params, null, 2).split('\n').map((line, i) => i === 0 ? line : '           ' + line).join('\n')}\n`;
                output += '\n';
            });
        }
        else {
            output += '✅ No immediate actions required\n';
            output += '   All steps in current phase are complete.\n\n';
        }
        // Blockers
        if (result.blockers.length > 0) {
            output += '─'.repeat(70) + '\n\n';
            output += '🚫 BLOCKERS\n\n';
            result.blockers.forEach(blocker => {
                output += `   ⚠️  ${blocker}\n`;
            });
            output += '\n';
        }
        // Warnings
        if (result.warnings.length > 0) {
            output += '─'.repeat(70) + '\n\n';
            output += '⚠️  WARNINGS\n\n';
            result.warnings.forEach(warning => {
                output += `   • ${warning}\n`;
            });
            output += '\n';
        }
        // Synced changes
        if (result.syncedChanges && result.syncedChanges.length > 0) {
            output += '─'.repeat(70) + '\n\n';
            output += '🔄 AUTO-SYNCED CHANGES\n\n';
            result.syncedChanges.forEach(change => {
                output += `   ✓ ${change}\n`;
            });
            output += '\n';
        }
        output += '='.repeat(70) + '\n';
        return output;
    }
    static getToolDefinition() {
        return {
            name: 'get_next_steps',
            description: 'Analyze project state and get intelligent suggestions for next actions. Returns prioritized suggestions with ready-to-execute tool calls and parameters.',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to the project directory',
                    },
                    maxSuggestions: {
                        type: 'number',
                        description: 'Maximum number of suggestions to return (default: 5)',
                    },
                    skipSync: {
                        type: 'boolean',
                        description: 'Skip auto-sync with file system (default: false)',
                    },
                },
                required: ['projectPath'],
            },
        };
    }
}
//# sourceMappingURL=get-next-steps.js.map