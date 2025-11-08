/**
 * Atomic Handoff Operations
 *
 * Provides atomic operation wrappers to ensure handoffs are all-or-nothing.
 * Prevents partial states and data corruption during MCP communication.
 *
 * Created: 2025-10-27
 */
import { RollbackManager } from './handoff-error-handler';
import { writeFile, readFile, unlink, rename, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
// ============================================================================
// ATOMIC TRANSACTION MANAGER
// ============================================================================
export class AtomicTransaction {
    projectPath;
    context;
    tempDir;
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.context = {
            transactionId: uuidv4(),
            startTime: Date.now(),
            operations: [],
            rollbackManager: new RollbackManager(),
            committed: false,
            rolledBack: false
        };
    }
    /**
     * Initialize transaction (create temp directory)
     */
    async begin() {
        this.tempDir = join(this.projectPath, '.mcp-temp', this.context.transactionId);
        await mkdir(this.tempDir, { recursive: true });
    }
    /**
     * Add file creation operation
     */
    async createFile(filePath, content) {
        this.ensureNotCommitted();
        const operation = {
            id: uuidv4(),
            type: 'create',
            target: filePath,
            executed: false
        };
        // Write to temp location first
        const tempPath = join(this.tempDir, `create_${operation.id}.tmp`);
        await writeFile(tempPath, content, 'utf-8');
        // Store operation
        this.context.operations.push(operation);
        // Create rollback point (delete file on rollback)
        this.context.rollbackManager.createRollbackPoint(operation.id, { tempPath, targetPath: filePath }, `Create file: ${filePath}`);
    }
    /**
     * Add file update operation
     */
    async updateFile(filePath, newContent) {
        this.ensureNotCommitted();
        const operation = {
            id: uuidv4(),
            type: 'update',
            target: filePath,
            executed: false
        };
        // Read current content for rollback
        let originalContent;
        try {
            originalContent = await readFile(filePath, 'utf-8');
        }
        catch (error) {
            // File doesn't exist, treat as create
            originalContent = undefined;
        }
        // Write new content to temp location
        const tempPath = join(this.tempDir, `update_${operation.id}.tmp`);
        await writeFile(tempPath, newContent, 'utf-8');
        operation.snapshot = originalContent;
        this.context.operations.push(operation);
        // Create rollback point (restore original content)
        this.context.rollbackManager.createRollbackPoint(operation.id, { tempPath, targetPath: filePath, originalContent }, `Update file: ${filePath}`);
    }
    /**
     * Add file deletion operation
     */
    async deleteFile(filePath) {
        this.ensureNotCommitted();
        const operation = {
            id: uuidv4(),
            type: 'delete',
            target: filePath,
            executed: false
        };
        // Read current content for rollback
        const originalContent = await readFile(filePath, 'utf-8');
        operation.snapshot = originalContent;
        this.context.operations.push(operation);
        // Create rollback point (restore file)
        this.context.rollbackManager.createRollbackPoint(operation.id, { targetPath: filePath, originalContent }, `Delete file: ${filePath}`);
    }
    /**
     * Commit all operations atomically
     */
    async commit() {
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
        }
        catch (error) {
            // Rollback on failure
            await this.rollback();
            throw new AtomicOperationError(this.context.transactionId, `Transaction commit failed: ${error.message}`, this.context.operations);
        }
    }
    /**
     * Rollback all executed operations
     */
    async rollback() {
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
            }
            catch (error) {
                console.error(`Failed to rollback operation ${operation.id}:`, error);
                // Continue with other rollbacks
            }
        }
        this.context.rolledBack = true;
        await this.cleanup();
    }
    /**
     * Execute a single operation
     */
    async executeOperation(operation) {
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
    async rollbackOperation(operation) {
        await this.context.rollbackManager.rollback(operation.id, async (snapshot) => {
            const { targetPath, originalContent } = snapshot;
            switch (operation.type) {
                case 'create':
                    // Remove created file
                    try {
                        await unlink(targetPath);
                    }
                    catch (error) {
                        // File may not exist if operation partially failed
                    }
                    break;
                case 'update':
                    // Restore original content
                    if (originalContent !== undefined) {
                        await writeFile(targetPath, originalContent, 'utf-8');
                    }
                    else {
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
        });
    }
    /**
     * Get transaction status
     */
    getStatus() {
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
    async cleanup() {
        if (this.tempDir) {
            try {
                // Remove temp directory and all contents
                const { rm } = await import('fs/promises');
                await rm(this.tempDir, { recursive: true, force: true });
            }
            catch (error) {
                console.warn(`Failed to cleanup temp directory: ${this.tempDir}`, error);
            }
        }
    }
    /**
     * Ensure transaction not committed
     */
    ensureNotCommitted() {
        if (this.context.committed) {
            throw new Error('Transaction already committed');
        }
    }
    /**
     * Ensure transaction not rolled back
     */
    ensureNotRolledBack() {
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
export async function executeAtomicHandoff(projectPath, handoff, operationFn) {
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
    }
    catch (error) {
        // Automatic rollback on error
        try {
            await transaction.rollback();
        }
        catch (rollbackError) {
            console.error('Rollback failed:', rollbackError);
        }
        return {
            success: false,
            error: error,
            transactionId: transaction.getStatus().transactionId
        };
    }
}
/**
 * Execute multiple handoffs atomically (all succeed or all fail)
 */
export async function executeAtomicBatch(projectPath, handoffs, operationsFn) {
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
    }
    catch (error) {
        // Rollback all on any failure
        await transaction.rollback();
        return {
            success: false,
            successCount: 0,
            failedHandoffs: handoffs.map(h => h.handoffId),
            error: error
        };
    }
}
// ============================================================================
// TWO-PHASE COMMIT
// ============================================================================
export var TwoPhaseState;
(function (TwoPhaseState) {
    TwoPhaseState["PREPARING"] = "PREPARING";
    TwoPhaseState["PREPARED"] = "PREPARED";
    TwoPhaseState["COMMITTING"] = "COMMITTING";
    TwoPhaseState["COMMITTED"] = "COMMITTED";
    TwoPhaseState["ABORTING"] = "ABORTING";
    TwoPhaseState["ABORTED"] = "ABORTED";
})(TwoPhaseState || (TwoPhaseState = {}));
/**
 * Two-phase commit coordinator for distributed handoffs
 */
export class TwoPhaseCommit {
    coordinatorId;
    state = TwoPhaseState.PREPARING;
    participants = new Map(); // participantId -> prepared
    constructor(coordinatorId, participantIds) {
        this.coordinatorId = coordinatorId;
        participantIds.forEach(id => this.participants.set(id, false));
    }
    /**
     * Phase 1: Prepare - Ask all participants if they can commit
     */
    async prepare(prepareFn) {
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
            }
            catch (error) {
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
    async commit(commitFn) {
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
    async abort(abortFn) {
        this.state = TwoPhaseState.ABORTING;
        for (const [participantId] of this.participants) {
            try {
                await abortFn(participantId);
            }
            catch (error) {
                console.error(`Failed to abort participant ${participantId}:`, error);
            }
        }
        this.state = TwoPhaseState.ABORTED;
    }
    getState() {
        return this.state;
    }
    getParticipants() {
        return new Map(this.participants);
    }
}
// ============================================================================
// ERROR TYPES
// ============================================================================
export class AtomicOperationError extends Error {
    transactionId;
    operations;
    constructor(transactionId, message, operations) {
        super(message);
        this.transactionId = transactionId;
        this.operations = operations;
        this.name = 'AtomicOperationError';
    }
}
export class TwoPhaseCommitError extends Error {
    coordinatorId;
    phase;
    constructor(coordinatorId, phase, message) {
        super(message);
        this.coordinatorId = coordinatorId;
        this.phase = phase;
        this.name = 'TwoPhaseCommitError';
    }
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Create safe handoff execution context
 */
export async function withAtomicGuarantee(projectPath, handoff, operation) {
    const result = await executeAtomicHandoff(projectPath, handoff, operation);
    if (!result.success) {
        throw result.error ?? new Error('Atomic operation failed');
    }
    return result.result;
}
//# sourceMappingURL=handoff-atomic%202.js.map