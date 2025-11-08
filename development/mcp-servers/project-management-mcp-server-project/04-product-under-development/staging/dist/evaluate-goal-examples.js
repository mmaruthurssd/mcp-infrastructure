/**
 * Test Examples for evaluate_goal Tool
 *
 * Real-world goal descriptions to validate Impact/Effort estimation and tier suggestions
 */
import { EvaluateGoalTool } from './tools/evaluate-goal.js';
async function runExamples() {
    // Test Case 1: High Impact, Low Effort (Expected: NOW tier)
    const example1 = {
        goalDescription: 'Fix critical bug where users cannot save their work, affecting 50+ users daily. Error occurs when clicking save button.',
        context: 'Medical practice management system. Users are losing work and manually re-entering data.',
        projectType: 'medical'
    };
    console.error('=== Test Case 1: Critical Bug Fix ===');
    console.error('Expected: High Impact, Low Effort, NOW tier\n');
    const result1 = await EvaluateGoalTool.execute(example1);
    console.error(EvaluateGoalTool.formatResult(result1));
    console.error('\n---\n');
    // Test Case 2: High Impact, High Effort (Expected: NEXT tier)
    const example2 = {
        goalDescription: 'Build mobile app for field staff to access patient records offline. Must support iOS and Android, HIPAA compliant with encryption and audit logging.',
        context: 'Field staff (20 people) currently cannot access records when visiting patients at home. Requires full offline mode, sync, and compliance features.',
        projectType: 'medical'
    };
    console.error('=== Test Case 2: Major Mobile App Project ===');
    console.error('Expected: High Impact, High Effort, NEXT tier\n');
    const result2 = await EvaluateGoalTool.execute(example2);
    console.error(EvaluateGoalTool.formatResult(result2));
    console.error('\n---\n');
    // Test Case 3: Low Impact, Low Effort (Expected: LATER tier)
    const example3 = {
        goalDescription: 'Add dark mode toggle to settings page for UI customization.',
        context: 'A few users have requested this feature. No accessibility issues, just preference.'
    };
    console.error('=== Test Case 3: Dark Mode Feature ===');
    console.error('Expected: Low Impact, Low Effort, LATER tier\n');
    const result3 = await EvaluateGoalTool.execute(example3);
    console.error(EvaluateGoalTool.formatResult(result3));
    console.error('\n---\n');
    // Test Case 4: Low Impact, High Effort (Expected: SOMEDAY tier)
    const example4 = {
        goalDescription: 'Rebuild entire codebase using microservices architecture with Kubernetes orchestration.',
        context: 'Current monolith works fine. Considering this for future scalability but no immediate need.'
    };
    console.error('=== Test Case 4: Unnecessary Refactoring ===');
    console.error('Expected: Low Impact, High Effort, SOMEDAY tier\n');
    const result4 = await EvaluateGoalTool.execute(example4);
    console.error(EvaluateGoalTool.formatResult(result4));
    console.error('\n---\n');
    // Test Case 5: Medium Impact, Medium Effort (Expected: NEXT tier)
    const example5 = {
        goalDescription: 'Implement automated timesheet entry by integrating with calendar API. Parse appointments and auto-fill billing codes.',
        context: 'Staff (15 people) currently spend 30 minutes daily on manual timesheet entry. API integration available, need to build parser and validation logic.',
        projectType: 'medical'
    };
    console.error('=== Test Case 5: Automation Project ===');
    console.error('Expected: Medium Impact, Medium Effort, NEXT tier\n');
    const result5 = await EvaluateGoalTool.execute(example5);
    console.error(EvaluateGoalTool.formatResult(result5));
    console.error('\n---\n');
    // Summary
    console.error('=== Summary of Test Results ===\n');
    console.error(`Test 1 - Critical Bug Fix: ${result1.tier.tier} (Expected: Now)`);
    console.error(`Test 2 - Mobile App Project: ${result2.tier.tier} (Expected: Next)`);
    console.error(`Test 3 - Dark Mode: ${result3.tier.tier} (Expected: Later)`);
    console.error(`Test 4 - Microservices Rebuild: ${result4.tier.tier} (Expected: Someday)`);
    console.error(`Test 5 - Timesheet Automation: ${result5.tier.tier} (Expected: Next)`);
}
runExamples().catch(console.error);
//# sourceMappingURL=evaluate-goal-examples.js.map