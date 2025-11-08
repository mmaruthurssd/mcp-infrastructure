/**
 * MCP Handoff Receiver
 *
 * Loads, deserializes, validates, and processes incoming handoffs
 */
import { Handoff, HandoffResponse } from '../types/handoff.js';
/**
 * Deserialize a handoff from JSON string
 */
export declare function deserializeHandoff(json: string): Handoff;
/**
 * Load a handoff from file
 */
export declare function loadHandoffFromFile(filePath: string): Handoff;
/**
 * Find all pending handoffs for a specific MCP in a project
 */
export declare function findPendingHandoffs(projectPath: string, targetMcp: string): Handoff[];
/**
 * Validate a handoff structure
 */
export declare function validateHandoff(handoff: Handoff): boolean;
/**
 * Create a success response for a handoff
 */
export declare function createSuccessResponse(handoffId: string, result?: any): HandoffResponse;
/**
 * Create an error response for a handoff
 */
export declare function createErrorResponse(handoffId: string, error: {
    code: string;
    message: string;
    details?: any;
}): HandoffResponse;
/**
 * Mark a handoff as received by updating its status
 */
export declare function markHandoffReceived(filePath: string, handoff: Handoff): void;
/**
 * Mark a handoff as completed and move to archive
 */
export declare function markHandoffCompleted(projectPath: string, handoff: Handoff, response: HandoffResponse): void;
/**
 * Mark a handoff as failed
 */
export declare function markHandoffFailed(projectPath: string, handoff: Handoff, response: HandoffResponse): void;
/**
 * Process a handoff (high-level wrapper)
 */
export declare function processHandoff(handoff: Handoff, processor: (handoff: Handoff) => Promise<any>): Promise<HandoffResponse>;
//# sourceMappingURL=handoff-receiver.d.ts.map