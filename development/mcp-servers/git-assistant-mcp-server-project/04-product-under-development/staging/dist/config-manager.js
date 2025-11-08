// Configuration management for security integration
import fs from 'fs/promises';
import path from 'path';
export const DEFAULT_CONFIG = {
    enabled: true,
    scanCredentials: true,
    scanPHI: true,
    failOnSecurity: true,
    sensitivity: 'medium',
    minConfidence: 0.5,
    excludeDirs: [
        'node_modules',
        '.git',
        'dist',
        'build',
        'coverage',
        '.vscode',
        '.idea',
    ],
    cacheTimeout: 30,
    integrations: {
        gitAssistant: true,
        preCommitHook: true,
    },
    notifications: {
        showScanTime: true,
        verboseOutput: false,
    },
    customPatterns: {
        credentials: [],
        phi: [],
    },
};
export class ConfigManager {
    configPath;
    config;
    constructor(repoPath) {
        this.configPath = path.join(repoPath, '.git-security-config.json');
        this.config = { ...DEFAULT_CONFIG };
    }
    /**
     * Load configuration from file
     */
    async load() {
        try {
            const data = await fs.readFile(this.configPath, 'utf-8');
            const userConfig = JSON.parse(data);
            // Merge with defaults to ensure all fields exist
            this.config = {
                ...DEFAULT_CONFIG,
                ...userConfig,
                integrations: {
                    ...DEFAULT_CONFIG.integrations,
                    ...(userConfig.integrations || {}),
                },
                notifications: {
                    ...DEFAULT_CONFIG.notifications,
                    ...(userConfig.notifications || {}),
                },
                customPatterns: {
                    ...DEFAULT_CONFIG.customPatterns,
                    ...(userConfig.customPatterns || {}),
                },
            };
        }
        catch (error) {
            // Config file doesn't exist, use defaults
            this.config = { ...DEFAULT_CONFIG };
        }
        return this.config;
    }
    /**
     * Save configuration to file
     */
    async save() {
        await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    }
    /**
     * Get current configuration
     */
    get() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    async update(updates) {
        this.config = {
            ...this.config,
            ...updates,
        };
        await this.save();
        return this.config;
    }
    /**
     * Reset to default configuration
     */
    async reset() {
        this.config = { ...DEFAULT_CONFIG };
        await this.save();
        return this.config;
    }
    /**
     * Enable security scanning
     */
    async enable() {
        this.config.enabled = true;
        await this.save();
    }
    /**
     * Disable security scanning
     */
    async disable() {
        this.config.enabled = false;
        await this.save();
    }
    /**
     * Check if security scanning is enabled
     */
    isEnabled() {
        return this.config.enabled;
    }
    /**
     * Add custom credential pattern
     */
    async addCredentialPattern(pattern) {
        if (!this.config.customPatterns.credentials.includes(pattern)) {
            this.config.customPatterns.credentials.push(pattern);
            await this.save();
        }
    }
    /**
     * Add custom PHI pattern
     */
    async addPHIPattern(pattern) {
        if (!this.config.customPatterns.phi.includes(pattern)) {
            this.config.customPatterns.phi.push(pattern);
            await this.save();
        }
    }
    /**
     * Add directory to exclusion list
     */
    async excludeDirectory(dir) {
        if (!this.config.excludeDirs.includes(dir)) {
            this.config.excludeDirs.push(dir);
            await this.save();
        }
    }
    /**
     * Set sensitivity level
     */
    async setSensitivity(sensitivity) {
        this.config.sensitivity = sensitivity;
        // Adjust confidence threshold based on sensitivity
        switch (sensitivity) {
            case 'low':
                this.config.minConfidence = 0.8; // Fewer false positives
                break;
            case 'medium':
                this.config.minConfidence = 0.5; // Balanced
                break;
            case 'high':
                this.config.minConfidence = 0.3; // Catch more potential issues
                break;
        }
        await this.save();
    }
    /**
     * Validate configuration
     */
    validate() {
        const errors = [];
        if (this.config.minConfidence < 0 || this.config.minConfidence > 1) {
            errors.push('minConfidence must be between 0 and 1');
        }
        if (this.config.cacheTimeout < 0) {
            errors.push('cacheTimeout must be non-negative');
        }
        if (!['low', 'medium', 'high'].includes(this.config.sensitivity)) {
            errors.push('sensitivity must be "low", "medium", or "high"');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    /**
     * Export configuration as JSON string
     */
    export() {
        return JSON.stringify(this.config, null, 2);
    }
    /**
     * Import configuration from JSON string
     */
    async import(json) {
        try {
            const imported = JSON.parse(json);
            this.config = {
                ...DEFAULT_CONFIG,
                ...imported,
            };
            const validation = this.validate();
            if (!validation.valid) {
                throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
            }
            await this.save();
            return this.config;
        }
        catch (error) {
            throw new Error(`Failed to import configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
//# sourceMappingURL=config-manager.js.map