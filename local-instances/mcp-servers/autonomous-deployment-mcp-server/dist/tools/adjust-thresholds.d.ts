/**
 * Threshold Adjustment Tool
 * Manages confidence thresholds with validation and audit trail
 */
interface AdjustThresholdsParams {
    autonomousThreshold?: number;
    assistedThreshold?: number;
    maxAutonomousPerDay?: number;
    maxAutonomousPerHour?: number;
    dryRun?: boolean;
    reason?: string;
    reviewedBy?: string;
}
/**
 * Main tool handler
 */
export declare function adjustThresholds(params: AdjustThresholdsParams): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export {};
//# sourceMappingURL=adjust-thresholds.d.ts.map