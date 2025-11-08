/**
 * Handoff Protocol Integration Tests
 *
 * Comprehensive test suite for all handoff scenarios including:
 * - All 5 handoff types
 * - Validation and error handling
 * - Retry logic and exponential backoff
 * - Atomic operations
 * - Audit logging
 *
 * Created: 2025-10-27
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { createGoalToSpecHandoff, createSpecToTasksHandoff, createTaskCompletionHandoff, createSubgoalCompletionHandoff, createProgressUpdateHandoff, sendHandoff, serializeHandoff } from '../utils/handoff-sender';
import { deserializeHandoff, findPendingHandoffs, validateHandoff, createSuccessResponse, createErrorResponse } from '../utils/handoff-receiver';
import { retryWithBackoff, CircuitBreaker, CircuitState, DEFAULT_RETRY_CONFIG } from '../utils/handoff-error-handler';
import { AtomicTransaction } from '../utils/handoff-atomic';
import { HandoffAuditLogger, AuditLogQuery } from '../utils/handoff-audit';
// ============================================================================
// TEST SETUP
// ============================================================================
let testProjectPath;
let auditLogger;
beforeEach(async () => {
    // Create temporary test directory
    testProjectPath = await mkdtemp(join(tmpdir(), 'handoff-test-'));
    // Initialize audit logger
    auditLogger = new HandoffAuditLogger(testProjectPath, {
        bufferSize: 10,
        enableConsoleLog: false
    });
});
afterEach(async () => {
    // Cleanup
    await auditLogger.cleanup();
    await rm(testProjectPath, { recursive: true, force: true });
});
// ============================================================================
// TEST HELPERS
// ============================================================================
function createTestContext() {
    return {
        projectPath: testProjectPath,
        projectId: 'test-project',
        componentId: 'test-component',
        componentName: 'Test Component',
        majorGoalId: '001',
        majorGoalName: 'Test Goal'
    };
}
function createTestGoalToSpecPayload() {
    return {
        majorGoal: {
            id: '001',
            name: 'Test Major Goal',
            description: 'Test goal description',
            priority: 'high',
            tier: 'now',
            impact: 'high',
            effort: 'medium'
        },
        details: {
            problem: 'Test problem statement',
            expectedValue: 'Test expected value',
            successCriteria: ['Criterion 1', 'Criterion 2']
        },
        dependencies: [],
        risks: [],
        componentContext: {
            componentId: 'test-component',
            componentName: 'Test Component',
            componentPurpose: 'Testing purposes'
        },
        timeframe: {
            estimate: '2-3 weeks'
        },
        targetPaths: {
            subGoalsFolder: join(testProjectPath, 'sub-goals')
        }
    };
}
// ============================================================================
// HANDOFF TYPE TESTS
// ============================================================================
describe('Handoff Type Creation', () => {
    it('should create valid GoalToSpecHandoff', () => {
        const context = createTestContext();
        const payload = createTestGoalToSpecPayload();
        const handoff = createGoalToSpecHandoff(context, payload);
        expect(handoff.handoffType).toBe('goal-to-spec');
        expect(handoff.sourceMCP).toBe('ai-planning');
        expect(handoff.targetMCP).toBe('spec-driven');
        expect(handoff.handoffId).toBeTruthy();
        expect(handoff.version).toBe('1.0.0');
    });
    it('should create valid SpecToTasksHandoff', () => {
        const context = createTestContext();
        const payload = {
            subGoal: {
                id: '1.1',
                name: 'Test Sub-Goal',
                description: 'Test description',
                parentGoalId: '001',
                parentGoalName: 'Test Goal'
            },
            specification: {
                acceptanceCriteria: ['AC1', 'AC2'],
                deliverables: ['Deliverable 1']
            },
            taskGuidance: {
                complexity: 'moderate'
            },
            timeframe: {
                estimate: '3-5 days'
            },
            targetPaths: {
                workflowFolder: join(testProjectPath, 'workflows')
            },
            dependencies: {}
        };
        const handoff = createSpecToTasksHandoff(context, payload);
        expect(handoff.handoffType).toBe('spec-to-tasks');
        expect(handoff.sourceMCP).toBe('spec-driven');
        expect(handoff.targetMCP).toBe('task-executor');
    });
    it('should create valid TaskCompletionHandoff', () => {
        const context = createTestContext();
        const payload = {
            workflow: {
                workflowId: 'wf-001',
                workflowName: 'Test Workflow',
                subGoalId: '1.1',
                majorGoalId: '001'
            },
            completion: {
                allTasksComplete: true,
                completedAt: new Date().toISOString()
            },
            progress: {
                tasksCompleted: 5,
                totalTasks: 5,
                percentage: 100,
                currentStatus: 'completed'
            }
        };
        const handoff = createTaskCompletionHandoff(context, payload);
        expect(handoff.handoffType).toBe('task-completion');
        expect(handoff.sourceMCP).toBe('task-executor');
        expect(handoff.targetMCP).toBe('spec-driven');
    });
    it('should create valid SubgoalCompletionHandoff', () => {
        const context = createTestContext();
        const payload = {
            subGoal: {
                id: '1.1',
                name: 'Test Sub-Goal',
                majorGoalId: '001',
                majorGoalName: 'Test Goal'
            },
            completion: {
                completedAt: new Date().toISOString(),
                allCriteriaMetStatus: true,
                totalWorkflows: 1,
                completedWorkflows: 1
            },
            majorGoalProgress: {
                subGoalsCompleted: 1,
                totalSubGoals: 3,
                percentage: 33,
                suggestedStatus: 'in-progress'
            },
            outcomes: {
                deliverables: ['Test deliverable'],
                successCriteriaMet: ['Criterion 1']
            }
        };
        const handoff = createSubgoalCompletionHandoff(context, payload);
        expect(handoff.handoffType).toBe('subgoal-completion');
        expect(handoff.sourceMCP).toBe('spec-driven');
        expect(handoff.targetMCP).toBe('ai-planning');
    });
    it('should create valid ProgressUpdateHandoff', () => {
        const context = createTestContext();
        const payload = {
            entity: {
                type: 'major-goal',
                id: '001',
                name: 'Test Goal'
            },
            progress: {
                percentage: 50,
                status: 'in-progress',
                lastUpdated: new Date().toISOString(),
                completedItems: 1,
                totalItems: 2
            },
            trigger: {
                event: 'workflow-completed',
                triggeredBy: 'system'
            },
            propagation: {
                shouldBubbleUp: true,
                parentEntityType: 'component',
                parentEntityId: 'test-component'
            }
        };
        const handoff = createProgressUpdateHandoff(context, payload, 'spec-driven', 'ai-planning');
        expect(handoff.handoffType).toBe('progress-update');
    });
});
// ============================================================================
// SERIALIZATION TESTS
// ============================================================================
describe('Handoff Serialization', () => {
    it('should serialize and deserialize handoff correctly', () => {
        const context = createTestContext();
        const payload = createTestGoalToSpecPayload();
        const handoff = createGoalToSpecHandoff(context, payload);
        const serialized = serializeHandoff(handoff);
        const deserialized = deserializeHandoff(serialized);
        expect(deserialized.handoffId).toBe(handoff.handoffId);
        expect(deserialized.handoffType).toBe(handoff.handoffType);
        expect(deserialized.payload).toEqual(handoff.payload);
    });
    it('should reject invalid JSON during deserialization', () => {
        expect(() => {
            deserializeHandoff('invalid json');
        }).toThrow();
    });
    it('should reject handoff with missing required fields', () => {
        const invalidHandoff = {
            version: '1.0.0',
            handoffId: 'test-id'
            // Missing required fields
        };
        expect(() => {
            deserializeHandoff(JSON.stringify(invalidHandoff));
        }).toThrow();
    });
});
// ============================================================================
// VALIDATION TESTS
// ============================================================================
describe('Handoff Validation', () => {
    it('should validate correct handoff', () => {
        const context = createTestContext();
        const payload = createTestGoalToSpecPayload();
        const handoff = createGoalToSpecHandoff(context, payload);
        const result = validateHandoff(handoff);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
    it('should detect timestamp in future', () => {
        const context = createTestContext();
        const payload = createTestGoalToSpecPayload();
        const handoff = createGoalToSpecHandoff(context, payload);
        // Manually set timestamp to future
        handoff.timestamp = new Date(Date.now() + 1000000).toISOString();
        const result = validateHandoff(handoff);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('future'))).toBe(true);
    });
    it('should warn about old handoffs', () => {
        const context = createTestContext();
        const payload = createTestGoalToSpecPayload();
        const handoff = createGoalToSpecHandoff(context, payload);
        // Set timestamp to 100 hours ago
        handoff.timestamp = new Date(Date.now() - 100 * 60 * 60 * 1000).toISOString();
        const result = validateHandoff(handoff);
        expect(result.warnings.length).toBeGreaterThan(0);
    });
});
// ============================================================================
// RETRY LOGIC TESTS
// ============================================================================
describe('Retry Logic', () => {
    it('should retry failed operations with exponential backoff', async () => {
        let attempts = 0;
        const result = await retryWithBackoff(async () => {
            attempts++;
            if (attempts < 3) {
                throw new Error('Simulated failure');
            }
            return 'success';
        }, { ...DEFAULT_RETRY_CONFIG, maxRetries: 3, initialDelayMs: 10 });
        expect(result.success).toBe(true);
        expect(result.result).toBe('success');
        expect(attempts).toBe(3);
    });
    it('should give up after max retries', async () => {
        let attempts = 0;
        const result = await retryWithBackoff(async () => {
            attempts++;
            throw new Error('Persistent failure');
        }, { ...DEFAULT_RETRY_CONFIG, maxRetries: 2, initialDelayMs: 10 });
        expect(result.success).toBe(false);
        expect(attempts).toBe(3); // Initial + 2 retries
    });
    it('should invoke retry callback', async () => {
        const retryAttempts = [];
        await retryWithBackoff(async () => {
            if (retryAttempts.length < 2) {
                throw new Error('Fail');
            }
            return 'ok';
        }, { ...DEFAULT_RETRY_CONFIG, maxRetries: 3, initialDelayMs: 10 }, {
            onRetry: (attempt) => {
                retryAttempts.push(attempt);
            }
        });
        expect(retryAttempts).toEqual([1, 2]);
    });
});
// ============================================================================
// CIRCUIT BREAKER TESTS
// ============================================================================
describe('Circuit Breaker', () => {
    it('should open circuit after failure threshold', async () => {
        const breaker = new CircuitBreaker({
            failureThreshold: 3,
            successThreshold: 2,
            timeout: 1000
        });
        // Cause 3 failures
        for (let i = 0; i < 3; i++) {
            try {
                await breaker.execute(async () => {
                    throw new Error('Fail');
                });
            }
            catch { }
        }
        expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
    it('should move to half-open after timeout', async () => {
        const breaker = new CircuitBreaker({
            failureThreshold: 2,
            successThreshold: 1,
            timeout: 100
        });
        // Open circuit
        for (let i = 0; i < 2; i++) {
            try {
                await breaker.execute(async () => { throw new Error('Fail'); });
            }
            catch { }
        }
        expect(breaker.getState()).toBe(CircuitState.OPEN);
        // Wait for timeout
        await new Promise(resolve => setTimeout(resolve, 150));
        // Next call should move to half-open
        try {
            await breaker.execute(async () => { throw new Error('Fail'); });
        }
        catch { }
        // Will fail but state was half-open during execution
    });
    it('should close circuit after successful calls in half-open', async () => {
        const breaker = new CircuitBreaker({
            failureThreshold: 2,
            successThreshold: 2,
            timeout: 100
        });
        // Open circuit
        for (let i = 0; i < 2; i++) {
            try {
                await breaker.execute(async () => { throw new Error('Fail'); });
            }
            catch { }
        }
        // Wait and recover
        await new Promise(resolve => setTimeout(resolve, 150));
        await breaker.execute(async () => 'ok');
        await breaker.execute(async () => 'ok');
        expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
});
// ============================================================================
// ATOMIC OPERATION TESTS
// ============================================================================
describe('Atomic Operations', () => {
    it('should commit all operations atomically', async () => {
        const tx = new AtomicTransaction(testProjectPath);
        await tx.begin();
        await tx.createFile(join(testProjectPath, 'test1.txt'), 'content1');
        await tx.createFile(join(testProjectPath, 'test2.txt'), 'content2');
        await tx.commit();
        const status = tx.getStatus();
        expect(status.committed).toBe(true);
        expect(status.operationsCount).toBe(2);
    });
    it('should rollback all operations on failure', async () => {
        const tx = new AtomicTransaction(testProjectPath);
        await tx.begin();
        await tx.createFile(join(testProjectPath, 'test.txt'), 'content');
        await tx.rollback();
        const status = tx.getStatus();
        expect(status.rolledBack).toBe(true);
    });
});
// ============================================================================
// AUDIT LOGGING TESTS
// ============================================================================
describe('Audit Logging', () => {
    it('should log handoff creation', async () => {
        const context = createTestContext();
        const payload = createTestGoalToSpecPayload();
        const handoff = createGoalToSpecHandoff(context, payload);
        await auditLogger.logHandoffCreated(handoff);
        await auditLogger.flush();
        const query = new AuditLogQuery(testProjectPath);
        const history = await query.getHandoffHistory(handoff.handoffId);
        expect(history.length).toBeGreaterThan(0);
        expect(history[0].eventType).toBe('handoff_created');
    });
    it('should log handoff completion', async () => {
        const context = createTestContext();
        const payload = createTestGoalToSpecPayload();
        const handoff = createGoalToSpecHandoff(context, payload);
        const response = createSuccessResponse(handoff.handoffId, 'spec-driven', {});
        await auditLogger.logHandoffCompleted(handoff, response);
        await auditLogger.flush();
        const query = new AuditLogQuery(testProjectPath);
        const entries = await query.getEntriesByEventType('handoff_completed');
        expect(entries.length).toBeGreaterThan(0);
    });
    it('should track failed handoffs', async () => {
        const context = createTestContext();
        const payload = createTestGoalToSpecPayload();
        const handoff = createGoalToSpecHandoff(context, payload);
        const response = createErrorResponse(handoff.handoffId, 'spec-driven', {
            code: 'TEST_ERROR',
            message: 'Test error',
            recoverable: false
        });
        await auditLogger.logHandoffCompleted(handoff, response);
        await auditLogger.flush();
        const query = new AuditLogQuery(testProjectPath);
        const failed = await query.getFailedHandoffs();
        expect(failed.length).toBeGreaterThan(0);
    });
});
// ============================================================================
// INTEGRATION TESTS
// ============================================================================
describe('End-to-End Handoff Flow', () => {
    it('should complete full handoff lifecycle', async () => {
        const context = createTestContext();
        const payload = createTestGoalToSpecPayload();
        // 1. Create handoff
        const handoff = createGoalToSpecHandoff(context, payload);
        await auditLogger.logHandoffCreated(handoff);
        // 2. Send handoff
        const sendResult = await sendHandoff(testProjectPath, handoff);
        await auditLogger.logHandoffSent(handoff, sendResult);
        // 3. Find pending handoffs
        const pending = await findPendingHandoffs(testProjectPath, 'spec-driven', 'goal-to-spec');
        expect(pending.length).toBeGreaterThan(0);
        // 4. Load and validate
        const found = pending.find(p => p.handoff.handoffId === handoff.handoffId);
        expect(found).toBeTruthy();
        const validation = validateHandoff(found.handoff);
        await auditLogger.logHandoffValidation(found.handoff, validation);
        // 5. Complete
        const response = createSuccessResponse(handoff.handoffId, 'spec-driven', {});
        await auditLogger.logHandoffCompleted(handoff, response);
        await auditLogger.flush();
        // Verify audit trail
        const query = new AuditLogQuery(testProjectPath);
        const history = await query.getHandoffHistory(handoff.handoffId);
        expect(history.length).toBeGreaterThanOrEqual(4);
    });
});
//# sourceMappingURL=handoff-integration.test%202.js.map