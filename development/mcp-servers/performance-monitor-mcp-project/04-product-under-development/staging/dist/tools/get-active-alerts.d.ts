/**
 * Get Active Alerts Tool
 *
 * Get all currently active alerts
 */
export declare function getActiveAlerts(args: Record<string, unknown>): Promise<{
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
//# sourceMappingURL=get-active-alerts.d.ts.map