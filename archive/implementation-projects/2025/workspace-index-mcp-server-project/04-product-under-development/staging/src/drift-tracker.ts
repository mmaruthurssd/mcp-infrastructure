import { promises as fs } from 'fs';
import path from 'path';

export interface WorkspaceSnapshot {
  timestamp: string;
  mcpCount: {
    active: number;
    library: number;
    total: number;
    names: string[];
  };
  templateCount: {
    total: number;
    names: string[];
  };
  projectCount: {
    development: number;
    names: string[];
  };
}

export interface DriftChange {
  category: 'mcps' | 'templates' | 'projects' | 'documentation';
  type: 'added' | 'removed' | 'modified' | 'renamed';
  path: string;
  details: string;
}

export interface DriftResult {
  driftDetected: boolean;
  since: string;
  changes: DriftChange[];
  affectedDocumentation: string[];
  recommendedAction: string;
}

export class DriftTracker {
  private stateFilePath: string;

  constructor(private projectRoot: string) {
    this.stateFilePath = path.join(projectRoot, '.workspace-index-state.json');
  }

  /**
   * Save current workspace state as baseline
   */
  async saveBaseline(): Promise<WorkspaceSnapshot> {
    const snapshot = await this.captureSnapshot();
    await fs.writeFile(this.stateFilePath, JSON.stringify(snapshot, null, 2), 'utf-8');
    return snapshot;
  }

