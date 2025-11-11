/**
 * Domain Configuration Loader
 * Loads and manages domain-specific configurations
 */

import { promises as fs } from 'fs';
import path from 'path';
import { DomainConfig } from './types.js';

export class DomainConfigLoader {
  private configs: Map<string, DomainConfig> = new Map();
  private configDir: string;

  constructor(configDir: string) {
    this.configDir = configDir;
  }

  /**
   * Load all domain configurations from config directory
   */
  async loadAllConfigs(): Promise<void> {
    try {
      const files = await fs.readdir(this.configDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      for (const file of jsonFiles) {
        try {
          const configPath = path.join(this.configDir, file);
          const content = await fs.readFile(configPath, 'utf-8');
          const config: DomainConfig = JSON.parse(content);

          // Validate config
          this.validateConfig(config);

          this.configs.set(config.domain, config);
          console.error(`✓ Loaded domain config: ${config.domain} (${config.displayName})`);
        } catch (error: any) {
          console.error(`✗ Failed to load ${file}: ${error.message}`);
        }
      }

      console.error(`Loaded ${this.configs.size} domain configurations`);
    } catch (error: any) {
      console.error(`Failed to load domain configs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate domain configuration
   */
  private validateConfig(config: DomainConfig): void {
    if (!config.domain) throw new Error('Missing domain field');
    if (!config.knowledgeBaseFile) throw new Error('Missing knowledgeBaseFile field');
    if (!config.optimizationTriggers) throw new Error('Missing optimizationTriggers field');
    if (!Array.isArray(config.categories)) throw new Error('categories must be an array');
  }

  /**
   * Get configuration for a specific domain
   */
  getConfig(domain: string): DomainConfig | undefined {
    return this.configs.get(domain);
  }

  /**
   * List all available domains
   */
  listDomains(): string[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Get all configurations
   */
  getAllConfigs(): DomainConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Add a new domain configuration
   */
  async addDomain(config: DomainConfig): Promise<void> {
    this.validateConfig(config);

    // Save to file
    const configPath = path.join(this.configDir, `${config.domain}.json`);
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    // Add to memory
    this.configs.set(config.domain, config);

    console.error(`✓ Added domain config: ${config.domain}`);
  }

  /**
   * Resolve file paths relative to project root
   */
  resolveFilePath(domainConfig: DomainConfig, filePath: string, projectRoot: string): string {
    return path.join(projectRoot, filePath);
  }
}
