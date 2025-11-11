export interface SnapshotMetadata {
    rollbackId: string;
    timestamp: string;
    environment: string;
    fromDeploymentId: string;
    toDeploymentId: string;
    preserveData: boolean;
}
export declare class StatePreservationManager {
    private projectPath;
    constructor(projectPath: string);
    createSnapshot(rollbackId: string, environment: string, fromDeploymentId: string, toDeploymentId: string, preserveData: boolean): Promise<string>;
    private snapshotConfiguration;
    private snapshotStateFiles;
    private snapshotDatabaseState;
    private copyDirectory;
    restoreSnapshot(snapshotDir: string): Promise<void>;
}
//# sourceMappingURL=statePreservation.d.ts.map