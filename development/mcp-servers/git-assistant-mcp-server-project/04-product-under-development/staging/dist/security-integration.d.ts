export interface SecurityScanResult {
    passed: boolean;
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
    credentialsFound: number;
    phiFound: number;
    issues: SecurityIssue[];
    scanTime: number;
    message: string;
}
export interface SecurityIssue {
    type: 'credential' | 'phi';
    file: string;
    line?: number;
    pattern: string;
    confidence: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    matchedText?: string;
    remediation: string;
}
export interface SecurityConfig {
    enabled: boolean;
    scanCredentials: boolean;
    scanPHI: boolean;
    failOnSecurity: boolean;
    sensitivity: 'low' | 'medium' | 'high';
    minConfidence: number;
    excludeDirs: string[];
    cacheTimeout: number;
}
export declare class SecurityIntegration {
    private repoPath;
    private configPath;
    private cacheFile;
    private config;
    private cache;
    constructor(repoPath: string);
    /**
     * Load security configuration
     */
    loadConfig(): Promise<void>;
    /**
     * Save security configuration
     */
    saveConfig(): Promise<void>;
    /**
     * Check if security scanning is enabled
     */
    isEnabled(): boolean;
    /**
     * Run security scan on staged files
     */
    scanStaged(): Promise<SecurityScanResult>;
    /**
     * Quick security check (faster, less thorough)
     */
    quickScan(): Promise<SecurityScanResult>;
    /**
     * Scan for credentials using simple pattern matching
     * In production, this would call the security-compliance-mcp via file-based communication
     */
    private scanForCredentials;
    /**
     * Scan for PHI using simple pattern matching
     * In production, this would call the security-compliance-mcp via file-based communication
     */
    private scanForPHI;
    /**
     * Calculate overall severity from issues
     */
    private calculateSeverity;
    /**
     * Format scan message
     */
    private formatScanMessage;
    /**
     * Get a passed result with custom message
     */
    private getPassedResult;
    /**
     * Get cached result if still valid
     */
    private getCachedResult;
    /**
     * Cache a scan result
     */
    private setCachedResult;
    /**
     * Clear the cache
     */
    clearCache(): void;
    /**
     * Format security issues for display
     */
    formatIssuesForDisplay(issues: SecurityIssue[]): string;
}
//# sourceMappingURL=security-integration.d.ts.map