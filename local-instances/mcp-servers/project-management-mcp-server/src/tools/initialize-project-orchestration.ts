/**
 * Initialize Project Orchestration Tool
 *
 * Initializes workflow state tracking for a project
 */

import { StateManager } from 'workflow-orchestrator-mcp-server/dist/core/state-manager.js';
import { ProjectState } from 'workflow-orchestrator-mcp-server/dist/types/project-state.js';

export interface InitializeOrchestrationInput {
  projectPath: string;
  projectName?: string;
  force?: boolean; // Force reinitialize even if state exists
}

export interface InitializeOrchestrationResult {
  success: boolean;
  statePath: string;
  state: ProjectState;
  message: string;
  wasExisting: boolean;
}

export class InitializeProjectOrchestrationTool {
  static execute(input: InitializeOrchestrationInput): InitializeOrchestrationResult {
    const { projectPath, projectName, force } = input;

    // Check if state already exists
    const existing = StateManager.read(projectPath);
    const wasExisting = existing !== null;

    if (existing && !force) {
      return {
        success: true,
        statePath: StateManager.getStatePath(projectPath),
        state: existing,
        message: 'Orchestration already initialized. State loaded from existing file.',
        wasExisting: true,
      };
    }

    // Initialize or reinitialize
    let state: ProjectState;
    if (force && existing) {
      // Backup existing state before reinitializing
      const backupPath = StateManager.backup(projectPath);
      const name = projectName || existing.projectName;
      state = StateManager.initialize(projectPath, name);

      return {
        success: true,
        statePath: StateManager.getStatePath(projectPath),
        state,
        message: `Orchestration reinitialized. Previous state backed up to: ${backupPath}`,
        wasExisting: true,
      };
    } else {
      // Fresh initialization
      const name = projectName || require('path').basename(projectPath);
      state = StateManager.initialize(projectPath, name);

      return {
        success: true,
        statePath: StateManager.getStatePath(projectPath),
        state,
        message: 'Orchestration initialized successfully. State file created.',
        wasExisting: false,
      };
    }
  }

  static formatResult(result: InitializeOrchestrationResult): string {
    let output = '='.repeat(70) + '\n';
    output += '  PROJECT ORCHESTRATION INITIALIZED\n';
    output += '='.repeat(70) + '\n\n';

    output += `✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}\n`;
    output += `📁 State File: ${result.statePath}\n`;
    output += `📋 Project: ${result.state.projectName}\n`;
    output += `🕐 Created: ${result.state.created}\n`;
    output += `🔄 Current Phase: ${result.state.currentPhase}\n`;
    output += `📍 Current Step: ${result.state.currentStep}\n`;
    output += '\n';

    if (result.wasExisting) {
      output += '📝 Note: ' + result.message + '\n';
    } else {
      output += '✨ New initialization complete!\n';
    }

    output += '\n' + '─'.repeat(70) + '\n\n';

    output += 'Next Steps:\n';
    output += '1. Use get_next_steps to see suggested actions\n';
    output += '2. Use get_project_status for overview\n';
    output += '3. State will be automatically updated as you use AI Planning tools\n';

    output += '\n' + '='.repeat(70) + '\n';

    return output;
  }

  static getToolDefinition() {
    return {
      name: 'initialize_project_orchestration',
      description: 'Initialize workflow orchestration and state tracking for a project. Creates .ai-planning/project-state.json to track phases, steps, goals, and MCP integrations.',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Absolute path to the project directory',
          },
          projectName: {
            type: 'string',
            description: 'Optional project name (defaults to directory name)',
          },
          force: {
            type: 'boolean',
            description: 'Force reinitialization even if state exists (creates backup)',
          },
        },
        required: ['projectPath'],
      },
    };
  }
}
