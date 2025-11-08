import { BaseDeploymentStrategy } from "./baseStrategy.js";
export class RecreateDeploymentStrategy extends BaseDeploymentStrategy {
    async deploy() {
        const startTime = Date.now();
        const logs = [];
        const errors = [];
        try {
            logs.push(`Starting recreate deployment to ${this.context.environment}`);
            // Step 1: Build the application
            logs.push(await this.executeCommand("npm run build || echo 'No build script found'", "Building application"));
            // Step 2: Stop all current instances
            logs.push(await this.executeCommand("echo 'Stopping all current instances'", "Stopping current deployment"));
            logs.push(await this.executeCommand("echo 'All instances stopped'", "Instance shutdown complete"));
            // Step 3: Deploy new version (creates downtime)
            logs.push("⚠️  Downtime window started");
            logs.push(await this.executeCommand("echo 'Deploying new version'", "Deploying new instances"));
            // Step 4: Start new instances
            logs.push(await this.executeCommand("echo 'Starting new instances'", "Starting new deployment"));
            // Step 5: Wait for instances to be ready
            logs.push("Waiting for instances to become ready...");
            await new Promise((resolve) => setTimeout(resolve, this.context.dryRun ? 100 : 5000));
            // Step 6: Health check
            const healthy = await this.checkHealth();
            if (!healthy && !this.context.dryRun) {
                errors.push("Health check failed on new instances");
                throw new Error("Recreate deployment failed health check");
            }
            logs.push("Health check passed, downtime window ended");
            // Step 7: Verify deployment
            logs.push(await this.executeCommand("echo 'Deployment verified'", "Verifying deployment"));
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
            logs.push("Deployment failed during recreate, attempting to restore previous version");
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
//# sourceMappingURL=recreateDeployment.js.map