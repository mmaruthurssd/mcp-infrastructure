/**
 * Review Detector Utility
 *
 * Detects goals that need review based on various criteria:
 * - Stale potential goals (>90 days old, never promoted)
 * - Long-running selected goals (>60 days in progress)
 * - No progress updates (>14 days without update)
 * - Blocked too long (>30 days)
 * - Completed but not archived
 */
export interface ReviewItem {
    goalId?: string;
    goalName: string;
    type: 'potential' | 'selected';
    reason: 'stale' | 'long-running' | 'no-progress' | 'blocked' | 'completed-not-archived';
    daysSince: number;
    lastUpdated: string;
    recommendedAction: string;
    urgency: 'high' | 'medium' | 'low';
}
export interface ReviewThresholds {
    stalePotentialDays: number;
    staleSelectedDays: number;
    longRunningDays: number;
    noProgressDays: number;
    blockedDays: number;
}
/**
 * Detect all reviews needed
 */
export declare function detectReviewsNeeded(projectPath: string, checkType?: 'all' | 'selected' | 'potential', customThresholds?: Partial<ReviewThresholds>): ReviewItem[];
//# sourceMappingURL=review-detector%202.d.ts.map