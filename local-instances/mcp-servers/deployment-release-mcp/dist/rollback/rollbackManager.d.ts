import type { Environment, DeploymentRecord } from '../types.js';
export interface RollbackExecutionResult {
    success: boolean;
    servicesRolledBack: number;
    duration: number;
    errors: string[];
}
export declare class RollbackManager {
    executeRollback(projectPath: string, environment: Environment, targetDeployment: DeploymentRecord, preserveData: boolean): Promise<RollbackExecutionResult>;
    private stopServices;
    private rollbackCode;
    private restoreConfiguration;
    private rollbackDatabase;
    private startServices;
}
//# sourceMappingURL=rollbackManager.d.ts.map