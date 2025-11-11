import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

export interface WorkspaceConfig {
  version: string;
  workspace: {
    name: string;
    root: string;
    type: string;
  };
  workspace_structure: {
    development_dir: string;
    production_dir: string;
    archive_dir: string;
    frameworks_dir: string;
    templates_dir: string;
    documentation_roots: string | string[];
    critical_docs: string[];
  };
  detection_patterns: {
    supersession_keywords: string[];
    framework_indicators: Array<{
      path_pattern?: string;
      file_pattern?: string;
      weight: number;
      description: string;
    }>;
    redundancy_threshold: number;
    staleness_months: number;
    staleness_exemptions: string[];
  };
  confidence_weights: {
    patternMatch: number;
    historicalSuccess: number;
    complexityPenalty: number;
    reversibility: number;
    contextClarity: number;
  };
  thresholds: {
    auto_execute: number;
    assisted_mode_min: number;
    report_only_max: number;
  };
  automation: {
    auto_execute_enabled: boolean;
    require_approval_first_time: boolean;
    enable_scheduled_scans: boolean;
    scheduled_scan_cron: string;
    enable_git_hooks: boolean;
    enable_post_operation_hooks: boolean;
  };
  learning: {
    enable_workspace_brain_integration: boolean;
    pattern_export_path: string;
    auto_import_patterns_on_startup: boolean;
    confidence_adjustment_magnitude: number;
    min_operations_before_learning: number;
  };
  performance: {
    cache_ttl_seconds: number;
    incremental_scan_enabled: boolean;
    parallel_processing_enabled: boolean;
    max_scan_time_seconds: number;
    max_parallel_operations: number;
  };
  templates: {
    replacement_after_archival: string;
    consolidated_doc: string;
    framework_overview: string;
  };
  operations: {
    backup_before_operations: boolean;
    backup_path_template: string;
    dry_run_by_default: boolean;
    validate_markdown_syntax: boolean;
    validate_links: boolean;
    git_commit_operations: boolean;
    git_commit_message_template: string;
  };
  integrations: {
    workspace_brain: {
      enabled: boolean;
      event_type: string;
      log_all_operations: boolean;
      log_failed_operations: boolean;
    };
    project_management: {
      enabled: boolean;
      trigger_after_wrap_up: boolean;
      trigger_after_archive: boolean;
    };
    learning_optimizer: {
      enabled: boolean;
      track_as_domain: string;
      promote_frequent_issues: boolean;
      frequency_threshold: number;
    };
  };
  logging: {
    level: string;
    log_operations: boolean;
    log_detections: boolean;
    log_performance: boolean;
    log_file: string;
  };
}

/**
 * Configurable workspace adapter that loads configuration and provides
 * workspace structure information for Phase 4 autonomous documentation management.
 */
export class ConfigurableWorkspaceAdapter {
  private config: WorkspaceConfig;
  private workspaceRoot: string;
  private documentationFiles: string[] = [];
  private frameworkPaths: string[] = [];

  private constructor(workspaceRoot: string, config: WorkspaceConfig) {
    this.workspaceRoot = workspaceRoot;
    this.config = config;
  }

  /**
   * Create and initialize a workspace adapter
   */
  static async create(workspaceRoot: string): Promise<ConfigurableWorkspaceAdapter> {
    const configPath = path.join(workspaceRoot, 'workspace-index-config.json');

    let rawConfig: any;
    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      rawConfig = JSON.parse(configContent);
    } catch (error) {
      throw new Error(`Failed to load workspace-index-config.json: ${error}`);
    }

    // Auto-detect and replace placeholders
    const config = await ConfigurableWorkspaceAdapter.autoDetectConfig(workspaceRoot, rawConfig);

    const adapter = new ConfigurableWorkspaceAdapter(workspaceRoot, config);
    await adapter.initialize();

