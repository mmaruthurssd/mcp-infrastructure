/**
 * Learning Data Export Tool
 * Exports patterns, performance data, and outcomes in JSON or CSV format
 */
interface ExportLearningDataParams {
    format: 'json' | 'csv';
    includePatterns?: boolean;
    includeOutcomes?: boolean;
    includeMetrics?: boolean;
    outputPath?: string;
}
/**
 * Main tool handler
 */
export declare function exportLearningData(params: ExportLearningDataParams): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export {};
//# sourceMappingURL=export-learning-data.d.ts.map