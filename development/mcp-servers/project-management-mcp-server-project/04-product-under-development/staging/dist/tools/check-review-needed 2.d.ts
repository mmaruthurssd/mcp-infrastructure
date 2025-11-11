/**
 * Check Review Needed Tool
 *
 * Proactively detect goals that need review based on various criteria.
 */
import { ReviewItem } from '../utils/review-detector.js';
export interface CheckReviewNeededInput {
    projectPath: string;
    checkType?: 'all' | 'selected' | 'potential';
    staleDays?: number;
    longRunningDays?: number;
    noProgressDays?: number;
    blockedDays?: number;
}
export interface CheckReviewNeededOutput {
    success: boolean;
    reviewsNeeded: ReviewItem[];
    summary: {
        total: number;
        byReason: {
            stale: number;
            longRunning: number;
            noProgress: number;
            blocked: number;
            completedNotArchived: number;
        };
        byUrgency: {
            high: number;
            medium: number;
            low: number;
        };
    };
    message: string;
    formatted?: string;
    error?: string;
}
export declare class CheckReviewNeededTool {
    /**
     * Execute the check_review_needed tool
     */
    static execute(input: CheckReviewNeededInput): CheckReviewNeededOutput;
    /**
     * Format the result for display
     */
    static formatResult(result: CheckReviewNeededOutput): string;
    /**
     * Get MCP tool definition
     */
    static getToolDefinition(): {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                projectPath: {
                    type: string;
                    description: string;
                };
                checkType: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                staleDays: {
                    type: string;
                    description: string;
                };
                longRunningDays: {
                    type: string;
                    description: string;
                };
                noProgressDays: {
                    type: string;
                    description: string;
                };
                blockedDays: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=check-review-needed%202.d.ts.map