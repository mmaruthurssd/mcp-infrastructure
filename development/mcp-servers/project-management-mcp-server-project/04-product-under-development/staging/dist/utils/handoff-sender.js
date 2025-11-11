/**
 * MCP Handoff Sender
 *
 * Creates, serializes, and sends handoffs to target MCPs
 */
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
const HANDOFF_VERSION = '1.0';
const HANDOFFS_DIR = '.handoffs';
/**
 * Create a goal-to-spec handoff
 */
export function createGoalToSpecHandoff(projectPath, goalData) {
    const metadata = {
        version: HANDOFF_VERSION,
        handoffId: uuidv4(),
        handoffType: 'goal_to_spec',
        timestamp: new Date().toISOString(),
        sourceMcp: 'project-management',
        targetMcp: 'spec-driven',
        sourceProjectPath: projectPath,
        retryCount: 0,
        status: 'pending',
    };
    const data = {
        goalId: goalData.goalId,
        goalName: goalData.goalName,
        goalDescription: goalData.goalDescription,
        goalContext: {
            impact: goalData.impact,
            effort: goalData.effort,
            tier: goalData.tier,
        },
        autonomous: goalData.autonomous,
    };
    return { metadata, data };
}
/**
 * Create a spec-to-tasks handoff
 */
export function createSpecToTasksHandoff(projectPath, specData) {
    const metadata = {
        version: HANDOFF_VERSION,
        handoffId: uuidv4(),
        handoffType: 'spec_to_tasks',
        timestamp: new Date().toISOString(),
        sourceMcp: 'spec-driven',
        targetMcp: 'task-executor',
        sourceProjectPath: projectPath,
        retryCount: 0,
        status: 'pending',
    };
    return { metadata, data: specData };
}
/**
 * Create a task completion handoff
 */
export function createTaskCompletionHandoff(projectPath, taskData) {
    const metadata = {
        version: HANDOFF_VERSION,
        handoffId: uuidv4(),
        handoffType: 'task_completion',
        timestamp: new Date().toISOString(),
        sourceMcp: 'task-executor',
        targetMcp: 'spec-driven',
        sourceProjectPath: projectPath,
        retryCount: 0,
        status: 'pending',
    };
    return { metadata, data: taskData };
}
/**
 * Create a progress update handoff
 */
export function createProgressUpdateHandoff(projectPath, progressData) {
    const metadata = {
        version: HANDOFF_VERSION,
        handoffId: uuidv4(),
        handoffType: 'progress_update',
        timestamp: new Date().toISOString(),
        sourceMcp: 'spec-driven',
        targetMcp: 'project-management',
        sourceProjectPath: projectPath,
        retryCount: 0,
        status: 'pending',
    };
    return { metadata, data: progressData };
}
/**
 * Create a subgoal completion handoff
 */
export function createSubgoalCompletionHandoff(projectPath, data) {
    const metadata = {
        version: HANDOFF_VERSION,
        handoffId: uuidv4(),
        handoffType: 'subgoal_completion',
        timestamp: new Date().toISOString(),
        sourceMcp: 'spec-driven',
        targetMcp: 'project-management',
        sourceProjectPath: projectPath,
        retryCount: 0,
        status: 'pending',
    };
    return { metadata, data };
}
/**
 * Serialize a handoff to JSON string
 */
export function serializeHandoff(handoff) {
    return JSON.stringify(handoff, null, 2);
}
/**
 * Send a handoff by writing to the handoffs directory
 * Returns the file path where the handoff was saved
 */
export function sendHandoff(handoff) {
    const projectPath = handoff.metadata.sourceProjectPath;
    const handoffsDir = path.join(projectPath, HANDOFFS_DIR, 'outgoing');
    // Ensure directory exists
    if (!fs.existsSync(handoffsDir)) {
        fs.mkdirSync(handoffsDir, { recursive: true });
    }
    // Create filename with timestamp and handoff ID
    const filename = `${handoff.metadata.handoffType}_${handoff.metadata.handoffId}.json`;
    const filePath = path.join(handoffsDir, filename);
    // Update status to sent
    handoff.metadata.status = 'sent';
    // Write handoff to file
    fs.writeFileSync(filePath, serializeHandoff(handoff), 'utf8');
    return filePath;
}
/**
 * HandoffBuilder - Fluent interface for building handoffs
 */
export class HandoffBuilder {
    handoff;
    constructor(type) {
        this.handoff = {
            metadata: {
                version: HANDOFF_VERSION,
                handoffId: uuidv4(),
                handoffType: type,
                timestamp: new Date().toISOString(),
                sourceMcp: 'project-management',
                targetMcp: '',
                sourceProjectPath: '',
                retryCount: 0,
                status: 'pending',
            },
            data: {},
        };
    }
    setSource(mcp, projectPath) {
        if (this.handoff.metadata) {
            this.handoff.metadata.sourceMcp = mcp;
            this.handoff.metadata.sourceProjectPath = projectPath;
        }
        return this;
    }
    setTarget(mcp, projectPath) {
        if (this.handoff.metadata) {
            this.handoff.metadata.targetMcp = mcp;
            if (projectPath) {
                this.handoff.metadata.targetProjectPath = projectPath;
            }
        }
        return this;
    }
    setData(data) {
        this.handoff.data = data;
        return this;
    }
    build() {
        if (!this.handoff.metadata?.targetMcp) {
            throw new Error('Target MCP must be specified');
        }
        if (!this.handoff.metadata?.sourceProjectPath) {
            throw new Error('Source project path must be specified');
        }
        return this.handoff;
    }
    buildAndSend() {
        const handoff = this.build();
        return sendHandoff(handoff);
    }
}
//# sourceMappingURL=handoff-sender.js.map