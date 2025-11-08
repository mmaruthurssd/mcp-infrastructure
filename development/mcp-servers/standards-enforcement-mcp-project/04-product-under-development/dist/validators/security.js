import * as fs from 'fs/promises';
import * as path from 'path';
/**
 * Security Validator
 * Ensures projects follow security best practices
 */
/**
 * Patterns for detecting hardcoded secrets
 */
const SECRET_PATTERNS = [
    {
        name: 'API Key',
        pattern: /['"]?[a-zA-Z0-9_-]*api[_-]?key['"]?\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/gi,
    },
    {
        name: 'Password',
        pattern: /['"]?password['"]?\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    },
    {
        name: 'Secret',
        pattern: /['"]?[a-zA-Z0-9_-]*secret['"]?\s*[:=]\s*['"][a-zA-Z0-9]{16,}['"]/gi,
    },
    {
        name: 'Token',
        pattern: /['"]?[a-zA-Z0-9_-]*token['"]?\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/gi,
    },
    {
        name: 'Private Key',
        pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi,
    },
    {
        name: 'AWS Key',
        pattern: /AKIA[0-9A-Z]{16}/g,
    },
];
/**
 * Patterns for detecting PHI (Protected Health Information)
 */
const PHI_PATTERNS = [
    {
        name: 'SSN',
        pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    },
    {
        name: 'MRN (Medical Record Number)',
        pattern: /\b(mrn|medical[_-]?record[_-]?number)\s*[:=]\s*['"]?\d+['"]?/gi,
    },
    {
        name: 'Date of Birth',
        pattern: /\b(dob|date[_-]?of[_-]?birth|birth[_-]?date)\s*[:=]/gi,
    },
];
/**
 * Validate security practices
 */
export async function validateSecurity(context) {
    const issues = [];
    const { targetPath } = context;
    // Check for hardcoded secrets in source code
    const secretIssues = await scanForHardcodedSecrets(targetPath);
    issues.push(...secretIssues);
    // Check for PHI in code/config files
    const phiIssues = await scanForPHI(targetPath);
    issues.push(...phiIssues);
    // Validate .gitignore
    const gitignoreIssues = await validateGitignore(targetPath);
    issues.push(...gitignoreIssues);
    // Check for insecure dependencies
    const depIssues = await checkInsecureDependencies(targetPath);
    issues.push(...depIssues);
    // Check for security best practices in code
    const codePracticesIssues = await validateSecurityPractices(targetPath);
    issues.push(...codePracticesIssues);
    return issues;
}
/**
 * Scan for hardcoded secrets in source files
 */
async function scanForHardcodedSecrets(projectPath) {
    const issues = [];
    const srcPath = path.join(projectPath, 'src');
    const srcExists = await directoryExists(srcPath);
    if (!srcExists) {
        return issues;
    }
    // Scan TypeScript, JavaScript, and JSON files
    const files = await findFiles(srcPath, /\.(ts|js|json)$/);
    for (const filePath of files) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            for (const { name, pattern } of SECRET_PATTERNS) {
                const regex = new RegExp(pattern.source, pattern.flags);
                let match;
                while ((match = regex.exec(content)) !== null) {
                    // Get line number
                    const lineNumber = content.substring(0, match.index).split('\n').length;
                    issues.push({
                        ruleId: 'security-001',
                        severity: 'critical',
                        message: `Possible hardcoded ${name} detected`,
                        location: { path: filePath, line: lineNumber },
                        suggestion: 'Move secrets to environment variables or secure credential storage',
                        autoFixAvailable: false,
                    });
                }
            }
        }
        catch (error) {
            // Ignore read errors
        }
    }
    return issues;
}
/**
 * Scan for PHI in code and config files
 */
async function scanForPHI(projectPath) {
    const issues = [];
    // Scan source and config files
    const files = await findFiles(projectPath, /\.(ts|js|json|env)$/);
    for (const filePath of files) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            for (const { name, pattern } of PHI_PATTERNS) {
                const regex = new RegExp(pattern.source, pattern.flags);
                let match;
                while ((match = regex.exec(content)) !== null) {
                    const lineNumber = content.substring(0, match.index).split('\n').length;
                    issues.push({
                        ruleId: 'security-002',
                        severity: 'critical',
                        message: `Possible PHI (${name}) detected in source code`,
                        location: { path: filePath, line: lineNumber },
                        suggestion: 'Remove PHI from code and configuration files',
                        autoFixAvailable: false,
                    });
                }
            }
        }
        catch (error) {
            // Ignore read errors
        }
    }
    return issues;
}
/**
 * Validate .gitignore file
 */
async function validateGitignore(projectPath) {
    const issues = [];
    const gitignorePath = path.join(projectPath, '.gitignore');
    const exists = await fileExists(gitignorePath);
    if (!exists) {
        issues.push({
            ruleId: 'security-003',
            severity: 'critical',
            message: 'Missing .gitignore file',
            location: { path: projectPath },
            suggestion: 'Create .gitignore to prevent committing sensitive files',
            autoFixAvailable: true,
        });
        return issues;
    }
    try {
        const content = await fs.readFile(gitignorePath, 'utf-8');
        // Required patterns in .gitignore
        const requiredPatterns = [
            { pattern: /\.env/, name: '.env files' },
            { pattern: /node_modules/, name: 'node_modules' },
            { pattern: /dist/, name: 'dist directory' },
            { pattern: /\.DS_Store/, name: '.DS_Store' },
            { pattern: /(credentials|secrets)/, name: 'credentials/secrets' },
        ];
        for (const { pattern, name } of requiredPatterns) {
            if (!pattern.test(content)) {
                issues.push({
                    ruleId: 'security-004',
                    severity: 'warning',
                    message: `.gitignore missing pattern for ${name}`,
                    location: { path: gitignorePath },
                    suggestion: `Add pattern for ${name} to .gitignore`,
                    autoFixAvailable: true,
                });
            }
        }
    }
    catch (error) {
        // Ignore read errors
    }
    return issues;
}
/**
 * Check for known insecure dependencies
 */
async function checkInsecureDependencies(projectPath) {
    const issues = [];
    const packageJsonPath = path.join(projectPath, 'package.json');
    const exists = await fileExists(packageJsonPath);
    if (!exists) {
        return issues;
    }
    try {
        const content = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(content);
        const allDeps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
        };
        // Known insecure packages
        const insecurePackages = [
            { name: 'request', reason: 'Deprecated and has security vulnerabilities' },
            { name: 'node-uuid', reason: 'Deprecated, use uuid instead' },
            { name: 'growl', reason: 'Has command injection vulnerability' },
        ];
        for (const { name, reason } of insecurePackages) {
            if (allDeps[name]) {
                issues.push({
                    ruleId: 'security-005',
                    severity: 'critical',
                    message: `Insecure dependency detected: ${name}`,
                    location: { path: packageJsonPath },
                    suggestion: reason,
                    autoFixAvailable: false,
                });
            }
        }
        // Check for wildcard versions (security risk)
        for (const [dep, version] of Object.entries(allDeps)) {
            if (typeof version === 'string' && version === '*') {
                issues.push({
                    ruleId: 'security-006',
                    severity: 'warning',
                    message: `Dependency "${dep}" uses wildcard version`,
                    location: { path: packageJsonPath },
                    suggestion: 'Pin to specific version for security and reproducibility',
                    autoFixAvailable: false,
                });
            }
        }
    }
    catch (error) {
        // Ignore parsing errors
    }
    return issues;
}
/**
 * Validate security best practices in code
 */
async function validateSecurityPractices(projectPath) {
    const issues = [];
    const srcPath = path.join(projectPath, 'src');
    const srcExists = await directoryExists(srcPath);
    if (!srcExists) {
        return issues;
    }
    const files = await findFiles(srcPath, /\.(ts|js)$/);
    for (const filePath of files) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            // Check for eval() usage
            if (/\beval\s*\(/g.test(content)) {
                issues.push({
                    ruleId: 'security-007',
                    severity: 'critical',
                    message: 'Use of eval() detected',
                    location: { path: filePath },
                    suggestion: 'Remove eval() - it can execute arbitrary code',
                    autoFixAvailable: false,
                });
            }
            // Check for dangerous functions
            const dangerousFunctions = [
                { fn: 'exec', reason: 'can execute arbitrary shell commands' },
                { fn: 'spawn', reason: 'can execute arbitrary processes' },
            ];
            for (const { fn, reason } of dangerousFunctions) {
                const regex = new RegExp(`\\bchild_process\\.${fn}\\(`, 'g');
                if (regex.test(content)) {
                    issues.push({
                        ruleId: 'security-008',
                        severity: 'warning',
                        message: `Use of child_process.${fn}() detected`,
                        location: { path: filePath },
                        suggestion: `Review ${fn}() usage - ${reason}. Ensure input validation.`,
                        autoFixAvailable: false,
                    });
                }
            }
            // Check for SQL injection risks
            if (/\$\{[^}]+\}.*?SELECT|SELECT.*?\$\{[^}]+\}/gi.test(content)) {
                issues.push({
                    ruleId: 'security-009',
                    severity: 'critical',
                    message: 'Possible SQL injection vulnerability detected',
                    location: { path: filePath },
                    suggestion: 'Use parameterized queries instead of string interpolation',
                    autoFixAvailable: false,
                });
            }
            // Check for HTTP instead of HTTPS
            if (/"http:\/\/(?!localhost|127\.0\.0\.1)/g.test(content)) {
                issues.push({
                    ruleId: 'security-010',
                    severity: 'warning',
                    message: 'HTTP URL detected (should use HTTPS)',
                    location: { path: filePath },
                    suggestion: 'Use HTTPS for external connections',
                    autoFixAvailable: false,
                });
            }
            // Check for disabled SSL verification
            if (/rejectUnauthorized\s*:\s*false/gi.test(content)) {
                issues.push({
                    ruleId: 'security-011',
                    severity: 'critical',
                    message: 'SSL certificate verification disabled',
                    location: { path: filePath },
                    suggestion: 'Enable SSL certificate verification for security',
                    autoFixAvailable: false,
                });
            }
        }
        catch (error) {
            // Ignore read errors
        }
    }
    return issues;
}
/**
 * Validate HIPAA compliance for medical workspace
 */
