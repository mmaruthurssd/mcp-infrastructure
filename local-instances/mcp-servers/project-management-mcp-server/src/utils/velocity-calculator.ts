// Velocity calculator stubs
export interface VelocityEstimate {
  current: number;
  trend: string;
  confidence: 'High' | 'Medium' | 'Low';
  reasoning: string;
  estimatedCompletion?: string; // ISO date string
}
export function calculateVelocity(history: any[]): VelocityEstimate {
  return {
    current: 0,
    trend: 'stable',
    confidence: 'Medium',
    reasoning: 'Insufficient history for accurate velocity calculation',
    estimatedCompletion: undefined
  };
}
export function parseProgressHistory(text: string): any[] { return []; }
export function formatProgressHistory(history: any[]): string { return ''; }
export function addProgressUpdate(history: any[], update: any): any[] { return history; }