  /**
   * Load last saved baseline
   */
  async loadBaseline(): Promise<WorkspaceSnapshot | null> {
    try {
      const content = await fs.readFile(this.stateFilePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Capture current workspace state
   */
  private async captureSnapshot(): Promise<WorkspaceSnapshot> {
    // Scan MCPs
    const mcpPath = path.join(this.projectRoot, 'local-instances', 'mcp-servers');
    const mcpEntries = await fs.readdir(mcpPath, { withFileTypes: true });

    const mcpDirs: string[] = [];
    for (const entry of mcpEntries) {
      if (entry.isDirectory()) {
        mcpDirs.push(entry.name);
      } else if (entry.isSymbolicLink()) {
        try {
          const targetPath = path.join(mcpPath, entry.name);
          const stats = await fs.stat(targetPath);
          if (stats.isDirectory()) {
            mcpDirs.push(entry.name);
          }
        } catch {
          // Broken symlink, skip
        }
      }
    }

    const libraryMCPs = ['workflow-orchestrator-mcp-server'];
    const activeMCPs = mcpDirs.filter(name => !libraryMCPs.includes(name));

    // Scan templates
    const templatesPath = path.join(
      this.projectRoot,
      'templates-and-patterns',
      'mcp-server-templates',
      'templates'
    );
    const templateEntries = await fs.readdir(templatesPath, { withFileTypes: true });
    const templateDirs = templateEntries.filter(d => d.isDirectory()).map(d => d.name);

    // Scan development projects
    const devPath = path.join(this.projectRoot, 'development', 'mcp-servers');
    const devEntries = await fs.readdir(devPath, { withFileTypes: true });
    const devProjects = devEntries.filter(d => d.isDirectory()).map(d => d.name);

    return {
      timestamp: new Date().toISOString(),
      mcpCount: {
        active: activeMCPs.length,
        library: libraryMCPs.length,
        total: mcpDirs.length,
        names: mcpDirs.sort(),
      },
      templateCount: {
        total: templateDirs.length,
        names: templateDirs.sort(),
      },
      projectCount: {
        development: devProjects.length,
        names: devProjects.sort(),
      },
    };
  }

  /**
   * Track documentation drift since last baseline
   */
  async trackDrift(options: {
    since?: string | 'last-validation';
    categories?: Array<'mcps' | 'templates' | 'projects' | 'all'>;
    includeMinorChanges?: boolean;
  } = {}): Promise<DriftResult> {
    const categories = options.categories || ['all'];
    const shouldCheck = (cat: string) =>
      categories.includes('all') || categories.includes(cat as any);

    // Load baseline
    const baseline = await this.loadBaseline();
    if (!baseline) {
      return {
        driftDetected: false,
        since: 'never',
        changes: [],
        affectedDocumentation: [],
        recommendedAction: 'Run validate_workspace_documentation() to establish baseline',
      };
    }

    // Capture current state
    const current = await this.captureSnapshot();

    // Detect changes
    const changes: DriftChange[] = [];
    const affectedDocs = new Set<string>();

    if (shouldCheck('mcps')) {
      // Detect MCP changes
      const added = current.mcpCount.names.filter(name => !baseline.mcpCount.names.includes(name));
      const removed = baseline.mcpCount.names.filter(name => !current.mcpCount.names.includes(name));

      for (const name of added) {
        changes.push({
          category: 'mcps',
          type: 'added',
          path: `local-instances/mcp-servers/${name}`,
          details: `New MCP server: ${name}`,
        });
        affectedDocs.add('WORKSPACE_GUIDE.md');
        affectedDocs.add('WORKSPACE_ARCHITECTURE.md');
      }

      for (const name of removed) {
        changes.push({
          category: 'mcps',
          type: 'removed',
          path: `local-instances/mcp-servers/${name}`,
          details: `MCP server removed: ${name}`,
        });
        affectedDocs.add('WORKSPACE_GUIDE.md');
        affectedDocs.add('WORKSPACE_ARCHITECTURE.md');
      }
    }

    if (shouldCheck('templates')) {
      // Detect template changes
      const added = current.templateCount.names.filter(name => !baseline.templateCount.names.includes(name));
      const removed = baseline.templateCount.names.filter(name => !current.templateCount.names.includes(name));

      for (const name of added) {
        changes.push({
          category: 'templates',
          type: 'added',
          path: `templates-and-patterns/mcp-server-templates/templates/${name}`,
          details: `New template: ${name}`,
        });
        affectedDocs.add('templates-and-patterns/mcp-server-templates/TEMPLATES_INDEX.md');
      }

      for (const name of removed) {
        changes.push({
          category: 'templates',
          type: 'removed',
          path: `templates-and-patterns/mcp-server-templates/templates/${name}`,
          details: `Template removed: ${name}`,
        });
        affectedDocs.add('templates-and-patterns/mcp-server-templates/TEMPLATES_INDEX.md');
      }
    }

    if (shouldCheck('projects')) {
      // Detect development project changes
      const added = current.projectCount.names.filter(name => !baseline.projectCount.names.includes(name));
      const removed = baseline.projectCount.names.filter(name => !current.projectCount.names.includes(name));

      for (const name of added) {
        changes.push({
          category: 'projects',
          type: 'added',
          path: `development/mcp-servers/${name}`,
          details: `New development project: ${name}`,
        });
        if (options.includeMinorChanges) {
          affectedDocs.add('WORKSPACE_GUIDE.md');
        }
      }

      for (const name of removed) {
        changes.push({
          category: 'projects',
          type: 'removed',
          path: `development/mcp-servers/${name}`,
          details: `Development project removed: ${name}`,
        });
        if (options.includeMinorChanges) {
          affectedDocs.add('WORKSPACE_GUIDE.md');
        }
      }
    }

    // Determine recommended action
    let recommendedAction = '';
    if (changes.length === 0) {
      recommendedAction = 'No drift detected. Documentation is up to date.';
    } else if (changes.length <= 2) {
      recommendedAction = 'Minor drift detected. Review changes and update documentation if needed.';
    } else if (changes.length <= 5) {
      recommendedAction = 'Moderate drift detected. Run validate_workspace_documentation() and consider auto-fix.';
    } else {
      recommendedAction = 'Major drift detected. Run validate_workspace_documentation() with autoFix: true.';
    }

    return {
      driftDetected: changes.length > 0,
      since: baseline.timestamp,
      changes,
      affectedDocumentation: Array.from(affectedDocs),
      recommendedAction,
    };
  }
}
