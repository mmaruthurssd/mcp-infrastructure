/**
 * StandardsValidator Utility
 *
 * Validates MCP implementations against workspace standards:
 * - File structure (8-folder system)
 * - Naming conventions (kebab-case)
 * - Documentation standards (YAML frontmatter, required sections)
 * - Code standards (TypeScript, proper exports)
 * - MCP standards (tool schemas, SDK usage)
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
export class StandardsValidator {
    mcpPath;
    standards;
    constructor(mcpPath, standards) {
        this.mcpPath = mcpPath;
        this.standards = standards || ['fileStructure', 'naming', 'documentation', 'code', 'mcp'];
    }
    /**
     * Validate MCP implementation
     */
    async validate() {
        try {
            // Check if path exists
            if (!existsSync(this.mcpPath)) {
                return {
                    success: false,
                    compliance: this.createEmptyCompliance(),
                    recommendations: [],
                    error: `MCP path does not exist: ${this.mcpPath}`,
                };
            }
            const results = {};
            // Run validation for each standard
            if (this.standards.includes('fileStructure')) {
                results.fileStructure = this.validateFileStructure();
            }
            if (this.standards.includes('naming')) {
                results.naming = this.validateNaming();
            }
            if (this.standards.includes('documentation')) {
                results.documentation = this.validateDocumentation();
            }
            if (this.standards.includes('code')) {
                results.code = this.validateCode();
            }
            if (this.standards.includes('mcp')) {
                results.mcp = this.validateMcpStandards();
            }
            // Calculate overall compliance
            const totalPassed = Object.values(results).reduce((sum, r) => sum + r.passed, 0);
            const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0);
            const totalChecks = totalPassed + totalFailed;
            const overallCompliance = totalChecks > 0 ? Math.round((totalPassed / totalChecks) * 100) : 0;
            // Generate recommendations
            const recommendations = this.generateRecommendations(results);
            return {
                success: true,
                compliance: {
                    overall: overallCompliance,
                    categories: results,
                },
                recommendations,
            };
        }
        catch (error) {
            return {
                success: false,
                compliance: this.createEmptyCompliance(),
                recommendations: [],
                error: `Validation failed: ${error}`,
            };
        }
    }
    /**
     * Validate file structure (8-folder system)
     */
    validateFileStructure() {
        const issues = [];
        let passed = 0;
        let failed = 0;
        const requiredFolders = [
            '01-planning',
            '02-goals-and-roadmap',
            '03-resources-docs-assets-tools',
            '04-product-under-development',
            '05-brainstorming',
            '08-archive',
        ];
        const requiredFiles = ['README.md', 'EVENT-LOG.md', 'NEXT-STEPS.md'];
        // Check required folders
        for (const folder of requiredFolders) {
            const folderPath = join(this.mcpPath, folder);
            if (existsSync(folderPath)) {
                passed++;
            }
            else {
                failed++;
                issues.push({
                    severity: 'error',
                    message: `Required folder missing: ${folder}`,
                    recommendation: `Create ${folder}/ directory`,
                });
            }
        }
        // Check required files
        for (const file of requiredFiles) {
            const filePath = join(this.mcpPath, file);
            if (existsSync(filePath)) {
                passed++;
            }
            else {
                failed++;
                issues.push({
                    severity: 'error',
                    message: `Required file missing: ${file}`,
                    recommendation: `Create ${file} in project root`,
                });
            }
        }
        // Check dev-instance location
        const devInstancePath = join(this.mcpPath, '04-product-under-development', 'dev-instance');
        if (existsSync(devInstancePath)) {
            passed++;
        }
        else {
            failed++;
            issues.push({
                severity: 'error',
                message: 'dev-instance/ not found in 04-product-under-development/',
                recommendation: 'Create dev-instance/ directory in 04-product-under-development/',
            });
        }
        const totalChecks = requiredFolders.length + requiredFiles.length + 1;
        const score = totalChecks > 0 ? Math.round((passed / totalChecks) * 100) : 0;
        return { passed, failed, score, issues };
    }
    /**
     * Validate naming conventions
     */
    validateNaming() {
        const issues = [];
        let passed = 0;
        let failed = 0;
        // Check file naming conventions
        const checkNaming = (dirPath, depth = 0) => {
            if (depth > 3)
                return; // Limit recursion depth
            try {
                const entries = readdirSync(dirPath);
                for (const entry of entries) {
                    const fullPath = join(dirPath, entry);
                    const stat = statSync(fullPath);
                    // Skip node_modules, dist, coverage
                    if (entry === 'node_modules' || entry === 'dist' || entry === 'coverage') {
                        continue;
                    }
                    // Check file naming
                    if (stat.isFile()) {
                        const ext = extname(entry);
                        const baseName = basename(entry, ext);
                        // TypeScript/JavaScript files should be kebab-case or camelCase
                        if (['.ts', '.js', '.tsx', '.jsx'].includes(ext)) {
                            const isKebabCase = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(baseName);
                            const isCamelCase = /^[a-z][a-zA-Z0-9]*$/.test(baseName);
                            if (isKebabCase || isCamelCase) {
                                passed++;
                            }
                            else {
                                failed++;
                                issues.push({
                                    severity: 'warning',
                                    message: `File naming convention violation: ${entry}`,
                                    file: fullPath.replace(this.mcpPath, ''),
                                    recommendation: 'Use kebab-case or camelCase for TypeScript/JavaScript files',
                                });
                            }
                        }
                        // Markdown files should be UPPERCASE or kebab-case
                        if (ext === '.md') {
                            const isUppercase = /^[A-Z][A-Z0-9_-]*$/.test(baseName);
                            const isKebabCase = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(baseName);
                            if (isUppercase || isKebabCase) {
                                passed++;
                            }
                            else {
                                failed++;
                                issues.push({
                                    severity: 'warning',
                                    message: `Markdown file naming violation: ${entry}`,
                                    file: fullPath.replace(this.mcpPath, ''),
                                    recommendation: 'Use UPPERCASE or kebab-case for markdown files',
                                });
                            }
                        }
                    }
                    else if (stat.isDirectory()) {
                        // Directories should be kebab-case or have numbers
                        const isValid = /^[a-z0-9][a-z0-9-]*$/.test(entry) || /^\d{2}-[a-z-]+$/.test(entry);
                        if (isValid) {
                            passed++;
                        }
                        else {
                            failed++;
                            issues.push({
                                severity: 'warning',
                                message: `Directory naming violation: ${entry}`,
                                file: fullPath.replace(this.mcpPath, ''),
                                recommendation: 'Use kebab-case for directory names',
                            });
                        }
                        // Recurse into subdirectories
                        checkNaming(fullPath, depth + 1);
                    }
                }
            }
            catch (error) {
                // Skip directories we can't read
            }
        };
        checkNaming(this.mcpPath);
        const score = (passed + failed) > 0 ? Math.round((passed / (passed + failed)) * 100) : 100;
        return { passed, failed, score, issues };
    }
    /**
     * Validate documentation standards
     */
    validateDocumentation() {
        const issues = [];
        let passed = 0;
        let failed = 0;
        // Check README.md
        const readmePath = join(this.mcpPath, 'README.md');
        if (existsSync(readmePath)) {
            const content = readFileSync(readmePath, 'utf-8');
            // Check for YAML frontmatter
            if (content.startsWith('---')) {
                passed++;
            }
            else {
                failed++;
                issues.push({
                    severity: 'warning',
                    message: 'README.md missing YAML frontmatter',
                    file: 'README.md',
                    recommendation: 'Add YAML frontmatter with type, tags, etc.',
                });
            }
            // Check for required sections
            const requiredSections = ['Overview', 'Project Structure', 'Development Workflow'];
            for (const section of requiredSections) {
                if (content.includes(`## ${section}`)) {
                    passed++;
                }
                else {
                    failed++;
                    issues.push({
                        severity: 'info',
                        message: `README.md missing section: ${section}`,
                        file: 'README.md',
                        recommendation: `Add ## ${section} section`,
                    });
                }
            }
        }
        // Check SPECIFICATION.md if it exists
        const specPath = join(this.mcpPath, '01-planning', 'SPECIFICATION.md');
        if (existsSync(specPath)) {
            const content = readFileSync(specPath, 'utf-8');
            if (content.startsWith('---')) {
                passed++;
            }
            else {
                failed++;
                issues.push({
                    severity: 'warning',
                    message: 'SPECIFICATION.md missing YAML frontmatter',
                    file: '01-planning/SPECIFICATION.md',
                    recommendation: 'Add YAML frontmatter',
                });
            }
        }
        // Check all markdown files for frontmatter
        const checkMarkdownFiles = (dirPath) => {
            try {
                const entries = readdirSync(dirPath);
                for (const entry of entries) {
                    const fullPath = join(dirPath, entry);
                    const stat = statSync(fullPath);
                    if (entry === 'node_modules' || entry === 'dist' || entry === 'coverage') {
                        continue;
                    }
                    if (stat.isFile() && extname(entry) === '.md') {
                        const content = readFileSync(fullPath, 'utf-8');
                        if (content.startsWith('---')) {
                            passed++;
                        }
                        else {
                            // Only warning for project markdown files, not dev-instance
                            if (!fullPath.includes('dev-instance')) {
                                failed++;
                                issues.push({
                                    severity: 'info',
                                    message: `Markdown file missing YAML frontmatter: ${entry}`,
                                    file: fullPath.replace(this.mcpPath, ''),
                                    recommendation: 'Add YAML frontmatter',
                                });
                            }
                        }
                    }
                    else if (stat.isDirectory()) {
                        checkMarkdownFiles(fullPath);
                    }
                }
            }
            catch (error) {
                // Skip directories we can't read
            }
        };
        checkMarkdownFiles(this.mcpPath);
        const score = (passed + failed) > 0 ? Math.round((passed / (passed + failed)) * 100) : 100;
        return { passed, failed, score, issues };
    }
    /**
     * Validate code standards
     */
    validateCode() {
        const issues = [];
        let passed = 0;
        let failed = 0;
        const devInstancePath = join(this.mcpPath, '04-product-under-development', 'dev-instance');
        // Check if dev-instance exists
        if (!existsSync(devInstancePath)) {
            failed++;
            issues.push({
                severity: 'error',
                message: 'dev-instance/ directory not found',
                recommendation: 'Create dev-instance/ with src/ and tests/ directories',
            });
            return { passed, failed, score: 0, issues };
        }
        // Check for package.json
        const packageJsonPath = join(devInstancePath, 'package.json');
        if (existsSync(packageJsonPath)) {
            passed++;
            try {
                const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
                // Check for required scripts
                const requiredScripts = ['build', 'test'];
                for (const script of requiredScripts) {
                    if (packageJson.scripts && packageJson.scripts[script]) {
                        passed++;
                    }
                    else {
                        failed++;
                        issues.push({
                            severity: 'error',
                            message: `Missing required script in package.json: ${script}`,
                            file: 'package.json',
                            recommendation: `Add "${script}" script to package.json`,
                        });
                    }
                }
                // Check for @modelcontextprotocol/sdk dependency
                if (packageJson.dependencies && packageJson.dependencies['@modelcontextprotocol/sdk']) {
                    passed++;
                }
                else {
                    failed++;
                    issues.push({
                        severity: 'error',
                        message: 'Missing @modelcontextprotocol/sdk dependency',
                        file: 'package.json',
                        recommendation: 'Add @modelcontextprotocol/sdk to dependencies',
                    });
                }
            }
            catch (error) {
                failed++;
                issues.push({
                    severity: 'error',
                    message: 'package.json is not valid JSON',
                    file: 'package.json',
                });
            }
        }
        else {
            failed++;
            issues.push({
                severity: 'error',
                message: 'package.json not found in dev-instance/',
                file: 'dev-instance/package.json',
                recommendation: 'Create package.json',
            });
        }
        // Check for tsconfig.json
        const tsconfigPath = join(devInstancePath, 'tsconfig.json');
        if (existsSync(tsconfigPath)) {
            passed++;
        }
        else {
            failed++;
            issues.push({
                severity: 'error',
                message: 'tsconfig.json not found',
                file: 'dev-instance/tsconfig.json',
                recommendation: 'Create tsconfig.json for TypeScript configuration',
            });
        }
        // Check for src/ directory
        const srcPath = join(devInstancePath, 'src');
        if (existsSync(srcPath)) {
            passed++;
            // Check for server.ts
            const serverPath = join(srcPath, 'server.ts');
            if (existsSync(serverPath)) {
                passed++;
            }
            else {
                failed++;
                issues.push({
                    severity: 'error',
                    message: 'server.ts not found in src/',
                    file: 'src/server.ts',
                    recommendation: 'Create src/server.ts as MCP entry point',
                });
            }
            // Check for types.ts
            const typesPath = join(srcPath, 'types.ts');
            if (existsSync(typesPath)) {
                passed++;
            }
            else {
                failed++;
                issues.push({
                    severity: 'warning',
                    message: 'types.ts not found in src/',
                    file: 'src/types.ts',
                    recommendation: 'Create src/types.ts for type definitions',
                });
            }
        }
        else {
            failed++;
            issues.push({
                severity: 'error',
                message: 'src/ directory not found',
                file: 'src/',
                recommendation: 'Create src/ directory for source code',
            });
        }
        // Check for tests/ directory
        const testsPath = join(devInstancePath, 'tests');
        if (existsSync(testsPath)) {
            passed++;
        }
        else {
            failed++;
            issues.push({
                severity: 'warning',
                message: 'tests/ directory not found',
                file: 'tests/',
                recommendation: 'Create tests/ directory with unit/ and integration/ subdirectories',
            });
        }
        const score = (passed + failed) > 0 ? Math.round((passed / (passed + failed)) * 100) : 0;
        return { passed, failed, score, issues };
    }
    /**
     * Validate MCP standards
     */
    validateMcpStandards() {
        const issues = [];
        let passed = 0;
        let failed = 0;
        const devInstancePath = join(this.mcpPath, '04-product-under-development', 'dev-instance');
        const serverPath = join(devInstancePath, 'src', 'server.ts');
        if (!existsSync(serverPath)) {
            failed++;
            issues.push({
                severity: 'error',
                message: 'server.ts not found',
                recommendation: 'Create src/server.ts',
            });
            return { passed, failed, score: 0, issues };
        }
        try {
            const serverContent = readFileSync(serverPath, 'utf-8');
            // Check for @modelcontextprotocol/sdk imports
            if (serverContent.includes("from '@modelcontextprotocol/sdk")) {
                passed++;
            }
            else {
                failed++;
                issues.push({
                    severity: 'error',
                    message: 'Missing @modelcontextprotocol/sdk imports',
                    file: 'src/server.ts',
                    recommendation: 'Import Server and StdioServerTransport from @modelcontextprotocol/sdk',
                });
            }
            // Check for Server class usage
            if (serverContent.includes('new Server(')) {
                passed++;
            }
            else {
                failed++;
                issues.push({
                    severity: 'error',
                    message: 'Server class not instantiated',
                    file: 'src/server.ts',
                    recommendation: 'Create new Server() instance',
                });
            }
            // Check for ListToolsRequestSchema handler
            if (serverContent.includes('ListToolsRequestSchema')) {
                passed++;
            }
            else {
                failed++;
                issues.push({
                    severity: 'error',
                    message: 'Missing ListToolsRequestSchema handler',
                    file: 'src/server.ts',
                    recommendation: 'Add setRequestHandler for ListToolsRequestSchema',
                });
            }
            // Check for CallToolRequestSchema handler
            if (serverContent.includes('CallToolRequestSchema')) {
                passed++;
            }
            else {
                failed++;
                issues.push({
                    severity: 'error',
                    message: 'Missing CallToolRequestSchema handler',
                    file: 'src/server.ts',
                    recommendation: 'Add setRequestHandler for CallToolRequestSchema',
                });
            }
            // Check for StdioServerTransport
            if (serverContent.includes('StdioServerTransport')) {
                passed++;
            }
            else {
                failed++;
                issues.push({
                    severity: 'error',
                    message: 'Missing StdioServerTransport',
                    file: 'src/server.ts',
                    recommendation: 'Use StdioServerTransport for MCP communication',
                });
            }
            // Check for proper error handling
            if (serverContent.includes('.onerror')) {
                passed++;
            }
            else {
                failed++;
                issues.push({
                    severity: 'warning',
                    message: 'Missing error handler',
                    file: 'src/server.ts',
                    recommendation: 'Add server.onerror handler',
                });
            }
        }
        catch (error) {
            failed++;
            issues.push({
                severity: 'error',
                message: 'Failed to read server.ts',
                file: 'src/server.ts',
            });
        }
        const score = (passed + failed) > 0 ? Math.round((passed / (passed + failed)) * 100) : 0;
        return { passed, failed, score, issues };
    }
    /**
     * Generate recommendations based on validation results
     */
    generateRecommendations(results) {
        const recommendations = [];
        for (const [category, result] of Object.entries(results)) {
            if (result.score < 70) {
                recommendations.push(`${category}: Score ${result.score}% is below 70% threshold - review ${result.failed} failed checks`);
            }
            // Add top issues
            const errors = result.issues.filter((i) => i.severity === 'error').slice(0, 3);
            for (const error of errors) {
                if (error.recommendation) {
                    recommendations.push(`${category}: ${error.recommendation}`);
                }
            }
        }
        return recommendations;
    }
    /**
     * Create empty compliance structure
     */
    createEmptyCompliance() {
        const emptyCategory = { passed: 0, failed: 0, score: 0, issues: [] };
        return {
            overall: 0,
            categories: {
                fileStructure: emptyCategory,
                naming: emptyCategory,
                documentation: emptyCategory,
                code: emptyCategory,
                mcp: emptyCategory,
            },
        };
    }
}
//# sourceMappingURL=standards-validator.js.map