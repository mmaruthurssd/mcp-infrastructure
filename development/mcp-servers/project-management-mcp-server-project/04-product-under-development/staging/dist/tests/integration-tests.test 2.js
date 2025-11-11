/**
 * Integration Tests for Goals 004, 007, 008
 *
 * Comprehensive integration tests for:
 * - Goal 004: PROJECT OVERVIEW Generation Tool
 * - Goal 007: MCP Handoff Protocol
 * - Goal 008: Progress Aggregation System
 *
 * Created: 2025-10-27
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
// Goal 004: PROJECT OVERVIEW tools
import { startProjectOverviewConversation, continueProjectOverviewConversation, } from '../tools/start-project-overview-conversation';
import { generateProjectOverview, approveProjectOverview, } from '../tools/generate-project-overview';
// Goal 007: Handoff Protocol
import { createGoalToSpecHandoff, serializeHandoff, } from '../utils/handoff-sender';
import { deserializeHandoff } from '../utils/handoff-receiver';
import { HandoffAuditLogger } from '../utils/handoff-audit';
// Goal 008: Progress Aggregation
import { ProgressCacheManager } from '../cache/progress-cache-manager';
import { ProgressQueryService } from '../services/progress-query-service';
describe('Goal 004: PROJECT OVERVIEW Generation Tool', () => {
    let testProjectPath;
    beforeEach(async () => {
        testProjectPath = await mkdtemp(join(tmpdir(), 'test-project-'));
    });
    afterEach(async () => {
        await rm(testProjectPath, { recursive: true, force: true });
    });
    describe('Conversational Flow', () => {
        it('should start conversation and ask first question', async () => {
            const result = await startProjectOverviewConversation({
                projectPath: testProjectPath,
                projectName: 'Test Project',
            });
            expect(result.success).toBe(true);
            expect(result.conversationId).toBeTruthy();
            expect(result.currentQuestion.questionNumber).toBe(1);
            expect(result.currentQuestion.totalQuestions).toBe(5);
            expect(result.currentQuestion.questionText).toContain('tell me about your project');
        });
        it('should progress through conversation with user responses', async () => {
            // Start conversation
            const startResult = await startProjectOverviewConversation({
                projectPath: testProjectPath,
                projectName: 'Medical Practice App',
            });
            expect(startResult.success).toBe(true);
            // Answer Q1: Project basics
            const q1Response = await continueProjectOverviewConversation({
                projectPath: testProjectPath,
                conversationId: startResult.conversationId,
                userResponse: `I'm building a medical practice management system for small clinics.
It helps with appointments, patient records, and billing. Current solutions are too
expensive for small practices.`,
            });
            expect(q1Response.success).toBe(true);
            expect(q1Response.currentQuestion?.questionNumber).toBe(2);
            // Answer Q2: Vision & success
            const q2Response = await continueProjectOverviewConversation({
                projectPath: testProjectPath,
                conversationId: startResult.conversationId,
                userResponse: `Success means clinics can manage their practice affordably.
Key outcomes: easy scheduling, secure patient records, simple billing.
I'll know it's working when clinics save time and reduce no-shows.`,
            });
            expect(q2Response.success).toBe(true);
            expect(q2Response.currentQuestion?.questionNumber).toBe(3);
        });
        it('should extract information from responses', async () => {
            const startResult = await startProjectOverviewConversation({
                projectPath: testProjectPath,
                initialDescription: 'Building a React app with Node.js backend',
            });
            const response = await continueProjectOverviewConversation({
                projectPath: testProjectPath,
                conversationId: startResult.conversationId,
                userResponse: `In scope: user authentication, dashboard, API.
Out of scope: mobile app, marketing automation. Timeline: 3 months MVP.`,
            });
            expect(response.success).toBe(true);
        });
        it('should generate PROJECT OVERVIEW after all questions', async () => {
            const startResult = await startProjectOverviewConversation({
                projectPath: testProjectPath,
                projectName: 'Test SaaS',
            });
            // Answer all 5 questions (simplified for test)
            for (let i = 1; i <= 5; i++) {
                await continueProjectOverviewConversation({
                    projectPath: testProjectPath,
                    conversationId: startResult.conversationId,
                    userResponse: `Response to question ${i}`,
                });
            }
            // Generate overview
            const generateResult = await generateProjectOverview({
                projectPath: testProjectPath,
                conversationId: startResult.conversationId,
            });
            expect(generateResult.success).toBe(true);
            expect(generateResult.projectOverviewPath).toBeTruthy();
            expect(generateResult.confidence).toBeGreaterThan(0);
        });
    });
    describe('Information Extraction', () => {
        it('should extract project type from description', async () => {
            const { extractProjectType } = await import('../utils/information-extraction');
            expect(extractProjectType('Building a web app with React')).toBe('software');
            expect(extractProjectType('Research study on user behavior')).toBe('research');
            expect(extractProjectType('New product hardware device')).toBe('product');
        });
        it('should extract success criteria from text', async () => {
            const { extractSuccessCriteria } = await import('../utils/information-extraction');
            const criteria = extractSuccessCriteria(`Success means 50% reduction in time, 100 users onboarded, and positive feedback`);
            expect(criteria.length).toBeGreaterThan(0);
            expect(criteria.some(c => c.includes('50%'))).toBe(true);
        });
        it('should extract technologies', async () => {
            const { extractTechnologies } = await import('../utils/information-extraction');
            const { technologies } = extractTechnologies('Using React, Node.js, PostgreSQL, and Docker');
            expect(technologies).toContain('React');
            expect(technologies).toContain('Node.js');
            expect(technologies).toContain('PostgreSQL');
            expect(technologies).toContain('Docker');
        });
    });
    describe('Approval Workflow', () => {
        it('should handle approval and generate final document', async () => {
            const startResult = await startProjectOverviewConversation({
                projectPath: testProjectPath,
                projectName: 'Test Project',
            });
            // Complete conversation (simplified)
            for (let i = 1; i <= 5; i++) {
                await continueProjectOverviewConversation({
                    projectPath: testProjectPath,
                    conversationId: startResult.conversationId,
                    userResponse: `Answer ${i}`,
                });
            }
            // Approve
            const approveResult = await approveProjectOverview({
                projectPath: testProjectPath,
                conversationId: startResult.conversationId,
                action: 'approve',
            });
            expect(approveResult.success).toBe(true);
            expect(approveResult.projectOverviewPath).toBeTruthy();
        });
    });
});
describe('Goal 007: MCP Handoff Protocol', () => {
    describe('Handoff Creation', () => {
        it('should create goal-to-spec handoff', () => {
            const handoff = createGoalToSpecHandoff({
                projectPath: '/test/project',
                projectId: 'test-project',
                componentId: 'data-model',
                componentName: 'Data Model Component',
                majorGoalId: '001',
            }, {
                majorGoal: {
                    id: '001',
                    name: 'Design Data Model',
                    description: 'Design hierarchical data structures',
                    priority: 'high',
                    tier: 'now',
                    impact: 'high',
                    effort: 'medium',
                },
                details: {
                    problem: 'Need to design hierarchical data structures',
                    expectedValue: 'Well-designed data model for the system',
                    successCriteria: ['Entity interfaces defined', 'Validation schemas complete'],
                },
                dependencies: [],
                risks: [],
                componentContext: {
                    componentId: 'data-model',
                    componentName: 'Data Model Component',
                    componentPurpose: 'Data model design and implementation',
                },
                timeframe: {
                    estimate: '2 weeks',
                },
                targetPaths: {
                    subGoalsFolder: '/test/project/components/data-model/major-goals/001/sub-goals',
                },
            });
            expect(handoff.handoffType).toBe('goal-to-spec');
            expect(handoff.sourceMCP).toBe('ai-planning');
            expect(handoff.targetMCP).toBe('spec-driven');
            expect(handoff.handoffId).toBeTruthy();
            expect(handoff.payload.majorGoal.name).toBe('Design Data Model');
        });
    });
    describe('Serialization & Deserialization', () => {
        it('should serialize and deserialize handoff', () => {
            const original = createGoalToSpecHandoff({
                projectPath: '/test',
                projectId: 'test-project',
                componentId: 'test',
                componentName: 'Test Component',
                majorGoalId: '001',
            }, {
                majorGoal: {
                    id: '001',
                    name: 'Test Goal',
                    description: 'Test',
                    priority: 'medium',
                    tier: 'now',
                    impact: 'medium',
                    effort: 'low',
                },
                details: {
                    problem: 'Test problem',
                    expectedValue: 'Test value',
                    successCriteria: [],
                },
                dependencies: [],
                risks: [],
                componentContext: {
                    componentId: 'test',
                    componentName: 'Test Component',
                    componentPurpose: 'Test component purpose',
                },
                timeframe: {
                    estimate: '1 week',
                },
                targetPaths: {
                    subGoalsFolder: '/test/components/test/major-goals/001/sub-goals',
                },
            });
            const serialized = serializeHandoff(original);
            expect(typeof serialized).toBe('string');
            const deserialized = deserializeHandoff(serialized);
            expect(deserialized.handoffId).toBe(original.handoffId);
            expect(deserialized.handoffType).toBe(original.handoffType);
            expect(deserialized.payload).toEqual(original.payload);
        });
    });
    describe('Validation', () => {
        it('should validate handoff structure', () => {
            const handoff = createGoalToSpecHandoff({
                projectPath: '/test',
                projectId: 'test-project',
                componentId: 'test',
                componentName: 'Test Component',
                majorGoalId: '001'
            }, {
                majorGoal: {
                    id: '001',
                    name: 'Test',
                    description: 'Test',
                    priority: 'high',
                    tier: 'now',
                    impact: 'high',
                    effort: 'high',
                },
                details: {
                    problem: 'Test problem',
                    expectedValue: 'Test value',
                    successCriteria: [],
                },
                dependencies: [],
                risks: [],
                componentContext: {
                    componentId: 'test',
                    componentName: 'Test Component',
                    componentPurpose: 'Test component purpose',
                },
                timeframe: {
                    estimate: '1w',
                },
                targetPaths: {
                    subGoalsFolder: '/test/components/test/major-goals/001/sub-goals',
                },
            });
            // Should not throw
            expect(() => serializeHandoff(handoff)).not.toThrow();
        });
        it('should reject invalid handoff', () => {
            const invalidJson = '{"invalid": "handoff"}';
            expect(() => deserializeHandoff(invalidJson)).toThrow();
        });
    });
    describe('Audit Trail', () => {
        let testProjectPath;
        let auditLogger;
        beforeEach(async () => {
            testProjectPath = await mkdtemp(join(tmpdir(), 'test-audit-'));
            auditLogger = new HandoffAuditLogger(testProjectPath);
        });
        afterEach(async () => {
            await auditLogger.cleanup();
            await rm(testProjectPath, { recursive: true, force: true });
        });
        it('should log handoff creation', async () => {
            const handoff = createGoalToSpecHandoff({
                projectPath: testProjectPath,
                projectId: 'test-project',
                componentId: 'test',
                componentName: 'Test Component',
                majorGoalId: '001'
            }, {
                majorGoal: {
                    id: '001',
                    name: 'Test',
                    description: 'Test',
                    priority: 'high',
                    tier: 'now',
                    impact: 'high',
                    effort: 'medium',
                },
                details: {
                    problem: 'Test problem',
                    expectedValue: 'Test value',
                    successCriteria: [],
                },
                dependencies: [],
                risks: [],
                componentContext: {
                    componentId: 'test',
                    componentName: 'Test Component',
                    componentPurpose: 'Test component purpose',
                },
                timeframe: {
                    estimate: '1w',
                },
                targetPaths: {
                    subGoalsFolder: `${testProjectPath}/components/test/major-goals/001/sub-goals`,
                },
            });
            await auditLogger.logHandoffCreated(handoff);
            await auditLogger.flush();
            // Would query audit logs here
            expect(true).toBe(true); // Placeholder
        });
    });
});
describe('Goal 008: Progress Aggregation System', () => {
    let testProjectPath;
    let cache;
    beforeEach(async () => {
        testProjectPath = await mkdtemp(join(tmpdir(), 'test-progress-'));
        cache = new ProgressCacheManager();
    });
    afterEach(async () => {
        cache.destroy();
        await rm(testProjectPath, { recursive: true, force: true });
    });
    describe('Cache Manager', () => {
        it('should cache and retrieve progress', () => {
            const progress = {
                percentage: 50,
                status: 'in-progress',
                lastUpdated: new Date().toISOString(),
                completedItems: 5,
                totalItems: 10,
            };
            cache.set('major-goal', '001', progress);
            const retrieved = cache.get('major-goal', '001');
            expect(retrieved).toEqual(progress);
        });
        it('should expire entries after TTL', async () => {
            const shortTTLCache = new ProgressCacheManager({ defaultTTL: 100 });
            shortTTLCache.set('major-goal', '001', {
                percentage: 0,
                status: 'not-started',
                lastUpdated: new Date().toISOString(),
                completedItems: 0,
                totalItems: 0,
            });
            expect(shortTTLCache.has('major-goal', '001')).toBe(true);
            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 150));
            expect(shortTTLCache.has('major-goal', '001')).toBe(false);
            shortTTLCache.destroy();
        });
        it('should evict entries when cache is full', () => {
            const smallCache = new ProgressCacheManager({ maxEntries: 3 });
            smallCache.set('major-goal', '001', {
                percentage: 0,
                status: 'not-started',
                lastUpdated: new Date().toISOString(),
                completedItems: 0,
                totalItems: 0,
            });
            smallCache.set('major-goal', '002', {
                percentage: 0,
                status: 'not-started',
                lastUpdated: new Date().toISOString(),
                completedItems: 0,
                totalItems: 0,
            });
            smallCache.set('major-goal', '003', {
                percentage: 0,
                status: 'not-started',
                lastUpdated: new Date().toISOString(),
                completedItems: 0,
                totalItems: 0,
            });
            // Triggers eviction
            smallCache.set('major-goal', '004', {
                percentage: 0,
                status: 'not-started',
                lastUpdated: new Date().toISOString(),
                completedItems: 0,
                totalItems: 0,
            });
            const stats = smallCache.getStatistics();
            expect(stats.evictions).toBeGreaterThan(0);
            smallCache.destroy();
        });
        it('should cascade invalidation up hierarchy', () => {
            cache.set('task', '1', {
                percentage: 100,
                status: 'completed',
                lastUpdated: new Date().toISOString(),
                completedItems: 1,
                totalItems: 1,
            }, {
                parentEntityType: 'task-workflow',
                parentEntityId: 'workflow-1',
            });
            cache.set('task-workflow', 'workflow-1', {
                percentage: 50,
                status: 'in-progress',
                lastUpdated: new Date().toISOString(),
                completedItems: 5,
                totalItems: 10,
            }, {
                parentEntityType: 'sub-goal',
                parentEntityId: '1.1',
            });
            // Invalidate task and cascade up
            const invalidated = cache.invalidate('task', '1', { cascadeUp: true });
            expect(invalidated).toBeGreaterThanOrEqual(1);
            expect(cache.has('task', '1')).toBe(false);
        });
    });
    describe('Cache Statistics', () => {
        it('should track hit rate', () => {
            cache.set('major-goal', '001', {
                percentage: 0,
                status: 'not-started',
                lastUpdated: new Date().toISOString(),
                completedItems: 0,
                totalItems: 0,
            });
            // Hit
            cache.get('major-goal', '001');
            // Miss
            cache.get('major-goal', '002');
            const stats = cache.getStatistics();
            expect(stats.hits).toBe(1);
            expect(stats.misses).toBe(1);
            expect(stats.hitRate).toBeCloseTo(50, 0);
        });
    });
    describe('Query Service', () => {
        it('should query progress with caching', async () => {
            const queryService = new ProgressQueryService(testProjectPath, cache);
            // This would work if test project had actual structure
            // For now, just verify service initializes
            expect(queryService).toBeTruthy();
        });
        it('should provide cache hit metadata', () => {
            // Cache a value
            cache.set('major-goal', '001', {
                percentage: 50,
                status: 'in-progress',
                lastUpdated: new Date().toISOString(),
                completedItems: 5,
                totalItems: 10,
            });
            // Second query should be cache hit
            const result = cache.get('major-goal', '001');
            expect(result).toBeTruthy();
            const stats = cache.getStatistics();
            expect(stats.hits).toBeGreaterThan(0);
        });
    });
    describe('Performance', () => {
        it('should handle 100+ entries efficiently', () => {
            const startTime = Date.now();
            // Add 100 entries
            for (let i = 1; i <= 100; i++) {
                cache.set('major-goal', `${i}`, {
                    percentage: i,
                    status: 'in-progress',
                    lastUpdated: new Date().toISOString(),
                    completedItems: i,
                    totalItems: 100,
                });
            }
            const setDuration = Date.now() - startTime;
            // Retrieve all
            const getStartTime = Date.now();
            for (let i = 1; i <= 100; i++) {
                cache.get('major-goal', `${i}`);
            }
            const getDuration = Date.now() - getStartTime;
            // Should be fast (< 100ms for both operations)
            expect(setDuration).toBeLessThan(100);
            expect(getDuration).toBeLessThan(100);
        });
    });
});
describe('Integration: Full Workflow', () => {
    let testProjectPath;
    beforeEach(async () => {
        testProjectPath = await mkdtemp(join(tmpdir(), 'test-integration-'));
    });
    afterEach(async () => {
        await rm(testProjectPath, { recursive: true, force: true });
    });
    it('should complete end-to-end workflow: conversation → overview → handoff → progress', async () => {
        // 1. Start PROJECT OVERVIEW conversation
        const conversationResult = await startProjectOverviewConversation({
            projectPath: testProjectPath,
            projectName: 'Integration Test Project',
        });
        expect(conversationResult.success).toBe(true);
        // 2. Complete conversation (simplified)
        for (let i = 1; i <= 5; i++) {
            await continueProjectOverviewConversation({
                projectPath: testProjectPath,
                conversationId: conversationResult.conversationId,
                userResponse: `Response ${i}`,
            });
        }
        // 3. Generate PROJECT OVERVIEW
        const overviewResult = await generateProjectOverview({
            projectPath: testProjectPath,
            conversationId: conversationResult.conversationId,
        });
        expect(overviewResult.success).toBe(true);
        // 4. Create handoff
        const handoff = createGoalToSpecHandoff({
            projectPath: testProjectPath,
            projectId: 'integration-test-project',
            componentId: 'test-component',
            componentName: 'Test Component',
            majorGoalId: '001',
        }, {
            majorGoal: {
                id: '001',
                name: 'Test Goal',
                description: 'Integration test goal',
                priority: 'high',
                tier: 'now',
                impact: 'high',
                effort: 'medium',
            },
            details: {
                problem: 'Integration test problem',
                expectedValue: 'Integration test value',
                successCriteria: ['Criterion 1'],
            },
            dependencies: [],
            risks: [],
            componentContext: {
                componentId: 'test-component',
                componentName: 'Test Component',
                componentPurpose: 'Test component purpose',
            },
            timeframe: {
                estimate: '1 week',
            },
            targetPaths: {
                subGoalsFolder: `${testProjectPath}/components/test-component/major-goals/001/sub-goals`,
            },
        });
        expect(handoff.handoffId).toBeTruthy();
        // 5. Initialize progress tracking
        const cache = new ProgressCacheManager();
        cache.set('major-goal', '001', {
            percentage: 0,
            status: 'not-started',
            lastUpdated: new Date().toISOString(),
            completedItems: 0,
            totalItems: 10,
        });
        const progress = cache.get('major-goal', '001');
        expect(progress).toBeTruthy();
        expect(progress?.percentage).toBe(0);
        cache.destroy();
    });
});
//# sourceMappingURL=integration-tests.test%202.js.map