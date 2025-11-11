import type { DeploymentConfig, Environment } from "../../types.js";
export interface DeploymentContext {
    projectPath: string;
    environment: Environment;
    target?: string;
    config?: DeploymentConfig;
    dryRun: boolean;
    deploymentId: string;
    version: string;
}
export interface DeploymentResult {
    success: boolean;
    servicesDeployed: number;
    duration: number;
    logs: string[];
    errors: string[];
}
export declare abstract class BaseDeploymentStrategy {
    protected context: DeploymentContext;
    constructor(context: DeploymentContext);
    abstract deploy(): Promise<DeploymentResult>;
    protected executeCommand(command: string, description: string): Promise<string>;
    protected checkHealth(): Promise<boolean>;
    protected getVersion(): Promise<string>;
    protected getPreviousVersion(): Promise<string>;
}
//# sourceMappingURL=baseStrategy.d.ts.map