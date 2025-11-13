import { promises as fs } from 'fs';
import path from 'path';

export interface ValidationIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  file: string;
  line?: number;
  expected: string;
  actual: string;
  suggestion: string;
}

export interface ValidationResult {
  valid: boolean;
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
  };
  issues: ValidationIssue[];
  lastValidated: string;
}

export interface ValidationOptions {
  checks?: Array<'mcp_counts' | 'template_inventory' | 'status_accuracy' | 'cross_references' | 'all'>;
  targets?: string[];
  reportFormat?: 'summary' | 'detailed' | 'actionable';
  autoFix?: boolean;
}

export class DocumentationValidator {
  constructor(private projectRoot: string) {}

  async validate(options: ValidationOptions = {}): Promise<ValidationResult> {
    const checks = options.checks || ['all'];
    const shouldRunCheck = (check: string) =>
      checks.includes('all') || checks.includes(check as any);

    const issues: ValidationIssue[] = [];
    let totalChecks = 0;
    let passed = 0;

    // Run requested validation checks
    if (shouldRunCheck('mcp_counts')) {
      const mcpIssues = await this.validateMCPCounts();
      issues.push(...mcpIssues);
      totalChecks++;
      if (mcpIssues.length === 0) passed++;
    }

    if (shouldRunCheck('template_inventory')) {
      const templateIssues = await this.validateTemplateInventory();
      issues.push(...templateIssues);
      totalChecks++;
      if (templateIssues.length === 0) passed++;
    }

    if (shouldRunCheck('status_accuracy')) {
      const statusIssues = await this.validateStatusAccuracy();
      issues.push(...statusIssues);
      totalChecks++;
      if (statusIssues.length === 0) passed++;
    }

    if (shouldRunCheck('cross_references')) {
      const refIssues = await this.validateCrossReferences();
      issues.push(...refIssues);
      totalChecks++;
      if (refIssues.length === 0) passed++;
    }

    return {
      valid: issues.length === 0,
      summary: {
        totalChecks,
        passed,
        failed: totalChecks - passed,
      },
      issues,
      lastValidated: new Date().toISOString(),
    };
  }

