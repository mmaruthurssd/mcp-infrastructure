import * as fs from "fs/promises";
import * as path from "path";
import type {
  DeploymentConfig,
  DeploymentRecord,
  DeploymentRegistry,
  DeploymentStrategy,
  Environment,
} from "../types.js";
import { RollingDeploymentStrategy } from "./strategies/rollingDeployment.js";
import { BlueGreenDeploymentStrategy } from "./strategies/blueGreenDeployment.js";
import { CanaryDeploymentStrategy } from "./strategies/canaryDeployment.js";
import { RecreateDeploymentStrategy } from "./strategies/recreateDeployment.js";
import type { BaseDeploymentStrategy, DeploymentContext } from "./strategies/baseStrategy.js";

export class DeploymentManager {
  private projectPath: string;
  private deploymentsDir: string;
  private registryPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.deploymentsDir = path.join(projectPath, ".deployments");
    this.registryPath = path.join(this.deploymentsDir, "registry.json");
  }

  async initialize(): Promise<void> {
    // Create .deployments directory structure
    await fs.mkdir(this.deploymentsDir, { recursive: true });
    await fs.mkdir(path.join(this.deploymentsDir, "logs"), { recursive: true });

    // Initialize registry if it doesn't exist
    try {
      await fs.access(this.registryPath);
    } catch {
      const registry: DeploymentRegistry = {
        version: "1.0.0",
        projectPath: this.projectPath,
        lastUpdated: new Date().toISOString(),
        deployments: [],
      };
      await fs.writeFile(this.registryPath, JSON.stringify(registry, null, 2));
    }
  }

  generateDeploymentId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `dep-${timestamp}-${random}`;
  }

  async getRegistry(): Promise<DeploymentRegistry> {
    try {
      const content = await fs.readFile(this.registryPath, "utf-8");
      return JSON.parse(content);
    } catch {
      // Return empty registry if file doesn't exist
      return {
        version: "1.0.0",
        projectPath: this.projectPath,
        lastUpdated: new Date().toISOString(),
        deployments: [],
      };
    }
  }

  async updateRegistry(record: DeploymentRecord): Promise<void> {
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

  async getLastDeployment(environment: Environment): Promise<DeploymentRecord | null> {
    const registry = await this.getRegistry();
    const envDeployments = registry.deployments
      .filter((d) => d.environment === environment && d.status === "success")
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return envDeployments[0] || null;
  }

  async writeDeploymentLog(deploymentId: string, logs: string[]): Promise<string> {
    const logPath = path.join(this.deploymentsDir, "logs", `${deploymentId}.log`);
    const logContent = logs.join("\n");
    await fs.writeFile(logPath, logContent);
    return logPath;
  }

  async deploy(
    environment: Environment,
    strategy: DeploymentStrategy,
    target: string | undefined,
    config: DeploymentConfig | undefined,
    dryRun: boolean
  ): Promise<{
    deploymentId: string;
    success: boolean;
    servicesDeployed: number;
    duration: number;
    logs: string[];
    errors: string[];
    version: string;
    previousVersion: string;
    logPath: string;
  }> {
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
    const context: DeploymentContext = {
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

  private createStrategy(
    strategy: DeploymentStrategy,
    context: DeploymentContext
  ): BaseDeploymentStrategy {
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
