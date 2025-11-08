/**
 * Optimization Engine
 * Orchestrates the optimization process
 */
import { DomainConfig, OptimizationTrigger, OptimizationResult } from './types.js';
export declare class OptimizerEngine {
    private issueTracker;
    private categorizer;
    private duplicateDetector;
    private reviewWorkflow;
    private validator;
    constructor(projectRoot: string);
    /**
     * Check if optimization should be triggered
     */
    checkOptimizationTriggers(knowledgeBaseFile: string, config: DomainConfig): Promise<OptimizationTrigger[]>;
    /**
     * Execute full optimization
     */
    optimize(knowledgeBaseFile: string, config: DomainConfig): Promise<OptimizationResult>;
    /**
     * Estimate prevention rate based on issue characteristics
     */
    private estimatePreventionRate;
}
//# sourceMappingURL=optimizer.d.ts.map