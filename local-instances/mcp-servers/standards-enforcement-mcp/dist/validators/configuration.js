import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
/**
 * Configuration Validator
 * Validates configuration files and settings
 */
/**
 * Validate MCP configuration
 */
export async function validateConfiguration(context) {
    const issues = [];
    const { targetPath, targetType, mcpName } = context;
    // Validate package.json
    const packageJsonIssues = await validatePackageJson(targetPath, mcpName);
    issues.push(...packageJsonIssues);
    // Validate tsconfig.json (if TypeScript project)
    const tsconfigIssues = await validateTsConfig(targetPath);
    issues.push(...tsconfigIssues);
    // Validate environment files
    const envIssues = await validateEnvironmentFiles(targetPath);
    issues.push(...envIssues);
    // For MCPs, validate registration in Claude config
    if (targetType === 'mcp' && mcpName) {
        const registrationIssues = await validateMcpRegistration(mcpName);
        issues.push(...registrationIssues);
    }
    return issues;
}
/**
 * Validate package.json
 */
async function validatePackageJson(projectPath, mcpName) {
    const issues = [];
    const packageJsonPath = path.join(projectPath, 'package.json');
    const exists = await fileExists(packageJsonPath);
    if (!exists) {
        return issues; // Checked by other validators
    }
    try {
        const content = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(content);
        // Validate required fields
        const requiredFields = ['name', 'version', 'description'];
        for (const field of requiredFields) {
            if (!packageJson[field]) {
                issues.push({
                    ruleId: 'config-001',
                    severity: 'critical',
                    message: `package.json missing required field: ${field}`,
                    location: { path: packageJsonPath },
                    suggestion: `Add "${field}" to package.json`,
                    autoFixAvailable: false,
                });
            }
        }
        // Validate name format (lowercase, no spaces)
        if (packageJson.name) {
            if (packageJson.name !== packageJson.name.toLowerCase()) {
                issues.push({
                    ruleId: 'config-002',
                    severity: 'warning',
                    message: 'package.json name should be lowercase',
                    location: { path: packageJsonPath },
                    suggestion: `Change name to "${packageJson.name.toLowerCase()}"`,
                    autoFixAvailable: true,
                });
            }
            if (packageJson.name.includes(' ')) {
                issues.push({
                    ruleId: 'config-003',
                    severity: 'critical',
                    message: 'package.json name contains spaces',
                    location: { path: packageJsonPath },
                    suggestion: 'Replace spaces with hyphens in package name',
                    autoFixAvailable: true,
                });
            }
            // If MCP name provided, validate it matches
            if (mcpName && packageJson.name !== mcpName) {
                issues.push({
                    ruleId: 'config-004',
                    severity: 'warning',
                    message: `package.json name "${packageJson.name}" does not match MCP name "${mcpName}"`,
                    location: { path: packageJsonPath },
                    suggestion: `Update package name to "${mcpName}"`,
                    autoFixAvailable: true,
                });
            }
        }
        // Validate version format (semantic versioning)
        if (packageJson.version && !/^\d+\.\d+\.\d+/.test(packageJson.version)) {
            issues.push({
                ruleId: 'config-005',
                severity: 'warning',
                message: 'package.json version does not follow semantic versioning',
                location: { path: packageJsonPath },
                suggestion: 'Use semantic versioning format (e.g., 1.0.0)',
                autoFixAvailable: false,
            });
        }
        // Validate MCP SDK dependency for MCP projects
        if (mcpName) {
            const deps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies,
            };
            if (!deps['@modelcontextprotocol/sdk']) {
                issues.push({
                    ruleId: 'config-006',
                    severity: 'critical',
                    message: 'MCP project missing @modelcontextprotocol/sdk dependency',
                    location: { path: packageJsonPath },
                    suggestion: 'Add @modelcontextprotocol/sdk to dependencies',
                    autoFixAvailable: false,
                });
            }
        }
        // Validate scripts
        if (!packageJson.scripts) {
            issues.push({
                ruleId: 'config-007',
                severity: 'warning',
                message: 'package.json missing scripts section',
                location: { path: packageJsonPath },
                suggestion: 'Add build, test, and start scripts',
                autoFixAvailable: false,
            });
        }
        else {
            // Check for essential scripts
            const recommendedScripts = ['build', 'test'];
            for (const script of recommendedScripts) {
                if (!packageJson.scripts[script]) {
                    issues.push({
                        ruleId: 'config-008',
                        severity: 'info',
                        message: `package.json missing recommended script: ${script}`,
                        location: { path: packageJsonPath },
                        suggestion: `Add "${script}" script to package.json`,
                        autoFixAvailable: false,
                    });
                }
            }
        }
        // Check for deprecated dependencies
        const deprecatedDeps = await checkDeprecatedDependencies(packageJson);
        issues.push(...deprecatedDeps.map((dep) => ({
            ruleId: 'config-009',
            severity: 'warning',
            message: `Deprecated dependency: ${dep}`,
            location: { path: packageJsonPath },
            suggestion: 'Update to latest non-deprecated version',
            autoFixAvailable: false,
        })));
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            issues.push({
                ruleId: 'config-010',
                severity: 'critical',
                message: 'package.json has invalid JSON syntax',
                location: { path: packageJsonPath },
                suggestion: 'Fix JSON syntax errors',
                autoFixAvailable: false,
            });
        }
    }
    return issues;
}
/**
 * Validate tsconfig.json
 */
