import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { ConfigurableWorkspaceAdapter } from '../adapters/workspace-adapter.js';

/**
 * Reference found in a document
 */
export interface DocumentReference {
  /** File containing the reference */
  sourceFile: string;

  /** Line number where reference appears */
  lineNumber: number;

  /** Type of reference */
  type: 'file-link' | 'section-link' | 'relative-link';

  /** Original link text */
  original: string;

  /** Target path (resolved) */
  target: string;

  /** Whether link is valid */
  isValid: boolean;

  /** Error if link is invalid */
  error?: string;
}

/**
 * Reference update operation
 */
export interface ReferenceUpdate {
  /** File to update */
  file: string;

  /** Line number */
  lineNumber: number;

  /** Old link text */
  oldLink: string;

  /** New link text */
  newLink: string;

  /** Reason for update */
  reason: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Total references checked */
  totalReferences: number;

  /** Valid references */
  validReferences: number;

  /** Broken references */
  brokenReferences: DocumentReference[];

  /** Files scanned */
  filesScanned: number;

  /** Timestamp */
  timestamp: string;
}

/**
 * Update result
 */
export interface UpdateResult {
  /** Number of files updated */
  filesUpdated: number;

  /** Number of links updated */
  linksUpdated: number;

  /** Errors encountered */
  errors: string[];

  /** Success */
  success: boolean;
}

/**
 * ReferenceValidator - Validates and updates cross-references in documentation
 *
 * Features:
 * - Scan all markdown files for links
 * - Validate internal file links
 * - Validate section/anchor links
 * - Auto-update references after consolidation
 * - Report broken links
 */
export class ReferenceValidator {
  private adapter: ConfigurableWorkspaceAdapter;

  constructor(adapter: ConfigurableWorkspaceAdapter) {
    this.adapter = adapter;
  }

