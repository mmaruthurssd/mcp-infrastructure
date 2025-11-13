import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigurableWorkspaceAdapter } from '../../adapters/workspace-adapter.js';
import {
  IConsolidationStrategy,
  ConsolidationPlan,
  ConsolidationResult
} from './types.js';

/**
 * Hierarchical Consolidation Strategy
 *
 * Approach:
 * 1. Identify the most comprehensive document as primary
 * 2. Remove duplicate sections from secondary documents
 * 3. Add reference links pointing to primary document
 * 4. Keep all files, just reduce redundancy
 *
 * Best for: Technical documentation where one file is clearly comprehensive
 */
export class HierarchicalStrategy implements IConsolidationStrategy {
  private adapter: ConfigurableWorkspaceAdapter;

  constructor(adapter: ConfigurableWorkspaceAdapter) {
    this.adapter = adapter;
  }

  getName(): string {
    return 'hierarchical';
  }

  getDescription(): string {
    return 'Keep primary comprehensive document, remove duplicate sections from secondary docs, add references';
  }

  /**
   * Analyze files and create consolidation plan
   */
  async analyze(files: string[], overlaps: any[]): Promise<ConsolidationPlan> {
    // Identify primary document (largest file or most referenced)
    const primaryFile = await this.identifyPrimaryDocument(files);

    // Identify sections to remove from secondary files
    const filesToModify: ConsolidationPlan['filesToModify'] = [];
    let estimatedLineReduction = 0;

    for (const file of files) {
      if (file === primaryFile) {
        // Primary file - no changes
        filesToModify.push({
          file: this.adapter.getRelativePath(file),
          action: 'no-change'
        });
      } else {
        // Secondary file - remove duplicate sections and add reference
        const sectionsToRemove = await this.identifyDuplicateSections(file, primaryFile, overlaps);

        filesToModify.push({
          file: this.adapter.getRelativePath(file),
          action: 'remove-sections',
          sections: sectionsToRemove,
          referenceTarget: this.adapter.getRelativePath(primaryFile)
        });

        // Estimate line reduction (rough estimate: 10 lines per section)
        estimatedLineReduction += sectionsToRemove.length * 10;

        // Also add reference action
        filesToModify.push({
          file: this.adapter.getRelativePath(file),
          action: 'add-references',
          referenceTarget: this.adapter.getRelativePath(primaryFile)
        });
      }
    }

    const warnings: string[] = [];
    if (files.length > 5) {
      warnings.push('Large number of files - may require manual review of references');
    }

    return {
      strategy: 'hierarchical',
      primaryFile: this.adapter.getRelativePath(primaryFile),
      filesToModify,
      description: `Keep ${path.basename(primaryFile)} as primary, remove duplicate sections from ${files.length - 1} secondary file(s)`,
      estimatedLineReduction,
      warnings
    };
  }

  /**
   * Execute consolidation plan
   */
  async execute(plan: ConsolidationPlan, dryRun: boolean = false): Promise<ConsolidationResult> {
    const changedFiles: string[] = [];
    let linesRemoved = 0;

    try {
      for (const modification of plan.filesToModify) {
        if (modification.action === 'no-change') {
          continue;
        }

        const workspaceRoot = this.adapter.getWorkspaceRoot();
        const filePath = path.join(workspaceRoot, modification.file);

        if (modification.action === 'remove-sections' && modification.sections) {
          // Remove duplicate sections
          const result = await this.removeSectionsFromFile(
            filePath,
            modification.sections,
            dryRun
          );

          if (result.modified) {
            changedFiles.push(modification.file);
            linesRemoved += result.linesRemoved;
          }
        }

        if (modification.action === 'add-references' && modification.referenceTarget) {
          // Add reference to primary document
          const result = await this.addReferenceToFile(
            filePath,
            modification.referenceTarget,
            dryRun
          );

          if (result.modified && !changedFiles.includes(modification.file)) {
            changedFiles.push(modification.file);
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
   * Identify the primary (most comprehensive) document
   */
  private async identifyPrimaryDocument(files: string[]): Promise<string> {
    // Strategy: Choose the largest file as primary
    let primaryFile = files[0];
    let maxSize = 0;

    for (const file of files) {
      try {
        const stats = await fs.stat(file);
        if (stats.size > maxSize) {
          maxSize = stats.size;
          primaryFile = file;
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return primaryFile;
  }

  /**
   * Identify sections in file that duplicate content in primary
   */
  private async identifyDuplicateSections(
    file: string,
    primaryFile: string,
    overlaps: any[]
  ): Promise<string[]> {
    const duplicateSections: string[] = [];

    // Find overlap entry for this file pair
    const overlap = overlaps.find(o =>
      (o.file1 === file && o.file2 === primaryFile) ||
      (o.file1 === primaryFile && o.file2 === file)
    );

    if (overlap && overlap.similarSections) {
      // Extract section names from similarSections
      for (const section of overlap.similarSections) {
        if (typeof section === 'object' && section.section1) {
          duplicateSections.push(section.section1);
        } else if (typeof section === 'string') {
          duplicateSections.push(section);
        }
      }
    }

    return duplicateSections;
  }

  /**
   * Remove specified sections from a file
   */
  private async removeSectionsFromFile(
    filePath: string,
    sections: string[],
    dryRun: boolean
  ): Promise<{ modified: boolean; linesRemoved: number }> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      let newLines: string[] = [];
      let linesRemoved = 0;
      let inRemovalSection = false;
      let currentHeader = '';

      for (const line of lines) {
        const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

        if (headerMatch) {
          currentHeader = headerMatch[2];
          inRemovalSection = sections.some(s =>
            s.toLowerCase().includes(currentHeader.toLowerCase()) ||
            currentHeader.toLowerCase().includes(s.toLowerCase())
          );

          if (inRemovalSection) {
            linesRemoved++;
            continue; // Skip this header
          }
        }

        if (inRemovalSection) {
          linesRemoved++;
        } else {
          newLines.push(line);
        }
      }

      if (linesRemoved > 0 && !dryRun) {
        await fs.writeFile(filePath, newLines.join('\n'));
      }

      return { modified: linesRemoved > 0, linesRemoved };
    } catch (error) {
      console.error(`[HierarchicalStrategy] Error removing sections from ${filePath}:`, error);
      return { modified: false, linesRemoved: 0 };
    }
  }

  /**
   * Add reference link to primary document
   */
  private async addReferenceToFile(
    filePath: string,
    primaryFile: string,
    dryRun: boolean
  ): Promise<{ modified: boolean }> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Check if reference already exists
      if (content.includes(primaryFile)) {
        return { modified: false };
      }

      // Add reference at the top (after frontmatter if present)
      const lines = content.split('\n');
      let insertIndex = 0;

      // Skip YAML frontmatter
      if (lines[0] === '---') {
        for (let i = 1; i < lines.length; i++) {
          if (lines[i] === '---') {
            insertIndex = i + 1;
            break;
          }
        }
      }

      // Add reference notice
      const reference = `\n> **Note:** For comprehensive documentation, see [${path.basename(primaryFile)}](${primaryFile})\n`;
      lines.splice(insertIndex, 0, reference);

      if (!dryRun) {
        await fs.writeFile(filePath, lines.join('\n'));
      }

      return { modified: true };
    } catch (error) {
      console.error(`[HierarchicalStrategy] Error adding reference to ${filePath}:`, error);
      return { modified: false };
    }
  }
}
