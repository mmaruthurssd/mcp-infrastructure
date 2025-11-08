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

export const DEFAULT_CONFIG: BackupDRConfig = {
  version: '1.0.0',
  backupDirectory: '~/.backup-dr/backups',
  compression: {
    enabled: true,
    level: 6,
    algorithm: 'gzip'
  },
  retention: {
    dailyRetention: 7,
    weeklyRetention: 4,
    monthlyRetention: 12
  },
  defaults: {
    backupType: 'incremental',
    verify: true,
    excludePatterns: [
      '**/node_modules/**',
      '**/.git/**',
      '**/temp/**',
      '**/*.log',
      '**/.DS_Store'
    ]
  },
  sources: [],
  integrations: {
    phiScanningEnabled: true,
    preDeploymentBackup: true
  }
};
