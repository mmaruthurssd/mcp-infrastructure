import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
/**
 * Configurable workspace adapter that loads configuration and provides
 * workspace structure information for Phase 4 autonomous documentation management.
 */
export class ConfigurableWorkspaceAdapter {
    config;
    workspaceRoot;
    documentationFiles = [];
    frameworkPaths = [];
    constructor(workspaceRoot, config) {
        this.workspaceRoot = workspaceRoot;
        this.config = config;
    }
    /**
     * Create and initialize a workspace adapter
     */
    static async create(workspaceRoot) {
        const configPath = path.join(workspaceRoot, 'workspace-index-config.json');
        let rawConfig;
        try {
            const configContent = await fs.readFile(configPath, 'utf-8');
            rawConfig = JSON.parse(configContent);
        }
        catch (error) {
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
    static async autoDetectConfig(workspaceRoot, rawConfig) {
        const config = JSON.parse(JSON.stringify(rawConfig)); // Deep clone
        // Helper to replace AUTO_DETECT placeholders
        const replacePlaceholders = async (obj) => {
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
            }
            else if (Array.isArray(obj)) {
                return Promise.all(obj.map(replacePlaceholders));
            }
            else if (typeof obj === 'object' && obj !== null) {
                const result = {};
                for (const [key, value] of Object.entries(obj)) {
                    if (key.startsWith('_'))
                        continue; // Skip comment fields
                    result[key] = await replacePlaceholders(value);
                }
                return result;
            }
            return obj;
        };
        return await replacePlaceholders(config);
    }
    static async detectWorkspaceType(workspaceRoot) {
        const hasDevFolder = await ConfigurableWorkspaceAdapter.pathExists(path.join(workspaceRoot, 'development'));
        const hasMcpServers = await ConfigurableWorkspaceAdapter.pathExists(path.join(workspaceRoot, 'local-instances', 'mcp-servers'));
        if (hasDevFolder && hasMcpServers)
            return 'operations-workspace';
        if (hasMcpServers)
            return 'mcp-workspace';
        return 'general';
    }
    static async detectWorkspaceMaturity(workspaceRoot) {
        // Simple heuristic: count .telemetry events
        const telemetryPath = path.join(workspaceRoot, '.telemetry');
        try {
            const files = await fs.readdir(telemetryPath);
            const eventFiles = files.filter(f => f.endsWith('.jsonl'));
            if (eventFiles.length === 0)
                return 0;
            // Count total events
            let totalEvents = 0;
            for (const file of eventFiles) {
                const content = await fs.readFile(path.join(telemetryPath, file), 'utf-8');
                totalEvents += content.split('\n').filter(l => l.trim()).length;
            }
            // Maturity score: 0-1 based on event count (100+ events = mature)
            return Math.min(totalEvents / 100, 1.0);
        }
        catch {
            return 0; // New workspace
        }
    }
    static async pathExists(p) {
        try {
            await fs.access(p);
            return true;
        }
        catch {
            return false;
        }
    }
    static async findDocumentationFiles(workspaceRoot) {
        const patterns = [
            '**/README.md',
            '**/*GUIDE*.md',
            '**/*ARCHITECTURE*.md',
            '**/CONTRIBUTING.md',
            '**/SECURITY*.md',
            '**/*SPEC*.md',
            '**/*PLAN*.md'
        ];
        const results = [];
        for (const pattern of patterns) {
            try {
                const files = await glob(pattern, {
                    cwd: workspaceRoot,
                    ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
                    absolute: false
                });
                results.push(...files);
            }
            catch {
                // Ignore errors
            }
        }
        return [...new Set(results)]; // Deduplicate
    }
    /**
     * Initialize the adapter by scanning for documentation files and frameworks
     */
    async initialize() {
        // Find all documentation files
        const docRoots = this.config.workspace_structure.documentation_roots;
        if (typeof docRoots === 'string') {
            this.documentationFiles = [docRoots];
        }
        else if (Array.isArray(docRoots)) {
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
            }
            catch {
                // Framework dir doesn't exist, that's ok
            }
        }
    }
    /**
     * Get the full configuration
     */
    getConfig() {
        return this.config;
    }
    /**
     * Get workspace root path
     */
    getWorkspaceRoot() {
        return this.workspaceRoot;
    }
    /**
     * Get all documentation file paths
     */
    getDocumentationFiles() {
        return this.documentationFiles;
    }
    /**
     * Get all framework paths
     */
    getFrameworkPaths() {
        return this.frameworkPaths;
    }
    /**
     * Check if a file is a critical doc (should never be auto-archived)
     */
    isCriticalDoc(filePath) {
        const basename = path.basename(filePath);
        return this.config.workspace_structure.critical_docs.includes(basename);
    }
    /**
     * Check if a file matches any framework indicator patterns
     */
    async isFrameworkFile(filePath) {
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
    isStalenessExempt(filePath) {
        const basename = path.basename(filePath);
        return this.config.detection_patterns.staleness_exemptions.includes(basename);
    }
    /**
     * Get absolute path for a relative workspace path
     */
    getAbsolutePath(relativePath) {
        return path.join(this.workspaceRoot, relativePath);
    }
    /**
     * Get relative path from workspace root
     */
    getRelativePath(absolutePath) {
        return path.relative(this.workspaceRoot, absolutePath);
    }
}
