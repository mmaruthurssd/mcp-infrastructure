/**
 * Preventive Check Generator
 * Generates preventive checks from promoted issues
 */
import { TrackedIssue } from './types.js';
export declare class PreventiveCheckGenerator {
    private projectRoot;
    constructor(projectRoot: string);
    /**
     * Generate preventive check from issue
     */
    generatePreventiveCheck(issue: TrackedIssue): string;
    /**
     * Generate check title from issue
     */
    private generateCheckTitle;
    /**
     * Generate check script from issue solution
     */
    private generateCheckScript;
    /**
     * Add preventive checks to knowledge base file
     */
    addPreventiveChecks(knowledgeBaseFile: string, promotedIssues: TrackedIssue[]): Promise<void>;
}
//# sourceMappingURL=preventive-generator.d.ts.map