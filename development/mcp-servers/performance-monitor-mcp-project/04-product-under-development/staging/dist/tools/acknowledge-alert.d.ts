/**
 * Acknowledge Alert Tool
 *
 * Acknowledge an alert to stop notifications
 */
export declare function acknowledgeAlert(args: Record<string, unknown>): Promise<{
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
//# sourceMappingURL=acknowledge-alert.d.ts.map