async function validateTsConfig(projectPath) {
    const issues = [];
    const tsconfigPath = path.join(projectPath, 'tsconfig.json');
    const exists = await fileExists(tsconfigPath);
    if (!exists) {
        return issues; // Not all projects use TypeScript
    }
    try {
        const content = await fs.readFile(tsconfigPath, 'utf-8');
        const tsconfig = JSON.parse(content);
        const compilerOptions = tsconfig.compilerOptions || {};
        // Validate strict mode
        if (!compilerOptions.strict) {
            issues.push({
                ruleId: 'config-011',
                severity: 'warning',
                message: 'tsconfig.json should enable strict mode',
                location: { path: tsconfigPath },
                suggestion: 'Set "strict": true in compilerOptions',
                autoFixAvailable: true,
            });
        }
        // Validate module system
        if (!compilerOptions.module) {
            issues.push({
                ruleId: 'config-012',
                severity: 'warning',
                message: 'tsconfig.json missing module setting',
                location: { path: tsconfigPath },
                suggestion: 'Set "module": "ES2022" or "NodeNext" in compilerOptions',
                autoFixAvailable: false,
            });
        }
        // Validate target
        if (!compilerOptions.target) {
            issues.push({
                ruleId: 'config-013',
                severity: 'warning',
                message: 'tsconfig.json missing target setting',
                location: { path: tsconfigPath },
                suggestion: 'Set "target": "ES2022" in compilerOptions',
                autoFixAvailable: false,
            });
        }
        // Recommend useful strict options
        const recommendedStrictOptions = [
            'noImplicitAny',
            'strictNullChecks',
            'strictFunctionTypes',
        ];
        for (const option of recommendedStrictOptions) {
            if (compilerOptions[option] === false) {
                issues.push({
                    ruleId: 'config-014',
                    severity: 'info',
                    message: `tsconfig.json disables recommended option: ${option}`,
                    location: { path: tsconfigPath },
                    suggestion: `Enable "${option}" for better type safety`,
                    autoFixAvailable: true,
                });
            }
        }
        // Validate outDir is set
        if (!compilerOptions.outDir) {
            issues.push({
                ruleId: 'config-015',
                severity: 'warning',
                message: 'tsconfig.json missing outDir setting',
                location: { path: tsconfigPath },
                suggestion: 'Set "outDir": "./dist" in compilerOptions',
                autoFixAvailable: true,
            });
        }
        // Validate rootDir is set
        if (!compilerOptions.rootDir) {
            issues.push({
                ruleId: 'config-016',
                severity: 'info',
                message: 'tsconfig.json missing rootDir setting',
                location: { path: tsconfigPath },
                suggestion: 'Set "rootDir": "./src" in compilerOptions',
                autoFixAvailable: true,
            });
        }
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            issues.push({
                ruleId: 'config-017',
                severity: 'critical',
                message: 'tsconfig.json has invalid JSON syntax',
                location: { path: tsconfigPath },
                suggestion: 'Fix JSON syntax errors',
                autoFixAvailable: false,
            });
        }
    }
    return issues;
}
/**
 * Validate environment files
 */
async function validateEnvironmentFiles(projectPath) {
    const issues = [];
    // Check for .env files
    const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
    for (const envFile of envFiles) {
        const envPath = path.join(projectPath, envFile);
        const exists = await fileExists(envPath);
        if (exists) {
            const envIssues = await validateEnvFile(envPath);
            issues.push(...envIssues);
        }
    }
    // Check for .env.example
    const envExamplePath = path.join(projectPath, '.env.example');
    const hasEnvFiles = (await Promise.all(envFiles.map((f) => fileExists(path.join(projectPath, f))))).some(Boolean);
    if (hasEnvFiles && !(await fileExists(envExamplePath))) {
        issues.push({
            ruleId: 'config-018',
            severity: 'warning',
            message: 'Missing .env.example file',
            location: { path: projectPath },
            suggestion: 'Create .env.example with placeholder values',
            autoFixAvailable: false,
        });
    }
    return issues;
}
/**
 * Validate individual .env file
 */
