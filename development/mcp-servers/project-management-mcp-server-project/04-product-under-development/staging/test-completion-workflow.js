#!/usr/bin/env node

/**
 * Test Script: Completion Workflow End-to-End
 *
 * Tests the full completion workflow:
 * 1. validate_project_readiness
 * 2. generate_completion_checklist
 * 3. wrap_up_project
 *
 * Usage: node test-completion-workflow.js [projectPath]
 */

import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import tools
import { ValidateProjectReadinessTool } from './dist/tools/validate-project-readiness.js';
import { GenerateCompletionChecklistTool } from './dist/tools/generate-completion-checklist.js';
import { WrapUpProjectTool } from './dist/tools/wrap-up-project.js';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Create test project structure
function createTestProject(basePath) {
  const testProjectPath = join(basePath, 'test-completion-project');

  logStep('SETUP', 'Creating test project structure');

  // Create directories
  const dirs = [
    '.ai-planning',
    '02-goals-and-roadmap/selected-goals',
    'brainstorming/future-goals/potential-goals',
    'temp/workflows',
    'archive',
  ];

  dirs.forEach(dir => {
    const dirPath = join(testProjectPath, dir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
      logSuccess(`Created ${dir}`);
    }
  });

  // Create state file
  const state = {
    version: '1.0',
    projectName: 'Test Completion Project',
    created: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    currentPhase: 'execution',
    currentStep: 'validate-completion',
    phases: {
      initialization: {
        completed: true,
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        steps: {
          'setup-conversation': true,
          'generate-constitution': true,
          'identify-stakeholders': true,
          'create-roadmap': true,
        },
      },
      'goal-development': {
        completed: true,
        startedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        steps: {
          'brainstorm-ideas': true,
          'evaluate-goals': true,
          'create-potential': true,
          'promote-selected': true,
        },
      },
      execution: {
        completed: false,
        startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        steps: {
          'create-specification': true,
          'break-into-tasks': true,
          'execute-tasks': true,
          'update-progress': true,
        },
      },
      completion: {
        completed: false,
        steps: {
          'validate-readiness': false,
          'generate-checklist': false,
          'complete-checklist': false,
          'wrap-up': false,
        },
      },
    },
    goals: {
      potential: [],
      selected: [
        {
          id: '01',
          name: 'test-feature',
          status: 'Completed',
          priority: 'High',
          progress: 100,
        },
      ],
      completed: [],
      archived: [],
    },
    integrations: {
      specDriven: {
        used: true,
        lastHandoff: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        goalsWithSpecs: ['test-feature'],
      },
      taskExecutor: {
        activeWorkflows: [],
        lastCreated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        totalWorkflowsCreated: 1,
      },
    },
  };

  const stateFilePath = join(testProjectPath, '.ai-planning/project-state.json');
  require('fs').writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
  logSuccess('Created project state file');

  // Create a completed goal folder
  const goalPath = join(testProjectPath, '02-goals-and-roadmap/selected-goals/test-feature');
  mkdirSync(goalPath, { recursive: true });

  const goalFile = join(goalPath, 'goal.md');
  const goalContent = `# Test Feature

## Description
A test feature for completion workflow testing.

## Status
Status: Completed
Progress: 100%

## Impact & Effort
- Impact: High
- Effort: Medium
- Tier: Now
`;
  require('fs').writeFileSync(goalFile, goalContent);
  logSuccess('Created completed goal');

  return testProjectPath;
}

