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
export declare class ConfigurableWorkspaceAdapter {
    private config;
    private workspaceRoot;
    private documentationFiles;
    private frameworkPaths;
    private constructor();
    /**
     * Create and initialize a workspace adapter
     */
    static create(workspaceRoot: string): Promise<ConfigurableWorkspaceAdapter>;
    /**
     * Auto-detect workspace values and replace {{AUTO_DETECT:*}} placeholders
     */
    private static autoDetectConfig;
    private static detectWorkspaceType;
    private static detectWorkspaceMaturity;
    private static pathExists;
    private static findDocumentationFiles;
    /**
     * Initialize the adapter by scanning for documentation files and frameworks
     */
    private initialize;
    /**
     * Get the full configuration
     */
    getConfig(): WorkspaceConfig;
    /**
     * Get workspace root path
     */
    getWorkspaceRoot(): string;
    /**
     * Get all documentation file paths
     */
    getDocumentationFiles(): string[];
    /**
     * Get all framework paths
     */
    getFrameworkPaths(): string[];
    /**
     * Check if a file is a critical doc (should never be auto-archived)
     */
    isCriticalDoc(filePath: string): boolean;
    /**
     * Check if a file matches any framework indicator patterns
     */
    isFrameworkFile(filePath: string): Promise<{
        match: boolean;
        weight: number;
        reason?: string;
    }>;
    /**
     * Check if a file should be exempt from staleness checks
     */
    isStalenessExempt(filePath: string): boolean;
    /**
     * Get absolute path for a relative workspace path
     */
    getAbsolutePath(relativePath: string): string;
    /**
     * Get relative path from workspace root
     */
    getRelativePath(absolutePath: string): string;
}
