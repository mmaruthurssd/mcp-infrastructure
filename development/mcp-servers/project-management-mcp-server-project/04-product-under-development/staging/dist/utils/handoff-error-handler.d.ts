/**
 * MCP Handoff Error Handler
 *
 * Provides retry logic, rollback capabilities, and error recovery for handoffs
 */
import { Handoff, HandoffStatus } from '../types/handoff.js';
/**
 * Rollback point containing state snapshot
 */
export interface RollbackPoint {
    id: string;
    handoffId: string;
    timestamp: string;
    snapshotData: {
        handoff: Handoff;
        originalStatus: HandoffStatus;
        filesAffected: string[];
        stateBeforeHandoff?: any;
    };
    reason?: string;
}
/**
 * Retry configuration
 */
export interface RetryConfig {
    maxAttempts?: number;
    initialBackoffMs?: number;
    maxBackoffMs?: number;
    backoffMultiplier?: number;
}
/**
 * Error recovery strategy
 */
export type RecoveryStrategy = 'retry' | 'rollback' | 'manual' | 'skip';
/**
 * Handoff error with context
 */
export interface HandoffError extends Error {
    code: string;
    handoffId?: string;
    recoverable: boolean;
    suggestedStrategy: RecoveryStrategy;
    details?: any;
}
/**
 * RollbackManager manages rollback points and state restoration
 */
export declare class RollbackManager {
    private projectPath;
    private rollbackDir;
    constructor(projectPath: string);
    private ensureRollbackDir;
    /**
     * Create a rollback point before a handoff operation
     */
    createRollbackPoint(handoff: Handoff, filesAffected?: string[], stateBeforeHandoff?: any, reason?: string): RollbackPoint;
    /**
     * Clear a rollback point after successful operation
     */
    clearRollbackPoint(rollbackId: string): void;
    /**
     * Get all rollback points
     */
    getAllRollbackPoints(): RollbackPoint[];
    /**
     * Get rollback point by ID
     */
    getRollbackPoint(rollbackId: string): RollbackPoint | null;
    /**
     * Rollback to a previous state
     */
    rollback(point: RollbackPoint): void;
    /**
     * Clean up old rollback points (older than 7 days)
     */
    cleanupOldRollbackPoints(daysOld?: number): number;
}
/**
 * Retry a function with exponential backoff
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, config?: RetryConfig): Promise<T>;
/**
 * Retry a handoff send operation
 */
export declare function retryHandoffSend(handoff: Handoff, config?: RetryConfig): Promise<string>;
/**
 * Determine recovery strategy for an error
 */
export declare function determineRecoveryStrategy(error: any): RecoveryStrategy;
/**
 * Create a HandoffError with recovery strategy
 */
export declare function createHandoffError(code: string, message: string, handoffId?: string, details?: any): HandoffError;
/**
 * Handle a handoff error with automatic recovery
 */
export declare function handleHandoffError(error: any, handoff: Handoff, rollbackManager?: RollbackManager): Promise<{
    recovered: boolean;
    strategy: RecoveryStrategy;
    result?: any;
}>;
//# sourceMappingURL=handoff-error-handler.d.ts.map