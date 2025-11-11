import type { CoordinateReleaseParams, CoordinateReleaseResult } from "../types.js";
export declare class ReleaseCoordinator {
    private dependencyResolver;
    private releaseRegistry;
    constructor(projectPath: string);
    /**
     * Initialize the release coordinator
     */
    initialize(): Promise<void>;
    /**
     * Coordinate a multi-service release
     */
    coordinateRelease(params: CoordinateReleaseParams): Promise<CoordinateReleaseResult>;
    /**
     * Deploy a batch of services
     */
    private deployBatch;
    /**
     * Deploy a single service
     */
    private deployService;
    /**
     * Rollback deployed services
     */
    private rollbackServices;
    /**
     * Calculate overall health from service results
     */
    private calculateOverallHealth;
    /**
     * Generate release notes path
     */
    private generateReleaseNotesPath;
}
//# sourceMappingURL=releaseCoordinator.d.ts.map