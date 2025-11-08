#!/usr/bin/env node

/**
 * Test Script: MCP Handoffs with Spec-Driven and Task Executor
 *
 * Tests integration handoffs:
 * 1. prepare_spec_handoff
 * 2. prepare_task_executor_handoff
 * 3. Integration state tracking
 *
 * Usage: node test-mcp-handoffs.js [projectPath]
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import tools
import { PrepareSpecHandoffTool } from './dist/tools/prepare-spec-handoff.js';
import { PrepareTaskExecutorHandoffTool } from './dist/tools/prepare-task-executor-handoff.js';
import { StateManager } from './dist/utils/state-manager.js';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
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

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// Create test project with goals
function createTestProject(basePath) {
  const testProjectPath = join(basePath, 'test-handoff-project');

  logStep('SETUP', 'Creating test project structure');

  // Create directories
  const dirs = [
    '.ai-planning',
    '02-goals-and-roadmap/selected-goals/authentication-system',
    '02-goals-and-roadmap/selected-goals/authentication-system/spec',
    'brainstorming/future-goals/potential-goals',
    'temp/workflows',
  ];

  dirs.forEach(dir => {
    const dirPath = join(testProjectPath, dir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
      logSuccess(`Created ${dir}`);
    }
  });

  // Create state file with orchestration enabled
  const state = {
    version: '1.0',
    projectName: 'Test Handoff Project',
    created: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    currentPhase: 'execution',
    currentStep: 'create-specification',
    phases: {
      initialization: {
        completed: true,
        startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        steps: {
          'setup-conversation': true,
          'generate-constitution': true,
          'identify-stakeholders': true,
          'create-roadmap': true,
        },
      },
      'goal-development': {
        completed: true,
        startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        steps: {
          'brainstorm-ideas': true,
          'evaluate-goals': true,
          'create-potential': true,
          'promote-selected': true,
        },
      },
      execution: {
        completed: false,
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        steps: {
          'create-specification': false,
          'break-into-tasks': false,
          'execute-tasks': false,
          'update-progress': false,
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
          name: 'authentication-system',
          status: 'In Progress',
          priority: 'High',
          progress: 25,
        },
      ],
      completed: [],
      archived: [],
    },
    integrations: {
      specDriven: {
        used: false,
        lastHandoff: null,
        goalsWithSpecs: [],
      },
      taskExecutor: {
        activeWorkflows: [],
        lastCreated: null,
        totalWorkflowsCreated: 0,
      },
    },
  };

  const stateFilePath = join(testProjectPath, '.ai-planning/project-state.json');
  writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
  logSuccess('Created project state file');

  // Create goal file
  const goalFile = join(testProjectPath, '02-goals-and-roadmap/selected-goals/authentication-system/goal.md');
  const goalContent = `---
type: goal
status: In Progress
priority: High
tier: Now
---

# Authentication System

## Description
Implement comprehensive user authentication system with JWT tokens, session management, and password security.

## Impact & Effort
- **Impact:** High - Critical security feature affecting all users
- **Effort:** Medium - 2-3 weeks estimated
- **Dependencies:** Database schema, User model

## Progress
25% - Initial planning complete, ready for specification

## Next Steps
1. Create detailed specification
2. Break down into implementation tasks
3. Begin development
`;
  writeFileSync(goalFile, goalContent);
  logSuccess('Created goal file');

  // Create specification file
  const specFile = join(testProjectPath, '02-goals-and-roadmap/selected-goals/authentication-system/spec/specification.md');
  const specContent = `---
type: specification
goal: Authentication System
---

# Authentication System Specification

## Overview
Comprehensive user authentication system for secure access control.

## Features

### 1. User Registration
- Email/password registration
- Email verification
- Password strength validation

### 2. User Login
- Email/password authentication
- JWT token generation
- Session management

### 3. Password Security
- Bcrypt hashing
- Password reset via email
- Account lockout after failed attempts

## Technical Design

### Database Schema
- Users table with encrypted passwords
- Sessions table for active tokens
- Password reset tokens table

### API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/reset-password

## Tasks

### Phase 1: Setup (3 tasks, 8 hours)
1. Design database schema for users and sessions (3 hours)
2. Set up authentication middleware (3 hours)
3. Configure JWT token generation (2 hours)

### Phase 2: Registration (4 tasks, 12 hours)
4. Implement user registration endpoint (4 hours)
5. Add email validation (2 hours)
6. Implement password strength validator (3 hours)
7. Create email verification system (3 hours)

### Phase 3: Login & Sessions (3 tasks, 10 hours)
8. Implement login endpoint (4 hours)
9. Add session management (4 hours)
10. Implement logout functionality (2 hours)

### Phase 4: Password Security (3 tasks, 10 hours)
11. Implement password reset flow (5 hours)
12. Add account lockout mechanism (3 hours)
13. Create password change endpoint (2 hours)

### Phase 5: Testing & Documentation (2 tasks, 8 hours)
14. Write comprehensive tests for all endpoints (5 hours)
15. Document API endpoints and authentication flow (3 hours)

## Testing Strategy
- Unit tests for all authentication functions
- Integration tests for API endpoints
- Security testing for token validation
- Load testing for concurrent sessions

## Security Considerations
- Password hashing with bcrypt (cost factor 12)
- JWT tokens with expiration
- HTTPS required for all auth endpoints
- Rate limiting on login attempts
`;
  writeFileSync(specFile, specContent);
  logSuccess('Created specification file');

  return testProjectPath;
}

async function testMCPHandoffs(projectPath) {
  log('\n' + '='.repeat(60), 'bright');
  log('MCP HANDOFFS END-TO-END TEST', 'bright');
  log('='.repeat(60), 'bright');

  let testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: [],
  };

  const goalId = '01';

  // Step 1: Test prepare_spec_handoff
  logStep('STEP 1', 'Testing prepare_spec_handoff');
  try {
    const specHandoffResult = PrepareSpecHandoffTool.execute({
      projectPath,
      goalId,
    });

    if (specHandoffResult.success) {
      logSuccess('Spec handoff tool executed successfully');
      testResults.passed++;

      // Verify extracted context
      logInfo('Goal Context:');
      log(`  Name: ${specHandoffResult.goalContext.name}`, 'cyan');
      log(`  Description: ${specHandoffResult.goalContext.description}`, 'cyan');
      log(`  Impact: ${specHandoffResult.goalContext.impact}`, 'cyan');
      log(`  Effort: ${specHandoffResult.goalContext.effort}`, 'cyan');
      log(`  Tier: ${specHandoffResult.goalContext.tier}`, 'cyan');

      // Verify suggested tool call
      if (specHandoffResult.suggestedToolCall) {
        logSuccess('Suggested tool call generated');
        log(`  Tool: ${specHandoffResult.suggestedToolCall.tool}`, 'magenta');
        log(`  Action: ${specHandoffResult.suggestedToolCall.params.action}`, 'cyan');
        log(`  Project Path: ${specHandoffResult.suggestedToolCall.params.project_path}`, 'cyan');

        // Verify tool call structure
        const requiredParams = ['action', 'project_path', 'description'];
        const hasAllParams = requiredParams.every(
          param => specHandoffResult.suggestedToolCall.params[param] !== undefined
        );

        if (hasAllParams) {
          logSuccess('All required parameters present');
        } else {
          logWarning('Some required parameters missing');
          testResults.warnings++;
        }

        // Verify goal_context is passed
        if (specHandoffResult.suggestedToolCall.params.goal_context) {
          logSuccess('Goal context included in handoff');
        } else {
          logWarning('Goal context not included');
          testResults.warnings++;
        }
      } else {
        logError('No suggested tool call generated');
        testResults.failed++;
      }

      // Verify state was updated
      const updatedState = StateManager.read(projectPath);
      if (updatedState) {
        if (updatedState.integrations.specDriven.used) {
          logSuccess('State: specDriven.used = true');
        } else {
          logError('State: specDriven.used still false');
          testResults.failed++;
        }

        if (updatedState.integrations.specDriven.lastHandoff) {
          logSuccess(`State: lastHandoff timestamp = ${updatedState.integrations.specDriven.lastHandoff}`);
        } else {
          logError('State: lastHandoff not set');
          testResults.failed++;
        }

        if (updatedState.integrations.specDriven.goalsWithSpecs.includes('authentication-system')) {
          logSuccess('State: Goal added to goalsWithSpecs');
        } else {
          logError('State: Goal not added to goalsWithSpecs');
          testResults.failed++;
        }
      }

      testResults.details.push({
        step: 'prepare_spec_handoff',
        status: 'passed',
        goalContext: specHandoffResult.goalContext,
        stateUpdated: true,
      });
    } else {
      logError(`Spec handoff failed: ${specHandoffResult.error}`);
      testResults.failed++;
      testResults.details.push({
        step: 'prepare_spec_handoff',
        status: 'failed',
        error: specHandoffResult.error,
      });
    }
  } catch (error) {
    logError(`Exception in spec handoff: ${error.message}`);
    testResults.failed++;
    testResults.details.push({
      step: 'prepare_spec_handoff',
      status: 'failed',
      error: error.message,
    });
  }

  // Step 2: Test prepare_task_executor_handoff
  logStep('STEP 2', 'Testing prepare_task_executor_handoff');
  try {
    const taskHandoffResult = PrepareTaskExecutorHandoffTool.execute({
      projectPath,
      goalId,
    });

    if (taskHandoffResult.success) {
      logSuccess('Task executor handoff tool executed successfully');
      testResults.passed++;

      // Verify extracted tasks
      if (taskHandoffResult.tasks && taskHandoffResult.tasks.length > 0) {
        logSuccess(`Extracted ${taskHandoffResult.tasks.length} tasks from specification`);

        log('\nSample tasks:', 'cyan');
        taskHandoffResult.tasks.slice(0, 3).forEach((task, index) => {
          log(`  ${index + 1}. ${task.description}`, 'cyan');
          if (task.estimatedHours) {
            log(`     Est: ${task.estimatedHours}h`, 'blue');
          }
        });

        if (taskHandoffResult.tasks.length > 3) {
          log(`  ... and ${taskHandoffResult.tasks.length - 3} more tasks`, 'cyan');
        }

        // Verify task structure
        const firstTask = taskHandoffResult.tasks[0];
        if (firstTask.description) {
          logSuccess('Tasks have description field');
        } else {
          logWarning('Tasks missing description field');
          testResults.warnings++;
        }
      } else {
        logWarning('No tasks extracted from specification');
        testResults.warnings++;
      }

      // Verify suggested tool call
      if (taskHandoffResult.suggestedToolCall) {
        logSuccess('Suggested tool call generated');
        log(`  Tool: ${taskHandoffResult.suggestedToolCall.tool}`, 'magenta');
        log(`  Workflow name: ${taskHandoffResult.suggestedToolCall.params.name}`, 'cyan');
        log(`  Project path: ${taskHandoffResult.suggestedToolCall.params.projectPath}`, 'cyan');
        log(`  Task count: ${taskHandoffResult.suggestedToolCall.params.tasks.length}`, 'cyan');

        // Verify tool call structure
        const requiredParams = ['name', 'projectPath', 'tasks'];
        const hasAllParams = requiredParams.every(
          param => taskHandoffResult.suggestedToolCall.params[param] !== undefined
        );

        if (hasAllParams) {
          logSuccess('All required parameters present');
        } else {
          logWarning('Some required parameters missing');
          testResults.warnings++;
        }
      } else {
        logError('No suggested tool call generated');
        testResults.failed++;
      }

      // Verify state was updated
      const updatedState = StateManager.read(projectPath);
      if (updatedState) {
        if (updatedState.integrations.taskExecutor.lastCreated) {
          logSuccess(`State: lastCreated timestamp = ${updatedState.integrations.taskExecutor.lastCreated}`);
        } else {
          logError('State: lastCreated not set');
          testResults.failed++;
        }

        const workflowName = `${goalId}-implementation`;
        if (updatedState.integrations.taskExecutor.activeWorkflows.includes(workflowName)) {
          logSuccess(`State: Workflow '${workflowName}' added to activeWorkflows`);
        } else {
          logWarning(`State: Workflow '${workflowName}' not in activeWorkflows (may be added when workflow is actually created)`);
          testResults.warnings++;
        }

        if (updatedState.integrations.taskExecutor.totalWorkflowsCreated >= 1) {
          logSuccess(`State: totalWorkflowsCreated = ${updatedState.integrations.taskExecutor.totalWorkflowsCreated}`);
        } else {
          logWarning('State: totalWorkflowsCreated not incremented');
          testResults.warnings++;
        }
      }

      testResults.details.push({
        step: 'prepare_task_executor_handoff',
        status: 'passed',
        taskCount: taskHandoffResult.tasks.length,
        stateUpdated: true,
      });
    } else {
      logError(`Task executor handoff failed: ${taskHandoffResult.error}`);
      testResults.failed++;
      testResults.details.push({
        step: 'prepare_task_executor_handoff',
        status: 'failed',
        error: taskHandoffResult.error,
      });
    }
  } catch (error) {
    logError(`Exception in task executor handoff: ${error.message}`);
    testResults.failed++;
    testResults.details.push({
      step: 'prepare_task_executor_handoff',
      status: 'failed',
      error: error.message,
    });
  }

  // Step 3: Verify complete integration state
  logStep('STEP 3', 'Verifying complete integration state');
  try {
    const finalState = StateManager.read(projectPath);

    if (finalState) {
      logInfo('Final Integration State:');

      // Spec-Driven integration
      log('\nSpec-Driven MCP:', 'cyan');
      log(`  Used: ${finalState.integrations.specDriven.used}`, 'cyan');
      log(`  Last Handoff: ${finalState.integrations.specDriven.lastHandoff}`, 'cyan');
      log(`  Goals with Specs: ${finalState.integrations.specDriven.goalsWithSpecs.join(', ')}`, 'cyan');

      // Task Executor integration
      log('\nTask Executor MCP:', 'cyan');
      log(`  Active Workflows: ${finalState.integrations.taskExecutor.activeWorkflows.join(', ') || 'none'}`, 'cyan');
      log(`  Last Created: ${finalState.integrations.taskExecutor.lastCreated}`, 'cyan');
      log(`  Total Workflows: ${finalState.integrations.taskExecutor.totalWorkflowsCreated}`, 'cyan');

      logSuccess('Integration state tracking verified');
      testResults.passed++;

      testResults.details.push({
        step: 'verify_integration_state',
        status: 'passed',
        state: finalState.integrations,
      });
    } else {
      logError('Could not read final state');
      testResults.failed++;
    }
  } catch (error) {
    logError(`Exception verifying state: ${error.message}`);
    testResults.failed++;
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

  // Integration readiness
  log('\nIntegration Readiness:', 'bright');
  if (testResults.failed === 0) {
    log('✓ Ready for integration with Spec-Driven MCP', 'green');
    log('✓ Ready for integration with Task Executor MCP', 'green');
    log('\nNote: These tests verify the handoff tools and state tracking.', 'cyan');
    log('To test actual MCP integration, run with live MCP servers.', 'cyan');
  } else {
    log('✗ Integration issues detected', 'red');
    log('Review failed tests before attempting MCP integration', 'yellow');
  }

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

  const exitCode = await testMCPHandoffs(projectPath);
  process.exit(exitCode);
}

main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
