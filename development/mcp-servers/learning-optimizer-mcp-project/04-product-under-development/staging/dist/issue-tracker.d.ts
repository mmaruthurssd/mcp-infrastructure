/**
 * Issue Tracker
 * Tracks issues in markdown knowledge base files
 */
import { TrackedIssue, IssueContext, KnowledgeBase } from './types.js';
export declare class IssueTracker {
    private projectRoot;
    constructor(projectRoot: string);
    /**
     * Track a new issue or update existing one
     */
    trackIssue(knowledgeBaseFile: string, issue: {
        title: string;
        symptom: string;
        rootCause?: string;
        solution: string;
        prevention?: string;
        context: IssueContext;
    }): Promise<TrackedIssue>;
    /**
     * Find similar issue by symptom
     */
    private findSimilarIssue;
    /**
     * Get next available issue number
     */
    private getNextIssueNumber;
    /**
     * Parse knowledge base from markdown file
     */
    parseKnowledgeBase(filePath: string): Promise<KnowledgeBase>;
    /**
     * Parse issues from markdown content
     */
    private parseIssuesFromMarkdown;
    /**
     * Save knowledge base to markdown file
     */
    saveKnowledgeBase(filePath: string, kb: KnowledgeBase): Promise<void>;
    /**
     * Format issue as markdown
     */
    private formatIssue;
    /**
     * Get all issues from knowledge base
     */
    getIssues(knowledgeBaseFile: string): Promise<TrackedIssue[]>;
}
//# sourceMappingURL=issue-tracker.d.ts.map