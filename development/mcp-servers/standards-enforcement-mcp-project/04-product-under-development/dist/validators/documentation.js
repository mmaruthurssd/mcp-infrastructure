import * as fs from 'fs/promises';
import * as path from 'path';
/**
 * Documentation Validator
 * Ensures projects have proper documentation
 */
/**
 * Validate documentation exists and is complete
 */
export async function validateDocumentation(context) {
    const issues = [];
    const { targetPath, targetType } = context;
    // Validate README.md
    const readmeIssues = await validateReadme(targetPath, targetType);
    issues.push(...readmeIssues);
    // Validate SPECIFICATION.md for projects
    if (targetType === 'project' || targetType === 'mcp') {
        const specIssues = await validateSpecification(targetPath);
        issues.push(...specIssues);
    }
    // Validate CHANGELOG.md for MCPs
    if (targetType === 'mcp') {
        const changelogIssues = await validateChangelog(targetPath);
        issues.push(...changelogIssues);
    }
    // Validate inline code documentation
    const codeDocsIssues = await validateCodeDocumentation(targetPath);
    issues.push(...codeDocsIssues);
    // Validate API documentation for MCPs
    if (targetType === 'mcp') {
        const apiDocsIssues = await validateApiDocumentation(targetPath);
        issues.push(...apiDocsIssues);
    }
    return issues;
}
/**
 * Validate README.md
 */
