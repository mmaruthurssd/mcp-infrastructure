/**
 * create_backup tool - Create a new backup with optional PHI scanning
 */
import { BackupEngine } from '../engines/BackupEngine.js';
export class CreateBackupTool {
    backupEngine;
    constructor(compressionLevel = 6, backupDirectory = '~/.backup-dr/backups') {
        this.backupEngine = new BackupEngine(compressionLevel, backupDirectory);
    }
    async execute(params) {
        // Validate sources
        if (!params.sources || params.sources.length === 0) {
            throw new Error('At least one source path is required');
        }
        // PHI scanning if requested
        let phiScanResults;
        if (params.scanPHI) {
            phiScanResults = await this.scanForPHI(params.sources, params.excludePatterns || []);
        }
        // Create backup params
        const backupParams = {
            sources: params.sources,
            type: params.type || 'incremental',
            label: params.label,
            compression: params.compression ?? true,
            verify: params.verify ?? false,
            excludePatterns: params.excludePatterns || []
        };
        // Execute backup
        const result = await this.backupEngine.createBackup(backupParams);
        // Format response
        const warnings = [];
        if (phiScanResults?.phiDetected) {
            warnings.push('PHI detected in backup - ensure compliance with HIPAA regulations');
        }
        if (result.metadata.errors && result.metadata.errors.length > 0) {
            warnings.push(`${result.metadata.errors.length} errors occurred during backup`);
        }
        return {
            success: result.success,
            backupId: result.backupId,
            metadata: {
                fileCount: result.metadata.fileCount,
                totalSize: result.metadata.totalSize,
                compressedSize: result.metadata.compressedSize,
                compressionRatio: result.metadata.compressionRatio,
                type: result.metadata.type,
                created: result.metadata.created
            },
            duration: result.duration,
            phiScanResults,
            warnings
        };
    }
    /**
     * Scan sources for PHI (integrates with security-compliance-mcp if available)
     */
    async scanForPHI(sources, _excludePatterns) {
        // This would integrate with security-compliance-mcp's scan_for_phi tool
        // For now, return a placeholder implementation
        const warnings = [];
        let phiDetected = false;
        // Placeholder: Check if sources include known PHI-containing directories
        const phiPaths = [
            '/patient-data',
            '/medical-records',
            '/phi',
            '/ehr-data',
            'patient-intake',
            'appointments'
        ];
        for (const source of sources) {
            const sourceLower = source.toLowerCase();
            if (phiPaths.some(path => sourceLower.includes(path))) {
                phiDetected = true;
                warnings.push(`Potential PHI detected in: ${source}`);
            }
        }
        return {
            filesScanned: sources.length,
            phiDetected,
            warnings
        };
    }
}
//# sourceMappingURL=createBackup.js.map