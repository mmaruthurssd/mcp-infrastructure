import type { ServiceResult, HealthStatus } from "../types.js";
export interface ReleaseRecord {
    releaseId: string;
    releaseName: string;
    environment: string;
    timestamp: string;
    status: "in-progress" | "success" | "failed" | "rolled-back";
    services: string[];
    deploymentOrder: string[];
    serviceResults: ServiceResult[];
    duration: number;
    overallHealth: HealthStatus;
    releaseNotesPath: string;
}
export interface ReleaseRegistryData {
    version: string;
    projectPath: string;
    lastUpdated: string;
    releases: ReleaseRecord[];
}
export declare class ReleaseRegistry {
    private projectPath;
    private registryPath;
    constructor(projectPath: string);
    /**
     * Initialize registry file if it doesn't exist
     */
    initialize(): Promise<void>;
    /**
     * Load registry data
     */
    load(): Promise<ReleaseRegistryData>;
    /**
     * Save registry data
     */
    save(data: ReleaseRegistryData): Promise<void>;
    /**
     * Add a new release record
     */
    addRelease(record: ReleaseRecord): Promise<void>;
    /**
     * Update an existing release record
     */
    updateRelease(releaseId: string, updates: Partial<ReleaseRecord>): Promise<void>;
    /**
     * Get a release by ID
     */
    getRelease(releaseId: string): Promise<ReleaseRecord | null>;
    /**
     * Get all releases for an environment
     */
    getReleasesByEnvironment(environment: string): Promise<ReleaseRecord[]>;
    /**
     * Get the latest release for an environment
     */
    getLatestRelease(environment: string): Promise<ReleaseRecord | null>;
    /**
     * Get all successful releases
     */
    getSuccessfulReleases(environment?: string): Promise<ReleaseRecord[]>;
    /**
     * Get release statistics
     */
    getStatistics(environment?: string): Promise<{
        total: number;
        successful: number;
        failed: number;
        rolledBack: number;
        inProgress: number;
        averageDuration: number;
    }>;
    /**
     * Generate a unique release ID
     */
    generateReleaseId(releaseName: string): string;
}
//# sourceMappingURL=releaseRegistry.d.ts.map