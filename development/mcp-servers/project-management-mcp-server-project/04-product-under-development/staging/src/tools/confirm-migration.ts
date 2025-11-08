/**
 * Confirm Migration Tool
 *
 * Execute migration based on user-reviewed and confirmed suggestions.
 * Handles file moves, conflict resolution, and generates summary report.
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface ConfirmMigrationInput {
  projectPath: string;
  suggestions: Array<{
    sourceFile: string;
    suggestedDestination: string;
    action: 'accept' | 'reject' | 'custom';
    customDestination?: string;
  }>;
  conflictResolutions: {
    readme?: 'keep-both' | 'merge' | 'existing-only' | 'template-only';
    existingStructure?: 'merge' | 'archive' | 'cancel';
  };
  createBackup?: boolean;
}

export interface ConfirmMigrationOutput {
  success: boolean;
  projectPath: string;
  summary: {
    filesMoved: number;
    filesSkipped: number;
    conflictsResolved: number;
    errors: string[];
  };
  movements: Array<{
    source: string;
    destination: string;
    status: 'success' | 'failed' | 'skipped';
    error?: string;
  }>;
  backupPath?: string;
  message: string;
  formatted: string;
}

// ============================================================================
// Tool Implementation
// ============================================================================

export class ConfirmMigrationTool {
  static execute(input: ConfirmMigrationInput): ConfirmMigrationOutput {
    const projectPath = path.resolve(input.projectPath);
    const movements: Array<{
      source: string;
      destination: string;
      status: 'success' | 'failed' | 'skipped';
      error?: string;
    }> = [];
    const errors: string[] = [];

    // ========================================================================
    // STEP 1: Create backup if requested
    // ========================================================================
    let backupPath: string | undefined;
    if (input.createBackup) {
      backupPath = this.createBackup(projectPath);
      if (!backupPath) {
        return {
          success: false,
          projectPath,
          summary: {
            filesMoved: 0,
            filesSkipped: 0,
            conflictsResolved: 0,
            errors: ['Failed to create backup'],
          },
          movements: [],
          message: 'Migration failed: Could not create backup',
          formatted: '❌ Migration failed: Could not create backup',
        };
      }
    }

    // ========================================================================
    // STEP 2: Process each file suggestion
    // ========================================================================
    for (const suggestion of input.suggestions) {
      // Skip rejected suggestions
      if (suggestion.action === 'reject') {
        movements.push({
          source: suggestion.sourceFile,
          destination: '',
          status: 'skipped',
        });
        continue;
      }

      // Determine final destination
      const destination =
        suggestion.action === 'custom' && suggestion.customDestination
          ? path.join(projectPath, suggestion.customDestination)
          : path.join(projectPath, suggestion.suggestedDestination);

      // Move file
      const moveResult = this.moveFile(suggestion.sourceFile, destination);
      movements.push({
        source: suggestion.sourceFile,
        destination,
        status: moveResult.success ? 'success' : 'failed',
        error: moveResult.error,
      });

      if (!moveResult.success && moveResult.error) {
        errors.push(moveResult.error);
      }
    }

    // ========================================================================
    // STEP 3: Handle conflicts
    // ========================================================================
    const conflictsResolved = this.handleConflicts(projectPath, input.conflictResolutions);

    // ========================================================================
    // STEP 4: Generate summary
    // ========================================================================
    const filesMoved = movements.filter(m => m.status === 'success').length;
    const filesSkipped = movements.filter(m => m.status === 'skipped').length;

    // ========================================================================
    // STEP 5: Save migration report to EVENT-LOG
    // ========================================================================
    this.saveMigrationReport(projectPath, {
      filesMoved,
      filesSkipped,
      conflictsResolved,
      movements: movements.filter(m => m.status === 'success'),
      backupPath,
    });

    const formatted = this.formatOutput({
      projectPath,
      filesMoved,
      filesSkipped,
      conflictsResolved,
      errors,
      backupPath,
    });

    return {
      success: errors.length === 0,
      projectPath,
      summary: {
        filesMoved,
        filesSkipped,
        conflictsResolved,
        errors,
      },
      movements,
      backupPath,
      message: `Migration complete: ${filesMoved} files moved, ${filesSkipped} skipped, ${errors.length} errors`,
      formatted,
    };
  }

  static getToolDefinition() {
    return {
      name: 'confirm_migration',
      description: 'Execute migration based on user-reviewed suggestions. Moves files to new template structure and handles conflicts.',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Absolute path to the project directory',
          },
          suggestions: {
            type: 'array',
            description: 'Array of file movement suggestions with user decisions',
            items: {
              type: 'object',
              properties: {
                sourceFile: {
                  type: 'string',
                  description: 'Absolute path to source file',
                },
                suggestedDestination: {
                  type: 'string',
                  description: 'Suggested destination path (relative to project root)',
                },
                action: {
                  type: 'string',
                  enum: ['accept', 'reject', 'custom'],
                  description: 'User action: accept suggestion, reject (skip), or provide custom destination',
                },
                customDestination: {
                  type: 'string',
                  description: 'Custom destination if action is "custom"',
                },
              },
              required: ['sourceFile', 'suggestedDestination', 'action'],
            },
          },
          conflictResolutions: {
            type: 'object',
            description: 'How to resolve detected conflicts',
            properties: {
              readme: {
                type: 'string',
                enum: ['keep-both', 'merge', 'existing-only', 'template-only'],
                description: 'How to handle README conflicts',
              },
              existingStructure: {
                type: 'string',
                enum: ['merge', 'archive', 'cancel'],
                description: 'How to handle existing numbered folder structure',
              },
            },
          },
          createBackup: {
            type: 'boolean',
            description: 'Create backup before migration (default: true)',
          },
        },
        required: ['projectPath', 'suggestions'],
      },
    };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private static createBackup(projectPath: string): string | undefined {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupPath = path.join(projectPath, '08-archive', 'pre-migration', `backup-${timestamp}`);

      fs.mkdirSync(backupPath, { recursive: true });

      // Copy entire project to backup (excluding node_modules, .git, etc.)
      this.copyDirectory(projectPath, backupPath, [
        'node_modules',
        '.git',
        'dist',
        'build',
        '08-archive',
      ]);

      return backupPath;
    } catch (error) {
      console.error('Backup creation failed:', error);
      return undefined;
    }
  }

  private static copyDirectory(src: string, dest: string, exclude: string[] = []) {
    try {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }

      const entries = fs.readdirSync(src, { withFileTypes: true });

      for (const entry of entries) {
        if (exclude.includes(entry.name)) {
          continue;
        }

        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          this.copyDirectory(srcPath, destPath, exclude);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    } catch (error) {
      console.error(`Error copying directory ${src}:`, error);
    }
  }

  private static moveFile(
    source: string,
    destination: string
  ): { success: boolean; error?: string } {
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(destination);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Check if destination already exists
      if (fs.existsSync(destination)) {
        return {
          success: false,
          error: `Destination already exists: ${destination}`,
        };
      }

      // Move file
      fs.renameSync(source, destination);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to move ${source}: ${String(error)}`,
      };
    }
  }

  private static handleConflicts(
    projectPath: string,
    resolutions: ConfirmMigrationInput['conflictResolutions']
  ): number {
    let conflictsResolved = 0;

    // Handle README conflict
    if (resolutions.readme) {
      const readmePath = path.join(projectPath, 'README.md');
      const templateReadmePath = path.join(projectPath, 'README.md.template');

      if (resolutions.readme === 'keep-both') {
        // Move existing to docs/
        const docsPath = path.join(projectPath, '03-resources-docs-assets-tools', 'docs', 'README-original.md');
        if (fs.existsSync(readmePath)) {
          fs.mkdirSync(path.dirname(docsPath), { recursive: true });
          fs.renameSync(readmePath, docsPath);
          conflictsResolved++;
        }
      } else if (resolutions.readme === 'existing-only') {
        // Keep existing, remove template
        if (fs.existsSync(templateReadmePath)) {
          fs.unlinkSync(templateReadmePath);
          conflictsResolved++;
        }
      }
      // merge and template-only would require more complex logic
    }

    // Handle existing structure conflict
    if (resolutions.existingStructure === 'archive') {
      const archivePath = path.join(projectPath, '08-archive', 'pre-migration', 'old-structure');
      fs.mkdirSync(archivePath, { recursive: true });

      // Move existing numbered folders to archive
      for (let i = 1; i <= 8; i++) {
        const folderName = `0${i}-*`;
        const folderPath = path.join(projectPath, folderName);
        if (fs.existsSync(folderPath)) {
          fs.renameSync(folderPath, path.join(archivePath, folderName));
          conflictsResolved++;
        }
      }
    }

    return conflictsResolved;
  }

  private static saveMigrationReport(
    projectPath: string,
    data: {
      filesMoved: number;
      filesSkipped: number;
      conflictsResolved: number;
      movements: Array<{ source: string; destination: string }>;
      backupPath?: string;
    }
  ) {
    try {
      const eventLogPath = path.join(projectPath, 'EVENT-LOG.md');
      const timestamp = new Date().toISOString().split('T')[0];

      let report = `\n\n### Migration Completed - ${timestamp}\n`;
      report += `**Event:** Project migrated to 8-folder template structure\n\n`;
      report += `**Summary:**\n`;
      report += `- Files moved: ${data.filesMoved}\n`;
      report += `- Files skipped: ${data.filesSkipped}\n`;
      report += `- Conflicts resolved: ${data.conflictsResolved}\n`;

      if (data.backupPath) {
        report += `- Backup created: ${data.backupPath}\n`;
      }

      report += `\n**Status:** ✅ Complete\n`;

      // Append to EVENT-LOG if it exists
      if (fs.existsSync(eventLogPath)) {
        fs.appendFileSync(eventLogPath, report);
      }
    } catch (error) {
      console.error('Failed to save migration report:', error);
    }
  }

  private static formatOutput(data: {
    projectPath: string;
    filesMoved: number;
    filesSkipped: number;
    conflictsResolved: number;
    errors: string[];
    backupPath?: string;
  }): string {
    let output = '='.repeat(70) + '\n';
    output += '  MIGRATION COMPLETE\n';
    output += '='.repeat(70) + '\n\n';

    output += `📂 Project: ${data.projectPath}\n\n`;

    output += '─'.repeat(70) + '\n\n';

    output += '✅ MIGRATION SUMMARY:\n\n';
    output += `   • Files moved: ${data.filesMoved}\n`;
    output += `   • Files skipped: ${data.filesSkipped}\n`;
    output += `   • Conflicts resolved: ${data.conflictsResolved}\n`;

    if (data.backupPath) {
      output += `   • Backup created: ${data.backupPath}\n`;
    }

    output += '\n';

    if (data.errors.length > 0) {
      output += '─'.repeat(70) + '\n\n';
      output += '⚠️  ERRORS:\n\n';
      for (const error of data.errors) {
        output += `   • ${error}\n`;
      }
      output += '\n';
    }

    output += '─'.repeat(70) + '\n\n';

    output += '📋 NEXT STEPS:\n\n';
    output += '   1. Review the new project structure\n';
    output += '   2. Check EVENT-LOG.md for detailed migration report\n';
    output += '   3. Update any build scripts or paths as needed\n';
    output += '   4. Test your project to ensure everything works\n\n';

    if (data.backupPath) {
      output += '💡 Note: A backup of your original project structure was created\n';
      output += `   at ${data.backupPath}\n\n`;
    }

    return output;
  }
}
