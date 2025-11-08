/**
 * MCP Handoff Receiver
 *
 * Loads, deserializes, validates, and processes incoming handoffs
 */

import * as fs from 'fs';
import * as path from 'path';
import { Handoff, HandoffResponse } from '../types/handoff.js';

const HANDOFFS_DIR = '.handoffs';

/**
 * Deserialize a handoff from JSON string
 */
export function deserializeHandoff(json: string): Handoff {
  return JSON.parse(json) as Handoff;
}

/**
 * Load a handoff from file
 */
export function loadHandoffFromFile(filePath: string): Handoff {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Handoff file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  return deserializeHandoff(content);
}

/**
 * Find all pending handoffs for a specific MCP in a project
 */
export function findPendingHandoffs(
  projectPath: string,
  targetMcp: string
): Handoff[] {
  const incomingDir = path.join(projectPath, HANDOFFS_DIR, 'incoming');

  if (!fs.existsSync(incomingDir)) {
    return [];
  }

  const files = fs.readdirSync(incomingDir);
  const handoffs: Handoff[] = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const filePath = path.join(incomingDir, file);
    try {
      const handoff = loadHandoffFromFile(filePath);

      // Check if this handoff is for the target MCP and is pending
      if (
        handoff.metadata.targetMcp === targetMcp &&
        (handoff.metadata.status === 'sent' || handoff.metadata.status === 'pending')
      ) {
        handoffs.push(handoff);
      }
    } catch (error) {
      console.error(`Error loading handoff ${file}:`, error);
    }
  }

  return handoffs;
}

/**
 * Validate a handoff structure
 */
export function validateHandoff(handoff: Handoff): boolean {
  // Check required metadata fields
  if (!handoff.metadata) return false;
  if (!handoff.metadata.version) return false;
  if (!handoff.metadata.handoffId) return false;
  if (!handoff.metadata.handoffType) return false;
  if (!handoff.metadata.sourceMcp) return false;
  if (!handoff.metadata.targetMcp) return false;
  if (!handoff.metadata.sourceProjectPath) return false;

  // Check version compatibility (currently only v1.0)
  if (!handoff.metadata.version.startsWith('1.')) {
    return false;
  }

  // Check data exists
  if (!handoff.data) return false;

  // Type-specific validation
  switch (handoff.metadata.handoffType) {
    case 'goal_to_spec':
      return !!(handoff.data.goalId && handoff.data.goalName && handoff.data.goalDescription);

    case 'spec_to_tasks':
      return !!(handoff.data.goalId && handoff.data.tasks && Array.isArray(handoff.data.tasks));

    case 'task_completion':
      return !!(
        handoff.data.workflowName &&
        typeof handoff.data.completedTasks === 'number' &&
        typeof handoff.data.totalTasks === 'number'
      );

    case 'progress_update':
      return !!(
        handoff.data.goalId &&
        handoff.data.phase &&
        typeof handoff.data.progressPercentage === 'number'
      );

    case 'subgoal_completion':
      return true; // Generic, less strict validation

    default:
      return false;
  }
}

/**
 * Create a success response for a handoff
 */
export function createSuccessResponse(
  handoffId: string,
  result?: any
): HandoffResponse {
  return {
    handoffId,
    success: true,
    receivedAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    result,
  };
}

/**
 * Create an error response for a handoff
 */
export function createErrorResponse(
  handoffId: string,
  error: { code: string; message: string; details?: any }
): HandoffResponse {
  return {
    handoffId,
    success: false,
    receivedAt: new Date().toISOString(),
    error,
  };
}

/**
 * Mark a handoff as received by updating its status
 */
export function markHandoffReceived(
  filePath: string,
  handoff: Handoff
): void {
  handoff.metadata.status = 'received';

  // Write updated handoff back to file
  fs.writeFileSync(
    filePath,
    JSON.stringify(handoff, null, 2),
    'utf8'
  );
}

/**
 * Mark a handoff as completed and move to archive
 */
export function markHandoffCompleted(
  projectPath: string,
  handoff: Handoff,
  response: HandoffResponse
): void {
  handoff.metadata.status = 'completed';

  // Archive directory
  const archiveDir = path.join(projectPath, HANDOFFS_DIR, 'archive');
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  // Save handoff with response
  const archiveData = {
    handoff,
    response,
    archivedAt: new Date().toISOString(),
  };

  const filename = `${handoff.metadata.handoffType}_${handoff.metadata.handoffId}.json`;
  const archivePath = path.join(archiveDir, filename);

  fs.writeFileSync(archivePath, JSON.stringify(archiveData, null, 2), 'utf8');

  // Remove from incoming if it exists there
  const incomingPath = path.join(projectPath, HANDOFFS_DIR, 'incoming', filename);
  if (fs.existsSync(incomingPath)) {
    fs.unlinkSync(incomingPath);
  }
}

/**
 * Mark a handoff as failed
 */
export function markHandoffFailed(
  projectPath: string,
  handoff: Handoff,
  response: HandoffResponse
): void {
  handoff.metadata.status = 'failed';

  // Failed directory
  const failedDir = path.join(projectPath, HANDOFFS_DIR, 'failed');
  if (!fs.existsSync(failedDir)) {
    fs.mkdirSync(failedDir, { recursive: true });
  }

  // Save handoff with error response
  const failedData = {
    handoff,
    response,
    failedAt: new Date().toISOString(),
  };

  const filename = `${handoff.metadata.handoffType}_${handoff.metadata.handoffId}.json`;
  const failedPath = path.join(failedDir, filename);

  fs.writeFileSync(failedPath, JSON.stringify(failedData, null, 2), 'utf8');
}

/**
 * Process a handoff (high-level wrapper)
 */
export async function processHandoff(
  handoff: Handoff,
  processor: (handoff: Handoff) => Promise<any>
): Promise<HandoffResponse> {
  try {
    // Validate handoff
    if (!validateHandoff(handoff)) {
      return createErrorResponse(handoff.metadata.handoffId, {
        code: 'INVALID_HANDOFF',
        message: 'Handoff validation failed',
      });
    }

    // Process handoff with provided processor function
    const result = await processor(handoff);

    // Return success response
    return createSuccessResponse(handoff.metadata.handoffId, result);
  } catch (error: any) {
    return createErrorResponse(handoff.metadata.handoffId, {
      code: 'PROCESSING_ERROR',
      message: error.message || 'Unknown error occurred',
      details: error,
    });
  }
}
