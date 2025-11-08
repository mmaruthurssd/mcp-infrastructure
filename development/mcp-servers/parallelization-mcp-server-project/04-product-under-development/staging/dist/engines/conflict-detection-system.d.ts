/**
 * Conflict Detection System
 *
 * Detects conflicts from parallel agent execution
 * - File-level: Same file modified by multiple agents
 * - Semantic: Logically incompatible changes
 * - Dependency: Violated implicit dependencies
 */
import { DetectConflictsInput, DetectConflictsOutput, Conflict } from '../types.js';
export declare class ConflictDetectionSystem {
    /**
     * Detect conflicts from agent results
     */
    static detect(input: DetectConflictsInput): DetectConflictsOutput;
    /**
     * Detect file-level conflicts (easiest)
     */
    private static detectFileLevelConflicts;
    /**
     * Detect semantic conflicts (pattern-based heuristics)
     */
    private static detectSemanticConflicts;
    /**
     * Detect dependency violations
     */
    private static detectDependencyViolations;
    /**
     * Detect resource contention
     */
    private static detectResourceContention;
    /**
     * Assess file-level conflict severity
     */
    private static assessFileLevelSeverity;
    /**
     * Generate file-level resolution options
     */
    private static generateFileLevelResolutions;
    /**
     * Determine overall resolution strategy
     */
    private static determineResolutionStrategy;
    /**
     * Attempt automatic conflict resolution
     */
    static resolveAutomatically(conflict: Conflict): any | null;
}
//# sourceMappingURL=conflict-detection-system.d.ts.map