  /**
   * Validation Rule 1: MCP Counts
   * Scans local-instances/mcp-servers/, compares against documentation
   */
  private async validateMCPCounts(): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    try {
      // Scan actual MCP directories (including symlinks to directories)
      const mcpPath = path.join(this.projectRoot, 'local-instances', 'mcp-servers');
      const entries = await fs.readdir(mcpPath, { withFileTypes: true });

      // Filter for directories and symlinks that point to directories
      const mcpDirs: string[] = [];
      for (const entry of entries) {
        if (entry.isDirectory()) {
          mcpDirs.push(entry.name);
        } else if (entry.isSymbolicLink()) {
          // Check if symlink points to a directory
          try {
            const targetPath = path.join(mcpPath, entry.name);
            const stats = await fs.stat(targetPath); // stat() follows symlinks
            if (stats.isDirectory()) {
              mcpDirs.push(entry.name);
            }
          } catch {
            // Broken symlink, skip it
          }
        }
      }

      // Count active vs library MCPs
      const libraryMCPs = ['workflow-orchestrator-mcp-server'];
      const activeMCPs = mcpDirs.filter(name => !libraryMCPs.includes(name));
      const actualActiveMCPCount = activeMCPs.length;
      const actualLibraryMCPCount = mcpDirs.filter(name => libraryMCPs.includes(name)).length;
      const actualTotalCount = mcpDirs.length;

      // Check WORKSPACE_GUIDE.md
      const guideFile = 'WORKSPACE_GUIDE.md';
      const guidePath = path.join(this.projectRoot, guideFile);
      const guideContent = await fs.readFile(guidePath, 'utf-8');
      const guideLines = guideContent.split('\n');

      // Pattern matching for MCP counts
      const activePattern = /(\d+)\s+active\s+MCPs?/i;
      const libraryPattern = /(\d+)\s+library\s+MCP/i;
      const totalPattern = /(\d+)\s+MCPs?\s+(deployed|available|in production)/i;

      // Check each line for count mismatches
      guideLines.forEach((line, index) => {
        const activeMatch = line.match(activePattern);
        if (activeMatch) {
          const documentedCount = parseInt(activeMatch[1]);
          if (documentedCount !== actualActiveMCPCount) {
            issues.push({
              severity: 'warning',
              category: 'mcp_counts',
              file: guideFile,
              line: index + 1,
              expected: `${actualActiveMCPCount} active MCPs`,
              actual: `${documentedCount} active MCPs`,
              suggestion: `Update line ${index + 1} to reflect ${actualActiveMCPCount} active MCPs`,
            });
          }
        }

        const libraryMatch = line.match(libraryPattern);
        if (libraryMatch) {
          const documentedCount = parseInt(libraryMatch[1]);
          if (documentedCount !== actualLibraryMCPCount) {
            issues.push({
              severity: 'info',
              category: 'mcp_counts',
              file: guideFile,
              line: index + 1,
              expected: `${actualLibraryMCPCount} library MCP`,
              actual: `${documentedCount} library MCP`,
              suggestion: `Update line ${index + 1} to reflect ${actualLibraryMCPCount} library MCP`,
            });
          }
        }

        const totalMatch = line.match(totalPattern);
        if (totalMatch) {
          const documentedCount = parseInt(totalMatch[1]);
          if (documentedCount !== actualTotalCount && documentedCount !== actualActiveMCPCount) {
            issues.push({
              severity: 'warning',
              category: 'mcp_counts',
              file: guideFile,
              line: index + 1,
              expected: `${actualTotalCount} total MCPs (or ${actualActiveMCPCount} active)`,
              actual: `${documentedCount} MCPs`,
              suggestion: `Update line ${index + 1} to clarify: ${actualActiveMCPCount} active + ${actualLibraryMCPCount} library`,
            });
          }
        }
      });

      // Check WORKSPACE_ARCHITECTURE.md
      const archFile = 'WORKSPACE_ARCHITECTURE.md';
      const archPath = path.join(this.projectRoot, archFile);
      const archContent = await fs.readFile(archPath, 'utf-8');
      const archLines = archContent.split('\n');

      archLines.forEach((line, index) => {
        const activeMatch = line.match(activePattern);
        if (activeMatch) {
          const documentedCount = parseInt(activeMatch[1]);
          if (documentedCount !== actualActiveMCPCount) {
            issues.push({
              severity: 'warning',
              category: 'mcp_counts',
              file: archFile,
              line: index + 1,
              expected: `${actualActiveMCPCount} active MCPs`,
              actual: `${documentedCount} active MCPs`,
              suggestion: `Update line ${index + 1} to reflect ${actualActiveMCPCount} active MCPs`,
            });
          }
        }
      });

    } catch (error) {
      issues.push({
        severity: 'critical',
        category: 'mcp_counts',
        file: 'system',
        expected: 'Successful MCP count validation',
        actual: `Error: ${error}`,
        suggestion: 'Check that local-instances/mcp-servers/ directory exists and is readable',
      });
    }

