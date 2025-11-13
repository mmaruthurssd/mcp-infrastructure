import { ConfigurableWorkspaceAdapter } from '../../adapters/workspace-adapter.js';
import { IConsolidationStrategy, ConsolidationPlan, ConsolidationResult } from './types.js';
/**
 * Hierarchical Consolidation Strategy
 *
 * Approach:
 * 1. Identify the most comprehensive document as primary
 * 2. Remove duplicate sections from secondary documents
 * 3. Add reference links pointing to primary document
 * 4. Keep all files, just reduce redundancy
 *
 * Best for: Technical documentation where one file is clearly comprehensive
 */
export declare class HierarchicalStrategy implements IConsolidationStrategy {
    private adapter;
    constructor(adapter: ConfigurableWorkspaceAdapter);
    getName(): string;
    getDescription(): string;
    /**
     * Analyze files and create consolidation plan
     */
    analyze(files: string[], overlaps: any[]): Promise<ConsolidationPlan>;
    /**
     * Execute consolidation plan
     */
    execute(plan: ConsolidationPlan, dryRun?: boolean): Promise<ConsolidationResult>;
    /**
     * Identify the primary (most comprehensive) document
     */
    private identifyPrimaryDocument;
    /**
     * Identify sections in file that duplicate content in primary
     */
    private identifyDuplicateSections;
    /**
     * Remove specified sections from a file
     */
    private removeSectionsFromFile;
    /**
     * Add reference link to primary document
     */
    private addReferenceToFile;
}
