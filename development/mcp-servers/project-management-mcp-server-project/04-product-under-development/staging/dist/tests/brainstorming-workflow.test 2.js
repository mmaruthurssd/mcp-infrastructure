/**
 * Integration Tests: Goal 009 - Brainstorming Workflow Framework
 *
 * Tests for:
 * - start_brainstorming_session: Create brainstorming sessions
 * - add_brainstorming_idea: Capture ideas and approaches
 * - record_brainstorming_decision: Document decisions
 * - get_brainstorming_session: Get session status
 * - Integration with promote_to_major_goal from Goal 006
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { startBrainstormingSession, addBrainstormingIdea, recordBrainstormingDecision, getBrainstormingSession, } from '../tools/brainstorming-workflow';
import { promoteToMajorGoal } from '../tools/major-goal-workflow';
describe('Goal 009: Brainstorming Workflow Framework', () => {
    let tempDir;
    let projectPath;
    beforeEach(() => {
        // Create temporary project structure
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brainstorm-test-'));
        projectPath = tempDir;
        // Create basic project structure
        fs.mkdirSync(path.join(projectPath, 'brainstorming'), { recursive: true });
        // Create component structure for promotion tests
        const componentsPath = path.join(projectPath, '02-goals-and-roadmap', 'components', 'test-component', 'major-goals');
        fs.mkdirSync(componentsPath, { recursive: true });
    });
    afterEach(() => {
        // Clean up
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });
    // ============================================================================
    // TEST: start_brainstorming_session
    // ============================================================================
    describe('start_brainstorming_session', () => {
        it('should create a new brainstorming session', async () => {
            const result = await startBrainstormingSession({
                projectPath,
                title: 'Marketing Strategy Exploration',
                problem: 'We need to improve our marketing reach but unclear which channels to prioritize',
                context: 'Budget: $50K, Timeline: Q1 2025, Target: B2B SaaS companies',
                componentId: 'marketing-component',
            });
            expect(result.success).toBe(true);
            expect(result.session).toBeDefined();
            expect(result.session?.title).toBe('Marketing Strategy Exploration');
            expect(result.session?.problem).toContain('improve our marketing reach');
            expect(result.session?.status).toBe('active');
            expect(result.session?.ideasCount).toBe(0);
            expect(result.session?.decisionsCount).toBe(0);
            // Verify folder structure created
            const sessionPath = result.sessionPath;
            expect(fs.existsSync(sessionPath)).toBe(true);
            expect(fs.existsSync(path.join(sessionPath, 'ideas'))).toBe(true);
            expect(fs.existsSync(path.join(sessionPath, 'decisions'))).toBe(true);
            expect(fs.existsSync(path.join(sessionPath, 'SESSION-OVERVIEW.md'))).toBe(true);
            expect(fs.existsSync(path.join(sessionPath, 'DECISION-LOG.md'))).toBe(true);
            // Verify SESSION-OVERVIEW.md content
            const overviewContent = fs.readFileSync(path.join(sessionPath, 'SESSION-OVERVIEW.md'), 'utf-8');
            expect(overviewContent).toContain('Marketing Strategy Exploration');
            expect(overviewContent).toContain('improve our marketing reach');
            expect(overviewContent).toContain('Budget: $50K');
            expect(overviewContent).toContain('marketing-component');
        });
        it('should generate unique session IDs', async () => {
            const result1 = await startBrainstormingSession({
                projectPath,
                title: 'Session One',
                problem: 'Problem one',
            });
            const result2 = await startBrainstormingSession({
                projectPath,
                title: 'Session Two',
                problem: 'Problem two',
            });
            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
            expect(result1.session?.id).not.toBe(result2.session?.id);
        });
        it('should create session without optional fields', async () => {
            const result = await startBrainstormingSession({
                projectPath,
                title: 'Simple Session',
                problem: 'We need to decide on a technology stack',
            });
            expect(result.success).toBe(true);
            expect(result.session?.context).toBeUndefined();
            expect(result.session?.componentId).toBeUndefined();
        });
    });
    // ============================================================================
    // TEST: add_brainstorming_idea
    // ============================================================================
    describe('add_brainstorming_idea', () => {
        let sessionId;
        beforeEach(async () => {
            const session = await startBrainstormingSession({
                projectPath,
                title: 'Marketing Strategy',
                problem: 'Which marketing channels should we prioritize?',
            });
            sessionId = session.session.id;
        });
        it('should add an idea to brainstorming session', async () => {
            const result = await addBrainstormingIdea({
                projectPath,
                sessionId,
                title: 'Content Marketing',
                description: 'Focus on blog posts, SEO, and long-form content',
                approach: 'Build authority through educational content, target keywords with high search volume',
                pros: [
                    'Long-term organic traffic growth',
                    'Establishes thought leadership',
                    'Lower cost per acquisition over time',
                ],
                cons: [
                    'Takes 6-12 months to see results',
                    'Requires consistent content production',
                    'Competitive keywords are difficult',
                ],
                estimatedEffort: '3-4 months setup, ongoing',
                feasibility: 'high',
            });
            expect(result.success).toBe(true);
            expect(result.idea).toBeDefined();
            expect(result.idea?.id).toBe('idea-1');
            expect(result.idea?.title).toBe('Content Marketing');
            expect(result.idea?.pros.length).toBe(3);
            expect(result.idea?.cons.length).toBe(3);
            expect(result.idea?.feasibility).toBe('high');
            // Verify idea file created
            const ideaPath = result.ideaPath;
            expect(fs.existsSync(ideaPath)).toBe(true);
            const ideaContent = fs.readFileSync(ideaPath, 'utf-8');
            expect(ideaContent).toContain('Content Marketing');
            expect(ideaContent).toContain('Long-term organic traffic growth');
            expect(ideaContent).toContain('Takes 6-12 months');
        });
        it('should add multiple ideas with sequential IDs', async () => {
            const idea1 = await addBrainstormingIdea({
                projectPath,
                sessionId,
                title: 'Social Media',
                description: 'Build presence on LinkedIn and Twitter',
                approach: 'Daily posts and engagement',
            });
            const idea2 = await addBrainstormingIdea({
                projectPath,
                sessionId,
                title: 'Paid Advertising',
                description: 'Google Ads and LinkedIn Ads',
                approach: 'Targeted campaigns',
            });
            const idea3 = await addBrainstormingIdea({
                projectPath,
                sessionId,
                title: 'Email Marketing',
                description: 'Newsletter and drip campaigns',
                approach: 'Build email list',
            });
            expect(idea1.idea?.id).toBe('idea-1');
            expect(idea2.idea?.id).toBe('idea-2');
            expect(idea3.idea?.id).toBe('idea-3');
        });
        it('should update SESSION-OVERVIEW.md with new ideas', async () => {
            await addBrainstormingIdea({
                projectPath,
                sessionId,
                title: 'Content Marketing',
                description: 'Blog and SEO strategy',
                approach: 'Educational content',
            });
            await addBrainstormingIdea({
                projectPath,
                sessionId,
                title: 'Social Media',
                description: 'LinkedIn and Twitter',
                approach: 'Daily engagement',
            });
            const sessionPath = path.join(projectPath, 'brainstorming', 'sessions', sessionId);
            const overviewContent = fs.readFileSync(path.join(sessionPath, 'SESSION-OVERVIEW.md'), 'utf-8');
            expect(overviewContent).toContain('idea-1');
            expect(overviewContent).toContain('Content Marketing');
            expect(overviewContent).toContain('idea-2');
            expect(overviewContent).toContain('Social Media');
        });
        it('should fail if session does not exist', async () => {
            const result = await addBrainstormingIdea({
                projectPath,
                sessionId: 'non-existent-session',
                title: 'Test Idea',
                description: 'This should fail',
                approach: 'Test approach',
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });
        it('should support ideas without research data', async () => {
            const result = await addBrainstormingIdea({
                projectPath,
                sessionId,
                title: 'Partnership Strategy',
                description: 'Explore strategic partnerships',
                approach: 'Reach out to complementary companies',
            });
            expect(result.success).toBe(true);
            expect(result.idea?.status).toBe('exploring');
            expect(result.idea?.pros.length).toBe(0);
            expect(result.idea?.cons.length).toBe(0);
        });
    });
    // ============================================================================
    // TEST: record_brainstorming_decision
    // ============================================================================
    describe('record_brainstorming_decision', () => {
        let sessionId;
        beforeEach(async () => {
            const session = await startBrainstormingSession({
                projectPath,
                title: 'Marketing Strategy',
                problem: 'Which marketing channels should we prioritize?',
            });
            sessionId = session.session.id;
            // Add 3 ideas
            await addBrainstormingIdea({
                projectPath,
                sessionId,
                title: 'Content Marketing',
                description: 'Blog and SEO',
                approach: 'Educational content',
                feasibility: 'high',
            });
            await addBrainstormingIdea({
                projectPath,
                sessionId,
                title: 'Paid Advertising',
                description: 'Google and LinkedIn Ads',
                approach: 'Targeted campaigns',
                feasibility: 'medium',
            });
            await addBrainstormingIdea({
                projectPath,
                sessionId,
                title: 'Cold Outreach',
                description: 'Direct sales outreach',
                approach: 'Email and LinkedIn DMs',
                feasibility: 'low',
            });
        });
        it('should record a brainstorming decision', async () => {
            const result = await recordBrainstormingDecision({
                projectPath,
                sessionId,
                selectedIdeas: ['idea-1', 'idea-2'],
                rejectedIdeas: ['idea-3'],
                rationale: 'Content marketing provides long-term value and paid ads give us quick wins. Cold outreach has low ROI and doesn\'t scale.',
                tradeoffs: 'We\'re not doing cold outreach which could provide some immediate leads, but the team bandwidth is better spent on scalable channels.',
                nextSteps: [
                    'Promote Content Marketing to major goal',
                    'Promote Paid Advertising to major goal',
                    'Set budgets for both channels',
                ],
                decidedBy: 'Marketing Team',
            });
            expect(result.success).toBe(true);
            expect(result.decision).toBeDefined();
            expect(result.decision?.id).toBe('decision-1');
            expect(result.decision?.selectedIdeas).toEqual(['idea-1', 'idea-2']);
            expect(result.decision?.rejectedIdeas).toEqual(['idea-3']);
            // Verify decision file created
            const decisionPath = result.decisionPath;
            expect(fs.existsSync(decisionPath)).toBe(true);
            const decisionContent = fs.readFileSync(decisionPath, 'utf-8');
            expect(decisionContent).toContain('idea-1');
            expect(decisionContent).toContain('idea-2');
            expect(decisionContent).toContain('idea-3');
            expect(decisionContent).toContain('Content marketing provides long-term value');
            expect(decisionContent).toContain('Marketing Team');
        });
        it('should update DECISION-LOG.md', async () => {
            await recordBrainstormingDecision({
                projectPath,
                sessionId,
                selectedIdeas: ['idea-1'],
                rationale: 'Best ROI',
            });
            const sessionPath = path.join(projectPath, 'brainstorming', 'sessions', sessionId);
            const logContent = fs.readFileSync(path.join(sessionPath, 'DECISION-LOG.md'), 'utf-8');
            expect(logContent).toContain('decision-1');
            expect(logContent).toContain('idea-1');
        });
        it('should update session status to "decided"', async () => {
            await recordBrainstormingDecision({
                projectPath,
                sessionId,
                selectedIdeas: ['idea-1'],
                rationale: 'Best approach',
            });
            const sessionPath = path.join(projectPath, 'brainstorming', 'sessions', sessionId);
            const overviewContent = fs.readFileSync(path.join(sessionPath, 'SESSION-OVERVIEW.md'), 'utf-8');
            expect(overviewContent).toContain('**Status:** Decided');
        });
        it('should fail if idea does not exist', async () => {
            const result = await recordBrainstormingDecision({
                projectPath,
                sessionId,
                selectedIdeas: ['idea-999'],
                rationale: 'This should fail',
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });
        it('should support decision without rejected ideas', async () => {
            const result = await recordBrainstormingDecision({
                projectPath,
                sessionId,
                selectedIdeas: ['idea-1', 'idea-2'],
                rationale: 'Both approaches complement each other',
                nextSteps: ['Promote both to major goals'],
            });
            expect(result.success).toBe(true);
            expect(result.decision?.rejectedIdeas.length).toBe(0);
        });
    });
    // ============================================================================
    // TEST: get_brainstorming_session
    // ============================================================================
    describe('get_brainstorming_session', () => {
        let sessionId;
        beforeEach(async () => {
            const session = await startBrainstormingSession({
                projectPath,
                title: 'Technology Stack Selection',
                problem: 'Choose between React, Vue, and Angular for frontend',
            });
            sessionId = session.session.id;
        });
        it('should get brainstorming session status', async () => {
            const result = await getBrainstormingSession({
                projectPath,
                sessionId,
            });
            expect(result.success).toBe(true);
            expect(result.session).toBeDefined();
            expect(result.session?.id).toBe(sessionId);
            expect(result.session?.title).toBe('Technology Stack Selection');
            expect(result.session?.status).toBe('Active');
            expect(result.session?.ideasCount).toBe(0);
            expect(result.session?.decisionsCount).toBe(0);
            expect(result.session?.ideas).toEqual([]);
            expect(result.session?.decisions).toEqual([]);
        });
        it('should include ideas and decisions', async () => {
            // Add ideas
            await addBrainstormingIdea({
                projectPath,
                sessionId,
                title: 'React',
                description: 'Popular and flexible',
                approach: 'Component-based architecture',
            });
            await addBrainstormingIdea({
                projectPath,
                sessionId,
                title: 'Vue',
                description: 'Easy to learn',
                approach: 'Progressive framework',
            });
            // Make decision
            await recordBrainstormingDecision({
                projectPath,
                sessionId,
                selectedIdeas: ['idea-1'],
                rejectedIdeas: ['idea-2'],
                rationale: 'React has better ecosystem and team expertise',
            });
            const result = await getBrainstormingSession({
                projectPath,
                sessionId,
            });
            expect(result.success).toBe(true);
            expect(result.session?.ideasCount).toBe(2);
            expect(result.session?.decisionsCount).toBe(1);
            expect(result.session?.ideas.length).toBe(2);
            expect(result.session?.decisions.length).toBe(1);
            expect(result.session?.ideas[0].title).toBe('React');
            expect(result.session?.decisions[0].selectedIdeas).toEqual(['idea-1']);
        });
        it('should fail if session does not exist', async () => {
            const result = await getBrainstormingSession({
                projectPath,
                sessionId: 'non-existent-session',
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });
    });
    // ============================================================================
    // TEST: Integration - Full Workflow
    // ============================================================================
    describe('Integration: Full Brainstorming Workflow', () => {
        it('should complete full brainstorming workflow and promote to major goal', async () => {
            // Step 1: Start brainstorming session
            const sessionResult = await startBrainstormingSession({
                projectPath,
                title: 'Mobile App Strategy',
                problem: 'Decide between native, hybrid, or PWA approach for mobile app',
                context: 'Budget: $100K, Timeline: 6 months, Platforms: iOS and Android',
                componentId: 'test-component',
            });
            expect(sessionResult.success).toBe(true);
            const sessionId = sessionResult.session.id;
            // Step 2: Add multiple ideas
            const idea1 = await addBrainstormingIdea({
                projectPath,
                sessionId,
                title: 'Native Apps (Swift + Kotlin)',
                description: 'Build separate native apps for iOS and Android',
                approach: 'Use Swift for iOS and Kotlin for Android',
                pros: ['Best performance', 'Full platform features', 'Best UX'],
                cons: ['Highest cost', 'Duplicate code', 'Longer development'],
                estimatedEffort: '6 months',
                feasibility: 'medium',
            });
            const idea2 = await addBrainstormingIdea({
                projectPath,
                sessionId,
                title: 'React Native',
                description: 'Cross-platform with React Native',
                approach: 'Single codebase for both platforms',
                pros: ['Code reuse', 'Faster development', 'Large ecosystem'],
                cons: ['Performance limitations', 'Platform-specific code needed', 'Debugging challenges'],
                estimatedEffort: '4 months',
                feasibility: 'high',
            });
            const idea3 = await addBrainstormingIdea({
                projectPath,
                sessionId,
                title: 'Progressive Web App (PWA)',
                description: 'Web-based mobile experience',
                approach: 'Build responsive web app with offline support',
                pros: ['Lowest cost', 'One codebase', 'Instant updates'],
                cons: ['Limited features', 'Worse performance', 'Not native feel'],
                estimatedEffort: '2 months',
                feasibility: 'high',
            });
            expect(idea1.success && idea2.success && idea3.success).toBe(true);
            // Step 3: Get session status
            const statusResult = await getBrainstormingSession({
                projectPath,
                sessionId,
            });
            expect(statusResult.success).toBe(true);
            expect(statusResult.session?.ideasCount).toBe(3);
            // Step 4: Record decision
            const decisionResult = await recordBrainstormingDecision({
                projectPath,
                sessionId,
                selectedIdeas: ['idea-2'],
                rejectedIdeas: ['idea-1', 'idea-3'],
                rationale: 'React Native offers the best balance of development speed, code reuse, and performance. Native is too expensive and time-consuming. PWA lacks features we need.',
                tradeoffs: 'We accept some performance limitations and debugging complexity for faster time to market and code reuse.',
                nextSteps: [
                    'Promote React Native approach to major goal',
                    'Set up React Native development environment',
                    'Create proof of concept',
                ],
                decidedBy: 'Engineering & Product Team',
            });
            expect(decisionResult.success).toBe(true);
            // Step 5: Verify session status changed to "decided"
            const finalStatus = await getBrainstormingSession({
                projectPath,
                sessionId,
            });
            expect(finalStatus.success).toBe(true);
            expect(finalStatus.session?.status).toBe('Decided');
            expect(finalStatus.session?.decisionsCount).toBe(1);
            // Step 6: Promote selected idea to major goal
            const promotionResult = await promoteToMajorGoal({
                projectPath,
                componentId: 'test-component',
                sourceType: 'brainstorming',
                goalName: 'Build Mobile App with React Native',
                description: 'Cross-platform mobile app using React Native for iOS and Android',
                purpose: 'Deliver mobile experience with code reuse and fast development',
                successCriteria: [
                    'Apps published to App Store and Play Store',
                    'Core features working on both platforms',
                    'Performance meets benchmarks',
                ],
                estimatedEffort: '4 months',
                priority: 'High',
                owner: 'Mobile Team',
            });
            expect(promotionResult.success).toBe(true);
            expect(promotionResult.goalId).toBe('001');
            expect(promotionResult.handoffReady).toBe(true);
            // Verify major goal created
            const goalPath = path.join(projectPath, '02-goals-and-roadmap', 'components', 'test-component', 'major-goals', '001-build-mobile-app-with-react-native');
            expect(fs.existsSync(goalPath)).toBe(true);
            const goalStatusPath = path.join(goalPath, 'GOAL-STATUS.md');
            const goalContent = fs.readFileSync(goalStatusPath, 'utf-8');
            expect(goalContent).toContain('Build Mobile App with React Native');
            expect(goalContent).toContain('Apps published to App Store');
        });
        it('should handle multiple concurrent brainstorming sessions', async () => {
            const session1 = await startBrainstormingSession({
                projectPath,
                title: 'Marketing Strategy',
                problem: 'Choose marketing channels',
            });
            const session2 = await startBrainstormingSession({
                projectPath,
                title: 'Tech Stack',
                problem: 'Choose frontend framework',
            });
            const session3 = await startBrainstormingSession({
                projectPath,
                title: 'Hiring Strategy',
                problem: 'Remote vs. on-site team',
            });
            expect(session1.success && session2.success && session3.success).toBe(true);
            expect(session1.session?.id).not.toBe(session2.session?.id);
            expect(session2.session?.id).not.toBe(session3.session?.id);
            // All sessions should be accessible
            const status1 = await getBrainstormingSession({
                projectPath,
                sessionId: session1.session.id,
            });
            const status2 = await getBrainstormingSession({
                projectPath,
                sessionId: session2.session.id,
            });
            expect(status1.success && status2.success).toBe(true);
            expect(status1.session?.title).toBe('Marketing Strategy');
            expect(status2.session?.title).toBe('Tech Stack');
        });
    });
    // ============================================================================
    // TEST: Performance
    // ============================================================================
    describe('Performance', () => {
        it('should create session quickly', async () => {
            const start = Date.now();
            await startBrainstormingSession({
                projectPath,
                title: 'Performance Test Session',
                problem: 'Test performance',
            });
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(1000); // Should be < 1 second
        });
        it('should handle many ideas efficiently', async () => {
            const session = await startBrainstormingSession({
                projectPath,
                title: 'Many Ideas Test',
                problem: 'Testing with many ideas',
            });
            const sessionId = session.session.id;
            const start = Date.now();
            // Add 10 ideas
            for (let i = 1; i <= 10; i++) {
                await addBrainstormingIdea({
                    projectPath,
                    sessionId,
                    title: `Idea ${i}`,
                    description: `Description for idea ${i}`,
                    approach: `Approach ${i}`,
                });
            }
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(3000); // Should be < 3 seconds for 10 ideas
        });
    });
});
//# sourceMappingURL=brainstorming-workflow.test%202.js.map