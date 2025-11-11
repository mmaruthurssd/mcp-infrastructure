import * as fs from "fs/promises";
import * as path from "path";
import { RollingDeploymentStrategy } from "./strategies/rollingDeployment.js";
import { BlueGreenDeploymentStrategy } from "./strategies/blueGreenDeployment.js";
import { CanaryDeploymentStrategy } from "./strategies/canaryDeployment.js";
import { RecreateDeploymentStrategy } from "./strategies/recreateDeployment.js";
export class DeploymentManager {
    projectPath;
    deploymentsDir;
    registryPath;
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.deploymentsDir = path.join(projectPath, ".deployments");
        this.registryPath = path.join(this.deploymentsDir, "registry.json");
    }
    async initialize() {
        // Create .deployments directory structure
        await fs.mkdir(this.deploymentsDir, { recursive: true });
        await fs.mkdir(path.join(this.deploymentsDir, "logs"), { recursive: true });
        // Initialize registry if it doesn't exist
        try {
            await fs.access(this.registryPath);
        }
        catch {
            const registry = {
                version: "1.0.0",
                projectPath: this.projectPath,
                lastUpdated: new Date().toISOString(),
                deployments: [],
            };
            await fs.writeFile(this.registryPath, JSON.stringify(registry, null, 2));
        }
    }
    generateDeploymentId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `dep-${timestamp}-${random}`;
    }
    async getRegistry() {
        try {
            const content = await fs.readFile(this.registryPath, "utf-8");
            return JSON.parse(content);
        }
        catch {
            // Return empty registry if file doesn't exist
            return {
                version: "1.0.0",
                projectPath: this.projectPath,
                lastUpdated: new Date().toISOString(),
                deployments: [],
            };
        }
    }
    async updateRegistry(record) {
        const registry = await this.getRegistry();
        // Add new deployment record
        registry.deployments.push(record);
        registry.lastUpdated = new Date().toISOString();
        // Keep only last 50 deployments
        if (registry.deployments.length > 50) {
            registry.deployments = registry.deployments.slice(-50);
        }
        await fs.writeFile(this.registryPath, JSON.stringify(registry, null, 2));
    }
    async getLastDeployment(environment) {
        const registry = await this.getRegistry();
        const envDeployments = registry.deployments
            .filter((d) => d.environment === environment && d.status === "success")
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return envDeployments[0] || null;
    }
    async writeDeploymentLog(deploymentId, logs) {
        const logPath = path.join(this.deploymentsDir, "logs", `${deploymentId}.log`);
        const logContent = logs.join("\n");
        await fs.writeFile(logPath, logContent);
        return logPath;
    }
    async deploy(environment, strategy, target, config, dryRun) {
        const deploymentId = this.generateDeploymentId();
        // Get version information
        const strategyInstance = this.createStrategy(strategy, {
            projectPath: this.projectPath,
            environment,
            target,
            config,
            dryRun,
            deploymentId,
            version: "", // Will be populated by strategy
        });
        const version = await strategyInstance["getVersion"]();
        const previousVersion = await strategyInstance["getPreviousVersion"]();
        // Update context with version
        const context = {
            projectPath: this.projectPath,
            environment,
            target,
            config,
            dryRun,
            deploymentId,
            version,
        };
        const deploymentStrategy = this.createStrategy(strategy, context);
        const result = await deploymentStrategy.deploy();
        // Write deployment log
        const logPath = await this.writeDeploymentLog(deploymentId, result.logs);
        return {
            deploymentId,
            success: result.success,
            servicesDeployed: result.servicesDeployed,
            duration: result.duration,
            logs: result.logs,
            errors: result.errors,
            version,
            previousVersion,
            logPath,
        };
    }
    createStrategy(strategy, context) {
        switch (strategy) {
            case "rolling":
                return new RollingDeploymentStrategy(context);
            case "blue-green":
                return new BlueGreenDeploymentStrategy(context);
            case "canary":
                return new CanaryDeploymentStrategy(context);
            case "recreate":
                return new RecreateDeploymentStrategy(context);
            default:
                throw new Error(`Unknown deployment strategy: ${strategy}`);
        }
    }
}
//# sourceMappingURL=deploymentManager.js.map