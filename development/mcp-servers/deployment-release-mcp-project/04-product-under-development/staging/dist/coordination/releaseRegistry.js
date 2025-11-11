import { promises as fs } from "fs";
import path from "path";
export class ReleaseRegistry {
    projectPath;
    registryPath;
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.registryPath = path.join(projectPath, ".deployment-registry", "releases.json");
    }
    /**
     * Initialize registry file if it doesn't exist
     */
    async initialize() {
        try {
            const registryDir = path.dirname(this.registryPath);
            await fs.mkdir(registryDir, { recursive: true });
            try {
                await fs.access(this.registryPath);
            }
            catch {
                // File doesn't exist, create it
                const initialData = {
                    version: "1.0.0",
                    projectPath: this.projectPath,
                    lastUpdated: new Date().toISOString(),
                    releases: [],
                };
                await fs.writeFile(this.registryPath, JSON.stringify(initialData, null, 2), "utf-8");
            }
        }
        catch (error) {
            console.error(`[ReleaseRegistry] Failed to initialize registry: ${error}`);
            throw error;
        }
    }
    /**
     * Load registry data
     */
    async load() {
        try {
            const content = await fs.readFile(this.registryPath, "utf-8");
            return JSON.parse(content);
        }
        catch (error) {
            console.error(`[ReleaseRegistry] Failed to load registry: ${error}`);
            throw new Error(`Failed to load release registry from ${this.registryPath}`);
        }
    }
    /**
     * Save registry data
     */
    async save(data) {
        try {
            data.lastUpdated = new Date().toISOString();
            await fs.writeFile(this.registryPath, JSON.stringify(data, null, 2), "utf-8");
        }
        catch (error) {
            console.error(`[ReleaseRegistry] Failed to save registry: ${error}`);
            throw error;
        }
    }
    /**
     * Add a new release record
     */
    async addRelease(record) {
        const data = await this.load();
        data.releases.push(record);
        await this.save(data);
    }
    /**
     * Update an existing release record
     */
    async updateRelease(releaseId, updates) {
        const data = await this.load();
        const index = data.releases.findIndex((r) => r.releaseId === releaseId);
        if (index === -1) {
            throw new Error(`Release '${releaseId}' not found in registry`);
        }
        data.releases[index] = {
            ...data.releases[index],
            ...updates,
        };
        await this.save(data);
    }
    /**
     * Get a release by ID
     */
    async getRelease(releaseId) {
        const data = await this.load();
        return data.releases.find((r) => r.releaseId === releaseId) || null;
    }
    /**
     * Get all releases for an environment
     */
    async getReleasesByEnvironment(environment) {
        const data = await this.load();
        return data.releases.filter((r) => r.environment === environment);
    }
    /**
     * Get the latest release for an environment
     */
    async getLatestRelease(environment) {
        const releases = await this.getReleasesByEnvironment(environment);
        if (releases.length === 0) {
            return null;
        }
        // Sort by timestamp descending
        releases.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return releases[0];
    }
    /**
     * Get all successful releases
     */
    async getSuccessfulReleases(environment) {
        const data = await this.load();
        let releases = data.releases.filter((r) => r.status === "success");
        if (environment) {
            releases = releases.filter((r) => r.environment === environment);
        }
        return releases;
    }
    /**
     * Get release statistics
     */
    async getStatistics(environment) {
        const data = await this.load();
        let releases = data.releases;
        if (environment) {
            releases = releases.filter((r) => r.environment === environment);
        }
        const total = releases.length;
        const successful = releases.filter((r) => r.status === "success").length;
        const failed = releases.filter((r) => r.status === "failed").length;
        const rolledBack = releases.filter((r) => r.status === "rolled-back").length;
        const inProgress = releases.filter((r) => r.status === "in-progress").length;
        const averageDuration = releases.length > 0
            ? releases.reduce((sum, r) => sum + r.duration, 0) / releases.length
            : 0;
        return {
            total,
            successful,
            failed,
            rolledBack,
            inProgress,
            averageDuration,
        };
    }
    /**
     * Generate a unique release ID
     */
    generateReleaseId(releaseName) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const sanitizedName = releaseName
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .substring(0, 20);
        return `release-${sanitizedName}-${timestamp}-${random}`;
    }
}
//# sourceMappingURL=releaseRegistry.js.map