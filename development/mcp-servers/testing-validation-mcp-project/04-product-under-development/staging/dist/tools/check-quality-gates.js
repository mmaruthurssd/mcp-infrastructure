/**
 * Check Quality Gates Tool
 *
 * Execute ROLLOUT-CHECKLIST.md quality gates for production readiness.
 */
import { QualityGateValidator } from '../utils/quality-gate-validator.js';
export class CheckQualityGatesTool {
    /**
     * Get tool definition for MCP server
     */
    static getToolDefinition() {
        return {
            name: 'check_quality_gates',
            description: 'Execute ROLLOUT-CHECKLIST.md quality gates',
            inputSchema: {
                type: 'object',
                properties: {
                    mcpPath: {
                        type: 'string',
                        description: 'Path to MCP project root',
                    },
                    phase: {
                        type: 'string',
                        enum: ['pre-development', 'development', 'testing', 'documentation', 'pre-rollout', 'all'],
                        description: 'Phase to check (default: all)',
                    },
                },
                required: ['mcpPath'],
            },
        };
    }
    /**
     * Execute the tool
     */
    static async execute(input) {
        try {
            // Validate input
            if (!input.mcpPath) {
                return {
                    success: false,
                    gates: {},
                    overall: {
                        passed: 0,
                        failed: 0,
                        percentComplete: 0,
                        readyForRollout: false,
                    },
                    blockers: ['mcpPath is required'],
                    warnings: [],
                    error: 'mcpPath is required',
                };
            }
            // Create validator and execute
            const validator = new QualityGateValidator(input.mcpPath, input.phase);
            const result = await validator.validate();
            // Add formatted summary
            const formatted = this.formatResults(result);
            return {
                ...result,
                formatted,
            };
        }
        catch (error) {
            return {
                success: false,
                gates: {},
                overall: {
                    passed: 0,
                    failed: 0,
                    percentComplete: 0,
                    readyForRollout: false,
                },
                blockers: [`Tool execution failed: ${error}`],
                warnings: [],
                error: `Tool execution failed: ${error}`,
            };
        }
    }
    /**
     * Format results for display
     */
    static formatResults(result) {
        const lines = [];
        lines.push('='.repeat(60));
        lines.push('QUALITY GATE RESULTS');
        lines.push('='.repeat(60));
        lines.push('');
        if (!result.success) {
            lines.push(`❌ Quality Gate Check Failed`);
            lines.push('');
            if (result.error) {
                lines.push(`Error: ${result.error}`);
            }
            return lines.join('\n');
        }
        // Overall status
        const { overall } = result;
        const statusIcon = overall.readyForRollout ? '✅' : '❌';
        lines.push(`Status: ${overall.percentComplete}% Complete ${statusIcon}`);
        lines.push(`Ready for Rollout: ${overall.readyForRollout ? 'YES ✅' : 'NO ❌'}`);
        lines.push(`Gates: ${overall.passed} passed, ${overall.failed} failed`);
        lines.push('');
        // Phase breakdown
        if (Object.keys(result.gates).length > 0) {
            lines.push('-'.repeat(60));
            lines.push('PHASE BREAKDOWN');
            lines.push('-'.repeat(60));
            lines.push('');
            for (const [phase, category] of Object.entries(result.gates)) {
                const phaseStatus = category.failed === 0 ? '✅' : '❌';
                lines.push(`${this.formatPhaseName(phase)} ${phaseStatus}`);
                lines.push(`  ${category.passed} passed, ${category.failed} failed`);
                lines.push('');
                // Show failed gates
                const failedGates = category.gates.filter((g) => g.status === 'fail');
                if (failedGates.length > 0) {
                    for (const gate of failedGates) {
                        const required = gate.required ? '[REQUIRED]' : '[OPTIONAL]';
                        lines.push(`  ❌ ${gate.name} ${required}`);
                        lines.push(`     ${gate.details}`);
                        if (gate.recommendation) {
                            lines.push(`     Fix: ${gate.recommendation}`);
                        }
                        lines.push('');
                    }
                }
            }
        }
        // Blockers
        if (result.blockers.length > 0) {
            lines.push('-'.repeat(60));
            lines.push('🚫 BLOCKERS (Must Fix Before Rollout)');
            lines.push('-'.repeat(60));
            lines.push('');
            for (const blocker of result.blockers) {
                lines.push(`  • ${blocker}`);
            }
            lines.push('');
        }
        // Warnings
        if (result.warnings.length > 0) {
            lines.push('-'.repeat(60));
            lines.push('⚠️  WARNINGS (Recommended to Fix)');
            lines.push('-'.repeat(60));
            lines.push('');
            for (const warning of result.warnings.slice(0, 5)) {
                lines.push(`  • ${warning}`);
            }
            if (result.warnings.length > 5) {
                lines.push(`  ... and ${result.warnings.length - 5} more warnings`);
            }
            lines.push('');
        }
        // Summary
        lines.push('-'.repeat(60));
        if (overall.readyForRollout) {
            lines.push('✅ READY FOR ROLLOUT');
            lines.push('');
            lines.push('All quality gates passed. MCP is ready for production deployment.');
        }
        else {
            lines.push('❌ NOT READY FOR ROLLOUT');
            lines.push('');
            lines.push(`${result.blockers.length} blocker(s) must be resolved before deployment.`);
            lines.push('Review the issues above and fix them before rolling out to production.');
        }
        lines.push('='.repeat(60));
        return lines.join('\n');
    }
    /**
     * Format phase name for display
     */
    static formatPhaseName(phase) {
        const names = {
            preDevelopment: 'Pre-Development',
            development: 'Development',
            testing: 'Testing',
            documentation: 'Documentation',
            preRollout: 'Pre-Rollout',
        };
        return names[phase] || phase;
    }
}
//# sourceMappingURL=check-quality-gates.js.map