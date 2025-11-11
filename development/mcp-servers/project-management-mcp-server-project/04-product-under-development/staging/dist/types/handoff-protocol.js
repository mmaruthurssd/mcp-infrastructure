/**
 * MCP Handoff Protocol v1.0 - Type Definitions
 *
 * Defines JSON schemas for all inter-MCP communication between:
 * - Project Management MCP
 * - Spec-Driven MCP
 * - Task Executor MCP
 *
 * Protocol Version: 1.0.0
 * Created: 2025-10-27
 */
// ============================================================================
// TYPE GUARDS
// ============================================================================
export function isGoalToSpecHandoff(handoff) {
    return handoff.handoffType === 'goal-to-spec';
}
export function isSpecToTasksHandoff(handoff) {
    return handoff.handoffType === 'spec-to-tasks';
}
export function isTaskCompletionHandoff(handoff) {
    return handoff.handoffType === 'task-completion';
}
export function isSubgoalCompletionHandoff(handoff) {
    return handoff.handoffType === 'subgoal-completion';
}
export function isProgressUpdateHandoff(handoff) {
    return handoff.handoffType === 'progress-update';
}
//# sourceMappingURL=handoff-protocol.js.map