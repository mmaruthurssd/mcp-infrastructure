import { promises as fs } from 'fs';
import path from 'path';
import { WorkspaceSnapshot } from './drift-tracker.js';

export interface ValidationIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  file: string;
  line?: number;
  expected: string;
  actual: string;
  suggestion: string;
}

export interface UpdateChange {
  file: string;
  linesModified: number;
  preview: string; // Diff format
  originalContent?: string; // For rollback
}

export interface UpdateResult {
  applied: boolean;
  dryRun: boolean;
  backupPath?: string;
  changes: UpdateChange[];
  validation: {
    syntaxValid: boolean;
    errors: string[];
  };
}

export class DocumentationUpdater {
  private backupDir: string;

  constructor(private projectRoot: string) {
    this.backupDir = path.join(projectRoot, '.doc-backups');
  }

  /**
   * Create backup directory if it doesn't exist
   */
  private async ensureBackupDir(): Promise<void> {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create backup of a file before modification
   */
  private async createBackup(filePath: string): Promise<string> {
    await this.ensureBackupDir();

    const fileName = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${fileName}.${timestamp}.backup`;
    const backupPath = path.join(this.backupDir, backupName);

    const content = await fs.readFile(filePath, 'utf-8');
    await fs.writeFile(backupPath, content, 'utf-8');

    return backupPath;
  }

  /**
   * Restore file from backup
   */
  async rollback(backupPath: string, originalPath: string): Promise<void> {
    const content = await fs.readFile(backupPath, 'utf-8');
    await fs.writeFile(originalPath, content, 'utf-8');
  }

  /**
   * Validate markdown syntax (basic checks)
   */
  private validateMarkdownSyntax(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for unclosed code blocks
    const codeBlockMatches = content.match(/```/g);
    if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
      errors.push('Unclosed code block detected');
    }

