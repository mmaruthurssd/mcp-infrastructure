import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
export class BaseDeploymentStrategy {
    context;
    constructor(context) {
        this.context = context;
    }
    async executeCommand(command, description) {
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
        }
        catch (error) {
            throw new Error(`${description} failed: ${error.message}`);
        }
    }
    async checkHealth() {
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
        }
        catch {
            return false;
        }
    }
    async getVersion() {
        try {
            const { stdout } = await execAsync(`cd "${this.context.projectPath}" && git rev-parse --short HEAD`, {
                timeout: 5000,
            });
            return stdout.trim();
        }
        catch {
            return `v${Date.now()}`;
        }
    }
    async getPreviousVersion() {
        try {
            const { stdout } = await execAsync(`cd "${this.context.projectPath}" && git rev-parse --short HEAD~1`, { timeout: 5000 });
            return stdout.trim();
        }
        catch {
            return "unknown";
        }
    }
}
//# sourceMappingURL=baseStrategy.js.map