export async function validateHIPAACompliance(context) {
    const issues = [];
    const { targetPath } = context;
    // Check for SECURITY.md
    const securityMdPath = path.join(targetPath, 'SECURITY.md');
    const securityMdExists = await fileExists(securityMdPath);
    if (!securityMdExists) {
        issues.push({
            ruleId: 'security-012',
            severity: 'critical',
            message: 'Missing SECURITY.md for HIPAA compliance',
            location: { path: targetPath },
            suggestion: 'Create SECURITY.md documenting security policies and PHI handling',
            autoFixAvailable: false,
        });
    }
    // Check for audit logging
    const srcPath = path.join(targetPath, 'src');
    if (await directoryExists(srcPath)) {
        const files = await findFiles(srcPath, /\.(ts|js)$/);
        let hasAuditLogging = false;
        for (const filePath of files) {
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                if (/audit|log|track/i.test(content)) {
                    hasAuditLogging = true;
                    break;
                }
            }
            catch {
                // Ignore
            }
        }
        if (!hasAuditLogging && files.length > 0) {
            issues.push({
                ruleId: 'security-013',
                severity: 'warning',
                message: 'No audit logging detected (required for HIPAA)',
                location: { path: srcPath },
                suggestion: 'Implement audit logging for PHI access and modifications',
                autoFixAvailable: false,
            });
        }
    }
    // Check for encryption mention in code
    const packageJsonPath = path.join(targetPath, 'package.json');
    if (await fileExists(packageJsonPath)) {
        try {
            const content = await fs.readFile(packageJsonPath, 'utf-8');
            const packageJson = JSON.parse(content);
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            const hasEncryption = Object.keys(deps).some((dep) => /crypto|encrypt|cipher/i.test(dep));
            if (!hasEncryption) {
                issues.push({
                    ruleId: 'security-014',
                    severity: 'info',
                    message: 'No encryption libraries detected',
                    location: { path: packageJsonPath },
                    suggestion: 'Consider adding encryption for PHI at rest and in transit',
                    autoFixAvailable: false,
                });
            }
        }
        catch {
            // Ignore
        }
    }
    return issues;
}
/**
 * Find files matching pattern recursively
 */
async function findFiles(dir, pattern, maxDepth = 4, currentDepth = 0) {
    if (currentDepth > maxDepth) {
        return [];
    }
    const files = [];
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            // Skip node_modules, dist, build
            if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') {
                continue;
            }
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                const subFiles = await findFiles(fullPath, pattern, maxDepth, currentDepth + 1);
                files.push(...subFiles);
            }
            else if (entry.isFile() && pattern.test(entry.name)) {
                files.push(fullPath);
            }
        }
    }
    catch (error) {
        // Ignore read errors
    }
    return files;
}
/**
 * Check if directory exists
 */
async function directoryExists(dirPath) {
    try {
        const stats = await fs.stat(dirPath);
        return stats.isDirectory();
    }
    catch {
        return false;
    }
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
//# sourceMappingURL=security.js.map