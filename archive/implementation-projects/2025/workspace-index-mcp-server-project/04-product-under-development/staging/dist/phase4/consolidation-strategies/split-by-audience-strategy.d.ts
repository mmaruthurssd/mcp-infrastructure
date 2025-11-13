import { ConfigurableWorkspaceAdapter } from '../../adapters/workspace-adapter.js';
import { IConsolidationStrategy, ConsolidationPlan, ConsolidationResult } from './types.js';
/**
 * Split-by-Audience Consolidation Strategy
 *
 * Approach:
 * 1. Detect if files serve different audiences (technical vs non-technical)
 * 2. If audiences are different, recommend NO consolidation
 * 3. If audiences overlap, suggest adding cross-references
 * 4. Keep all files intact
 *
 * Best for: Documentation serving different user groups
 */
export declare class SplitByAudienceStrategy implements IConsolidationStrategy {
    private adapter;
    constructor(adapter: ConfigurableWorkspaceAdapter);
    getName(): string;
    getDescription(): string;
    /**
     * Analyze files to detect audience differences
     */
    analyze(files: string[], overlaps: any[]): Promise<ConsolidationPlan>;
    /**
     * Execute consolidation plan
     */
    execute(plan: ConsolidationPlan, dryRun?: boolean): Promise<ConsolidationResult>;
    /**
     * Detect the intended audience of a document
     */
    private detectAudience;
    /**
     * Add cross-references to related documentation
     */
    private addCrossReferences;
}
