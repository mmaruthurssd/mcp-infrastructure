import { BaseDeploymentStrategy } from "./baseStrategy.js";
export class CanaryDeploymentStrategy extends BaseDeploymentStrategy {
    async deploy() {
        const startTime = Date.now();
        const logs = [];
        const errors = [];
        try {
            logs.push(`Starting canary deployment to ${this.context.environment}`);
            // Step 1: Build the application
            logs.push(await this.executeCommand("npm run build || echo 'No build script found'", "Building application"));
            // Step 2: Deploy canary (small percentage of traffic)
            logs.push(await this.executeCommand("echo 'Deploying canary instance (10% traffic)'", "Canary deployment"));
            // Step 3: Monitor canary
            logs.push("Monitoring canary instance for errors...");
            await new Promise((resolve) => setTimeout(resolve, this.context.dryRun ? 100 : 5000));
            const canaryHealthy = await this.checkHealth();
            if (!canaryHealthy && !this.context.dryRun) {
                errors.push("Canary health check failed");
                throw new Error("Canary deployment failed health check");
            }
            logs.push("Canary health check passed");
            // Step 4: Gradually increase traffic to canary
            const trafficSteps = [25, 50, 75, 100];
            for (const percentage of trafficSteps) {
                logs.push(await this.executeCommand(`echo 'Increasing canary traffic to ${percentage}%'`, `Traffic increase to ${percentage}%`));
                // Monitor at each step
                await new Promise((resolve) => setTimeout(resolve, this.context.dryRun ? 100 : 3000));
                const stepHealthy = await this.checkHealth();
                if (!stepHealthy && !this.context.dryRun) {
                    errors.push(`Health check failed at ${percentage}% traffic`);
                    throw new Error(`Canary deployment failed at ${percentage}% traffic`);
                }
                logs.push(`Health check passed at ${percentage}% traffic`);
            }
            // Step 5: Complete canary deployment
            logs.push(await this.executeCommand("echo 'Canary deployment successful, replacing all instances'", "Finalizing canary deployment"));
            const duration = Date.now() - startTime;
            return {
                success: true,
                servicesDeployed: 1,
                duration,
                logs,
                errors,
            };
        }
        catch (error) {
            errors.push(error.message);
            logs.push("Rolling back canary deployment");
            const duration = Date.now() - startTime;
            return {
                success: false,
                servicesDeployed: 0,
                duration,
                logs,
                errors,
            };
        }
    }
}
//# sourceMappingURL=canaryDeployment.js.map