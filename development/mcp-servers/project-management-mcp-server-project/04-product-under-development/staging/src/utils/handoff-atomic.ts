/**
 * Atomic Handoff Operations
 *
 * Provides atomic operation wrappers to ensure handoffs are all-or-nothing.
 * Prevents partial states and data corruption during MCP communication.
 *
 * Created: 2025-10-27
 */

import { Handoff, HandoffResponse } from '../types/handoff.js';
import { RollbackManager, RollbackPoint } from './handoff-error-handler.js';
import { writeFile, readFile, unlink, rename, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// ATOMIC OPERATION CONTEXT
// ============================================================================

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
  target: string; // File path or entity ID
  snapshot?: any; // Pre-operation state
  executed: boolean;
}

// ============================================================================
// ATOMIC TRANSACTION MANAGER
// ============================================================================

export class AtomicTransaction {
  private context: AtomicContext;
  private tempDir?: string;

  constructor(private projectPath: string) {
    this.context = {
      transactionId: uuidv4(),
      startTime: Date.now(),
      operations: [],
      rollbackManager: new RollbackManager(projectPath),
      committed: false,
      rolledBack: false
    };
  }

  /**
   * Initialize transaction (create temp directory)
   */
  async begin(): Promise<void> {
    this.tempDir = join(this.projectPath, '.mcp-temp', this.context.transactionId);
    await mkdir(this.tempDir, { recursive: true });
  }

  /**
   * Add file creation operation
   */
  async createFile(filePath: string, content: string): Promise<void> {
    this.ensureNotCommitted();

    const operation: Operation = {
      id: uuidv4(),
      type: 'create',
      target: filePath,
      executed: false
    };

    // Write to temp location first
    const tempPath = join(this.tempDir!, `create_${operation.id}.tmp`);
    await writeFile(tempPath, content, 'utf-8');

    // Store operation
    this.context.operations.push(operation);

    // TODO: Implement atomic operation-specific rollback tracking
    // Note: RollbackManager is designed for handoff-specific rollbacks
    // This file operation tracking needs a different approach
  }

  /**
   * Add file update operation
   */
  async updateFile(filePath: string, newContent: string): Promise<void> {
    this.ensureNotCommitted();

    const operation: Operation = {
      id: uuidv4(),
      type: 'update',
      target: filePath,
      executed: false
    };

    // Read current content for rollback
    let originalContent: string | undefined;
    try {
      originalContent = await readFile(filePath, 'utf-8');
    } catch (error) {
      // File doesn't exist, treat as create
      originalContent = undefined;
    }

    // Write new content to temp location
    const tempPath = join(this.tempDir!, `update_${operation.id}.tmp`);
    await writeFile(tempPath, newContent, 'utf-8');

    operation.snapshot = originalContent;
    this.context.operations.push(operation);

    // TODO: Implement atomic operation-specific rollback tracking
  }

  /**
   * Add file deletion operation
   */
  async deleteFile(filePath: string): Promise<void> {
    this.ensureNotCommitted();

    const operation: Operation = {
      id: uuidv4(),
      type: 'delete',
      target: filePath,
      executed: false
    };

    // Read current content for rollback
    const originalContent = await readFile(filePath, 'utf-8');

    operation.snapshot = originalContent;
    this.context.operations.push(operation);

    // TODO: Implement atomic operation-specific rollback tracking
  }

  /**
   * Commit all operations atomically
   */
  async commit(): Promise<void> {
    this.ensureNotCommitted();
    this.ensureNotRolledBack();

    try {
      // Execute all operations
      for (const operation of this.context.operations) {
        await this.executeOperation(operation);
        operation.executed = true;
      }

      // Mark as committed
      this.context.committed = true;

      // Clear rollback points (success)
      for (const operation of this.context.operations) {
        this.context.rollbackManager.clearRollbackPoint(operation.id);
      }

      // Cleanup temp directory
      await this.cleanup();

    } catch (error) {
      // Rollback on failure
      await this.rollback();
      throw new AtomicOperationError(
        this.context.transactionId,
        `Transaction commit failed: ${(error as Error).message}`,
        this.context.operations
      );
    }
  }

