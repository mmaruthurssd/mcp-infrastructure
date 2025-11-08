/**
 * Wrap Up Project Tool
 *
 * Final validation and project archiving with completion report
 */
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from 'workflow-orchestrator-mcp-server/dist/core/state-manager.js';
import { ValidateProjectReadinessTool } from './validate-project-readiness.js';
export class WrapUpProjectTool {
    static execute(input) {
        const { projectPath, skipValidation = false, notes } = input;
        // Read state
        const state = StateManager.read(projectPath);
        if (!state) {
            return {
                success: false,
                validationPassed: false,
                warnings: [],
                message: 'No orchestration state found. Cannot wrap up uninitialized project.',
            };
        }
        const warnings = [];
        // Run final validation (unless skipped)
        if (!skipValidation) {
            const validation = ValidateProjectReadinessTool.execute({ projectPath });
            if (!validation.ready) {
                return {
                    success: false,
                    validationPassed: false,
                    warnings: validation.blockers,
                    message: `Project not ready for wrap-up. ${validation.blockers.length} blocker(s) found. Fix blockers or use skipValidation: true to override.`,
                };
            }
            if (validation.recommendations.length > 0) {
                warnings.push(...validation.recommendations);
            }
        }
        else {
            warnings.push('⚠️  Validation skipped - proceeding without checks');
        }
        // Mark completion phase as complete
        state.currentPhase = 'completion';
        state.phases.completion.status = 'complete';
        state.phases.completion.completedAt = new Date().toISOString();
        // Update all completion steps
        state.phases.completion.steps.forEach((step) => {
            step.status = 'complete';
            step.completedAt = new Date().toISOString();
        });
        // Save updated state
        StateManager.write(projectPath, state);
        // Generate completion report
        const reportPath = this.generateCompletionReport(projectPath, state, notes);
        // Create final state backup
        StateManager.backup(projectPath);
        return {
            success: true,
            completionReportPath: reportPath,
            validationPassed: !skipValidation,
            warnings,
            message: 'Project wrapped up successfully! Completion report generated.',
        };
    }
    /**
     * Generate completion report
     */
    static generateCompletionReport(projectPath, state, notes) {
        const now = new Date();
        const reportPath = path.join(projectPath, 'PROJECT-COMPLETION-REPORT.md');
        let content = '';
        content += '---\n';
        content += 'type: report\n';
        content += 'tags: [completion, retrospective, metrics]\n';
        content += '---\n\n';
        content += '# Project Completion Report\n\n';
        content += `**Project:** ${state.projectName}\n`;
        content += `**Completed:** ${now.toISOString().split('T')[0]}\n`;
        content += `**Duration:** ${this.calculateDuration(state.created, now.toISOString())}\n`;
        content += '\n---\n\n';
        // Executive Summary
        content += '## Executive Summary\n\n';
        content += `Project **${state.projectName}** has been successfully completed.\n\n`;
        const totalGoals = state.goals.potential.length + state.goals.selected.length + state.goals.completed.length;
        content += `- **Total Goals:** ${totalGoals}\n`;
        content += `  - Potential: ${state.goals.potential.length}\n`;
        content += `  - Selected: ${state.goals.selected.length}\n`;
        content += `  - Completed: ${state.goals.completed.length}\n\n`;
        content += `- **Workflows Completed:** ${state.integrations.taskExecutor.totalWorkflowsCreated || 0}\n`;
        content += `- **Spec-Driven Used:** ${state.integrations.specDriven.used ? 'Yes' : 'No'}\n`;
        content += '\n';
        // Phase Timeline
        content += '## Phase Timeline\n\n';
        const phases = ['initialization', 'goal-development', 'execution', 'completion'];
        phases.forEach(phase => {
            const phaseInfo = state.phases[phase];
            if (phaseInfo.status === 'complete') {
                const duration = this.calculateDuration(phaseInfo.startedAt, phaseInfo.completedAt);
                content += `- **${phase}**: ${duration}\n`;
            }
        });
        content += '\n';
        // Goals Achieved
        content += '## Goals Achieved\n\n';
        if (state.goals.completed.length > 0) {
            state.goals.completed.forEach((goal) => {
                content += `- ✅ ${goal}\n`;
            });
        }
        else {
            content += '*No goals marked as completed*\n';
        }
        content += '\n';
        // Goals Deferred
        if (state.goals.potential.length > 0) {
            content += '## Goals Deferred\n\n';
            state.goals.potential.forEach((goal) => {
                content += `- 📋 ${goal}\n`;
            });
            content += '\n';
        }
        // Metrics
        content += '## Metrics\n\n';
        content += '| Metric | Value |\n';
        content += '|--------|-------|\n';
        content += `| Total Duration | ${this.calculateDuration(state.created, now.toISOString())} |\n`;
        content += `| Goals Completed | ${state.goals.completed.length} |\n`;
        content += `| Workflows Created | ${state.integrations.taskExecutor.totalWorkflowsCreated || 0} |\n`;
        content += `| Specifications Created | ${state.integrations.specDriven.goalsWithSpecs.length} |\n`;
        content += '\n';
        // Completion Notes
        if (notes) {
            content += '## Completion Notes\n\n';
            content += notes + '\n\n';
        }
        // Next Steps / Handoff
        content += '## Next Steps\n\n';
        content += '- [ ] Review completion report\n';
        content += '- [ ] Archive project repository\n';
        content += '- [ ] Communicate completion to stakeholders\n';
        content += '- [ ] Transfer knowledge if needed\n';
        content += '- [ ] Update project registry\n';
        content += '\n';
        // Appendix
        content += '## Appendix\n\n';
        content += '### File Locations\n\n';
        content += '- **State File:** `.ai-planning/project-state.json`\n';
        content += '- **Goals:** `02-goals-and-roadmap/`\n';
        content += '- **Documentation:** `03-resources-docs-assets-tools/docs/`\n';
        content += '- **Archived Workflows:** `archive/workflows/`\n';
        content += '\n';
        content += '---\n\n';
        content += `*Report generated by Project Management MCP Server v${this.getServerVersion()}*\n`;
        fs.writeFileSync(reportPath, content, 'utf8');
        return reportPath;
    }
    /**
     * Calculate duration between two ISO timestamps
     */
    static calculateDuration(start, end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            return `${diffHours} hour(s)`;
        }
        else if (diffDays < 30) {
            return `${diffDays} day(s)`;
        }
        else {
            const months = Math.floor(diffDays / 30);
            const days = diffDays % 30;
            return `${months} month(s), ${days} day(s)`;
        }
    }
    /**
     * Get server version
     */
    static getServerVersion() {
        return '0.9.0';
    }
    static formatResult(result) {
        let output = '='.repeat(70) + '\n';
        output += '  PROJECT WRAP-UP\n';
        output += '='.repeat(70) + '\n\n';
        if (!result.success) {
            output += `❌ ${result.message}\n\n`;
            if (result.warnings.length > 0) {
                output += '🚫 Blockers:\n';
                result.warnings.forEach(w => {
                    output += `   - ${w}\n`;
                });
            }
            return output;
        }
        output += '🎉 PROJECT COMPLETED!\n\n';
        output += `✅ ${result.message}\n\n`;
        if (result.completionReportPath) {
            output += `📊 Completion Report: ${result.completionReportPath}\n`;
        }
        output += `✓ Validation: ${result.validationPassed ? 'Passed' : 'Skipped'}\n`;
        output += '\n';
        if (result.warnings.length > 0) {
            output += '─'.repeat(70) + '\n\n';
            output += '⚠️  Notes:\n';
            result.warnings.forEach(w => {
                output += `   ${w}\n`;
            });
            output += '\n';
        }
        output += '─'.repeat(70) + '\n\n';
        output += '🎯 NEXT STEPS\n\n';
        output += '   1. Review completion report\n';
        output += '   2. Archive project repository\n';
        output += '   3. Communicate completion to stakeholders\n';
        output += '   4. Transfer knowledge if needed\n';
        output += '\n';
        output += '💡 TIP: Validate workspace documentation to ensure it reflects the project completion:\n';
        output += '   workspace-index.validate_workspace_documentation()\n';
        output += '\n';
        output += '='.repeat(70) + '\n';
        return output;
    }
    static getToolDefinition() {
        return {
            name: 'wrap_up_project',
            description: 'Finalize project with validation and completion report. Marks all phases complete, generates comprehensive completion report with metrics and timeline. Use after all goals completed and validation passed.',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to the project directory',
                    },
                    skipValidation: {
                        type: 'boolean',
                        description: 'Skip final validation (not recommended, default: false)',
                    },
                    notes: {
                        type: 'string',
                        description: 'Optional completion notes to include in report',
                    },
                },
                required: ['projectPath'],
            },
        };
    }
}
//# sourceMappingURL=wrap-up-project.js.map