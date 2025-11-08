/**
 * Generate Completion Checklist Tool
 *
 * Creates a comprehensive pre-closure checklist
 */

import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from 'workflow-orchestrator-mcp-server/dist/core/state-manager.js';

export interface GenerateCompletionChecklistInput {
  projectPath: string;
  outputFile?: string; // Optional custom output path (default: PROJECT-WRAP-UP-CHECKLIST.md)
}

export interface GenerateCompletionChecklistResult {
  success: boolean;
  checklistPath: string;
  itemCount: number;
  message: string;
}

export class GenerateCompletionChecklistTool {
  static execute(input: GenerateCompletionChecklistInput): GenerateCompletionChecklistResult {
    const { projectPath, outputFile } = input;

    // Read state
    const state = StateManager.read(projectPath);
    if (!state) {
      return {
        success: false,
        checklistPath: '',
        itemCount: 0,
        message: 'No orchestration state found. Run initialize_project_orchestration first.',
      };
    }

    // Generate checklist content
    const checklist = this.generateChecklistContent(projectPath, state);

    // Determine output path
    const checklistPath = outputFile
      ? path.join(projectPath, outputFile)
      : path.join(projectPath, 'PROJECT-WRAP-UP-CHECKLIST.md');

    // Write checklist
    try {
      fs.writeFileSync(checklistPath, checklist, 'utf8');

      // Count checklist items
      const itemCount = (checklist.match(/- \[ \]/g) || []).length;

      return {
        success: true,
        checklistPath,
        itemCount,
        message: `Completion checklist generated with ${itemCount} items`,
      };
    } catch (error) {
      return {
        success: false,
        checklistPath,
        itemCount: 0,
        message: `Failed to write checklist: ${error}`,
      };
    }
  }

