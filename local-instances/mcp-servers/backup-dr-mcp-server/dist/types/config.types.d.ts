/**
 * Configuration type definitions for Backup & DR MCP
 */
import { RetentionPolicy } from './backup.types.js';
export interface BackupDRConfig {
    version: string;
    backupDirectory: string;
    compression: {
        enabled: boolean;
        level: number;
        algorithm: 'gzip';
    };
    retention: RetentionPolicy;
    defaults: {
        backupType: 'full' | 'incremental';
        verify: boolean;
        excludePatterns: string[];
    };
    sources: string[];
    integrations: {
        phiScanningEnabled: boolean;
        preDeploymentBackup: boolean;
    };
}
export declare const DEFAULT_CONFIG: BackupDRConfig;
//# sourceMappingURL=config.types.d.ts.map