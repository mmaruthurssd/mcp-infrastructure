/**
 * Credential scanner engine
 *
 * Scans files and text content for potential credentials using pattern matching
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { CREDENTIAL_PATTERNS } from '../patterns/credential-patterns.js';
/**
 * Credential scanner class
 */
export class CredentialScanner {
    patterns;
    allowList;
    minConfidence;
    contextLines;
    constructor(options = {}) {
        this.patterns = options.patterns || CREDENTIAL_PATTERNS;
        this.allowList = options.allowList || [];
        this.minConfidence = options.minConfidence ?? 0.5;
        this.contextLines = options.contextLines ?? 2;
    }
    /**
     * Scan a file for credentials
     */
    async scanFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const violations = this.scanText(content, filePath);
            return {
                filePath,
                violations,
                clean: violations.length === 0,
                scannedAt: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new Error(`Failed to scan file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Scan text content for credentials
     */
    scanText(content, filePath = '<text>') {
        const lines = content.split('\n');
        const violations = [];
        // Scan each line with each pattern
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const lineNumber = lineIndex + 1;
            for (const pattern of this.patterns) {
                // Skip if pattern doesn't meet minimum confidence
                if (pattern.confidence < this.minConfidence) {
                    continue;
                }
                // Reset regex lastIndex (important for global patterns)
                pattern.pattern.lastIndex = 0;
                let match;
                while ((match = pattern.pattern.exec(line)) !== null) {
                    const matchedText = match[0];
                    const column = match.index + 1;
                    // Check allow-list
                    if (this.isAllowListed(filePath, lineNumber, pattern.name, matchedText)) {
                        continue;
                    }
                    // Extract context
                    const context = this.extractContext(lines, lineIndex);
                    // Create violation
                    violations.push({
                        file: filePath,
                        line: lineNumber,
                        column,
                        pattern: pattern.name,
                        severity: pattern.severity,
                        confidence: pattern.confidence,
                        context,
                        suggestion: this.generateSuggestion(pattern),
                    });
                }
            }
        }
        return violations;
    }
    /**
     * Scan multiple files
     */
    async scanFiles(filePaths) {
        const results = [];
        for (const filePath of filePaths) {
            try {
                const result = await this.scanFile(filePath);
                results.push(result);
            }
            catch (error) {
                // Log error but continue scanning other files
                console.error(`Error scanning ${filePath}:`, error);
                results.push({
                    filePath,
                    violations: [],
                    clean: false,
                    scannedAt: new Date().toISOString(),
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
        return results;
    }
    /**
     * Scan directory recursively
     */
    async scanDirectory(dirPath, options = {}) {
        const exclude = options.exclude || [
            'node_modules',
            '.git',
            'dist',
            'build',
            'coverage',
            '.next',
            '.cache',
        ];
        const files = await this.findFiles(dirPath, exclude);
        return this.scanFiles(files);
    }
    /**
     * Check if a match is allow-listed
     */
    isAllowListed(filePath, lineNumber, patternName, matchedText) {
        return this.allowList.some((entry) => {
            // Check file path match
            if (entry.filePath && !this.matchesPath(filePath, entry.filePath)) {
                return false;
            }
            // Check line number match
            if (entry.lineNumber !== undefined && entry.lineNumber !== lineNumber) {
                return false;
            }
            // Check pattern name match
            if (entry.patternName && entry.patternName !== patternName) {
                return false;
            }
            // Check matched text
            if (entry.matchedText && entry.matchedText !== matchedText) {
                return false;
            }
            return true;
        });
    }
    /**
     * Match file path against pattern (supports wildcards)
     */
    matchesPath(filePath, pattern) {
        // Simple wildcard matching (can be enhanced with glob library)
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
        return regex.test(filePath);
    }
    /**
     * Extract context lines around a match
     */
    extractContext(lines, lineIndex) {
        const start = Math.max(0, lineIndex - this.contextLines);
        const end = Math.min(lines.length, lineIndex + this.contextLines + 1);
        const contextLines = [];
        for (let i = start; i < end; i++) {
            const prefix = i === lineIndex ? '> ' : '  ';
            contextLines.push(`${prefix}${i + 1}: ${lines[i]}`);
        }
        return contextLines.join('\n');
    }
    /**
     * Generate a helpful suggestion for fixing the violation
     */
    generateSuggestion(pattern) {
        const suggestions = {
            'AWS Access Key ID': 'Use AWS IAM roles or store in AWS Secrets Manager. Reference via environment variable.',
            'AWS Secret Access Key': 'Use AWS IAM roles or store in AWS Secrets Manager. Reference via environment variable.',
            'Generic API Key': 'Store in environment variable or secrets manager. Use process.env.API_KEY in code.',
            'Bearer Token': 'Never hardcode bearer tokens. Use environment variables or secure token storage.',
            'JWT Token': 'Avoid committing JWTs. Use short-lived tokens and secure storage.',
            'RSA Private Key': 'Never commit private keys. Store in secure keystore or use SSH agent.',
            'EC Private Key': 'Never commit private keys. Store in secure keystore or use SSH agent.',
            'OpenSSH Private Key': 'Never commit private keys. Store in ~/.ssh/ and use SSH agent.',
            'Generic Password': 'Never hardcode passwords. Use environment variables or secrets manager.',
            'Generic Secret': 'Store secrets in environment variables or dedicated secrets manager.',
            'Database URL with Password': 'Use connection string without password. Store password separately in environment variable.',
            'Google Cloud API Key': 'Store in environment variable. Restrict API key usage in Google Cloud Console.',
            'Google OAuth Client Secret': 'Store in environment variable or Google Cloud Secret Manager.',
            'GitHub Personal Access Token': 'Use environment variable. Regenerate token if exposed. Consider using GitHub Apps.',
            'GitHub OAuth Token': 'Use environment variable. Regenerate token if exposed.',
            'Slack Webhook': 'Store webhook URL in environment variable. Regenerate if exposed.',
            'Slack API Token': 'Store in environment variable. Regenerate token if exposed.',
            'Stripe Secret Key': 'CRITICAL: Regenerate immediately if exposed. Store in environment variable.',
            'Stripe Publishable Key': 'While publishable, still store in environment variable for key rotation.',
            'Twilio API Key': 'Store in environment variable or Twilio Key Store.',
            'Generic Access Token': 'Store tokens in environment variables or secure token storage.',
        };
        return suggestions[pattern.name] || 'Remove hardcoded credential and use environment variable or secrets manager.';
    }
    /**
     * Find all files in directory recursively
     */
    async findFiles(dirPath, exclude) {
        const files = [];
        async function walk(currentPath) {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                // Skip excluded directories
                if (exclude.includes(entry.name)) {
                    continue;
                }
                if (entry.isDirectory()) {
                    await walk(fullPath);
                }
                else if (entry.isFile()) {
                    // Skip binary files (basic check)
                    if (!isBinaryFile(entry.name)) {
                        files.push(fullPath);
                    }
                }
            }
        }
        await walk(dirPath);
        return files;
    }
}
/**
 * Simple binary file detection
 */
function isBinaryFile(filename) {
    const binaryExtensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg',
        '.pdf', '.zip', '.tar', '.gz', '.7z', '.rar',
        '.exe', '.dll', '.so', '.dylib',
        '.woff', '.woff2', '.ttf', '.otf', '.eot',
        '.mp3', '.mp4', '.avi', '.mov', '.wmv',
        '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    ];
    const ext = path.extname(filename).toLowerCase();
    return binaryExtensions.includes(ext);
}
/**
 * Convenience function to scan a file
 */
export async function scanFile(filePath, options) {
    const scanner = new CredentialScanner(options);
    return scanner.scanFile(filePath);
}
/**
 * Convenience function to scan text
 */
export function scanText(content, filePath, options) {
    const scanner = new CredentialScanner(options);
    return scanner.scanText(content, filePath);
}
/**
 * Convenience function to scan multiple files
 */
export async function scanFiles(filePaths, options) {
    const scanner = new CredentialScanner(options);
    return scanner.scanFiles(filePaths);
}
/**
 * Convenience function to scan directory
 */
export async function scanDirectory(dirPath, options) {
    const scanner = new CredentialScanner(options);
    return scanner.scanDirectory(dirPath, { exclude: options?.exclude });
}
//# sourceMappingURL=credential-scanner.js.map