    // Check for malformed headers
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check header spacing (after all #s, must have space or be end of line)
      // Valid: "## Header", "### Another", "#"
      // Invalid: "##NoSpace", "###BadHeader"
      if (/^#{1,6}[^\s#]/.test(line) && !line.startsWith('#---')) {
        errors.push(`Line ${i + 1}: Header missing space after # symbols`);
      }

      // Check for broken links (basic)
      const linkMatches = line.match(/\[([^\]]+)\]\(([^)]+)\)/g);
      if (linkMatches) {
        for (const match of linkMatches) {
          const urlPart = match.match(/\]\(([^)]+)\)/)?.[1];
          if (urlPart && urlPart.trim() === '') {
            errors.push(`Line ${i + 1}: Empty link URL`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate diff preview between original and updated content
   */
  private generateDiff(original: string, updated: string, filePath: string): string {
    const originalLines = original.split('\n');
    const updatedLines = updated.split('\n');

    let diff = `--- a/${filePath}\n+++ b/${filePath}\n`;

    const maxLen = Math.max(originalLines.length, updatedLines.length);
    let changes = 0;

    for (let i = 0; i < maxLen; i++) {
      const origLine = originalLines[i] || '';
      const newLine = updatedLines[i] || '';

      if (origLine !== newLine) {
        if (origLine) {
          diff += `@@ -${i + 1} @@\n`;
          diff += `-${origLine}\n`;
        }
        if (newLine) {
          if (!origLine) diff += `@@ +${i + 1} @@\n`;
          diff += `+${newLine}\n`;
        }
        changes++;
      }
    }

    if (changes === 0) {
      diff += '(no changes)\n';
    }

    return diff;
  }

  /**
   * Update MCP counts in documentation
   */
  private updateMCPCounts(
    content: string,
    snapshot: WorkspaceSnapshot
  ): { updated: string; linesModified: number } {
    let updated = content;
    let linesModified = 0;

    // Pattern 1: "21 active MCPs" or "22 MCPs"
    const activePattern = /(\d+)\s+(active\s+)?MCPs?/gi;
    updated = updated.replace(activePattern, (match) => {
      const hasActive = /active/i.test(match);
      if (hasActive) {
        linesModified++;
        return `${snapshot.mcpCount.active} active MCPs`;
      }
      return match;
    });

    // Pattern 2: "21 active + 1 library" or similar
    const libraryPattern = /(\d+)\s+active\s*\+\s*(\d+)\s+library/gi;
    updated = updated.replace(libraryPattern, (match) => {
      linesModified++;
      return `${snapshot.mcpCount.active} active + ${snapshot.mcpCount.library} library`;
    });

    // Pattern 3: Total count
    const totalPattern = /total:\s*(\d+)/gi;
    updated = updated.replace(totalPattern, (match) => {
      linesModified++;
      return `total: ${snapshot.mcpCount.total}`;
    });

    return { updated, linesModified };
  }

  /**
   * Update template counts in documentation
   */
  private updateTemplateCounts(
    content: string,
    snapshot: WorkspaceSnapshot
  ): { updated: string; linesModified: number } {
    let updated = content;
    let linesModified = 0;

    // Pattern: "24 templates" or "24 MCP templates"
    const templatePattern = /(\d+)\s+(MCP\s+)?templates?/gi;
    updated = updated.replace(templatePattern, (match) => {
      const hasMCP = /MCP/i.test(match);
      linesModified++;
      return hasMCP
        ? `${snapshot.templateCount.total} MCP templates`
        : `${snapshot.templateCount.total} templates`;
    });

    return { updated, linesModified };
  }

  /**
   * Update workspace documentation to match reality
   */
  async updateDocumentation(options: {
    targets?: string[];
    dryRun?: boolean;
    createBackup?: boolean;
    issues?: ValidationIssue[];
    snapshot: WorkspaceSnapshot;
  }): Promise<UpdateResult> {
    const dryRun = options.dryRun !== false; // Default to true
    const createBackup = options.createBackup !== false; // Default to true

    const changes: UpdateChange[] = [];
    const errors: string[] = [];
    const backupPaths = new Map<string, string>();

    // Default targets if not specified
    const targets = options.targets || [
      'WORKSPACE_GUIDE.md',
      'WORKSPACE_ARCHITECTURE.md',
    ];

    // Update each target file
    for (const target of targets) {
      try {
        const filePath = path.join(this.projectRoot, target);

        // Read original content
        const originalContent = await fs.readFile(filePath, 'utf-8');

        // Create backup ONCE before any updates (if not dry run and backup enabled)
        let backupPath: string | undefined;
        if (!dryRun && createBackup) {
          backupPath = await this.createBackup(filePath);
          backupPaths.set(target, backupPath);
        }

        // Apply all updates to content (pure transformations)
        let updated = originalContent;
        let totalLinesModified = 0;

        // Update MCP counts
        const mcpResult = this.updateMCPCounts(updated, options.snapshot);
        updated = mcpResult.updated;
        totalLinesModified += mcpResult.linesModified;

        // Update template counts
        const templateResult = this.updateTemplateCounts(updated, options.snapshot);
        updated = templateResult.updated;
        totalLinesModified += templateResult.linesModified;

        // Generate preview diff
        if (totalLinesModified > 0) {
          const preview = this.generateDiff(originalContent, updated, target);
          changes.push({
            file: target,
            linesModified: totalLinesModified,
            preview,
            originalContent,
          });
        }

        // Apply changes if not dry run
        if (!dryRun && totalLinesModified > 0) {
          await fs.writeFile(filePath, updated, 'utf-8');

          // Validate syntax after write
          const validation = this.validateMarkdownSyntax(updated);

          if (!validation.valid) {
            errors.push(...validation.errors);

            // Rollback if syntax invalid and backup exists
            if (backupPath) {
              console.error(`Syntax validation failed for ${target}, rolling back...`);
              await this.rollback(backupPath, filePath);
            }
          }
        }
      } catch (error) {
        errors.push(`Error updating ${target}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      applied: !dryRun && errors.length === 0,
      dryRun,
      backupPath: createBackup ? this.backupDir : undefined,
      changes,
      validation: {
        syntaxValid: errors.length === 0,
        errors,
      },
    };
  }
}
