import type { DeploymentConfig, DeploymentRecord, DeploymentRegistry, DeploymentStrategy, Environment } from "../types.js";
export declare class DeploymentManager {
    private projectPath;
    private deploymentsDir;
    private registryPath;
    constructor(projectPath: string);
    initialize(): Promise<void>;
    generateDeploymentId(): string;
    getRegistry(): Promise<DeploymentRegistry>;
    updateRegistry(record: DeploymentRecord): Promise<void>;
    getLastDeployment(environment: Environment): Promise<DeploymentRecord | null>;
    writeDeploymentLog(deploymentId: string, logs: string[]): Promise<string>;
    deploy(environment: Environment, strategy: DeploymentStrategy, target: string | undefined, config: DeploymentConfig | undefined, dryRun: boolean): Promise<{
        deploymentId: string;
        success: boolean;
        servicesDeployed: number;
        duration: number;
        logs: string[];
        errors: string[];
        version: string;
        previousVersion: string;
        logPath: string;
    }>;
    private createStrategy;
}
//# sourceMappingURL=deploymentManager.d.ts.map