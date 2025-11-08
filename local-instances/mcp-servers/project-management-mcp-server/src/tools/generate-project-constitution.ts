/**
 * Generate Project Constitution Tool
 *
 * Generate project-specific constitution with principles and guidelines.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ConversationManager } from '../utils/conversation-manager.js';
import { ConstitutionGenerator } from '../utils/constitution-generator.js';
import { ProjectSetupRenderer } from '../utils/project-setup-renderer.js';

// ============================================================================
// Types
// ============================================================================

export interface GenerateProjectConstitutionInput {
  projectPath: string;
  conversationId: string;
  mode?: 'quick' | 'deep';
  customPrinciples?: string[];
}

export interface GenerateProjectConstitutionOutput {
  success: boolean;
  constitutionPath: string;
  mode: 'quick' | 'deep';
  sections: {
    principles: number;
    hasDecisionFramework: boolean;
    hasGuidelines: boolean;
    constraints: number;
    successCriteria: number;
    hasEthicsStatement: boolean;
  };
  formatted: string;
}

// ============================================================================
// Tool Implementation
// ============================================================================

export class GenerateProjectConstitutionTool {
  static execute(input: GenerateProjectConstitutionInput): GenerateProjectConstitutionOutput {
    // Load conversation
    const state = ConversationManager.loadConversation(input.projectPath, input.conversationId);

    // Determine mode (use conversation mode if not specified)
    const mode = input.mode || state.constitutionMode;

    // Generate constitution
    const sections = ConstitutionGenerator.generate(
      state.extractedInfo,
      state.projectType,
      mode
    );

    // Add custom principles if provided
    if (input.customPrinciples) {
      const customPrincipleObjects = input.customPrinciples.map(p => ({
        name: p,
        description: 'Custom principle provided by user',
      }));
      sections.principles = [...customPrincipleObjects, ...sections.principles];
    }

    // Prepare template data
    const templateData = {
      projectName: state.projectName,
      date: new Date().toISOString().split('T')[0],
      projectType: state.projectType,
      deepMode: mode === 'deep',
      principles: sections.principles,
      decisionFramework: sections.decisionFramework || [],
      guidelines: sections.guidelines || [],
      constraints: sections.constraints,
      successCriteria: sections.successCriteria,
      ethicsStatement: sections.ethicsStatement,
    };

    // Render constitution
    const templatePath = path.join(
      path.dirname(new URL(import.meta.url).pathname),
      '../templates/project-setup/CONSTITUTION.md'
    );
    const constitution = ProjectSetupRenderer.render(templatePath, templateData);

    // Save constitution to 01-planning/ (template structure)
    const planningDir = path.join(input.projectPath, '01-planning');
    if (!fs.existsSync(planningDir)) {
      fs.mkdirSync(planningDir, { recursive: true });
    }

    const constitutionPath = path.join(planningDir, 'CONSTITUTION.md');
    fs.writeFileSync(constitutionPath, constitution, 'utf-8');

    // Format output
    const formatted = this.formatOutput(state.projectName, sections, mode, constitutionPath);

    return {
      success: true,
      constitutionPath,
      mode,
      sections: {
        principles: sections.principles.length,
        hasDecisionFramework: !!sections.decisionFramework,
        hasGuidelines: !!sections.guidelines,
        constraints: sections.constraints.length,
        successCriteria: sections.successCriteria.length,
        hasEthicsStatement: !!sections.ethicsStatement,
      },
      formatted,
    };
  }

  static getToolDefinition() {
    return {
      name: 'generate_project_constitution',
      description: 'Generate a project-specific constitution with principles, guidelines, decision framework, and constraints based on the project setup conversation.',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Absolute path to project directory',
          },
          conversationId: {
            type: 'string',
            description: 'Conversation ID from start_project_setup',
          },
          mode: {
            type: 'string',
            enum: ['quick', 'deep'],
            description: 'Override conversation mode - quick (3-5 principles) or deep (comprehensive framework)',
          },
          customPrinciples: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional custom principles to include',
          },
        },
        required: ['projectPath', 'conversationId'],
      },
    };
  }

  private static formatOutput(
    projectName: string,
    sections: any,
    mode: string,
    filePath: string
  ): string {
    let output = '='.repeat(60) + '\n';
    output += '  PROJECT CONSTITUTION GENERATED\n';
    output += '='.repeat(60) + '\n\n';

    output += `📋 Project: ${projectName}\n`;
    output += `⚙️  Mode: ${mode}\n`;
    output += `📄 File: ${filePath}\n\n`;

    output += '─'.repeat(60) + '\n\n';

    output += `📜 CONSTITUTION SUMMARY:\n\n`;

    output += `Core Principles (${sections.principles.length}):\n`;
    for (const principle of sections.principles) {
      output += `   • ${principle.name}: ${principle.description}\n`;
    }
    output += '\n';

    if (sections.decisionFramework) {
      output += `Decision Framework:\n`;
      for (let i = 0; i < sections.decisionFramework.length; i++) {
        output += `   ${i + 1}. ${sections.decisionFramework[i]}\n`;
      }
      output += '\n';
    }

    if (sections.guidelines) {
      output += `Quality Guidelines (${sections.guidelines.length}):\n`;
      for (const guideline of sections.guidelines) {
        output += `   • ${guideline}\n`;
      }
      output += '\n';
    }

    output += `Constraints (${sections.constraints.length}):\n`;
    for (const constraint of sections.constraints) {
      output += `   • [${constraint.type}] ${constraint.description}\n`;
    }
    output += '\n';

    output += `Success Criteria (${sections.successCriteria.length}):\n`;
    for (const criterion of sections.successCriteria) {
      output += `   • ${criterion}\n`;
    }
    output += '\n';

    if (sections.ethicsStatement) {
      output += `Ethics Statement:\n`;
      output += `   ${sections.ethicsStatement}\n\n`;
    }

    output += '─'.repeat(60) + '\n\n';
    output += '✅ Constitution saved successfully!\n\n';

    return output;
  }
}