    return issues;
  }

  /**
   * Validation Rule 2: Template Inventory
   * Scans templates-and-patterns/mcp-server-templates/templates/, compares against TEMPLATES_INDEX.md
   */
  private async validateTemplateInventory(): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    try {
      // Scan actual template directories
      const templatesPath = path.join(
        this.projectRoot,
        'templates-and-patterns',
        'mcp-server-templates',
        'templates'
      );
      const dirs = await fs.readdir(templatesPath, { withFileTypes: true });
      const templateDirs = dirs.filter(d => d.isDirectory()).map(d => d.name);
      const actualTemplateCount = templateDirs.length;

      // Check TEMPLATES_INDEX.md
      const indexFile = 'templates-and-patterns/mcp-server-templates/TEMPLATES_INDEX.md';
      const indexPath = path.join(this.projectRoot, indexFile);
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const indexLines = indexContent.split('\n');

      // Check for total count mismatch
      const totalPattern = /Total Templates[:\s]+(\d+)/i;
      indexLines.forEach((line, index) => {
        const match = line.match(totalPattern);
        if (match) {
          const documentedCount = parseInt(match[1]);
          if (documentedCount !== actualTemplateCount) {
            issues.push({
              severity: 'warning',
              category: 'template_inventory',
              file: indexFile,
              line: index + 1,
              expected: `Total Templates: ${actualTemplateCount}`,
              actual: `Total Templates: ${documentedCount}`,
              suggestion: `Update line ${index + 1} to reflect ${actualTemplateCount} templates`,
            });
          }
        }
      });

      // Check for missing templates in documentation
      for (const templateName of templateDirs) {
        const simpleName = templateName.replace('-template', '').replace('mcp-server-', '').replace('-mcp-', '-');
        const isDocumented = indexContent.includes(templateName) ||
                            indexContent.includes(simpleName);

        if (!isDocumented) {
          issues.push({
            severity: 'warning',
            category: 'template_inventory',
            file: indexFile,
            expected: `Template ${templateName} listed in inventory`,
            actual: `Template ${templateName} not found in documentation`,
            suggestion: `Add ${templateName} to the template listing in ${indexFile}`,
          });
        }
      }

    } catch (error) {
      issues.push({
        severity: 'critical',
        category: 'template_inventory',
        file: 'system',
        expected: 'Successful template inventory validation',
        actual: `Error: ${error}`,
        suggestion: 'Check that templates directory exists and is readable',
      });
    }

    return issues;
  }

  /**
   * Validation Rule 3: Status Accuracy
   * Checks archive/ vs active directories, validates documentation status references
   */
  private async validateStatusAccuracy(): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    try {
      // Check for archived MCPs
      const archivePath = path.join(this.projectRoot, 'archive', 'mcp-servers');
      let archivedMCPs: string[] = [];

      try {
        const dirs = await fs.readdir(archivePath, { withFileTypes: true });
        archivedMCPs = dirs.filter(d => d.isDirectory()).map(d => d.name);
      } catch {
        // Archive directory might not exist, which is fine
      }

      // Check WORKSPACE_ARCHITECTURE.md for references to archived MCPs
      const archFile = 'WORKSPACE_ARCHITECTURE.md';
      const archPath = path.join(this.projectRoot, archFile);
      const archContent = await fs.readFile(archPath, 'utf-8');
      const archLines = archContent.split('\n');

      // Look for MCP headers (#### mcp-name)
      const mcpHeaderPattern = /^####\s+([a-z-]+)/;

      archLines.forEach((line, index) => {
        const match = line.match(mcpHeaderPattern);
        if (match) {
          const mcpName = match[1];

          // Check if this MCP is archived but listed as active
          for (const archivedName of archivedMCPs) {
            if (archivedName.includes(mcpName) || mcpName.includes(archivedName.replace('-project', ''))) {
              issues.push({
                severity: 'warning',
                category: 'status_accuracy',
                file: archFile,
                line: index + 1,
                expected: `${mcpName} marked as archived or removed from active listing`,
                actual: `${mcpName} listed in active MCPs section`,
                suggestion: `Remove ${mcpName} from active MCP listings or add (archived) note at line ${index + 1}`,
              });
            }
          }
        }
      });

    } catch (error) {
      issues.push({
        severity: 'info',
        category: 'status_accuracy',
        file: 'system',
        expected: 'Successful status accuracy validation',
        actual: `Error: ${error}`,
        suggestion: 'Check that archive directory structure exists',
      });
    }

    return issues;
  }

  /**
   * Validation Rule 4: Cross-References
   * Checks file paths, MCP names, links are accurate
   */
  private async validateCrossReferences(): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    try {
      // Check key documentation files
      const docsToCheck = [
        'WORKSPACE_GUIDE.md',
        'WORKSPACE_ARCHITECTURE.md',
        'templates-and-patterns/mcp-server-templates/TEMPLATES_INDEX.md',
      ];

      for (const docFile of docsToCheck) {
        const docPath = path.join(this.projectRoot, docFile);
        const content = await fs.readFile(docPath, 'utf-8');
        const lines = content.split('\n');

        // Check for relative path references
        const pathPattern = /`?([a-z-]+\/[a-z-\/]+\.(md|ts|js|json))`?/gi;

        lines.forEach((line, index) => {
          let match;
          while ((match = pathPattern.exec(line)) !== null) {
            const referencedPath = match[1];

            // Skip if it's clearly not a file path
            if (referencedPath.includes('://') || referencedPath.startsWith('http')) {
              continue;
            }

            // Check if referenced file exists
            const fullPath = path.join(this.projectRoot, referencedPath);
            fs.access(fullPath).catch(() => {
              issues.push({
                severity: 'info',
                category: 'cross_references',
                file: docFile,
                line: index + 1,
                expected: `File exists at ${referencedPath}`,
                actual: `File not found: ${referencedPath}`,
                suggestion: `Verify path at line ${index + 1} or update to correct location`,
              });
            });
          }
        });
      }

    } catch (error) {
      issues.push({
        severity: 'info',
        category: 'cross_references',
        file: 'system',
        expected: 'Successful cross-reference validation',
        actual: `Error: ${error}`,
        suggestion: 'Check that documentation files exist and are readable',
      });
    }

    return issues;
  }
}
