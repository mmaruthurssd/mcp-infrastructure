export function calculateVelocity(history) {
    return {
        current: 0,
        trend: 'stable',
        confidence: 'Medium',
        reasoning: 'Insufficient history for accurate velocity calculation',
        estimatedCompletion: undefined
    };
}
export function parseProgressHistory(text) { return []; }
export function formatProgressHistory(history) { return ''; }
export function addProgressUpdate(history, update) { return history; }
//# sourceMappingURL=velocity-calculator.js.map