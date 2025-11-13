/**
 * Wrap Up Project Tool
 *
 * Final validation and project archiving with completion report
 */

import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from 'workflow-orchestrator-mcp-server/dist/core/state-manager.js';
import { ValidateProjectReadinessTool } from './validate-project-readiness.js';

export interface WrapUpProjectInput {
  projectPath: string;
  skipValidation?: boolean; // Skip final validation (not recommended)
  notes?: string; // Optional completion notes
}

export interface WrapUpProjectResult {
  success: boolean;
  completionReportPath?: string;
  validationPassed: boolean;
  warnings: string[];
  message: string;
  // Archival fields
  archived?: boolean;
  archivePath?: string;
  completionSummaryPath?: string;
  gitCommit?: string;
}

export class WrapUpProjectTool {
  static execute(input: WrapUpProjectInput): WrapUpProjectResult {
    const { projectPath, skipValidation = false, notes } = input;

    // Read state
    const state = StateManager.read(projectPath);
    if (!state) {
      return {
        success: false,
        validationPassed: false,
        warnings: [],
        message: 'No orchestration state found. Cannot wrap up uninitialized project.',
      };
    }

    const warnings: string[] = [];

    // Run final validation (unless skipped)
    if (!skipValidation) {
      const validation = ValidateProjectReadinessTool.execute({ projectPath });
      if (!validation.ready) {
        return {
          success: false,
          validationPassed: false,
          warnings: validation.blockers,
          message: `Project not ready for wrap-up. ${validation.blockers.length} blocker(s) found. Fix blockers or use skipValidation: true to override.`,
        };
      }
      if (validation.recommendations.length > 0) {
        warnings.push(...validation.recommendations);
      }
    } else {
      warnings.push('⚠️  Validation skipped - proceeding without checks');
    }

    // Mark completion phase as complete
    state.currentPhase = 'completion';
    state.phases.completion.status = 'complete';
    state.phases.completion.completedAt = new Date().toISOString();

    // Update all completion steps
    state.phases.completion.steps.forEach((step: any) => {
      step.status = 'complete';
      step.completedAt = new Date().toISOString();
    });

    // Save updated state
    StateManager.write(projectPath, state);

    // Generate completion report
    const reportPath = this.generateCompletionReport(projectPath, state, notes);

    // Create final state backup
    StateManager.backup(projectPath);

    // Auto-detect and archive implementation projects
    const archivalResult = this.archiveImplementationProject(projectPath, state, notes);

    const message = archivalResult.archived
      ? `Project wrapped up and archived to ${archivalResult.archivePath}`
      : 'Project wrapped up successfully! Completion report generated.';

    if (archivalResult.archived) {
      warnings.push(`✨ Implementation project automatically archived`);
      if (archivalResult.gitCommit) {
        warnings.push(`📦 Git commit created: ${archivalResult.gitCommit}`);
      }
    }

    return {
      success: true,
      completionReportPath: reportPath,
      validationPassed: !skipValidation,
      warnings,
      message,
      archived: archivalResult.archived,
      archivePath: archivalResult.archivePath,
      completionSummaryPath: archivalResult.completionSummaryPath,
      gitCommit: archivalResult.gitCommit,
    };
  }

