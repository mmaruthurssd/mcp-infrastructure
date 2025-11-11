/**
 * Detect Anomalies Tool
 *
 * Detect performance anomalies using statistical methods
 */
export declare function detectAnomalies(args: Record<string, unknown>): Promise<{
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
//# sourceMappingURL=detect-anomalies.d.ts.map