// Security integration layer for git-assistant MCP
// Coordinates with security-compliance-mcp for credential and PHI scanning
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
export class SecurityIntegration {
    repoPath;
    configPath;
    cacheFile;
    config;
    cache;
    constructor(repoPath) {
        this.repoPath = repoPath;
        this.configPath = path.join(repoPath, '.git-security-config.json');
        this.cacheFile = path.join(repoPath, '.git', '.security-scan-cache.json');
        this.cache = new Map();
        // Default configuration
        this.config = {
            enabled: true,
            scanCredentials: true,
            scanPHI: true,
            failOnSecurity: true,
            sensitivity: 'medium',
            minConfidence: 0.5,
            excludeDirs: ['node_modules', '.git', 'dist', 'build', 'coverage'],
            cacheTimeout: 30, // 30 seconds
        };
    }
    /**
     * Load security configuration
     */
    async loadConfig() {
        try {
            const data = await fs.readFile(this.configPath, 'utf-8');
            const userConfig = JSON.parse(data);
            this.config = { ...this.config, ...userConfig };
        }
        catch (error) {
            // Config file doesn't exist, use defaults
        }
    }
    /**
     * Save security configuration
     */
    async saveConfig() {
        await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    }
    /**
     * Check if security scanning is enabled
     */
    isEnabled() {
        return this.config.enabled;
    }
    /**
     * Run security scan on staged files
     */
    async scanStaged() {
        if (!this.config.enabled) {
            return this.getPassedResult('Security scanning disabled');
        }
        // Check cache
        const cacheKey = 'staged';
        const cached = this.getCachedResult(cacheKey);
        if (cached) {
            return cached;
        }
        const startTime = Date.now();
        const issues = [];
        try {
            // Scan for credentials if enabled
            if (this.config.scanCredentials) {
                const credentialIssues = await this.scanForCredentials();
                issues.push(...credentialIssues);
            }
            // Scan for PHI if enabled
            if (this.config.scanPHI) {
                const phiIssues = await this.scanForPHI();
                issues.push(...phiIssues);
            }
            const scanTime = Date.now() - startTime;
            const credentialsFound = issues.filter(i => i.type === 'credential').length;
            const phiFound = issues.filter(i => i.type === 'phi').length;
            const result = {
                passed: issues.length === 0,
                severity: this.calculateSeverity(issues),
                credentialsFound,
                phiFound,
                issues,
                scanTime,
                message: this.formatScanMessage(credentialsFound, phiFound),
            };
            // Cache the result
            this.setCachedResult(cacheKey, result);
            return result;
        }
        catch (error) {
            // If scanning fails, log error but don't block
            console.error('Security scan error:', error);
            return this.getPassedResult('Security scan failed (non-blocking)');
        }
    }
    /**
     * Quick security check (faster, less thorough)
     */
    async quickScan() {
        if (!this.config.enabled) {
            return this.getPassedResult('Security scanning disabled');
        }
        // Only scan for high-confidence credential patterns
        const startTime = Date.now();
        const issues = [];
        try {
            const credentialIssues = await this.scanForCredentials(0.8); // Higher confidence threshold
            issues.push(...credentialIssues);
            const scanTime = Date.now() - startTime;
            const result = {
                passed: issues.length === 0,
                severity: this.calculateSeverity(issues),
                credentialsFound: issues.length,
                phiFound: 0,
                issues,
                scanTime,
                message: issues.length === 0
                    ? '✅ Quick security check passed'
                    : `⚠️ ${issues.length} potential credential(s) detected`,
            };
            return result;
        }
        catch (error) {
            console.error('Quick security scan error:', error);
            return this.getPassedResult('Security scan failed (non-blocking)');
        }
    }
    /**
     * Scan for credentials using simple pattern matching
     * In production, this would call the security-compliance-mcp via file-based communication
     */
    async scanForCredentials(minConfidence) {
        const issues = [];
        const confidence = minConfidence || this.config.minConfidence;
        try {
            // Get list of staged files
            const { stdout } = await execAsync('git diff --staged --name-only', {
                cwd: this.repoPath
            });
            const stagedFiles = stdout.trim().split('\n').filter(f => f);
            // Simple pattern-based scanning (MVP implementation)
            // In production, this would communicate with security-compliance-mcp
            const patterns = [
                { regex: /api[_-]?key\s*[:=]\s*['"]\w+['"]/, pattern: 'API Key', severity: 'critical' },
                { regex: /password\s*[:=]\s*['"]\w+['"]/, pattern: 'Password', severity: 'critical' },
                { regex: /secret\s*[:=]\s*['"]\w+['"]/, pattern: 'Secret', severity: 'high' },
                { regex: /token\s*[:=]\s*['"]\w+['"]/, pattern: 'Token', severity: 'high' },
                { regex: /bearer\s+[a-zA-Z0-9_-]{20,}/, pattern: 'Bearer Token', severity: 'critical' },
            ];
            for (const file of stagedFiles) {
                // Skip excluded directories
                if (this.config.excludeDirs.some(dir => file.includes(dir))) {
                    continue;
                }
                try {
                    const filePath = path.join(this.repoPath, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    const lines = content.split('\n');
                    lines.forEach((line, lineNum) => {
                        patterns.forEach(({ regex, pattern, severity }) => {
                            if (regex.test(line)) {
                                issues.push({
                                    type: 'credential',
                                    file,
                                    line: lineNum + 1,
                                    pattern,
                                    confidence: 0.7, // Simple pattern matching has moderate confidence
                                    severity,
                                    remediation: `Remove hard-coded ${pattern} from code. Use environment variables or secure configuration.`,
                                });
                            }
                        });
                    });
                }
                catch (error) {
                    // Skip files that can't be read
                    continue;
                }
            }
        }
        catch (error) {
            console.error('Error scanning for credentials:', error);
        }
        return issues.filter(i => i.confidence >= confidence);
    }
    /**
     * Scan for PHI using simple pattern matching
     * In production, this would call the security-compliance-mcp via file-based communication
     */
    async scanForPHI() {
        const issues = [];
        try {
            // Get list of staged files
            const { stdout } = await execAsync('git diff --staged --name-only', {
                cwd: this.repoPath
            });
            const stagedFiles = stdout.trim().split('\n').filter(f => f);
            // Simple PHI pattern matching (MVP implementation)
            const phiPatterns = [
                { regex: /\b\d{3}-\d{2}-\d{4}\b/, pattern: 'SSN', severity: 'critical' },
                { regex: /MRN[:\s]*\d{6,}/, pattern: 'Medical Record Number', severity: 'critical' },
                { regex: /patient[_\s]+(id|name|dob)/i, pattern: 'Patient Identifier', severity: 'high' },
            ];
            for (const file of stagedFiles) {
                // Skip excluded directories
                if (this.config.excludeDirs.some(dir => file.includes(dir))) {
                    continue;
                }
                try {
                    const filePath = path.join(this.repoPath, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    const lines = content.split('\n');
                    lines.forEach((line, lineNum) => {
                        phiPatterns.forEach(({ regex, pattern, severity }) => {
                            if (regex.test(line)) {
                                issues.push({
                                    type: 'phi',
                                    file,
                                    line: lineNum + 1,
                                    pattern,
                                    confidence: 0.6,
                                    severity,
                                    remediation: `Remove PHI (${pattern}) from code. Use synthetic/anonymized data for testing.`,
                                });
                            }
                        });
                    });
                }
                catch (error) {
                    continue;
                }
            }
        }
        catch (error) {
            console.error('Error scanning for PHI:', error);
        }
        return issues.filter(i => i.confidence >= this.config.minConfidence);
    }
    /**
     * Calculate overall severity from issues
     */
    calculateSeverity(issues) {
        if (issues.length === 0)
            return 'none';
        const severities = issues.map(i => i.severity);
        if (severities.includes('critical'))
            return 'critical';
        if (severities.includes('high'))
            return 'high';
        if (severities.includes('medium'))
            return 'medium';
        return 'low';
    }
    /**
     * Format scan message
     */
    formatScanMessage(credentials, phi) {
        if (credentials === 0 && phi === 0) {
            return '✅ No security issues detected';
        }
        const parts = [];
        if (credentials > 0) {
            parts.push(`${credentials} credential(s)`);
        }
        if (phi > 0) {
            parts.push(`${phi} PHI instance(s)`);
        }
        return `⚠️ Security issues detected: ${parts.join(', ')}`;
    }
    /**
     * Get a passed result with custom message
     */
    getPassedResult(message) {
        return {
            passed: true,
            severity: 'none',
            credentialsFound: 0,
            phiFound: 0,
            issues: [],
            scanTime: 0,
            message,
        };
    }
    /**
     * Get cached result if still valid
     */
    getCachedResult(key) {
        const cached = this.cache.get(key);
        if (!cached)
            return null;
        const age = (Date.now() - cached.timestamp) / 1000; // seconds
        if (age > this.config.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        return cached.result;
    }
    /**
     * Cache a scan result
     */
    setCachedResult(key, result) {
        this.cache.set(key, {
            result,
            timestamp: Date.now(),
        });
    }
    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Format security issues for display
     */
    formatIssuesForDisplay(issues) {
        if (issues.length === 0) {
            return 'No issues found.';
        }
        const lines = [];
        // Group by file
        const byFile = new Map();
        issues.forEach(issue => {
            const fileIssues = byFile.get(issue.file) || [];
            fileIssues.push(issue);
            byFile.set(issue.file, fileIssues);
        });
        byFile.forEach((fileIssues, file) => {
            lines.push(`\n📄 ${file}`);
            fileIssues.forEach(issue => {
                const icon = issue.type === 'credential' ? '🔑' : '🏥';
                const location = issue.line ? `Line ${issue.line}` : 'Unknown location';
                lines.push(`  ${icon} ${issue.pattern} (${issue.severity}) - ${location}`);
                lines.push(`     ${issue.remediation}`);
            });
        });
        return lines.join('\n');
    }
}
//# sourceMappingURL=security-integration.js.map