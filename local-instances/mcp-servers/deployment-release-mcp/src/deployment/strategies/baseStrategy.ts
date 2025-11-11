import { exec } from "child_process";
import { promisify } from "util";
import type { DeploymentConfig, Environment } from "../../types.js";

const execAsync = promisify(exec);

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

export abstract class BaseDeploymentStrategy {
  protected context: DeploymentContext;

  constructor(context: DeploymentContext) {
    this.context = context;
  }

  abstract deploy(): Promise<DeploymentResult>;

  protected async executeCommand(command: string, description: string): Promise<string> {
    const log = `[${new Date().toISOString()}] ${description}: ${command}`;

    if (this.context.dryRun) {
      return `[DRY-RUN] ${log}`;
    }

    try {
      const timeout = this.context.config?.timeout || 300000; // 5 minutes default
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.context.projectPath,
        timeout,
      });

      return `${log}\nOutput: ${stdout}\n${stderr ? `Stderr: ${stderr}` : ""}`;
    } catch (error: any) {
      throw new Error(`${description} failed: ${error.message}`);
    }
  }

  protected async checkHealth(): Promise<boolean> {
    if (this.context.dryRun) {
      return true;
    }

    const healthUrl = this.context.config?.healthCheckUrl;
    if (!healthUrl) {
      return true; // No health check configured
    }

    try {
      // Simple health check using curl
      await execAsync(`curl -f -s -o /dev/null -w "%{http_code}" "${healthUrl}"`, {
        timeout: 10000,
      });
      return true;
    } catch {
      return false;
    }
  }

  protected async getVersion(): Promise<string> {
    try {
      const { stdout } = await execAsync(`cd "${this.context.projectPath}" && git rev-parse --short HEAD`, {
        timeout: 5000,
      });
      return stdout.trim();
    } catch {
      return `v${Date.now()}`;
    }
  }

  protected async getPreviousVersion(): Promise<string> {
    try {
      const { stdout } = await execAsync(
        `cd "${this.context.projectPath}" && git rev-parse --short HEAD~1`,
        { timeout: 5000 }
      );
      return stdout.trim();
    } catch {
      return "unknown";
    }
  }
}
