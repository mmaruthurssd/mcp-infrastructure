import { DependencyResolver } from "./dependencyResolver.js";
import { ReleaseRegistry } from "./releaseRegistry.js";
import { deployApplication } from "../tools/deployApplication.js";
import { rollbackDeployment } from "../tools/rollbackDeployment.js";
export class ReleaseCoordinator {
    dependencyResolver;
    releaseRegistry;
    constructor(projectPath) {
        this.dependencyResolver = new DependencyResolver();
        this.releaseRegistry = new ReleaseRegistry(projectPath);
    }
    /**
     * Initialize the release coordinator
     */
    async initialize() {
        await this.releaseRegistry.initialize();
    }
    /**
     * Coordinate a multi-service release
     */
    async coordinateRelease(params) {
        const { projectPath, releaseName, environment, services, strategy = "dependency-order", rollbackOnFailure = false, notifyChannels = [], } = params;
        const startTime = Date.now();
        const timestamp = new Date().toISOString();
        const releaseId = this.releaseRegistry.generateReleaseId(releaseName);
        console.error(`[ReleaseCoordinator] Starting release '${releaseName}' (${releaseId}) to ${environment}`);
        console.error(`[ReleaseCoordinator] Strategy: ${strategy}, Services: ${services.length}`);
        try {
            // Step 1: Validate dependencies
            console.error(`[ReleaseCoordinator] Validating dependencies...`);
            const validation = this.dependencyResolver.validateDependencies(services);
            if (!validation.valid) {
                throw new Error(`Dependency validation failed:\n${validation.errors.join("\n")}`);
            }
            if (validation.warnings.length > 0) {
                console.error(`[ReleaseCoordinator] Warnings:\n${validation.warnings.join("\n")}`);
            }
            // Step 2: Determine deployment order
            console.error(`[ReleaseCoordinator] Computing deployment order...`);
            const deploymentBatches = this.dependencyResolver.getDeploymentOrder(services, strategy);
            const deploymentOrder = deploymentBatches.flat();
            console.error(`[ReleaseCoordinator] Deployment order: ${deploymentOrder.join(" -> ")}`);
            console.error(`[ReleaseCoordinator] Batches: ${deploymentBatches.length}`);
            // Step 3: Create initial release record
            const releaseRecord = {
                releaseId,
                releaseName,
                environment,
                timestamp,
                status: "in-progress",
                services: services.map((s) => s.name),
                deploymentOrder,
                serviceResults: [],
                duration: 0,
                overallHealth: "healthy",
                releaseNotesPath: this.generateReleaseNotesPath(projectPath, releaseName, environment),
            };
            await this.releaseRegistry.addRelease(releaseRecord);
            // Step 4: Deploy services batch by batch
            const serviceResults = [];
            const deployedServices = [];
            let overallSuccess = true;
            for (let batchIndex = 0; batchIndex < deploymentBatches.length; batchIndex++) {
                const batch = deploymentBatches[batchIndex];
                console.error(`[ReleaseCoordinator] Deploying batch ${batchIndex + 1}/${deploymentBatches.length}: ${batch.join(", ")}`);
                // Deploy services in batch (parallel or sequential based on strategy)
                const batchResults = await this.deployBatch(projectPath, environment, batch, services, strategy === "parallel");
                serviceResults.push(...batchResults);
                // Check if any service in this batch failed
                const batchFailed = batchResults.some((r) => r.status === "failed");
                if (batchFailed) {
                    overallSuccess = false;
                    console.error(`[ReleaseCoordinator] Batch ${batchIndex + 1} failed, stopping deployment`);
                    // Track which services were deployed before failure
                    deployedServices.push(...batchResults.filter((r) => r.status === "success").map((r) => r.service));
                    // Handle rollback if enabled
                    if (rollbackOnFailure && deployedServices.length > 0) {
                        console.error(`[ReleaseCoordinator] Initiating rollback for ${deployedServices.length} deployed services`);
                        const rollbackResults = await this.rollbackServices(projectPath, environment, deployedServices, services, `Release ${releaseName} failed during deployment`);
                        // Update service results with rollback status
                        for (const rollbackResult of rollbackResults) {
                            const serviceResult = serviceResults.find((r) => r.service === rollbackResult.service);
                            if (serviceResult) {
                                serviceResult.status = "rolled-back";
                            }
                        }
                    }
                    break;
                }
                // Track successfully deployed services
                deployedServices.push(...batch);
            }
            // Step 5: Calculate overall health
            const overallHealth = this.calculateOverallHealth(serviceResults);
            // Step 6: Update release record with final status
            const duration = Date.now() - startTime;
            const finalStatus = overallSuccess ? "success" : rollbackOnFailure && deployedServices.length > 0 ? "rolled-back" : "failed";
            await this.releaseRegistry.updateRelease(releaseId, {
                status: finalStatus,
                serviceResults,
                duration,
                overallHealth,
            });
            // Step 7: Notify channels (placeholder for future implementation)
            if (notifyChannels.length > 0) {
                console.error(`[ReleaseCoordinator] Notifications would be sent to: ${notifyChannels.join(", ")}`);
            }
            // Step 8: Build result
            const result = {
                success: overallSuccess,
                releaseId,
                environment,
                timestamp,
                summary: {
                    totalServices: services.length,
                    deployed: serviceResults.filter((r) => r.status === "success").length,
                    failed: serviceResults.filter((r) => r.status === "failed").length,
                    rolledBack: serviceResults.filter((r) => r.status === "rolled-back")
                        .length,
                    duration,
                },
                deploymentOrder,
                serviceResults,
                overallHealth,
                releaseNotes: releaseRecord.releaseNotesPath,
            };
            console.error(`[ReleaseCoordinator] Release ${overallSuccess ? "succeeded" : "failed"} in ${duration}ms`);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[ReleaseCoordinator] Release failed: ${errorMessage}`);
            // Update registry with failure
            try {
                await this.releaseRegistry.updateRelease(releaseId, {
                    status: "failed",
                    duration,
                    overallHealth: "unhealthy",
                });
            }
            catch (updateError) {
                console.error(`[ReleaseCoordinator] Failed to update registry: ${updateError}`);
            }
            // Return failure result
            return {
                success: false,
                releaseId,
                environment,
                timestamp,
                summary: {
                    totalServices: services.length,
                    deployed: 0,
                    failed: services.length,
                    rolledBack: 0,
                    duration,
                },
                deploymentOrder: [],
                serviceResults: [],
                overallHealth: "unhealthy",
                releaseNotes: this.generateReleaseNotesPath(projectPath, releaseName, environment),
            };
        }
    }
    /**
     * Deploy a batch of services
     */
    async deployBatch(projectPath, environment, batch, allServices, parallel) {
        const results = [];
        if (parallel) {
            // Deploy all services in parallel
            const promises = batch.map((serviceName) => this.deployService(projectPath, environment, serviceName, allServices));
            const batchResults = await Promise.all(promises);
            results.push(...batchResults);
        }
        else {
            // Deploy services sequentially
            for (const serviceName of batch) {
                const result = await this.deployService(projectPath, environment, serviceName, allServices);
                results.push(result);
                // Stop if this service failed
                if (result.status === "failed") {
                    break;
                }
            }
        }
        return results;
    }
    /**
     * Deploy a single service
     */
    async deployService(projectPath, environment, serviceName, allServices) {
        const service = allServices.find((s) => s.name === serviceName);
        if (!service) {
            throw new Error(`Service '${serviceName}' not found in service list`);
        }
        const startTime = Date.now();
        try {
            console.error(`[ReleaseCoordinator] Deploying service '${serviceName}'...`);
            // Call deploy_application for this service
            const deployResult = await deployApplication({
                projectPath,
                environment,
                target: serviceName,
                strategy: "rolling", // Default strategy for individual services
                preChecks: true,
                dryRun: false,
                config: service.config,
            });
            const duration = Date.now() - startTime;
            const result = {
                service: serviceName,
                status: deployResult.success ? "success" : "failed",
                deploymentId: deployResult.deploymentId,
                version: service.version,
                duration,
                healthStatus: deployResult.success ? "healthy" : "unhealthy",
            };
            console.error(`[ReleaseCoordinator] Service '${serviceName}' deployment ${result.status} in ${duration}ms`);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[ReleaseCoordinator] Service '${serviceName}' deployment failed: ${errorMessage}`);
            return {
                service: serviceName,
                status: "failed",
                deploymentId: `error-${Date.now()}`,
                version: service.version,
                duration,
                healthStatus: "unhealthy",
            };
        }
    }
    /**
     * Rollback deployed services
     */
    async rollbackServices(projectPath, environment, servicesToRollback, allServices, reason) {
        console.error(`[ReleaseCoordinator] Rolling back ${servicesToRollback.length} services`);
        const results = [];
        // Rollback in reverse order
        const reversedServices = [...servicesToRollback].reverse();
        for (const serviceName of reversedServices) {
            const service = allServices.find((s) => s.name === serviceName);
            if (!service) {
                console.error(`[ReleaseCoordinator] Service '${serviceName}' not found, skipping rollback`);
                continue;
            }
            const startTime = Date.now();
            try {
                console.error(`[ReleaseCoordinator] Rolling back service '${serviceName}'...`);
                const rollbackResult = await rollbackDeployment({
                    projectPath,
                    environment,
                    target: serviceName,
                    preserveData: true,
                    reason,
                    force: false,
                });
                const duration = Date.now() - startTime;
                results.push({
                    service: serviceName,
                    status: rollbackResult.success ? "rolled-back" : "failed",
                    deploymentId: rollbackResult.rollbackId,
                    version: service.version,
                    duration,
                    healthStatus: rollbackResult.validation.healthChecks
                        ? "healthy"
                        : "unhealthy",
                });
                console.error(`[ReleaseCoordinator] Service '${serviceName}' rollback ${rollbackResult.success ? "succeeded" : "failed"} in ${duration}ms`);
            }
            catch (error) {
                const duration = Date.now() - startTime;
                console.error(`[ReleaseCoordinator] Service '${serviceName}' rollback failed: ${error}`);
                results.push({
                    service: serviceName,
                    status: "failed",
                    deploymentId: `rollback-error-${Date.now()}`,
                    version: service.version,
                    duration,
                    healthStatus: "unhealthy",
                });
            }
        }
        return results;
    }
    /**
     * Calculate overall health from service results
     */
    calculateOverallHealth(serviceResults) {
        if (serviceResults.length === 0) {
            return "unhealthy";
        }
        const successCount = serviceResults.filter((r) => r.status === "success")
            .length;
        const totalCount = serviceResults.length;
        const successRate = successCount / totalCount;
        if (successRate === 1.0) {
            return "healthy";
        }
        else if (successRate >= 0.5) {
            return "degraded";
        }
        else {
            return "unhealthy";
        }
    }
    /**
     * Generate release notes path
     */
    generateReleaseNotesPath(projectPath, releaseName, environment) {
        const sanitizedName = releaseName
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-");
        const timestamp = new Date().toISOString().split("T")[0];
        return `${projectPath}/.deployment-registry/release-notes/${environment}/${sanitizedName}-${timestamp}.md`;
    }
}
//# sourceMappingURL=releaseCoordinator.js.map