    return adapter;
  }

  /**
   * Auto-detect workspace values and replace {{AUTO_DETECT:*}} placeholders
   */
  private static async autoDetectConfig(
    workspaceRoot: string,
    rawConfig: any
  ): Promise<WorkspaceConfig> {
    const config = JSON.parse(JSON.stringify(rawConfig)); // Deep clone

    // Helper to replace AUTO_DETECT placeholders
    const replacePlaceholders = async (obj: any): Promise<any> => {
      if (typeof obj === 'string') {
        // Replace {{AUTO_DETECT:workspace_name}}
        if (obj.includes('{{AUTO_DETECT:workspace_name}}')) {
          return obj.replace('{{AUTO_DETECT:workspace_name}}', path.basename(workspaceRoot));
        }
        // Replace {{AUTO_DETECT:workspace_root}}
        if (obj.includes('{{AUTO_DETECT:workspace_root}}')) {
          return obj.replace('{{AUTO_DETECT:workspace_root}}', workspaceRoot);
        }
        // Replace {{AUTO_DETECT:workspace_type}}
        if (obj.includes('{{AUTO_DETECT:workspace_type}}')) {
          // Detect type based on structure
          const type = await ConfigurableWorkspaceAdapter.detectWorkspaceType(workspaceRoot);
          return obj.replace('{{AUTO_DETECT:workspace_type}}', type);
        }
        // Replace {{AUTO_DETECT:maturity_threshold}}
        if (obj.includes('{{AUTO_DETECT:maturity_threshold}}')) {
          // New workspace: 0.95, mature: 0.85
          const maturity = await ConfigurableWorkspaceAdapter.detectWorkspaceMaturity(workspaceRoot);
          return obj.replace('{{AUTO_DETECT:maturity_threshold}}', maturity >= 0.7 ? '0.85' : '0.95');
        }
        // Replace {{AUTO_DETECT:maturity}}
        if (obj.includes('{{AUTO_DETECT:maturity}}')) {
          const maturity = await ConfigurableWorkspaceAdapter.detectWorkspaceMaturity(workspaceRoot);
          return obj.replace('{{AUTO_DETECT:maturity}}', maturity >= 0.7 ? 'mature' : 'new');
        }
        // Replace {{AUTO_DETECT:timestamp}}
        if (obj.includes('{{AUTO_DETECT:timestamp}}')) {
          return obj.replace('{{AUTO_DETECT:timestamp}}', new Date().toISOString());
        }
        // Replace directory detection patterns like {{AUTO_DETECT:development/}}
        const dirMatch = obj.match(/{{AUTO_DETECT:([^}]+)\/?}}/);
        if (dirMatch) {
          const dir = dirMatch[1].replace(/\/$/, '');
          const exists = await ConfigurableWorkspaceAdapter.pathExists(path.join(workspaceRoot, dir));
          return exists ? dir : '';
        }
        // Replace {{AUTO_DETECT:documentation_files}}
        if (obj.includes('{{AUTO_DETECT:documentation_files}}')) {
          const docs = await ConfigurableWorkspaceAdapter.findDocumentationFiles(workspaceRoot);
          return docs;
        }
        return obj;
      } else if (Array.isArray(obj)) {
        return Promise.all(obj.map(replacePlaceholders));
      } else if (typeof obj === 'object' && obj !== null) {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (key.startsWith('_')) continue; // Skip comment fields
          result[key] = await replacePlaceholders(value);
        }
        return result;
      }
      return obj;
    };

    return await replacePlaceholders(config);
  }

  private static async detectWorkspaceType(workspaceRoot: string): Promise<string> {
    const hasDevFolder = await ConfigurableWorkspaceAdapter.pathExists(
      path.join(workspaceRoot, 'development')
    );
    const hasMcpServers = await ConfigurableWorkspaceAdapter.pathExists(
      path.join(workspaceRoot, 'local-instances', 'mcp-servers')
    );

    if (hasDevFolder && hasMcpServers) return 'medical-practice-workspace';
    if (hasMcpServers) return 'mcp-workspace';
    return 'general';
  }

  private static async detectWorkspaceMaturity(workspaceRoot: string): Promise<number> {
    // Simple heuristic: count .telemetry events
    const telemetryPath = path.join(workspaceRoot, '.telemetry');
    try {
      const files = await fs.readdir(telemetryPath);
      const eventFiles = files.filter(f => f.endsWith('.jsonl'));
      if (eventFiles.length === 0) return 0;

      // Count total events
      let totalEvents = 0;
      for (const file of eventFiles) {
        const content = await fs.readFile(path.join(telemetryPath, file), 'utf-8');
        totalEvents += content.split('\n').filter(l => l.trim()).length;
      }

      // Maturity score: 0-1 based on event count (100+ events = mature)
      return Math.min(totalEvents / 100, 1.0);
    } catch {
      return 0; // New workspace
    }
  }

  private static async pathExists(p: string): Promise<boolean> {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }

  private static async findDocumentationFiles(workspaceRoot: string): Promise<string[]> {
    const patterns = [
      '**/README.md',
      '**/*GUIDE*.md',
      '**/*ARCHITECTURE*.md',
      '**/CONTRIBUTING.md',
      '**/SECURITY*.md',
      '**/*SPEC*.md',
      '**/*PLAN*.md'
    ];

    const results: string[] = [];
    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, {
          cwd: workspaceRoot,
          ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
          absolute: false
        });
        results.push(...files);
      } catch {
        // Ignore errors
      }
    }

    return [...new Set(results)]; // Deduplicate
  }

  /**
   * Initialize the adapter by scanning for documentation files and frameworks
   */
  private async initialize(): Promise<void> {
    // Find all documentation files
    const docRoots = this.config.workspace_structure.documentation_roots;
    if (typeof docRoots === 'string') {
      this.documentationFiles = [docRoots];
    } else if (Array.isArray(docRoots)) {
      this.documentationFiles = docRoots;
    }

    // Find all frameworks
    const frameworksDir = this.config.workspace_structure.frameworks_dir;
    if (frameworksDir) {
      try {
        const frameworkDirPath = path.join(this.workspaceRoot, frameworksDir);
        const exists = await ConfigurableWorkspaceAdapter.pathExists(frameworkDirPath);
        if (exists) {
          const entries = await fs.readdir(frameworkDirPath, { withFileTypes: true });
          this.frameworkPaths = entries
            .filter(e => e.isDirectory())
            .map(e => path.join(frameworksDir, e.name));
        }
      } catch {
        // Framework dir doesn't exist, that's ok
      }
    }
  }

  /**
   * Get the full configuration
   */
  getConfig(): WorkspaceConfig {
    return this.config;
  }

  /**
   * Get workspace root path
   */
  getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  /**
   * Get all documentation file paths
   */
  getDocumentationFiles(): string[] {
    return this.documentationFiles;
  }

  /**
   * Get all framework paths
   */
  getFrameworkPaths(): string[] {
    return this.frameworkPaths;
  }

  /**
   * Check if a file is a critical doc (should never be auto-archived)
   */
  isCriticalDoc(filePath: string): boolean {
    const basename = path.basename(filePath);
    return this.config.workspace_structure.critical_docs.includes(basename);
  }

  /**
   * Check if a file matches any framework indicator patterns
   */
  async isFrameworkFile(filePath: string): Promise<{ match: boolean; weight: number; reason?: string }> {
    const indicators = this.config.detection_patterns.framework_indicators;

    for (const indicator of indicators) {
      if (indicator.path_pattern) {
        // Convert glob pattern to regex
        const pattern = indicator.path_pattern.replace(/\*/g, '.*');
        const regex = new RegExp(pattern);
        if (regex.test(filePath)) {
          return { match: true, weight: indicator.weight, reason: indicator.description };
        }
      }

      if (indicator.file_pattern) {
        const basename = path.basename(filePath);
        const pattern = indicator.file_pattern.replace(/\*/g, '.*');
        const regex = new RegExp(pattern);
        if (regex.test(basename)) {
          return { match: true, weight: indicator.weight, reason: indicator.description };
        }
      }
    }

    return { match: false, weight: 0 };
  }

  /**
   * Check if a file should be exempt from staleness checks
   */
  isStalenessExempt(filePath: string): boolean {
    const basename = path.basename(filePath);
    return this.config.detection_patterns.staleness_exemptions.includes(basename);
  }

  /**
   * Get absolute path for a relative workspace path
   */
  getAbsolutePath(relativePath: string): string {
    return path.join(this.workspaceRoot, relativePath);
  }

  /**
   * Get relative path from workspace root
   */
  getRelativePath(absolutePath: string): string {
    return path.relative(this.workspaceRoot, absolutePath);
  }
}
