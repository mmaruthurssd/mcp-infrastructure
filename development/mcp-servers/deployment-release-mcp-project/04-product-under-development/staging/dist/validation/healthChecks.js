import { promises as fs } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import * as http from "http";
import * as https from "https";
const execAsync = promisify(exec);
/**
 * Check if specified processes are running
 */
export async function checkProcessesRunning(processNames = ["node"], timeout = 5000) {
    const startTime = Date.now();
    try {
        // Check if processes are running using ps command
        const { stdout } = await execAsync('ps aux');
        const runningProcesses = processNames.filter(name => stdout.toLowerCase().includes(name.toLowerCase()));
        const allRunning = runningProcesses.length === processNames.length;
        const duration = Date.now() - startTime;
        return {
            name: "Process Health Check",
            category: "service-health",
            status: allRunning ? "passed" : "failed",
            message: allRunning
                ? `All ${processNames.length} processes running: ${processNames.join(", ")}`
                : `Missing processes: ${processNames.filter(n => !runningProcesses.includes(n)).join(", ")}`,
            duration,
        };
    }
    catch (error) {
        const duration = Date.now() - startTime;
        return {
            name: "Process Health Check",
            category: "service-health",
            status: "failed",
            message: `Process check failed: ${error instanceof Error ? error.message : String(error)}`,
            duration,
        };
    }
}
/**
 * Check health endpoints using HTTP/HTTPS requests
 */
export async function checkHealthEndpoints(endpoints, timeout = 5000) {
    const checks = [];
    for (const endpoint of endpoints) {
        const startTime = Date.now();
        try {
            const status = await pingEndpoint(endpoint, timeout);
            const duration = Date.now() - startTime;
            checks.push({
                name: `Health Endpoint: ${endpoint}`,
                category: "service-health",
                status: status.ok ? "passed" : "failed",
                message: status.ok
                    ? `Endpoint responded with status ${status.statusCode} in ${duration}ms`
                    : `Endpoint failed: ${status.error}`,
                duration,
            });
        }
        catch (error) {
            const duration = Date.now() - startTime;
            checks.push({
                name: `Health Endpoint: ${endpoint}`,
                category: "service-health",
                status: "failed",
                message: `Request failed: ${error instanceof Error ? error.message : String(error)}`,
                duration,
            });
        }
    }
    return checks;
}
/**
 * Check for recent crashes in logs
 */
export async function checkForCrashes(projectPath, logPaths = ["logs", "deployment-logs"]) {
    const startTime = Date.now();
    try {
        const crashPatterns = [
            /error|exception|crash|fatal/i,
            /uncaught exception/i,
            /segmentation fault/i,
        ];
        let crashesFound = 0;
        const crashMessages = [];
        for (const logPath of logPaths) {
            const fullPath = `${projectPath}/${logPath}`;
            try {
                const files = await fs.readdir(fullPath);
                for (const file of files) {
                    if (file.endsWith('.log')) {
                        const content = await fs.readFile(`${fullPath}/${file}`, 'utf-8');
                        const lines = content.split('\n').slice(-100); // Check last 100 lines
                        for (const line of lines) {
                            if (crashPatterns.some(pattern => pattern.test(line))) {
                                crashesFound++;
                                if (crashMessages.length < 3) {
                                    crashMessages.push(line.substring(0, 100));
                                }
                            }
                        }
                    }
                }
            }
            catch (error) {
                // Log directory might not exist, that's okay
                continue;
            }
        }
        const duration = Date.now() - startTime;
        return {
            name: "Crash Detection",
            category: "service-health",
            status: crashesFound === 0 ? "passed" : crashesFound < 5 ? "warning" : "failed",
            message: crashesFound === 0
                ? "No crashes detected in recent logs"
                : `Found ${crashesFound} potential crash indicators: ${crashMessages.join("; ")}`,
            duration,
        };
    }
    catch (error) {
        const duration = Date.now() - startTime;
        return {
            name: "Crash Detection",
            category: "service-health",
            status: "warning",
            message: `Could not check logs: ${error instanceof Error ? error.message : String(error)}`,
            duration,
        };
    }
}
/**
 * Helper function to ping an HTTP/HTTPS endpoint
 */
function pingEndpoint(url, timeout) {
    return new Promise((resolve) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        const req = protocol.get(url, { timeout }, (res) => {
            resolve({
                ok: res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 500,
                statusCode: res.statusCode,
            });
            res.resume(); // Consume response data
        });
        req.on('error', (error) => {
            resolve({
                ok: false,
                error: error.message,
            });
        });
        req.on('timeout', () => {
            req.destroy();
            resolve({
                ok: false,
                error: `Request timeout after ${timeout}ms`,
            });
        });
    });
}
/**
 * Run all service health checks
 */
export async function runServiceHealthChecks(projectPath, config = {}) {
    const checks = [];
    // Check processes
    if (config.processNames && config.processNames.length > 0) {
        checks.push(await checkProcessesRunning(config.processNames, config.timeout));
    }
    // Check health endpoints
    if (config.healthEndpoints && config.healthEndpoints.length > 0) {
        const endpointChecks = await checkHealthEndpoints(config.healthEndpoints, config.timeout);
        checks.push(...endpointChecks);
    }
    // Check for crashes
    checks.push(await checkForCrashes(projectPath));
    return checks;
}
//# sourceMappingURL=healthChecks.js.map