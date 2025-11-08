/**
 * MCP Handoff Error Handler
 *
 * Provides retry logic, rollback capabilities, and error recovery for handoffs
 */
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { sendHandoff } from './handoff-sender.js';
const ROLLBACK_DIR = '.handoffs/rollback';
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;
/**
 * RollbackManager manages rollback points and state restoration
 */
export class RollbackManager {
    projectPath;
    rollbackDir;
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.rollbackDir = path.join(projectPath, ROLLBACK_DIR);
        this.ensureRollbackDir();
    }
    ensureRollbackDir() {
        if (!fs.existsSync(this.rollbackDir)) {
            fs.mkdirSync(this.rollbackDir, { recursive: true });
        }
    }
    /**
     * Create a rollback point before a handoff operation
     */
    createRollbackPoint(handoff, filesAffected = [], stateBeforeHandoff, reason) {
        const rollbackPoint = {
            id: uuidv4(),
            handoffId: handoff.metadata.handoffId,
            timestamp: new Date().toISOString(),
            snapshotData: {
                handoff: JSON.parse(JSON.stringify(handoff)), // Deep copy
                originalStatus: handoff.metadata.status,
                filesAffected,
                stateBeforeHandoff,
            },
            reason,
        };
        // Save rollback point to disk
        const filename = `rollback_${rollbackPoint.id}.json`;
        const filePath = path.join(this.rollbackDir, filename);
        fs.writeFileSync(filePath, JSON.stringify(rollbackPoint, null, 2), 'utf8');
        return rollbackPoint;
    }
    /**
     * Clear a rollback point after successful operation
     */
    clearRollbackPoint(rollbackId) {
        const filename = `rollback_${rollbackId}.json`;
        const filePath = path.join(this.rollbackDir, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
    /**
     * Get all rollback points
     */
    getAllRollbackPoints() {
        if (!fs.existsSync(this.rollbackDir)) {
            return [];
        }
        const files = fs.readdirSync(this.rollbackDir);
        const rollbackPoints = [];
        for (const file of files) {
            if (!file.startsWith('rollback_') || !file.endsWith('.json')) {
                continue;
            }
            try {
                const filePath = path.join(this.rollbackDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const point = JSON.parse(content);
                rollbackPoints.push(point);
            }
            catch (error) {
                console.error(`Error loading rollback point ${file}:`, error);
            }
        }
        return rollbackPoints.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    /**
     * Get rollback point by ID
     */
    getRollbackPoint(rollbackId) {
        const filename = `rollback_${rollbackId}.json`;
        const filePath = path.join(this.rollbackDir, filename);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        }
        catch (error) {
            console.error(`Error loading rollback point ${rollbackId}:`, error);
            return null;
        }
    }
    /**
     * Rollback to a previous state
     */
    rollback(point) {
        const handoff = point.snapshotData.handoff;
        // Update handoff status to rolled_back
        handoff.metadata.status = 'rolled_back';
        // Restore handoff file if it exists
        const handoffsDir = path.join(this.projectPath, '.handoffs', 'outgoing');
        const filename = `${handoff.metadata.handoffType}_${handoff.metadata.handoffId}.json`;
        const handoffPath = path.join(handoffsDir, filename);
        if (fs.existsSync(handoffPath)) {
            fs.writeFileSync(handoffPath, JSON.stringify(handoff, null, 2), 'utf8');
        }
        // Move to failed directory
        const failedDir = path.join(this.projectPath, '.handoffs', 'failed');
        if (!fs.existsSync(failedDir)) {
            fs.mkdirSync(failedDir, { recursive: true });
        }
        const failedPath = path.join(failedDir, filename);
        fs.writeFileSync(failedPath, JSON.stringify({
            handoff,
            rolledBack: true,
            rollbackPoint: point,
            rolledBackAt: new Date().toISOString(),
        }, null, 2), 'utf8');
        // Clear the rollback point
        this.clearRollbackPoint(point.id);
    }
    /**
     * Clean up old rollback points (older than 7 days)
     */
    cleanupOldRollbackPoints(daysOld = 7) {
        const points = this.getAllRollbackPoints();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        let cleaned = 0;
        for (const point of points) {
            const pointDate = new Date(point.timestamp);
            if (pointDate < cutoffDate) {
                this.clearRollbackPoint(point.id);
                cleaned++;
            }
        }
        return cleaned;
    }
}
/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff(fn, config = {}) {
    const maxAttempts = config.maxAttempts || MAX_RETRY_ATTEMPTS;
    const initialBackoff = config.initialBackoffMs || INITIAL_BACKOFF_MS;
    const maxBackoff = config.maxBackoffMs || MAX_BACKOFF_MS;
    const multiplier = config.backoffMultiplier || 2;
    let lastError = null;
    let backoffMs = initialBackoff;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxAttempts) {
                break;
            }
            // Wait with exponential backoff
            await sleep(backoffMs);
            backoffMs = Math.min(backoffMs * multiplier, maxBackoff);
            console.log(`Retry attempt ${attempt}/${maxAttempts} after ${backoffMs}ms`);
        }
    }
    throw lastError || new Error('Max retry attempts reached');
}
/**
 * Retry a handoff send operation
 */
export async function retryHandoffSend(handoff, config = {}) {
    return retryWithBackoff(async () => {
        // Increment retry count
        handoff.metadata.retryCount++;
        // Update timestamp
        handoff.metadata.timestamp = new Date().toISOString();
        // Attempt to send
        return sendHandoff(handoff);
    }, config);
}
/**
 * Determine recovery strategy for an error
 */
export function determineRecoveryStrategy(error) {
    const errorCode = error.code || error.message;
    // Network/temporary errors - retry
    if (errorCode.includes('ENOENT') ||
        errorCode.includes('EACCES') ||
        errorCode.includes('ETIMEDOUT') ||
        errorCode.includes('ECONNREFUSED')) {
        return 'retry';
    }
    // Validation errors - manual intervention
    if (errorCode.includes('INVALID') ||
        errorCode.includes('VALIDATION')) {
        return 'manual';
    }
    // Critical errors - rollback
    if (errorCode.includes('CORRUPTION') ||
        errorCode.includes('FATAL')) {
        return 'rollback';
    }
    // Default to retry for unknown errors
    return 'retry';
}
/**
 * Create a HandoffError with recovery strategy
 */
export function createHandoffError(code, message, handoffId, details) {
    const error = new Error(message);
    error.code = code;
    error.handoffId = handoffId;
    error.details = details;
    // Determine if error is recoverable
    error.recoverable = !code.includes('FATAL') && !code.includes('CORRUPTION');
    error.suggestedStrategy = determineRecoveryStrategy(error);
    return error;
}
/**
 * Handle a handoff error with automatic recovery
 */
export async function handleHandoffError(error, handoff, rollbackManager) {
    const strategy = determineRecoveryStrategy(error);
    switch (strategy) {
        case 'retry':
            try {
                const result = await retryHandoffSend(handoff, {
                    maxAttempts: 3,
                });
                return { recovered: true, strategy, result };
            }
            catch (retryError) {
                return { recovered: false, strategy };
            }
        case 'rollback':
            if (rollbackManager) {
                const points = rollbackManager.getAllRollbackPoints();
                const point = points.find(p => p.handoffId === handoff.metadata.handoffId);
                if (point) {
                    rollbackManager.rollback(point);
                    return { recovered: true, strategy };
                }
            }
            return { recovered: false, strategy };
        case 'manual':
        case 'skip':
        default:
            return { recovered: false, strategy };
    }
}
/**
 * Sleep utility for backoff
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//# sourceMappingURL=handoff-error-handler.js.map