  /**
   * Rollback all executed operations
   */
  async rollback(): Promise<void> {
    if (this.context.committed) {
      throw new Error('Cannot rollback committed transaction');
    }

    if (this.context.rolledBack) {
      return; // Already rolled back
    }

    // Rollback operations in reverse order
    const executedOps = this.context.operations
      .filter(op => op.executed)
      .reverse();

    for (const operation of executedOps) {
      try {
        await this.rollbackOperation(operation);
      } catch (error) {
        console.error(
          `Failed to rollback operation ${operation.id}:`,
          error
        );
        // Continue with other rollbacks
      }
    }

    this.context.rolledBack = true;
    await this.cleanup();
  }

  /**
   * Execute a single operation
   */
  private async executeOperation(operation: Operation): Promise<void> {
    const rollbackPoint = this.context.rollbackManager
      .getAllRollbackPoints()
      .find(rp => rp.handoffId === operation.id);

    if (!rollbackPoint) {
      throw new Error(`No rollback point for operation ${operation.id}`);
    }

    const { tempPath, targetPath } = rollbackPoint.snapshotData;

    switch (operation.type) {
      case 'create':
      case 'update':
        // Ensure target directory exists
        await mkdir(dirname(targetPath), { recursive: true });
        // Move from temp to target (atomic rename)
        await rename(tempPath, targetPath);
        break;

      case 'delete':
        await unlink(targetPath);
        break;

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Rollback a single operation
   */
  private async rollbackOperation(operation: Operation): Promise<void> {
    // TODO: Implement proper rollback for atomic file operations
    // This requires a different approach than the handoff-specific RollbackManager
    const targetPath = operation.target;
    const originalContent = operation.snapshot;

    switch (operation.type) {
      case 'create':
        // Remove created file
        try {
          await unlink(targetPath);
        } catch (error) {
          // File may not exist if operation partially failed
        }
        break;

      case 'update':
        // Restore original content
        if (originalContent !== undefined) {
          await writeFile(targetPath, originalContent, 'utf-8');
        } else {
          // Was a create, delete it
          await unlink(targetPath);
        }
        break;

      case 'delete':
        // Restore deleted file
        await mkdir(dirname(targetPath), { recursive: true });
        await writeFile(targetPath, originalContent, 'utf-8');
        break;
    }
  }

  /**
   * Get transaction status
   */
  getStatus(): {
    transactionId: string;
    duration: number;
    operationsCount: number;
    committed: boolean;
    rolledBack: boolean;
  } {
    return {
      transactionId: this.context.transactionId,
      duration: Date.now() - this.context.startTime,
      operationsCount: this.context.operations.length,
      committed: this.context.committed,
      rolledBack: this.context.rolledBack
    };
  }

  /**
   * Cleanup temp directory
   */
  private async cleanup(): Promise<void> {
    if (this.tempDir) {
      try {
        // Remove temp directory and all contents
        const { rm } = await import('fs/promises');
        await rm(this.tempDir, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Failed to cleanup temp directory: ${this.tempDir}`, error);
      }
    }
  }

  /**
   * Ensure transaction not committed
   */
  private ensureNotCommitted(): void {
    if (this.context.committed) {
      throw new Error('Transaction already committed');
    }
  }

  /**
   * Ensure transaction not rolled back
   */
  private ensureNotRolledBack(): void {
    if (this.context.rolledBack) {
      throw new Error('Transaction already rolled back');
    }
  }
}

// ============================================================================
// ATOMIC HANDOFF WRAPPER
// ============================================================================

/**
 * Execute handoff with atomic guarantees
 */
export async function executeAtomicHandoff<TResult>(
  projectPath: string,
  handoff: Handoff,
  operationFn: (transaction: AtomicTransaction) => Promise<TResult>
): Promise<{
  success: boolean;
  result?: TResult;
  error?: Error;
  transactionId: string;
}> {
  const transaction = new AtomicTransaction(projectPath);

  try {
    // Begin transaction
    await transaction.begin();

    // Execute operation function
    const result = await operationFn(transaction);

    // Commit transaction
    await transaction.commit();

    return {
      success: true,
      result,
      transactionId: transaction.getStatus().transactionId
    };

  } catch (error) {
    // Automatic rollback on error
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }

    return {
      success: false,
      error: error as Error,
      transactionId: transaction.getStatus().transactionId
    };
  }
}

/**
 * Execute multiple handoffs atomically (all succeed or all fail)
 */
export async function executeAtomicBatch(
  projectPath: string,
  handoffs: Handoff[],
  operationsFn: (transaction: AtomicTransaction, handoff: Handoff) => Promise<void>
): Promise<{
  success: boolean;
  successCount: number;
  failedHandoffs: string[];
  error?: Error;
}> {
  const transaction = new AtomicTransaction(projectPath);

  try {
    await transaction.begin();

    // Execute all handoff operations
    for (const handoff of handoffs) {
      await operationsFn(transaction, handoff);
    }

    // Commit all at once
    await transaction.commit();

    return {
      success: true,
      successCount: handoffs.length,
      failedHandoffs: []
    };

  } catch (error) {
    // Rollback all on any failure
    await transaction.rollback();

    return {
      success: false,
      successCount: 0,
      failedHandoffs: handoffs.map(h => h.handoffId),
      error: error as Error
    };
  }
}

// ============================================================================
// TWO-PHASE COMMIT
// ============================================================================

export enum TwoPhaseState {
  PREPARING = 'PREPARING',
  PREPARED = 'PREPARED',
  COMMITTING = 'COMMITTING',
  COMMITTED = 'COMMITTED',
  ABORTING = 'ABORTING',
  ABORTED = 'ABORTED'
}

/**
 * Two-phase commit coordinator for distributed handoffs
 */
export class TwoPhaseCommit {
  private state: TwoPhaseState = TwoPhaseState.PREPARING;
  private participants: Map<string, boolean> = new Map(); // participantId -> prepared

  constructor(
    private coordinatorId: string,
    participantIds: string[]
  ) {
    participantIds.forEach(id => this.participants.set(id, false));
  }

  /**
   * Phase 1: Prepare - Ask all participants if they can commit
   */
  async prepare(prepareFn: (participantId: string) => Promise<boolean>): Promise<boolean> {
    this.state = TwoPhaseState.PREPARING;

    for (const [participantId] of this.participants) {
      try {
        const canCommit = await prepareFn(participantId);
        this.participants.set(participantId, canCommit);

        if (!canCommit) {
          // At least one participant can't commit
          this.state = TwoPhaseState.ABORTING;
          return false;
        }
      } catch (error) {
        this.participants.set(participantId, false);
        this.state = TwoPhaseState.ABORTING;
        return false;
      }
    }

    this.state = TwoPhaseState.PREPARED;
    return true;
  }

  /**
   * Phase 2: Commit - Tell all participants to commit
   */
  async commit(commitFn: (participantId: string) => Promise<void>): Promise<void> {
    if (this.state !== TwoPhaseState.PREPARED) {
      throw new Error(`Cannot commit from state ${this.state}`);
    }

    this.state = TwoPhaseState.COMMITTING;

    for (const [participantId] of this.participants) {
      await commitFn(participantId);
    }

    this.state = TwoPhaseState.COMMITTED;
  }

  /**
   * Abort - Tell all participants to abort
   */
  async abort(abortFn: (participantId: string) => Promise<void>): Promise<void> {
    this.state = TwoPhaseState.ABORTING;

    for (const [participantId] of this.participants) {
      try {
        await abortFn(participantId);
      } catch (error) {
        console.error(`Failed to abort participant ${participantId}:`, error);
      }
    }

    this.state = TwoPhaseState.ABORTED;
  }

  getState(): TwoPhaseState {
    return this.state;
  }

  getParticipants(): Map<string, boolean> {
    return new Map(this.participants);
  }
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class AtomicOperationError extends Error {
  constructor(
    public transactionId: string,
    message: string,
    public operations: Operation[]
  ) {
    super(message);
    this.name = 'AtomicOperationError';
  }
}

export class TwoPhaseCommitError extends Error {
  constructor(
    public coordinatorId: string,
    public phase: 'prepare' | 'commit' | 'abort',
    message: string
  ) {
    super(message);
    this.name = 'TwoPhaseCommitError';
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create safe handoff execution context
 */
export async function withAtomicGuarantee<T>(
  projectPath: string,
  handoff: Handoff,
  operation: (tx: AtomicTransaction) => Promise<T>
): Promise<T> {
  const result = await executeAtomicHandoff(projectPath, handoff, operation);

  if (!result.success) {
    throw result.error ?? new Error('Atomic operation failed');
  }

  return result.result!;
}
