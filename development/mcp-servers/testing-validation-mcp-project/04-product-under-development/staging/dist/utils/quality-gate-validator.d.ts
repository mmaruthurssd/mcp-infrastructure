/**
 * QualityGateValidator Utility
 *
 * Validates MCP implementations against ROLLOUT-CHECKLIST.md quality gates.
 * Executes comprehensive checks for production readiness.
 */
import type { CheckQualityGatesOutput } from '../types.js';
export declare class QualityGateValidator {
    private mcpPath;
    private phase;
    constructor(mcpPath: string, phase?: string);
    /**
     * Validate quality gates
     */
    validate(): Promise<CheckQualityGatesOutput>;
    /**
     * Validate pre-development gates
     */
    private validatePreDevelopment;
    /**
     * Validate development gates
     */
    private validateDevelopment;
    /**
     * Validate testing gates
     */
    private validateTesting;
    /**
     * Validate documentation gates
     */
    private validateDocumentation;
    /**
     * Validate pre-rollout gates
     */
    private validatePreRollout;
    /**
     * Create gate category from gates
     */
    private createGateCategory;
    /**
     * Identify blockers (critical failures)
     */
    private identifyBlockers;
    /**
     * Identify warnings (non-critical failures)
     */
    private identifyWarnings;
    /**
     * Create error result
     */
    private createErrorResult;
}
//# sourceMappingURL=quality-gate-validator.d.ts.map