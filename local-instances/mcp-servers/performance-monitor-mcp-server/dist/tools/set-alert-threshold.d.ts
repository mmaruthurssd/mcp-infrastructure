/**
 * Set Alert Threshold Tool
 *
 * Configure alerting thresholds for metrics
 */
export declare function setAlertThreshold(args: Record<string, unknown>): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=set-alert-threshold.d.ts.map