async function validateReadme(projectPath, targetType) {
    const issues = [];
    const readmePath = path.join(projectPath, 'README.md');
    const exists = await fileExists(readmePath);
    if (!exists) {
        issues.push({
            ruleId: 'docs-001',
            severity: 'critical',
            message: 'Missing README.md',
            location: { path: projectPath },
            suggestion: 'Create README.md with project overview',
            autoFixAvailable: false,
        });
        return issues;
    }
    try {
        const content = await fs.readFile(readmePath, 'utf-8');
        // Check minimum length
        if (content.length < 200) {
            issues.push({
                ruleId: 'docs-002',
                severity: 'warning',
                message: 'README.md appears incomplete (< 200 characters)',
                location: { path: readmePath },
                suggestion: 'Expand README.md with detailed project information',
                autoFixAvailable: false,
            });
        }
        // Required sections
        const requiredSections = [
            { name: 'Description', pattern: /##\s*(Description|Overview|About)/i },
            { name: 'Installation', pattern: /##\s*Installation/i },
            { name: 'Usage', pattern: /##\s*Usage/i },
        ];
        for (const section of requiredSections) {
            if (!section.pattern.test(content)) {
                issues.push({
                    ruleId: 'docs-003',
                    severity: 'warning',
                    message: `README.md missing "${section.name}" section`,
                    location: { path: readmePath },
                    suggestion: `Add ## ${section.name} section`,
                    autoFixAvailable: false,
                });
            }
        }
        // Check for code examples
        if (targetType === 'mcp' && !content.includes('```')) {
            issues.push({
                ruleId: 'docs-004',
                severity: 'info',
                message: 'README.md missing code examples',
                location: { path: readmePath },
                suggestion: 'Add code examples showing how to use the MCP',
                autoFixAvailable: false,
            });
        }
        // Check for placeholder text
        const placeholders = ['TODO', 'TBD', '[Your', 'Lorem ipsum'];
        for (const placeholder of placeholders) {
            if (content.includes(placeholder)) {
                issues.push({
                    ruleId: 'docs-005',
                    severity: 'warning',
                    message: `README.md contains placeholder text: "${placeholder}"`,
                    location: { path: readmePath },
                    suggestion: 'Replace placeholder text with actual content',
                    autoFixAvailable: false,
                });
            }
        }
        // Check for broken links (simple check for markdown links)
        const brokenLinks = await checkBrokenMarkdownLinks(content, projectPath);
        issues.push(...brokenLinks.map((link) => ({
            ruleId: 'docs-006',
            severity: 'warning',
            message: `Possible broken link in README.md: ${link}`,
            location: { path: readmePath },
            suggestion: 'Fix or remove broken link',
            autoFixAvailable: false,
        })));
    }
    catch (error) {
        // Ignore read errors
    }
    return issues;
}
/**
 * Validate SPECIFICATION.md
 */
async function validateSpecification(projectPath) {
    const issues = [];
    const specPath = path.join(projectPath, '01-planning', 'SPECIFICATION.md');
    const exists = await fileExists(specPath);
    if (!exists) {
        issues.push({
            ruleId: 'docs-007',
            severity: 'critical',
            message: 'Missing SPECIFICATION.md in 01-planning',
            location: { path: projectPath },
            suggestion: 'Create SPECIFICATION.md with detailed requirements',
            autoFixAvailable: false,
        });
        return issues;
    }
    try {
        const content = await fs.readFile(specPath, 'utf-8');
        // Check minimum length
        if (content.length < 1000) {
            issues.push({
                ruleId: 'docs-008',
                severity: 'warning',
                message: 'SPECIFICATION.md appears incomplete (< 1000 characters)',
                location: { path: specPath },
                suggestion: 'Expand SPECIFICATION.md with detailed requirements and architecture',
                autoFixAvailable: false,
            });
        }
        // Required sections
        const requiredSections = [
            { name: 'Executive Summary', pattern: /##\s*Executive\s*Summary/i },
            { name: 'Constitution', pattern: /##\s*Constitution/i },
            { name: 'Requirements', pattern: /##\s*(Requirements|Functional Requirements)/i },
            { name: 'Architecture', pattern: /##\s*Architecture/i },
        ];
        for (const section of requiredSections) {
            if (!section.pattern.test(content)) {
                issues.push({
                    ruleId: 'docs-009',
                    severity: 'warning',
                    message: `SPECIFICATION.md missing "${section.name}" section`,
                    location: { path: specPath },
                    suggestion: `Add ## ${section.name} section`,
                    autoFixAvailable: false,
                });
            }
        }
        // Check for functional requirements (FR1, FR2, etc.)
        const hasRequirements = /FR\d+:/i.test(content);
        if (!hasRequirements) {
            issues.push({
                ruleId: 'docs-010',
                severity: 'warning',
                message: 'SPECIFICATION.md missing functional requirements (FR1, FR2, etc.)',
                location: { path: specPath },
                suggestion: 'Add numbered functional requirements (FR1, FR2, etc.)',
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
 * Validate CHANGELOG.md
 */
async function validateChangelog(projectPath) {
    const issues = [];
    const changelogPath = path.join(projectPath, 'CHANGELOG.md');
    const exists = await fileExists(changelogPath);
    if (!exists) {
        issues.push({
            ruleId: 'docs-011',
            severity: 'warning',
            message: 'Missing CHANGELOG.md',
            location: { path: projectPath },
            suggestion: 'Create CHANGELOG.md to track version history',
            autoFixAvailable: false,
        });
        return issues;
    }
    try {
        const content = await fs.readFile(changelogPath, 'utf-8');
        // Check for version entries
        const hasVersions = /##\s*\[\d+\.\d+\.\d+\]/.test(content);
        if (!hasVersions) {
            issues.push({
                ruleId: 'docs-012',
                severity: 'warning',
                message: 'CHANGELOG.md missing version entries',
                location: { path: changelogPath },
                suggestion: 'Add version entries (e.g., ## [1.0.0] - 2024-01-01)',
                autoFixAvailable: false,
            });
        }
        // Check for standard sections (Added, Changed, Fixed, etc.)
        const standardSections = ['Added', 'Changed', 'Fixed', 'Removed'];
        const hasSections = standardSections.some((section) => new RegExp(`###\\s*${section}`, 'i').test(content));
        if (!hasSections) {
            issues.push({
                ruleId: 'docs-013',
                severity: 'info',
                message: 'CHANGELOG.md missing standard sections (Added, Changed, Fixed, etc.)',
                location: { path: changelogPath },
                suggestion: 'Use standard changelog format with Added, Changed, Fixed sections',
                autoFixAvailable: false,
            });
        }
        // Check minimum length
        if (content.length < 100) {
            issues.push({
                ruleId: 'docs-014',
                severity: 'warning',
                message: 'CHANGELOG.md appears empty or incomplete',
                location: { path: changelogPath },
                suggestion: 'Add meaningful changelog entries',
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
 * Validate inline code documentation
 */
async function validateCodeDocumentation(projectPath) {
    const issues = [];
    const srcPath = path.join(projectPath, 'src');
    const srcExists = await directoryExists(srcPath);
    if (!srcExists) {
        return issues; // No source code to check
    }
    // Check for JSDoc/TSDoc comments in TypeScript files
    const tsFiles = await findFiles(srcPath, /\.ts$/);
    for (const filePath of tsFiles) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            // Count exported functions/classes
            const exports = (content.match(/export\s+(function|class|interface|type)/g) || []).length;
            // Count JSDoc/TSDoc comments
            const docComments = (content.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
            // If more than 3 exports but less than 50% have docs
            if (exports > 3 && docComments < exports * 0.5) {
                issues.push({
                    ruleId: 'docs-015',
                    severity: 'info',
                    message: `Low inline documentation coverage in ${path.basename(filePath)}`,
                    location: { path: filePath },
                    suggestion: 'Add JSDoc/TSDoc comments to exported functions and classes',
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
 * Validate API documentation for MCPs
 */
async function validateApiDocumentation(projectPath) {
    const issues = [];
    // Check for API documentation file
    const apiDocPaths = [
        path.join(projectPath, 'docs', 'API.md'),
        path.join(projectPath, 'API.md'),
        path.join(projectPath, 'docs', 'api.md'),
    ];
    const apiDocExists = (await Promise.all(apiDocPaths.map(fileExists))).some(Boolean);
    if (!apiDocExists) {
        issues.push({
            ruleId: 'docs-016',
            severity: 'info',
            message: 'Missing API documentation',
            location: { path: projectPath },
            suggestion: 'Create API.md documenting all MCP tools and their parameters',
            autoFixAvailable: false,
        });
    }
    return issues;
}
/**
 * Check for broken markdown links
 */
async function checkBrokenMarkdownLinks(content, basePath) {
    const broken = [];
    // Match markdown links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
        const url = match[2];
        // Only check local file links (not http/https)
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('#')) {
            const linkPath = path.join(basePath, url);
            const exists = await fileExists(linkPath);
            if (!exists) {
                broken.push(url);
            }
        }
    }
    return broken;
}
/**
 * Find files matching pattern recursively
 */
async function findFiles(dir, pattern, maxDepth = 3, currentDepth = 0) {
    if (currentDepth > maxDepth) {
        return [];
    }
    const files = [];
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
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
//# sourceMappingURL=documentation.js.map