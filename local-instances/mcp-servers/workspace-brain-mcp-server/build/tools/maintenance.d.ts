/**
 * Maintenance Tools
 * Archive, export, and storage management
 */
/**
 * Archive Old Data
 * Move old telemetry data to archives (Phase 1: just move, no compression yet)
 */
export declare function archiveOldData(args: any, brainPath: string): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
/**
 * Export Data
 * Export data to specified format
 */
export declare function exportData(args: any, brainPath: string): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
/**
 * Get Storage Stats
 * Calculate storage usage for external brain
 */
export declare function getStorageStats(args: any, brainPath: string): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=maintenance.d.ts.map