  /**
   * Generate completion report
   */
  private static generateCompletionReport(
    projectPath: string,
    state: any,
    notes?: string
  ): string {
    const now = new Date();
    const reportPath = path.join(projectPath, 'PROJECT-COMPLETION-REPORT.md');

    let content = '';

    content += '---\n';
    content += 'type: report\n';
    content += 'tags: [completion, retrospective, metrics]\n';
    content += '---\n\n';

    content += '# Project Completion Report\n\n';
    content += `**Project:** ${state.projectName}\n`;
    content += `**Completed:** ${now.toISOString().split('T')[0]}\n`;
    content += `**Duration:** ${this.calculateDuration(state.created, now.toISOString())}\n`;
    content += '\n---\n\n';

    // Executive Summary
    content += '## Executive Summary\n\n';
    content += `Project **${state.projectName}** has been successfully completed.\n\n`;

    const totalGoals = state.goals.potential.length + state.goals.selected.length + state.goals.completed.length;
    content += `- **Total Goals:** ${totalGoals}\n`;
    content += `  - Potential: ${state.goals.potential.length}\n`;
    content += `  - Selected: ${state.goals.selected.length}\n`;
    content += `  - Completed: ${state.goals.completed.length}\n\n`;

    content += `- **Workflows Completed:** ${state.integrations.taskExecutor.totalWorkflowsCreated || 0}\n`;
    content += `- **Spec-Driven Used:** ${state.integrations.specDriven.used ? 'Yes' : 'No'}\n`;
    content += '\n';

    // Phase Timeline
    content += '## Phase Timeline\n\n';
    const phases = ['initialization', 'goal-development', 'execution', 'completion'];
    phases.forEach(phase => {
      const phaseInfo = state.phases[phase];
      if (phaseInfo.status === 'complete') {
        const duration = this.calculateDuration(phaseInfo.startedAt, phaseInfo.completedAt);
        content += `- **${phase}**: ${duration}\n`;
      }
    });
    content += '\n';

    // Goals Achieved
    content += '## Goals Achieved\n\n';
    if (state.goals.completed.length > 0) {
      state.goals.completed.forEach((goal: string) => {
        content += `- ✅ ${goal}\n`;
      });
    } else {
      content += '*No goals marked as completed*\n';
    }
    content += '\n';

    // Goals Deferred
    if (state.goals.potential.length > 0) {
      content += '## Goals Deferred\n\n';
      state.goals.potential.forEach((goal: string) => {
        content += `- 📋 ${goal}\n`;
      });
      content += '\n';
    }

    // Metrics
    content += '## Metrics\n\n';
    content += '| Metric | Value |\n';
    content += '|--------|-------|\n';
    content += `| Total Duration | ${this.calculateDuration(state.created, now.toISOString())} |\n`;
    content += `| Goals Completed | ${state.goals.completed.length} |\n`;
    content += `| Workflows Created | ${state.integrations.taskExecutor.totalWorkflowsCreated || 0} |\n`;
    content += `| Specifications Created | ${state.integrations.specDriven.goalsWithSpecs.length} |\n`;
    content += '\n';

    // Completion Notes
    if (notes) {
      content += '## Completion Notes\n\n';
      content += notes + '\n\n';
    }

    // Next Steps / Handoff
    content += '## Next Steps\n\n';
    content += '- [ ] Review completion report\n';
    content += '- [ ] Archive project repository\n';
    content += '- [ ] Communicate completion to stakeholders\n';
    content += '- [ ] Transfer knowledge if needed\n';
    content += '- [ ] Update project registry\n';
    content += '\n';

    // Appendix
    content += '## Appendix\n\n';
    content += '### File Locations\n\n';
    content += '- **State File:** `.ai-planning/project-state.json`\n';
    content += '- **Goals:** `02-goals-and-roadmap/`\n';
    content += '- **Documentation:** `03-resources-docs-assets-tools/docs/`\n';
    content += '- **Archived Workflows:** `archive/workflows/`\n';
    content += '\n';

    content += '---\n\n';
    content += `*Report generated by Project Management MCP Server v${this.getServerVersion()}*\n`;

    fs.writeFileSync(reportPath, content, 'utf8');
    return reportPath;
  }

