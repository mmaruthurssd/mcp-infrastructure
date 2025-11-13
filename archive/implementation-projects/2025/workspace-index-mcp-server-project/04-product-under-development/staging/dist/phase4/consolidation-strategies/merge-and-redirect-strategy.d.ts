import { ConfigurableWorkspaceAdapter } from '../../adapters/workspace-adapter.js';
import { IConsolidationStrategy, ConsolidationPlan, ConsolidationResult } from './types.js';
/**
 * Merge-and-Redirect Consolidation Strategy
 *
 * Approach:
 * 1. Merge all unique content into single comprehensive document
 * 2. Archive original files
 * 3. Create redirect stubs pointing to merged document
 * 4. Update all cross-references
 *
 * Best for: Highly redundant documentation with no audience differentiation
 */
export declare class MergeAndRedirectStrategy implements IConsolidationStrategy {
    private adapter;
    constructor(adapter: ConfigurableWorkspaceAdapter);
    getName(): string;
    getDescription(): string;
    /**
     * Analyze files and create merge plan
     */
    analyze(files: string[], overlaps: any[]): Promise<ConsolidationPlan>;
    /**
     * Execute merge and redirect
     */
    execute(plan: ConsolidationPlan, dryRun?: boolean): Promise<ConsolidationResult>;
    /**
     * Determine the target file for merged content
     */
    private determineTargetFile;
    /**
     * Merge content from multiple files into one
     */
    private mergeFiles;
    /**
     * Extract unique content not already present in merged document
     */
    private extractUniqueContent;
    /**
     * Create a redirect stub file
     */
    private createRedirectStub;
}