async function testCompletionWorkflow(projectPath) {
  log('\n' + '='.repeat(60), 'bright');
  log('COMPLETION WORKFLOW END-TO-END TEST', 'bright');
  log('='.repeat(60), 'bright');

  let testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: [],
  };

  // Step 1: Validate project readiness
  logStep('STEP 1', 'Testing validate_project_readiness');
  try {
    const validationResult = ValidateProjectReadinessTool.execute({ projectPath });

    if (validationResult.success) {
      logSuccess('Validation tool executed successfully');
      testResults.passed++;

      log(`\nReadiness: ${validationResult.ready ? 'READY' : 'NOT READY'}`,
          validationResult.ready ? 'green' : 'yellow');
      log(`Completion: ${validationResult.completionPercentage}%`, 'cyan');

      if (validationResult.blockers && validationResult.blockers.length > 0) {
        logWarning(`Found ${validationResult.blockers.length} blockers`);
        testResults.warnings += validationResult.blockers.length;
        validationResult.blockers.forEach(blocker => {
          log(`  - ${blocker}`, 'yellow');
        });
      } else {
        logSuccess('No blockers found');
      }

      testResults.details.push({
        step: 'validate_project_readiness',
        status: 'passed',
        ready: validationResult.ready,
        blockers: validationResult.blockers?.length || 0,
      });
    } else {
      logError(`Validation failed: ${validationResult.error}`);
      testResults.failed++;
      testResults.details.push({
        step: 'validate_project_readiness',
        status: 'failed',
        error: validationResult.error,
      });
    }
  } catch (error) {
    logError(`Exception in validation: ${error.message}`);
    testResults.failed++;
    testResults.details.push({
      step: 'validate_project_readiness',
      status: 'failed',
      error: error.message,
    });
  }

  // Step 2: Generate completion checklist
  logStep('STEP 2', 'Testing generate_completion_checklist');
  try {
    const checklistResult = GenerateCompletionChecklistTool.execute({ projectPath });

    if (checklistResult.success) {
      logSuccess('Checklist tool executed successfully');
      testResults.passed++;

      log(`Created: ${checklistResult.checklistPath}`, 'cyan');

      // Verify file was created
      if (existsSync(checklistResult.checklistPath)) {
        logSuccess('Checklist file exists');
        const content = readFileSync(checklistResult.checklistPath, 'utf-8');
        log(`File size: ${content.length} bytes`, 'cyan');

        // Check for expected sections
        const expectedSections = [
          'Goals & Deliverables',
          'Documentation Quality',
          'Validation Checks',
          'Workflow & Task Cleanup',
          'Handoff & Transition',
          'Archive & Wrap-up',
        ];

        let sectionsFound = 0;
        expectedSections.forEach(section => {
          if (content.includes(section)) {
            sectionsFound++;
          }
        });

        if (sectionsFound === expectedSections.length) {
          logSuccess(`All ${expectedSections.length} sections present`);
        } else {
          logWarning(`Only ${sectionsFound}/${expectedSections.length} sections found`);
          testResults.warnings++;
        }
      } else {
        logError('Checklist file not found');
        testResults.failed++;
      }

      testResults.details.push({
        step: 'generate_completion_checklist',
        status: 'passed',
        filePath: checklistResult.checklistPath,
      });
    } else {
      logError(`Checklist generation failed: ${checklistResult.error}`);
      testResults.failed++;
      testResults.details.push({
        step: 'generate_completion_checklist',
        status: 'failed',
        error: checklistResult.error,
      });
    }
  } catch (error) {
    logError(`Exception in checklist generation: ${error.message}`);
    testResults.failed++;
    testResults.details.push({
      step: 'generate_completion_checklist',
      status: 'failed',
      error: error.message,
    });
  }

  // Step 3: Wrap up project
  logStep('STEP 3', 'Testing wrap_up_project');
  try {
    const wrapUpResult = WrapUpProjectTool.execute({
      projectPath,
      notes: 'Test completion workflow - automated test',
      skipValidation: true, // Skip since we may have warnings
    });

    if (wrapUpResult.success) {
      logSuccess('Wrap-up tool executed successfully');
      testResults.passed++;

      log(`Report: ${wrapUpResult.reportPath}`, 'cyan');
      log(`State archived: ${wrapUpResult.stateArchived ? 'Yes' : 'No'}`, 'cyan');

      // Verify completion report was created
      if (existsSync(wrapUpResult.reportPath)) {
        logSuccess('Completion report exists');
        const content = readFileSync(wrapUpResult.reportPath, 'utf-8');
        log(`File size: ${content.length} bytes`, 'cyan');

        // Check for expected sections
        const expectedSections = [
          'Executive Summary',
          'Phase Timeline',
          'Goals Achieved',
          'Metrics',
          'Appendix',
        ];

        let sectionsFound = 0;
        expectedSections.forEach(section => {
          if (content.includes(section)) {
            sectionsFound++;
          }
        });

        if (sectionsFound === expectedSections.length) {
          logSuccess(`All ${expectedSections.length} sections present in report`);
        } else {
          logWarning(`Only ${sectionsFound}/${expectedSections.length} sections found in report`);
          testResults.warnings++;
        }
      } else {
        logError('Completion report not found');
        testResults.failed++;
      }

      testResults.details.push({
        step: 'wrap_up_project',
        status: 'passed',
        reportPath: wrapUpResult.reportPath,
        stateArchived: wrapUpResult.stateArchived,
      });
    } else {
      logError(`Wrap-up failed: ${wrapUpResult.error}`);
      testResults.failed++;
      testResults.details.push({
        step: 'wrap_up_project',
        status: 'failed',
        error: wrapUpResult.error,
      });
    }
  } catch (error) {
    logError(`Exception in wrap-up: ${error.message}`);
    testResults.failed++;
    testResults.details.push({
      step: 'wrap_up_project',
      status: 'failed',
      error: error.message,
    });
  }

  // Summary
  log('\n' + '='.repeat(60), 'bright');
  log('TEST RESULTS', 'bright');
  log('='.repeat(60), 'bright');

  log(`\nPassed: ${testResults.passed}`, testResults.passed > 0 ? 'green' : 'reset');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'reset');
  log(`Warnings: ${testResults.warnings}`, testResults.warnings > 0 ? 'yellow' : 'reset');

  const totalTests = testResults.passed + testResults.failed;
  const successRate = totalTests > 0 ? (testResults.passed / totalTests * 100).toFixed(1) : 0;
  log(`\nSuccess Rate: ${successRate}%`, successRate >= 100 ? 'green' : 'yellow');

  if (testResults.failed === 0) {
    log('\n✓ ALL TESTS PASSED', 'green');
    return 0;
  } else {
    log('\n✗ SOME TESTS FAILED', 'red');
    return 1;
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  let projectPath;

  if (args.length > 0) {
    projectPath = args[0];
    log(`Using provided project path: ${projectPath}`, 'cyan');
  } else {
    // Create test project
    const basePath = join(__dirname, 'test-projects');
    if (!existsSync(basePath)) {
      mkdirSync(basePath, { recursive: true });
    }
    projectPath = createTestProject(basePath);
    log(`\nCreated test project at: ${projectPath}`, 'green');
  }

  if (!existsSync(projectPath)) {
    logError(`Project path does not exist: ${projectPath}`);
    process.exit(1);
  }

  const exitCode = await testCompletionWorkflow(projectPath);
  process.exit(exitCode);
}

main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
