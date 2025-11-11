export interface VelocityEstimate {
    current: number;
    trend: string;
    confidence: 'High' | 'Medium' | 'Low';
    reasoning: string;
    estimatedCompletion?: string;
}
export declare function calculateVelocity(history: any[]): VelocityEstimate;
export declare function parseProgressHistory(text: string): any[];
export declare function formatProgressHistory(history: any[]): string;
export declare function addProgressUpdate(history: any[], update: any): any[];
//# sourceMappingURL=velocity-calculator.d.ts.map