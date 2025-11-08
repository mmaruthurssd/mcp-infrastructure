import type { DeploymentRegistry, DeploymentRecord } from '../types.js';
export declare class DeploymentRegistryManager {
    private registryPath;
    constructor(projectPath: string);
    ensureRegistryExists(): Promise<void>;
    getRegistry(): Promise<DeploymentRegistry>;
    saveRegistry(registry: DeploymentRegistry): Promise<void>;
    getDeployment(deploymentId: string): Promise<DeploymentRecord | null>;
    getLatestDeployment(environment: string): Promise<DeploymentRecord | null>;
    getPreviousDeployment(environment: string, currentDeploymentId?: string): Promise<DeploymentRecord | null>;
    addRollbackRecord(rollbackId: string, fromDeploymentId: string, toDeploymentId: string, reason: string): Promise<void>;
}
//# sourceMappingURL=registry.d.ts.map