  /**
   * Generate checklist content
   */
  private static generateChecklistContent(projectPath: string, state: any): string {
    const now = new Date().toISOString().split('T')[0];
    let content = '';

    content += '---\n';
    content += 'type: checklist\n';
    content += 'tags: [completion, validation, wrap-up]\n';
    content += '---\n\n';

    content += '# Project Completion Checklist\n\n';
    content += `**Generated:** ${now}\n`;
    content += `**Project:** ${state.projectName}\n`;
    content += `**Current Phase:** ${state.currentPhase}\n\n`;

    content += '> Complete all items before running `wrap_up_project`\n\n';
    content += '---\n\n';

    // Section 1: Goals & Deliverables
    content += '## 1. Goals & Deliverables\n\n';
    content += '### Goal Status\n';
    content += `- [ ] All selected goals completed or shelved (current: ${state.goals.selected.length} selected)\n`;
    content += '- [ ] No goals in "blocked" status\n';
    content += `- [ ] All goals archived with retrospectives (current: ${state.goals.completed.length} completed)\n`;
    content += '\n';

    content += '### Goal Deliverables\n';
    state.goals.selected.forEach((goal: string) => {
      content += `- [ ] Goal '${goal}' has specification\n`;
      content += `- [ ] Goal '${goal}' implementation complete\n`;
      content += `- [ ] Goal '${goal}' tested and validated\n`;
    });
    if (state.goals.selected.length === 0) {
      content += '- [x] No selected goals to validate\n';
    }
    content += '\n';

    // Section 2: Documentation
    content += '## 2. Documentation\n\n';
    content += '### Core Documentation\n';
    content += '- [ ] README.md updated with final status\n';
    content += '- [ ] EVENT-LOG.md has project completion entry\n';
    content += '- [ ] NEXT-STEPS.md updated (or archived if complete)\n';
    content += '- [ ] TROUBLESHOOTING.md current and accurate\n';
    content += '- [ ] PROJECT-METADATA.md complete\n';
    content += '\n';

    content += '### Documentation Quality\n';
    content += '- [ ] All TBD/TODO placeholders resolved\n';
    content += '- [ ] No broken links in documentation\n';
    content += '- [ ] All YAML frontmatter valid\n';
    content += '- [ ] Code examples tested and working\n';
    content += '\n';

    content += '### Specifications\n';
    state.goals.completed.forEach((goal: string) => {
      content += `- [ ] Goal '${goal}' specification archived\n`;
    });
    if (state.goals.completed.length === 0) {
      content += '- [ ] All goal specifications reviewed\n';
    }
    content += '\n';

    // Section 3: Validation
    content += '## 3. Validation & Testing\n\n';
    content += '### Validation Tools\n';
    content += '- [ ] `validate_project_readiness` passes all checks\n';
    content += '- [ ] `validate_project` shows 100% compliance\n';
    content += '- [ ] No missing folders or files\n';
    content += '\n';

    content += '### Testing\n';
    content += '- [ ] All code builds successfully\n';
    content += '- [ ] All tests passing\n';
    content += '- [ ] Integration tests complete\n';
    content += '- [ ] Manual testing done\n';
    content += '\n';

    // Section 4: Workflows & Cleanup
    content += '## 4. Workflows & Cleanup\n\n';
    content += '### Workflow Management\n';
    content += `- [ ] All active workflows archived (current: ${state.integrations.taskExecutor.activeWorkflows.length} active)\n`;
    content += '- [ ] All temp/workflows/ moved to archive/\n';
    content += '- [ ] All brainstorming/ content archived or organized\n';
    content += '\n';

    content += '### File Cleanup\n';
    content += '- [ ] temp/ directory empty or removed\n';
    content += '- [ ] No duplicate files\n';
    content += '- [ ] No debug files (.log, .tmp, etc.)\n';
    content += '- [ ] Git repository clean (no uncommitted changes)\n';
    content += '\n';

    // Section 5: Handoff Preparation
    content += '## 5. Handoff Preparation\n\n';
    content += '### Deployment\n';
    content += '- [ ] Deployment documentation complete\n';
    content += '- [ ] Configuration files documented\n';
    content += '- [ ] Environment variables documented\n';
    content += '- [ ] Deployment checklist created\n';
    content += '\n';

    content += '### Knowledge Transfer\n';
    content += '- [ ] Known issues documented\n';
    content += '- [ ] Future enhancements cataloged\n';
    content += '- [ ] Technical debt documented\n';
    content += '- [ ] Lessons learned captured\n';
    content += '\n';

    content += '### Stakeholder Communication\n';
    content += '- [ ] Stakeholders notified of completion\n';
    content += '- [ ] Success metrics shared\n';
    content += '- [ ] Next steps communicated\n';
    content += '\n';

    // Section 6: Archive Readiness
    content += '## 6. Archive Readiness\n\n';
    content += '- [ ] Project wrap-up report created\n';
    content += '- [ ] All goals archived\n';
    content += '- [ ] All workflows archived\n';
    content += '- [ ] Retrospective complete\n';
    content += '- [ ] Ready for deployment or handoff\n';
    content += '\n';

    content += '---\n\n';
    content += '## Completion Steps\n\n';
    content += 'After checking all items:\n\n';
    content += '1. Run `validate_project_readiness` one final time\n';
    content += '2. Review all blockers and warnings\n';
    content += '3. Execute `wrap_up_project` to finalize\n';
    content += '4. Verify completion report generated\n';
    content += '\n';

    return content;
  }

  static formatResult(result: GenerateCompletionChecklistResult): string {
    let output = '='.repeat(70) + '\n';
    output += '  COMPLETION CHECKLIST GENERATED\n';
    output += '='.repeat(70) + '\n\n';

    if (!result.success) {
      output += `❌ ${result.message}\n`;
      return output;
    }

    output += `✅ ${result.message}\n\n`;
    output += `📋 Checklist: ${result.checklistPath}\n`;
    output += `📊 Items: ${result.itemCount} checklist items\n`;
    output += '\n';
    output += '💡 Next Steps:\n';
    output += '   1. Review and complete all checklist items\n';
    output += '   2. Run validate_project_readiness to verify\n';
    output += '   3. Use wrap_up_project when ready to finalize\n';
    output += '\n';

    output += '='.repeat(70) + '\n';

    return output;
  }

  static getToolDefinition() {
    return {
      name: 'generate_completion_checklist',
      description: 'Generate comprehensive pre-closure checklist with all validation items. Creates PROJECT-WRAP-UP-CHECKLIST.md with goals, documentation, validation, workflows, and handoff items.',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Absolute path to the project directory',
          },
          outputFile: {
            type: 'string',
            description: 'Optional custom output filename (default: PROJECT-WRAP-UP-CHECKLIST.md)',
          },
        },
        required: ['projectPath'],
      },
    };
  }
}
