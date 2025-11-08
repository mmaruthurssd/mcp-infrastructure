/**
 * Test Examples for evaluate_goal Tool
 *
 * Real-world goal descriptions to validate Impact/Effort estimation and tier suggestions
 */
import { EvaluateGoalTool } from './tools/evaluate-goal.js';
// Test Case 1: High Impact, Low Effort (Expected: NOW tier)
const example1 = {
    goalDescription: 'Fix critical bug where users cannot save their work, affecting 50+ users daily. Error occurs when clicking save button.',
    context: 'Medical practice management system. Users are losing work and manually re-entering data.',
    projectType: 'medical'
};
console.log('=== Test Case 1: Critical Bug Fix ===');
console.log('Expected: High Impact, Low Effort, NOW tier\n');
const result1 = EvaluateGoalTool.execute(example1);
console.log(EvaluateGoalTool.formatResult(result1));
console.log('\n---\n');
// Test Case 2: High Impact, High Effort (Expected: NEXT tier)
const example2 = {
    goalDescription: 'Build mobile app for field staff to access patient records offline. Must support iOS and Android, HIPAA compliant with encryption and audit logging.',
    context: 'Field staff (20 people) currently cannot access records when visiting patients at home. Requires full offline mode, sync, and compliance features.',
    projectType: 'medical'
};
console.log('=== Test Case 2: Major Mobile App Project ===');
console.log('Expected: High Impact, High Effort, NEXT tier\n');
const result2 = EvaluateGoalTool.execute(example2);
console.log(EvaluateGoalTool.formatResult(result2));
console.log('\n---\n');
// Test Case 3: Low Impact, Low Effort (Expected: LATER tier)
const example3 = {
    goalDescription: 'Add dark mode toggle to settings page for UI customization.',
    context: 'A few users have requested this feature. No accessibility issues, just preference.'
};
console.log('=== Test Case 3: Dark Mode Feature ===');
console.log('Expected: Low Impact, Low Effort, LATER tier\n');
const result3 = EvaluateGoalTool.execute(example3);
console.log(EvaluateGoalTool.formatResult(result3));
console.log('\n---\n');
// Test Case 4: Low Impact, High Effort (Expected: SOMEDAY tier)
const example4 = {
    goalDescription: 'Rebuild entire codebase using microservices architecture with Kubernetes orchestration.',
    context: 'Current monolith works fine. Considering this for future scalability but no immediate need.'
};
console.log('=== Test Case 4: Unnecessary Refactoring ===');
console.log('Expected: Low Impact, High Effort, SOMEDAY tier\n');
const result4 = EvaluateGoalTool.execute(example4);
console.log(EvaluateGoalTool.formatResult(result4));
console.log('\n---\n');
// Test Case 5: Medium Impact, Medium Effort (Expected: NEXT tier)
const example5 = {
    goalDescription: 'Implement automated timesheet entry by integrating with calendar API. Parse appointments and auto-fill billing codes.',
    context: 'Staff (15 people) currently spend 30 minutes daily on manual timesheet entry. API integration available, need to build parser and validation logic.',
    projectType: 'medical'
};
console.log('=== Test Case 5: Automation Project ===');
console.log('Expected: Medium Impact, Medium Effort, NEXT tier\n');
const result5 = EvaluateGoalTool.execute(example5);
console.log(EvaluateGoalTool.formatResult(result5));
console.log('\n---\n');
// Summary
console.log('=== Summary of Test Results ===\n');
console.log(`Test 1 - Critical Bug Fix: ${result1.tier.tier} (Expected: Now)`);
console.log(`Test 2 - Mobile App Project: ${result2.tier.tier} (Expected: Next)`);
console.log(`Test 3 - Dark Mode: ${result3.tier.tier} (Expected: Later)`);
console.log(`Test 4 - Microservices Rebuild: ${result4.tier.tier} (Expected: Someday)`);
console.log(`Test 5 - Timesheet Automation: ${result5.tier.tier} (Expected: Next)`);
//# sourceMappingURL=evaluate-goal-examples.js.map