import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigurableWorkspaceAdapter } from '../../adapters/workspace-adapter.js';
import {
  IConsolidationStrategy,
  ConsolidationPlan,
  ConsolidationResult
} from './types.js';

/**
 * Merge-and-Redirect Consolidation Strategy
 *
 * Approach:
 * 1. Merge all unique content into single comprehensive document
 * 2. Archive original files
 * 3. Create redirect stubs pointing to merged document
 * 4. Update all cross-references
 *
 * Best for: Highly redundant documentation with no audience differentiation
 */
export class MergeAndRedirectStrategy implements IConsolidationStrategy {
  private adapter: ConfigurableWorkspaceAdapter;

  constructor(adapter: ConfigurableWorkspaceAdapter) {
    this.adapter = adapter;
  }

  getName(): string {
    return 'merge-and-redirect';
  }

  getDescription(): string {
    return 'Merge all files into one comprehensive document, archive originals, create redirects';
  }

  /**
   * Analyze files and create merge plan
   */
  async analyze(files: string[], overlaps: any[]): Promise<ConsolidationPlan> {
    // Determine target merged file path (use first file's location)
    const targetFile = this.determineTargetFile(files);

    const filesToModify: ConsolidationPlan['filesToModify'] = [];
    let estimatedLineReduction = 0;

    // Target file will receive merged content
    filesToModify.push({
      file: this.adapter.getRelativePath(targetFile),
      action: 'merge-into'
    });

    // All other files will be archived
    for (const file of files) {
      if (file !== targetFile) {
        filesToModify.push({
          file: this.adapter.getRelativePath(file),
          action: 'archive',
          referenceTarget: this.adapter.getRelativePath(targetFile)
        });

        // Estimate line reduction (full file minus redirect stub ~5 lines)
        try {
          const content = await fs.readFile(file, 'utf-8');
          const lineCount = content.split('\n').length;
          estimatedLineReduction += Math.max(0, lineCount - 5);
        } catch {
          // Estimate 50 lines if can't read
          estimatedLineReduction += 45;
        }
      }
    }

    const warnings: string[] = [];
    warnings.push('This is an aggressive consolidation - ensure no unique content is lost');
    warnings.push('All cross-references in the workspace will need to be updated');

    if (files.length > 3) {
      warnings.push(`Merging ${files.length} files - review carefully for unique content`);
    }

    return {
      strategy: 'merge-and-redirect',
      primaryFile: this.adapter.getRelativePath(targetFile),
      filesToModify,
      description: `Merge ${files.length} files into ${path.basename(targetFile)}, archive originals with redirects`,
      estimatedLineReduction,
      warnings
    };
  }

  /**
   * Execute merge and redirect
   */
  async execute(plan: ConsolidationPlan, dryRun: boolean = false): Promise<ConsolidationResult> {
    const changedFiles: string[] = [];
    let linesRemoved = 0;

    try {
      const workspaceRoot = this.adapter.getWorkspaceRoot();
      const targetFilePath = path.join(workspaceRoot, plan.primaryFile);

      // Step 1: Collect all content from files to be merged
      const filesToMerge = plan.filesToModify.filter(m => m.action === 'archive');
      const mergedContent = await this.mergeFiles(
        targetFilePath,
        filesToMerge.map(m => path.join(workspaceRoot, m.file))
      );

      // Step 2: Write merged content to target file
      if (!dryRun) {
        await fs.writeFile(targetFilePath, mergedContent);
      }
      changedFiles.push(plan.primaryFile);

      // Step 3: Replace source files with redirect stubs
      for (const modification of plan.filesToModify) {
        if (modification.action === 'archive' && modification.referenceTarget) {
          const filePath = path.join(workspaceRoot, modification.file);

          // Count lines before archiving
          try {
            const originalContent = await fs.readFile(filePath, 'utf-8');
            const originalLines = originalContent.split('\n').length;

            // Create redirect stub
            if (!dryRun) {
              const redirectContent = this.createRedirectStub(
                modification.file,
                modification.referenceTarget
              );
              await fs.writeFile(filePath, redirectContent);
            }

            linesRemoved += Math.max(0, originalLines - 5);
            changedFiles.push(modification.file);
          } catch (error) {
            console.error(`[MergeAndRedirectStrategy] Error processing ${modification.file}:`, error);
          }
        }
      }

      return {
        success: true,
        plan,
        changedFiles,
        linesRemoved
      };
    } catch (error) {
      return {
        success: false,
        plan,
        changedFiles,
        linesRemoved,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Determine the target file for merged content
   */
  private determineTargetFile(files: string[]): string {
    // Strategy: Use the file with the most generic name (e.g., README.md over WORKSPACE_GUIDE.md)
    // Or the first file if no clear winner

    const genericNames = ['README.md', 'OVERVIEW.md', 'INDEX.md'];

    for (const genericName of genericNames) {
      const match = files.find(f => path.basename(f).toLowerCase() === genericName.toLowerCase());
      if (match) {
        return match;
      }
    }

    // Default to first file
    return files[0];
  }

  /**
   * Merge content from multiple files into one
   */
  private async mergeFiles(targetFile: string, sourceFiles: string[]): Promise<string> {
    const sections: string[] = [];

    // Read target file if it exists
    try {
      const targetContent = await fs.readFile(targetFile, 'utf-8');
      sections.push(targetContent);
    } catch {
      // Target file doesn't exist yet - start fresh
      sections.push(`# ${path.basename(targetFile, '.md')}\n\n`);
    }

    // Add content from each source file
    for (const sourceFile of sourceFiles) {
      try {
        const content = await fs.readFile(sourceFile, 'utf-8');

        // Extract unique sections (skip frontmatter)
        const cleanContent = this.extractUniqueContent(content, sections.join('\n'));

        if (cleanContent) {
          sections.push(`\n---\n\n## From ${path.basename(sourceFile)}\n\n${cleanContent}`);
        }
      } catch (error) {
        console.error(`[MergeAndRedirectStrategy] Error reading ${sourceFile}:`, error);
      }
    }

    return sections.join('\n');
  }

  /**
   * Extract unique content not already present in merged document
   */
  private extractUniqueContent(newContent: string, existingContent: string): string {
    // Remove YAML frontmatter
    let cleaned = newContent.replace(/^---\n[\s\S]*?\n---\n/m, '');

    // Split into sections
    const sections = cleaned.split(/\n## /);
    const uniqueSections: string[] = [];

    for (const section of sections) {
      // Check if this section's content already exists
      const sectionHeader = section.split('\n')[0];

      if (!existingContent.toLowerCase().includes(sectionHeader.toLowerCase())) {
        uniqueSections.push(section);
      }
    }

    return uniqueSections.join('\n## ').trim();
  }

  /**
   * Create a redirect stub file
   */
  private createRedirectStub(originalPath: string, targetPath: string): string {
    return `---
redirect_to: ${targetPath}
deprecated: true
---

# ${path.basename(originalPath, '.md')} (Redirected)

> **This document has been consolidated.**
>
> Please see [${path.basename(targetPath)}](${targetPath}) for the comprehensive documentation.

---

*This file is maintained for backward compatibility and will redirect to the consolidated documentation.*
`;
  }
}
