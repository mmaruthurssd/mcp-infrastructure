import { ConfigurableWorkspaceAdapter } from '../adapters/workspace-adapter.js';
import { ConsolidationStrategyType, ConsolidationPlan, ConsolidationResult } from './consolidation-strategies/index.js';
import { OperationResult } from './types.js';
/**
 * Execution options for consolidation
 */
export interface ConsolidationExecutionOptions {
    /** Run in dry-run mode (no actual changes) */
    dryRun?: boolean;
    /** Create backup before execution */
    createBackup?: boolean;
    /** Strategy to use */
    strategy: ConsolidationStrategyType;
    /** Files to consolidate */
    files: string[];
    /** Overlap analysis data */
    overlaps?: any[];
    /** Reason for consolidation (for audit trail) */
    reason?: string;
}
/**
 * Consolidation execution result with full audit trail
 */
export interface ConsolidationExecutionResult extends OperationResult {
    backupPath?: string;
    consolidationResult?: ConsolidationResult;
    plan?: ConsolidationPlan;
}
/**
 * ConsolidationExecutor - Orchestrates the entire consolidation workflow
 *
 * Workflow:
 * 1. Create backup (if enabled)
 * 2. Select and initialize strategy
 * 3. Generate consolidation plan
 * 4. Execute strategy (with dry-run support)
 * 5. Validate results
 * 6. Create audit trail
 * 7. Support rollback if needed
 */
export declare class ConsolidationExecutor {
    private adapter;
    private backupManager;
    private strategies;
    constructor(adapter: ConfigurableWorkspaceAdapter);
    /**
     * Execute consolidation with full workflow
     */
    execute(options: ConsolidationExecutionOptions): Promise<ConsolidationExecutionResult>;
    /**
     * Rollback consolidation using backup
     */
    rollback(backupPath: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Preview consolidation without executing
     */
    preview(strategy: ConsolidationStrategyType, files: string[], overlaps?: any[]): Promise<ConsolidationPlan>;
    /**
     * Validate consolidation results
     */
    private validateConsolidation;
    /**
     * List available backups
     */
    listBackups(): Promise<Array<{
        path: string;
        metadata: any;
    }>>;
    /**
     * Get available strategies
     */
    getAvailableStrategies(): ConsolidationStrategyType[];
    /**
     * Get strategy description
     */
    getStrategyDescription(strategy: ConsolidationStrategyType): string;
}