  /**
   * Calculate duration between two ISO timestamps
   */
  private static calculateDuration(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      return `${diffHours} hour(s)`;
    } else if (diffDays < 30) {
      return `${diffDays} day(s)`;
    } else {
      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;
      return `${months} month(s), ${days} day(s)`;
    }
  }

  /**
   * Get server version
   */
  private static getServerVersion(): string {
    return '0.9.0';
  }

  /**
   * Archive implementation project if detected
   */
  private static archiveImplementationProject(
    projectPath: string,
    state: any,
    notes?: string
  ): { archived: boolean; archivePath?: string; completionSummaryPath?: string; gitCommit?: string } {
    // Detect if this is an implementation project
    const isImplementationProject = projectPath.includes('Implementation Projects');

    if (!isImplementationProject) {
      return { archived: false };
    }

    console.error('[WrapUpProject] Implementation project detected - initiating archival...');

    try {
      // Determine archive destination
      const now = new Date();
      const year = now.getFullYear();
      const projectName = path.basename(projectPath);

      // Find workspace root (go up from Implementation Projects/)
      const implementationProjectsIndex = projectPath.indexOf('Implementation Projects');
      const workspaceRoot = projectPath.substring(0, implementationProjectsIndex);

      const archiveRoot = path.join(workspaceRoot, 'archive', 'implementation-projects', String(year));
      const archivePath = path.join(archiveRoot, projectName);

      // Create archive directory
      if (!fs.existsSync(archiveRoot)) {
        fs.mkdirSync(archiveRoot, { recursive: true });
      }

      // Generate completion summary before moving
      const completionSummaryPath = this.generateCompletionSummary(
        projectPath,
        state,
        notes,
        archivePath
      );

      // Move project to archive
      if (fs.existsSync(archivePath)) {
        // If archive destination exists, append timestamp to avoid collision
        const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
        const uniqueArchivePath = `${archivePath}-${timestamp}`;
        console.error(`[WrapUpProject] Archive path exists, using ${uniqueArchivePath}`);
        fs.renameSync(projectPath, uniqueArchivePath);
      } else {
        fs.renameSync(projectPath, archivePath);
      }

      console.error(`[WrapUpProject] Project moved to: ${archivePath}`);

      // Create git commit
      const gitCommit = this.createGitCommit(workspaceRoot, projectName, year);

      // Log telemetry
      this.logTelemetry(workspaceRoot, {
        event_type: 'implementation-project-archived',
        event_data: {
          projectName,
          archivePath,
          year,
          goalsCompleted: state.goals.completed.length,
          duration: this.calculateDuration(state.created, now.toISOString()),
        },
      });

      return {
        archived: true,
        archivePath,
        completionSummaryPath,
        gitCommit,
      };
    } catch (error) {
      console.error('[WrapUpProject] Archival failed:', error);
      return {
        archived: false,
      };
    }
  }

  /**
   * Generate completion summary for archived project
   */
  private static generateCompletionSummary(
    projectPath: string,
    state: any,
    notes: string | undefined,
    archivePath: string
  ): string {
    const now = new Date();
    const summaryPath = path.join(projectPath, 'COMPLETION-SUMMARY.md');

    let content = '';
    content += '---\n';
    content += `project: ${state.projectName}\n`;
    content += `completed: ${now.toISOString().split('T')[0]}\n`;
    content += `status: ${state.goals.completed.length > 0 ? 'deployed' : 'completed'}\n`;
    content += 'type: implementation-project\n';
    content += '---\n\n';

    content += `# ${state.projectName} - Completion Summary\n\n`;
    content += `**Status**: ✅ COMPLETE\n`;
    content += `**Completed**: ${now.toISOString().split('T')[0]}\n`;
    content += `**Duration**: ${this.calculateDuration(state.created, now.toISOString())}\n`;
    content += `**Archived to**: \`${path.relative(path.dirname(path.dirname(projectPath)), archivePath)}\`\n\n`;

    content += '---\n\n';

    // Goals completed
    content += '## Goals Completed\n\n';
    if (state.goals.completed.length > 0) {
      state.goals.completed.forEach((goal: string) => {
        content += `- ✅ ${goal}\n`;
      });
    } else {
      content += '*No goals tracked*\n';
    }
    content += '\n';

    // Metrics
    content += '## Metrics\n\n';
    content += `- **Total Goals**: ${state.goals.completed.length}\n`;
    content += `- **Workflows Created**: ${state.integrations.taskExecutor.totalWorkflowsCreated || 0}\n`;
    content += `- **Specifications**: ${state.integrations.specDriven.goalsWithSpecs.length}\n`;
    content += `- **Duration**: ${this.calculateDuration(state.created, now.toISOString())}\n`;
    content += '\n';

    // Deployment info
    if (state.integrations.specDriven.goalsWithSpecs.length > 0) {
      content += '## Deployment\n\n';
      content += '*See PROJECT-COMPLETION-REPORT.md for detailed deployment information*\n\n';
    }

    // Notes
    if (notes) {
      content += '## Completion Notes\n\n';
      content += notes + '\n\n';
    }

    content += '---\n\n';
    content += `*Archived: ${now.toISOString().split('T')[0]}*\n`;
    content += '*Generated by Project Management MCP Server*\n';

    fs.writeFileSync(summaryPath, content, 'utf8');
    console.error(`[WrapUpProject] Completion summary created: ${summaryPath}`);

    return summaryPath;
  }

  /**
   * Create git commit for archival
   */
  private static createGitCommit(workspaceRoot: string, projectName: string, year: number): string | undefined {
    try {
      const { execSync } = require('child_process');

      // Check if we're in a git repository
      try {
        execSync('git rev-parse --git-dir', { cwd: workspaceRoot, stdio: 'ignore' });
      } catch {
        console.error('[WrapUpProject] Not a git repository - skipping commit');
        return undefined;
      }

      // Create commit
      const message = `archive: ${projectName} - completed ${new Date().toISOString().split('T')[0]}`;
      execSync('git add .', { cwd: workspaceRoot, stdio: 'ignore' });
      execSync(`git commit -m "${message}"`, { cwd: workspaceRoot, stdio: 'ignore' });

      // Get commit hash
      const commitHash = execSync('git rev-parse --short HEAD', { cwd: workspaceRoot, encoding: 'utf8' }).trim();

      console.error(`[WrapUpProject] Git commit created: ${commitHash}`);
      return commitHash;
    } catch (error) {
      console.error('[WrapUpProject] Git commit failed:', error);
      return undefined;
    }
  }

  /**
   * Log telemetry to workspace-brain
   */
  private static logTelemetry(workspaceRoot: string, event: any): void {
    try {
      const telemetryDir = path.join(workspaceRoot, '.telemetry');
      if (!fs.existsSync(telemetryDir)) {
        fs.mkdirSync(telemetryDir, { recursive: true });
      }

      const logFile = path.join(telemetryDir, 'project-management-events.jsonl');
      const entry = {
        timestamp: new Date().toISOString(),
        source: 'project-management-mcp',
        ...event,
      };

      fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
      console.error(`[WrapUpProject] Telemetry logged`);
    } catch (error) {
      console.error('[WrapUpProject] Telemetry logging failed:', error);
    }
  }

  static formatResult(result: WrapUpProjectResult): string {
    let output = '='.repeat(70) + '\n';
    output += '  PROJECT WRAP-UP\n';
    output += '='.repeat(70) + '\n\n';

    if (!result.success) {
      output += `❌ ${result.message}\n\n`;

      if (result.warnings.length > 0) {
        output += '🚫 Blockers:\n';
        result.warnings.forEach(w => {
          output += `   - ${w}\n`;
        });
      }
      return output;
    }

    output += '🎉 PROJECT COMPLETED!\n\n';
    output += `✅ ${result.message}\n\n`;

    if (result.completionReportPath) {
      output += `📊 Completion Report: ${result.completionReportPath}\n`;
    }

    if (result.archived) {
      output += `📦 Archived to: ${result.archivePath}\n`;
      if (result.completionSummaryPath) {
        output += `📝 Completion Summary: ${result.completionSummaryPath}\n`;
      }
      if (result.gitCommit) {
        output += `🔖 Git Commit: ${result.gitCommit}\n`;
      }
    }

    output += `✓ Validation: ${result.validationPassed ? 'Passed' : 'Skipped'}\n`;
    output += '\n';

    if (result.warnings.length > 0) {
      output += '─'.repeat(70) + '\n\n';
      output += '⚠️  Notes:\n';
      result.warnings.forEach(w => {
        output += `   ${w}\n`;
      });
      output += '\n';
    }

    output += '─'.repeat(70) + '\n\n';
    output += '🎯 NEXT STEPS\n\n';
    output += '   1. Review completion report\n';
    if (!result.archived) {
      output += '   2. Archive project repository\n';
      output += '   3. Communicate completion to stakeholders\n';
      output += '   4. Transfer knowledge if needed\n';
    } else {
      output += '   2. Communicate completion to stakeholders\n';
      output += '   3. Transfer knowledge if needed\n';
    }
    output += '\n';

    output += '💡 TIP: Validate workspace documentation to ensure it reflects the project completion:\n';
    output += '   workspace-index.validate_workspace_documentation()\n';
    output += '\n';

    output += '='.repeat(70) + '\n';

    return output;
  }

  static getToolDefinition() {
    return {
      name: 'wrap_up_project',
      description: 'Finalize project with validation and completion report. Marks all phases complete, generates comprehensive completion report with metrics and timeline. Use after all goals completed and validation passed.',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Absolute path to the project directory',
          },
          skipValidation: {
            type: 'boolean',
            description: 'Skip final validation (not recommended, default: false)',
          },
          notes: {
            type: 'string',
            description: 'Optional completion notes to include in report',
          },
        },
        required: ['projectPath'],
      },
    };
  }
}
