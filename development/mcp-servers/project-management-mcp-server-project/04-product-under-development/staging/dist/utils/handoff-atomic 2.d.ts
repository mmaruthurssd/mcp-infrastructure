/**
 * Atomic Handoff Operations
 *
 * Provides atomic operation wrappers to ensure handoffs are all-or-nothing.
 * Prevents partial states and data corruption during MCP communication.
 *
 * Created: 2025-10-27
 */
import { BaseHandoff } from '../types/handoff-protocol';
import { RollbackManager } from './handoff-error-handler';
export interface AtomicContext {
    transactionId: string;
    startTime: number;
    operations: Operation[];
    rollbackManager: RollbackManager;
    committed: boolean;
    rolledBack: boolean;
}
export interface Operation {
    id: string;
    type: 'create' | 'update' | 'delete';
    target: string;
    snapshot?: any;
    executed: boolean;
}
export declare class AtomicTransaction {
    private projectPath;
    private context;
    private tempDir?;
    constructor(projectPath: string);
    /**
     * Initialize transaction (create temp directory)
     */
    begin(): Promise<void>;
    /**
     * Add file creation operation
     */
    createFile(filePath: string, content: string): Promise<void>;
    /**
     * Add file update operation
     */
    updateFile(filePath: string, newContent: string): Promise<void>;
    /**
     * Add file deletion operation
     */
    deleteFile(filePath: string): Promise<void>;
    /**
     * Commit all operations atomically
     */
    commit(): Promise<void>;
    /**
     * Rollback all executed operations
     */
    rollback(): Promise<void>;
    /**
     * Execute a single operation
     */
    private executeOperation;
    /**
     * Rollback a single operation
     */
    private rollbackOperation;
    /**
     * Get transaction status
     */
    getStatus(): {
        transactionId: string;
        duration: number;
        operationsCount: number;
        committed: boolean;
        rolledBack: boolean;
    };
    /**
     * Cleanup temp directory
     */
    private cleanup;
    /**
     * Ensure transaction not committed
     */
    private ensureNotCommitted;
    /**
     * Ensure transaction not rolled back
     */
    private ensureNotRolledBack;
}
/**
 * Execute handoff with atomic guarantees
 */
export declare function executeAtomicHandoff<TResult>(projectPath: string, handoff: BaseHandoff, operationFn: (transaction: AtomicTransaction) => Promise<TResult>): Promise<{
    success: boolean;
    result?: TResult;
    error?: Error;
    transactionId: string;
}>;
/**
 * Execute multiple handoffs atomically (all succeed or all fail)
 */
export declare function executeAtomicBatch(projectPath: string, handoffs: BaseHandoff[], operationsFn: (transaction: AtomicTransaction, handoff: BaseHandoff) => Promise<void>): Promise<{
    success: boolean;
    successCount: number;
    failedHandoffs: string[];
    error?: Error;
}>;
export declare enum TwoPhaseState {
    PREPARING = "PREPARING",
    PREPARED = "PREPARED",
    COMMITTING = "COMMITTING",
    COMMITTED = "COMMITTED",
    ABORTING = "ABORTING",
    ABORTED = "ABORTED"
}
/**
 * Two-phase commit coordinator for distributed handoffs
 */
export declare class TwoPhaseCommit {
    private coordinatorId;
    private state;
    private participants;
    constructor(coordinatorId: string, participantIds: string[]);
    /**
     * Phase 1: Prepare - Ask all participants if they can commit
     */
    prepare(prepareFn: (participantId: string) => Promise<boolean>): Promise<boolean>;
    /**
     * Phase 2: Commit - Tell all participants to commit
     */
    commit(commitFn: (participantId: string) => Promise<void>): Promise<void>;
    /**
     * Abort - Tell all participants to abort
     */
    abort(abortFn: (participantId: string) => Promise<void>): Promise<void>;
    getState(): TwoPhaseState;
    getParticipants(): Map<string, boolean>;
}
export declare class AtomicOperationError extends Error {
    transactionId: string;
    operations: Operation[];
    constructor(transactionId: string, message: string, operations: Operation[]);
}
export declare class TwoPhaseCommitError extends Error {
    coordinatorId: string;
    phase: 'prepare' | 'commit' | 'abort';
    constructor(coordinatorId: string, phase: 'prepare' | 'commit' | 'abort', message: string);
}
/**
 * Create safe handoff execution context
 */
export declare function withAtomicGuarantee<T>(projectPath: string, handoff: BaseHandoff, operation: (tx: AtomicTransaction) => Promise<T>): Promise<T>;
//# sourceMappingURL=handoff-atomic%202.d.ts.map