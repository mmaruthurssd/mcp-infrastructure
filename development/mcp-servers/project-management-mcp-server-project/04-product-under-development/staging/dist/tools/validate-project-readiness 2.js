/**
 * Validate Project Readiness Tool
 *
 * Comprehensive validation to check if project is ready for completion/wrap-up
 */
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from 'workflow-orchestrator-mcp-server/dist/core/state-manager.js';
export class ValidateProjectReadinessTool {
    static execute(input) {
        const { projectPath } = input;
        // Read state
        const state = StateManager.read(projectPath);
        if (!state) {
            return {
                success: false,
                ready: false,
                completionPercentage: 0,
                checks: {
                    goals: this.createFailedCheck('goals', 'No orchestration state found'),
                    documentation: this.createFailedCheck('documentation', 'Cannot validate without state'),
                    deliverables: this.createFailedCheck('deliverables', 'Cannot validate without state'),
                    workflows: this.createFailedCheck('workflows', 'Cannot validate without state'),
                },
                summary: { totalChecks: 0, passed: 0, failed: 4 },
                blockers: ['Project orchestration not initialized'],
                recommendations: ['Run initialize_project_orchestration first'],
            };
        }
        // Run validation checks
        const goalsCheck = this.validateGoals(projectPath, state);
        const documentationCheck = this.validateDocumentation(projectPath, state);
        const deliverablesCheck = this.validateDeliverables(projectPath, state);
        const workflowsCheck = this.validateWorkflows(projectPath, state);
        // Calculate summary
        const checks = [goalsCheck, documentationCheck, deliverablesCheck, workflowsCheck];
        const totalChecks = checks.length;
        const passed = checks.filter(c => c.passed).length;
        const failed = totalChecks - passed;
        // Collect all blockers
        const blockers = [];
        checks.forEach(check => {
            if (check.blockers.length > 0) {
                blockers.push(...check.blockers);
            }
        });
        // Calculate completion percentage
        const completionPercentage = Math.round((passed / totalChecks) * 100);
        // Generate recommendations
        const recommendations = this.generateRecommendations(checks);
        // Determine if ready
        const ready = blockers.length === 0 && completionPercentage === 100;
        return {
            success: true,
            ready,
            completionPercentage,
            checks: {
                goals: goalsCheck,
                documentation: documentationCheck,
                deliverables: deliverablesCheck,
                workflows: workflowsCheck,
            },
            summary: { totalChecks, passed, failed },
            blockers,
            recommendations,
        };
    }
    /**
     * Validate goals status
     */
    static validateGoals(projectPath, state) {
        const details = [];
        const blockers = [];
        // Check selected goals
        if (state.goals.selected.length > 0) {
            blockers.push(`${state.goals.selected.length} goal(s) still in selected - complete or archive them`);
            details.push(`❌ ${state.goals.selected.length} selected goal(s) not yet completed`);
        }
        else {
            details.push('✅ No goals in selected (all addressed)');
        }
        // Check completed goals
        if (state.goals.completed.length > 0) {
            details.push(`✅ ${state.goals.completed.length} goal(s) completed and archived`);
        }
        else {
            details.push('⚠️  No completed goals archived');
        }
        // Check for potential goals
        if (state.goals.potential.length > 0) {
            details.push(`ℹ️  ${state.goals.potential.length} potential goal(s) remain (optional)`);
        }
        const passed = blockers.length === 0;
        return {
            category: 'Goals',
            passed,
            details,
            blockers,
        };
    }
    /**
     * Validate documentation completeness
     */
    static validateDocumentation(projectPath, state) {
        const details = [];
        const blockers = [];
        const requiredDocs = [
            { file: 'README.md', name: 'README' },
            { file: 'EVENT-LOG.md', name: 'Event Log' },
            { file: 'NEXT-STEPS.md', name: 'Next Steps' },
            { file: '03-resources-docs-assets-tools/docs/PROJECT-METADATA.md', name: 'Project Metadata' },
        ];
        requiredDocs.forEach(doc => {
            const fullPath = path.join(projectPath, doc.file);
            if (fs.existsSync(fullPath)) {
                // Check if file is non-empty and doesn't have TODO/TBD placeholders
                const content = fs.readFileSync(fullPath, 'utf8');
                if (content.trim().length === 0) {
                    blockers.push(`${doc.name} is empty`);
                    details.push(`❌ ${doc.name}: empty file`);
                }
                else if (content.includes('TODO') || content.includes('TBD')) {
                    blockers.push(`${doc.name} has TODO/TBD placeholders`);
                    details.push(`⚠️  ${doc.name}: contains TODO/TBD`);
                }
                else {
                    details.push(`✅ ${doc.name}: complete`);
                }
            }
            else {
                blockers.push(`${doc.name} missing`);
                details.push(`❌ ${doc.name}: not found`);
            }
        });
        const passed = blockers.length === 0;
        return {
            category: 'Documentation',
            passed,
            details,
            blockers,
        };
    }
    /**
     * Validate deliverables
     */
    static validateDeliverables(projectPath, state) {
        const details = [];
        const blockers = [];
        // Check if goals have specifications
        const selectedGoalsPath = path.join(projectPath, '02-goals-and-roadmap/selected-goals');
        if (fs.existsSync(selectedGoalsPath)) {
            const goalFolders = fs.readdirSync(selectedGoalsPath).filter(f => fs.statSync(path.join(selectedGoalsPath, f)).isDirectory());
            goalFolders.forEach(goal => {
                const specPath = path.join(selectedGoalsPath, goal, 'spec/specification.md');
                if (fs.existsSync(specPath)) {
                    details.push(`✅ Goal '${goal}' has specification`);
                }
                else {
                    details.push(`⚠️  Goal '${goal}' missing specification`);
                }
            });
        }
        // Check constitution exists
        const constitutionPath = path.join(projectPath, 'brainstorming/future-goals/CONSTITUTION.md');
        if (fs.existsSync(constitutionPath)) {
            details.push('✅ Project constitution exists');
        }
        else {
            blockers.push('Constitution missing');
            details.push('❌ Project constitution not found');
        }
        // Check roadmap exists
        const roadmapPath = path.join(projectPath, '02-goals-and-roadmap/ROADMAP.md');
        if (fs.existsSync(roadmapPath)) {
            details.push('✅ Project roadmap exists');
        }
        else {
            details.push('⚠️  Project roadmap not found');
        }
        const passed = blockers.length === 0;
        return {
            category: 'Deliverables',
            passed,
            details,
            blockers,
        };
    }
    /**
     * Validate workflows status
     */
    static validateWorkflows(projectPath, state) {
        const details = [];
        const blockers = [];
        // Check active workflows
        if (state.integrations.taskExecutor.activeWorkflows.length > 0) {
            blockers.push(`${state.integrations.taskExecutor.activeWorkflows.length} active workflow(s) - archive them before completion`);
            details.push(`❌ ${state.integrations.taskExecutor.activeWorkflows.length} workflow(s) still active`);
        }
        else {
            details.push('✅ No active workflows');
        }
        // Check for archived workflows
        const archivedPath = path.join(projectPath, 'archive/workflows');
        if (fs.existsSync(archivedPath)) {
            const archived = fs.readdirSync(archivedPath).filter(f => fs.statSync(path.join(archivedPath, f)).isDirectory());
            if (archived.length > 0) {
                details.push(`✅ ${archived.length} workflow(s) archived`);
            }
        }
        // Check temp folder
        const tempPath = path.join(projectPath, 'temp');
        if (fs.existsSync(tempPath)) {
            const tempContents = fs.readdirSync(tempPath);
            if (tempContents.length > 0) {
                blockers.push('temp/ directory has content - clean up before completion');
                details.push(`⚠️  temp/ has ${tempContents.length} item(s)`);
            }
            else {
                details.push('✅ temp/ directory clean');
            }
        }
        const passed = blockers.length === 0;
        return {
            category: 'Workflows',
            passed,
            details,
            blockers,
        };
    }
    /**
     * Generate recommendations based on checks
     */
    static generateRecommendations(checks) {
        const recommendations = [];
        checks.forEach(check => {
            if (!check.passed) {
                if (check.category === 'Goals' && check.blockers.some(b => b.includes('selected'))) {
                    recommendations.push('Complete or archive selected goals using archive_goal tool');
                }
                if (check.category === 'Documentation' && check.blockers.some(b => b.includes('TODO'))) {
                    recommendations.push('Resolve all TODO/TBD placeholders in documentation');
                }
                if (check.category === 'Workflows' && check.blockers.some(b => b.includes('active'))) {
                    recommendations.push('Archive active workflows using task-executor MCP');
                }
                if (check.category === 'Workflows' && check.blockers.some(b => b.includes('temp'))) {
                    recommendations.push('Clean up temp/ directory or move content to archive/');
                }
            }
        });
        if (recommendations.length === 0) {
            recommendations.push('✅ Project ready for wrap-up! Use wrap_up_project tool.');
        }
        return recommendations;
    }
    /**
     * Create a failed check result
     */
    static createFailedCheck(category, blocker) {
        return {
            category,
            passed: false,
            details: [`❌ ${blocker}`],
            blockers: [blocker],
        };
    }
    static formatResult(result) {
        let output = '='.repeat(70) + '\n';
        output += '  PROJECT READINESS VALIDATION\n';
        output += '='.repeat(70) + '\n\n';
        if (!result.success) {
            output += '❌ Validation failed\n';
            if (result.blockers.length > 0) {
                output += '\nBlockers:\n';
                result.blockers.forEach(b => output += `   - ${b}\n`);
            }
            return output;
        }
        // Summary
        output += `📊 Completion: ${result.completionPercentage}%\n`;
        output += `✅ Passed: ${result.summary.passed}/${result.summary.totalChecks} checks\n`;
        output += `🎯 Ready: ${result.ready ? '✅ YES' : '❌ NO'}\n`;
        output += '\n' + '─'.repeat(70) + '\n\n';
        // Detailed checks
        output += '📋 VALIDATION CHECKS\n\n';
        Object.entries(result.checks).forEach(([key, check]) => {
            const icon = check.passed ? '✅' : '❌';
            output += `${icon} ${check.category}\n`;
            check.details.forEach(detail => {
                output += `   ${detail}\n`;
            });
            output += '\n';
        });
        // Blockers
        if (result.blockers.length > 0) {
            output += '─'.repeat(70) + '\n\n';
            output += '🚫 BLOCKERS\n\n';
            result.blockers.forEach(blocker => {
                output += `   ⚠️  ${blocker}\n`;
            });
            output += '\n';
        }
        // Recommendations
        if (result.recommendations.length > 0) {
            output += '─'.repeat(70) + '\n\n';
            output += '💡 RECOMMENDATIONS\n\n';
            result.recommendations.forEach(rec => {
                output += `   ${rec}\n`;
            });
            output += '\n';
        }
        output += '='.repeat(70) + '\n';
        return output;
    }
    static getToolDefinition() {
        return {
            name: 'validate_project_readiness',
            description: 'Validate if project is ready for completion. Performs comprehensive checks on goals, documentation, deliverables, and workflows. Returns detailed validation report with blockers and recommendations.',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to the project directory',
                    },
                },
                required: ['projectPath'],
            },
        };
    }
}
//# sourceMappingURL=validate-project-readiness%202.js.map