async function validateEnvFile(envPath) {
    const issues = [];
    try {
        const content = await fs.readFile(envPath, 'utf-8');
        const lines = content.split('\n');
        // Check for hardcoded secrets (basic patterns)
        const secretPatterns = [
            { pattern: /password\s*=\s*["']?.{8,}["']?/i, name: 'password' },
            { pattern: /api[_-]?key\s*=\s*["']?[a-zA-Z0-9]{20,}["']?/i, name: 'API key' },
            { pattern: /secret\s*=\s*["']?.{16,}["']?/i, name: 'secret' },
            { pattern: /token\s*=\s*["']?[a-zA-Z0-9]{20,}["']?/i, name: 'token' },
        ];
        lines.forEach((line, index) => {
            for (const { pattern, name } of secretPatterns) {
                if (pattern.test(line) && !line.trim().startsWith('#')) {
                    issues.push({
                        ruleId: 'config-019',
                        severity: 'critical',
                        message: `Possible hardcoded ${name} in environment file`,
                        location: { path: envPath, line: index + 1 },
                        suggestion: 'Use placeholder values in .env files, store real values in secure credential manager',
                        autoFixAvailable: false,
                    });
                }
            }
        });
        // Check for missing comments/documentation
        const hasComments = lines.some((line) => line.trim().startsWith('#'));
        if (!hasComments && lines.length > 3) {
            issues.push({
                ruleId: 'config-020',
                severity: 'info',
                message: 'Environment file lacks documentation comments',
                location: { path: envPath },
                suggestion: 'Add comments explaining each environment variable',
                autoFixAvailable: false,
            });
        }
    }
    catch (error) {
        // Ignore read errors
    }
    return issues;
}
/**
 * Validate MCP is registered in Claude config
 */
async function validateMcpRegistration(mcpName) {
    const issues = [];
    const claudeConfigPath = path.join(os.homedir(), '.claude.json');
    const exists = await fileExists(claudeConfigPath);
    if (!exists) {
        issues.push({
            ruleId: 'config-021',
            severity: 'warning',
            message: 'Claude config file not found',
            location: { path: claudeConfigPath },
            suggestion: 'Create ~/.claude.json to register MCPs',
            autoFixAvailable: false,
        });
        return issues;
    }
    try {
        const content = await fs.readFile(claudeConfigPath, 'utf-8');
        const config = JSON.parse(content);
        const mcpServers = config.mcpServers || {};
        if (!mcpServers[mcpName]) {
            issues.push({
                ruleId: 'config-022',
                severity: 'critical',
                message: `MCP "${mcpName}" not registered in Claude config`,
                location: { path: claudeConfigPath },
                suggestion: `Register MCP in ~/.claude.json mcpServers section`,
                autoFixAvailable: false,
            });
        }
        else {
            // Validate MCP configuration
            const mcpConfig = mcpServers[mcpName];
            if (!mcpConfig.command) {
                issues.push({
                    ruleId: 'config-023',
                    severity: 'critical',
                    message: `MCP "${mcpName}" missing command in config`,
                    location: { path: claudeConfigPath },
                    suggestion: 'Add "command" field to MCP configuration',
                    autoFixAvailable: false,
                });
            }
            if (!mcpConfig.args) {
                issues.push({
                    ruleId: 'config-024',
                    severity: 'warning',
                    message: `MCP "${mcpName}" missing args in config`,
                    location: { path: claudeConfigPath },
                    suggestion: 'Add "args" array to MCP configuration',
                    autoFixAvailable: false,
                });
            }
        }
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            issues.push({
                ruleId: 'config-025',
                severity: 'critical',
                message: 'Claude config file has invalid JSON',
                location: { path: claudeConfigPath },
                suggestion: 'Fix JSON syntax errors in ~/.claude.json',
                autoFixAvailable: false,
            });
        }
    }
    return issues;
}
/**
 * Check for deprecated npm packages
 */
async function checkDeprecatedDependencies(packageJson) {
    const deprecated = [];
    // Known deprecated packages (common ones)
    const knownDeprecated = [
        'request',
        'node-uuid',
        '@types/node@<16',
        'tslint',
    ];
    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
    };
    for (const dep of knownDeprecated) {
        if (allDeps[dep.split('@')[0]]) {
            deprecated.push(dep);
        }
    }
    return deprecated;
}
/**
 * Check if file exists
 */
async function fileExists(filePath) {
    try {
        const stats = await fs.stat(filePath);
        return stats.isFile();
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=configuration.js.map