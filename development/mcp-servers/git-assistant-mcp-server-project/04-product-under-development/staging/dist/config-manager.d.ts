export interface SecurityConfig {
    enabled: boolean;
    scanCredentials: boolean;
    scanPHI: boolean;
    failOnSecurity: boolean;
    sensitivity: 'low' | 'medium' | 'high';
    minConfidence: number;
    excludeDirs: string[];
    cacheTimeout: number;
    integrations: {
        gitAssistant: boolean;
        preCommitHook: boolean;
    };
    notifications: {
        showScanTime: boolean;
        verboseOutput: boolean;
    };
    customPatterns: {
        credentials: string[];
        phi: string[];
    };
}
export declare const DEFAULT_CONFIG: SecurityConfig;
export declare class ConfigManager {
    private configPath;
    private config;
    constructor(repoPath: string);
    /**
     * Load configuration from file
     */
    load(): Promise<SecurityConfig>;
    /**
     * Save configuration to file
     */
    save(): Promise<void>;
    /**
     * Get current configuration
     */
    get(): SecurityConfig;
    /**
     * Update configuration
     */
    update(updates: Partial<SecurityConfig>): Promise<SecurityConfig>;
    /**
     * Reset to default configuration
     */
    reset(): Promise<SecurityConfig>;
    /**
     * Enable security scanning
     */
    enable(): Promise<void>;
    /**
     * Disable security scanning
     */
    disable(): Promise<void>;
    /**
     * Check if security scanning is enabled
     */
    isEnabled(): boolean;
    /**
     * Add custom credential pattern
     */
    addCredentialPattern(pattern: string): Promise<void>;
    /**
     * Add custom PHI pattern
     */
    addPHIPattern(pattern: string): Promise<void>;
    /**
     * Add directory to exclusion list
     */
    excludeDirectory(dir: string): Promise<void>;
    /**
     * Set sensitivity level
     */
    setSensitivity(sensitivity: 'low' | 'medium' | 'high'): Promise<void>;
    /**
     * Validate configuration
     */
    validate(): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Export configuration as JSON string
     */
    export(): string;
    /**
     * Import configuration from JSON string
     */
    import(json: string): Promise<SecurityConfig>;
}
//# sourceMappingURL=config-manager.d.ts.map