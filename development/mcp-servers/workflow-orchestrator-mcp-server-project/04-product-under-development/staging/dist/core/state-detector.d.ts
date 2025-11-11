/**
 * State Detector
 *
 * Auto-detects project state from file system and syncs with state file
 * Prevents state drift by detecting actual project changes
 */
import { ProjectState } from '../types/project-state.js';
export interface StateDetectionResult {
    goalsDetected: {
        potential: string[];
        selected: string[];
        completed: string[];
    };
    workflowsDetected: {
        active: string[];
        archived: string[];
    };
    filesDetected: {
        constitution: boolean;
        stakeholders: boolean;
        roadmap: boolean;
    };
    mismatches: StateMismatch[];
}
export interface StateMismatch {
    type: 'goals' | 'workflows' | 'files' | 'phase';
    severity: 'warning' | 'error';
    message: string;
    currentState: any;
    detectedState: any;
}
/**
 * State Detector - scans project and detects actual state
 */
export declare class StateDetector {
    /**
     * Detect project state from file system
     */
    static detectState(projectPath: string): StateDetectionResult;
    /**
     * Compare detected state with stored state and identify mismatches
     */
    static compareWithState(projectPath: string, state: ProjectState): StateDetectionResult;
    /**
     * Auto-sync state with detected changes
     */
    static syncState(projectPath: string, state: ProjectState): {
        updated: boolean;
        changes: string[];
    };
    /**
     * Detect goals from file system
     */
    private static detectGoals;
    /**
     * Detect workflows from file system
     */
    private static detectWorkflows;
    /**
     * Detect key project files
     */
    private static detectKeyFiles;
    /**
     * Detect specifications (for Spec-Driven integration tracking)
     */
    private static detectSpecifications;
    /**
     * Compare two arrays and find differences
     */
    private static arrayDifference;
    /**
     * Check if two arrays are equal (ignoring order)
     */
    private static arraysEqual;
}
//# sourceMappingURL=state-detector.d.ts.map