  /**
   * Scan workspace and validate all internal references
   */
  async validateAllReferences(): Promise<ValidationResult> {
    const workspaceRoot = this.adapter.getWorkspaceRoot();
    const mdFiles = await this.findMarkdownFiles(workspaceRoot);

    console.error(`[ReferenceValidator] Scanning ${mdFiles.length} markdown files...`);

    const allReferences: DocumentReference[] = [];
    let filesScanned = 0;

    for (const file of mdFiles) {
      try {
        const references = await this.extractReferences(file);
        allReferences.push(...references);
        filesScanned++;
      } catch (error) {
        console.error(`[ReferenceValidator] Error scanning ${file}:`, error);
      }
    }

    const brokenReferences = allReferences.filter(r => !r.isValid);

    console.error(`[ReferenceValidator] Validation complete:`);
    console.error(`[ReferenceValidator]   Files scanned: ${filesScanned}`);
    console.error(`[ReferenceValidator]   Total references: ${allReferences.length}`);
    console.error(`[ReferenceValidator]   Broken references: ${brokenReferences.length}`);

    return {
      totalReferences: allReferences.length,
      validReferences: allReferences.length - brokenReferences.length,
      brokenReferences,
      filesScanned,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Update references after a file has moved or been consolidated
   */
  async updateReferences(
    oldPath: string,
    newPath: string,
    dryRun: boolean = false
  ): Promise<UpdateResult> {
    const workspaceRoot = this.adapter.getWorkspaceRoot();
    const mdFiles = await this.findMarkdownFiles(workspaceRoot);

    console.error(`[ReferenceValidator] Updating references from ${oldPath} to ${newPath}...`);
    console.error(`[ReferenceValidator]   Dry run: ${dryRun}`);

    const updates: ReferenceUpdate[] = [];
    const errors: string[] = [];

    // Find all references to oldPath
    for (const file of mdFiles) {
      try {
        const fileUpdates = await this.findReferencesTo(file, oldPath, newPath);
        updates.push(...fileUpdates);
      } catch (error) {
        errors.push(`Error scanning ${file}: ${error}`);
      }
    }

    console.error(`[ReferenceValidator] Found ${updates.length} references to update`);

    // Apply updates (unless dry-run)
    let filesUpdated = 0;
    if (!dryRun && updates.length > 0) {
      filesUpdated = await this.applyUpdates(updates);
    }

    return {
      filesUpdated: dryRun ? 0 : filesUpdated,
      linksUpdated: updates.length,
      errors,
      success: errors.length === 0
    };
  }

  /**
   * Batch update references for multiple file mappings
   */
  async batchUpdateReferences(
    mappings: Array<{ oldPath: string; newPath: string }>,
    dryRun: boolean = false
  ): Promise<UpdateResult> {
    const workspaceRoot = this.adapter.getWorkspaceRoot();
    const mdFiles = await this.findMarkdownFiles(workspaceRoot);

    console.error(`[ReferenceValidator] Batch updating ${mappings.length} file mappings...`);

    const allUpdates: ReferenceUpdate[] = [];
    const errors: string[] = [];

    for (const file of mdFiles) {
      try {
        for (const { oldPath, newPath } of mappings) {
          const fileUpdates = await this.findReferencesTo(file, oldPath, newPath);
          allUpdates.push(...fileUpdates);
        }
      } catch (error) {
        errors.push(`Error scanning ${file}: ${error}`);
      }
    }

    console.error(`[ReferenceValidator] Found ${allUpdates.length} total references to update`);

    let filesUpdated = 0;
    if (!dryRun && allUpdates.length > 0) {
      filesUpdated = await this.applyUpdates(allUpdates);
    }

    return {
      filesUpdated: dryRun ? 0 : filesUpdated,
      linksUpdated: allUpdates.length,
      errors,
      success: errors.length === 0
    };
  }

  /**
   * Find all markdown files in workspace
   */
  private async findMarkdownFiles(workspaceRoot: string): Promise<string[]> {
    const patterns = ['**/*.md'];
    const ignore = [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
      '**/.doc-consolidation-backups/**'
    ];

    try {
      return await glob(patterns, {
        cwd: workspaceRoot,
        ignore,
        absolute: true,
        nodir: true
      });
    } catch (error) {
      console.error(`[ReferenceValidator] Error finding markdown files:`, error);
      return [];
    }
  }

  /**
   * Extract all references from a file
   */
  private async extractReferences(filePath: string): Promise<DocumentReference[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const references: DocumentReference[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match markdown links: [text](path) or [text](path#section)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;

      while ((match = linkRegex.exec(line)) !== null) {
        const linkText = match[1];
        const linkPath = match[2];

        // Skip external links
        if (linkPath.startsWith('http://') || linkPath.startsWith('https://')) {
          continue;
        }

        // Parse link
        const [filePart, sectionPart] = linkPath.split('#');
        const type: DocumentReference['type'] = sectionPart
          ? 'section-link'
          : filePart
          ? 'file-link'
          : 'relative-link';

        // Validate link
        const validation = await this.validateLink(filePath, filePart, sectionPart);

        references.push({
          sourceFile: this.adapter.getRelativePath(filePath),
          lineNumber: i + 1,
          type,
          original: linkPath,
          target: filePart || '',
          isValid: validation.isValid,
          error: validation.error
        });
      }
    }

    return references;
  }

  /**
   * Validate a single link
   */
  private async validateLink(
    sourceFile: string,
    targetFile: string,
    section?: string
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Resolve target file path
      const sourceDir = path.dirname(sourceFile);
      const targetPath = path.resolve(sourceDir, targetFile);

      // Check file exists
      try {
        await fs.access(targetPath);
      } catch {
        return { isValid: false, error: `File not found: ${targetFile}` };
      }

      // If section specified, validate it exists
      if (section) {
        const content = await fs.readFile(targetPath, 'utf-8');
        const normalizedSection = section.toLowerCase().replace(/[-_\s]/g, '');
        const contentLower = content.toLowerCase().replace(/[-_\s]/g, '');

        // Look for header matching the section
        const headerRegex = new RegExp(`#+\\s*${normalizedSection}`, 'i');
        if (!headerRegex.test(contentLower)) {
          return { isValid: false, error: `Section not found: #${section}` };
        }
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Find all references in a file to a specific target
   */
  private async findReferencesTo(
    sourceFile: string,
    oldPath: string,
    newPath: string
  ): Promise<ReferenceUpdate[]> {
    const content = await fs.readFile(sourceFile, 'utf-8');
    const lines = content.split('\n');
    const updates: ReferenceUpdate[] = [];

    const oldBasename = path.basename(oldPath);
    const relativeSourceFile = this.adapter.getRelativePath(sourceFile);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match markdown links containing the old path
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;

      while ((match = linkRegex.exec(line)) !== null) {
        const linkPath = match[2];

        // Check if this link references the old file
        if (linkPath.includes(oldBasename) || linkPath.includes(oldPath)) {
          // Calculate new link path relative to source file
          const sourceDir = path.dirname(sourceFile);
          const newAbsolutePath = path.join(this.adapter.getWorkspaceRoot(), newPath);
          const newRelativePath = path.relative(sourceDir, newAbsolutePath);

          updates.push({
            file: relativeSourceFile,
            lineNumber: i + 1,
            oldLink: linkPath,
            newLink: newRelativePath,
            reason: `File moved from ${oldPath} to ${newPath}`
          });
        }
      }
    }

    return updates;
  }

  /**
   * Apply reference updates to files
   */
  private async applyUpdates(updates: ReferenceUpdate[]): Promise<number> {
    // Group updates by file
    const updatesByFile = new Map<string, ReferenceUpdate[]>();

    for (const update of updates) {
      if (!updatesByFile.has(update.file)) {
        updatesByFile.set(update.file, []);
      }
      updatesByFile.get(update.file)!.push(update);
    }

    let filesUpdated = 0;

    // Apply updates to each file
    for (const [relativeFile, fileUpdates] of updatesByFile.entries()) {
      try {
        const filePath = path.join(this.adapter.getWorkspaceRoot(), relativeFile);
        const content = await fs.readFile(filePath, 'utf-8');
        let newContent = content;

        // Apply each update
        for (const update of fileUpdates) {
          newContent = newContent.replace(
            `](${update.oldLink})`,
            `](${update.newLink})`
          );
        }

        // Write updated content
        await fs.writeFile(filePath, newContent);
        filesUpdated++;

        console.error(`[ReferenceValidator]   ✓ Updated ${relativeFile} (${fileUpdates.length} links)`);
      } catch (error) {
        console.error(`[ReferenceValidator]   ✗ Failed to update ${relativeFile}:`, error);
      }
    }

    return filesUpdated;
  }
}
