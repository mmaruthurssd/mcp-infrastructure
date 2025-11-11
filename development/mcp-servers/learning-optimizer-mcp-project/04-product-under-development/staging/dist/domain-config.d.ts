/**
 * Domain Configuration Loader
 * Loads and manages domain-specific configurations
 */
import { DomainConfig } from './types.js';
export declare class DomainConfigLoader {
    private configs;
    private configDir;
    constructor(configDir: string);
    /**
     * Load all domain configurations from config directory
     */
    loadAllConfigs(): Promise<void>;
    /**
     * Validate domain configuration
     */
    private validateConfig;
    /**
     * Get configuration for a specific domain
     */
    getConfig(domain: string): DomainConfig | undefined;
    /**
     * List all available domains
     */
    listDomains(): string[];
    /**
     * Get all configurations
     */
    getAllConfigs(): DomainConfig[];
    /**
     * Add a new domain configuration
     */
    addDomain(config: DomainConfig): Promise<void>;
    /**
     * Resolve file paths relative to project root
     */
    resolveFilePath(domainConfig: DomainConfig, filePath: string, projectRoot: string): string;
}
//# sourceMappingURL=domain-config.d.ts.map