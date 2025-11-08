/**
 * Configuration type definitions for Backup & DR MCP
 */
export const DEFAULT_CONFIG = {
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
//# sourceMappingURL=config.types.js.map