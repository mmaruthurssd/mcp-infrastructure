import { promises as fs } from 'fs';
import * as path from 'path';
export class DeploymentRegistryManager {
    registryPath;
    constructor(projectPath) {
        this.registryPath = path.join(projectPath, '.deployments', 'deployment-registry.json');
    }
    async ensureRegistryExists() {
        const dir = path.dirname(this.registryPath);
        await fs.mkdir(dir, { recursive: true });
        try {
            await fs.access(this.registryPath);
        }
        catch {
            const emptyRegistry = {
                version: '1.0.0',
                projectPath: path.dirname(dir),
                lastUpdated: new Date().toISOString(),
                deployments: [],
            };
            await fs.writeFile(this.registryPath, JSON.stringify(emptyRegistry, null, 2));
        }
    }
    async getRegistry() {
        await this.ensureRegistryExists();
        const content = await fs.readFile(this.registryPath, 'utf-8');
        return JSON.parse(content);
    }
    async saveRegistry(registry) {
        registry.lastUpdated = new Date().toISOString();
        await fs.writeFile(this.registryPath, JSON.stringify(registry, null, 2));
    }
    async getDeployment(deploymentId) {
        const registry = await this.getRegistry();
        return registry.deployments.find(d => d.id === deploymentId) || null;
    }
    async getLatestDeployment(environment) {
        const registry = await this.getRegistry();
        const envDeployments = registry.deployments
            .filter(d => d.environment === environment && d.status === 'success')
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return envDeployments[0] || null;
    }
    async getPreviousDeployment(environment, currentDeploymentId) {
        const registry = await this.getRegistry();
        const successfulDeployments = registry.deployments
            .filter(d => d.environment === environment &&
            d.status === 'success' &&
            (!currentDeploymentId || d.id !== currentDeploymentId))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return successfulDeployments[0] || null;
    }
    async addRollbackRecord(rollbackId, fromDeploymentId, toDeploymentId, reason) {
        const registry = await this.getRegistry();
        // Update the rolled-back deployment status
        const deployment = registry.deployments.find(d => d.id === fromDeploymentId);
        if (deployment) {
            deployment.status = 'rolled-back';
        }
        // Add rollback metadata to registry
        const rollbackRecord = {
            id: rollbackId,
            environment: deployment?.environment || 'unknown',
            strategy: 'rollback',
            version: registry.deployments.find(d => d.id === toDeploymentId)?.version || 'unknown',
            timestamp: new Date().toISOString(),
            status: 'success',
            duration: 0,
            servicesDeployed: deployment?.servicesDeployed || [],
            healthStatus: 'pending',
            rollbackAvailable: false,
        };
        registry.deployments.push(rollbackRecord);
        await this.saveRegistry(registry);
    }
}
//# sourceMappingURL=registry.js.map