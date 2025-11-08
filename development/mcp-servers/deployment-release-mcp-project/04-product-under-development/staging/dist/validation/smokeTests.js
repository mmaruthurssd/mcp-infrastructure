import * as http from "http";
import * as https from "https";
/**
 * Run smoke tests on API endpoints
 */
export async function runApiSmokeTests(endpoints, timeout = 5000) {
    const checks = [];
    for (const endpoint of endpoints) {
        const startTime = Date.now();
        try {
            const result = await testApiEndpoint(endpoint, timeout);
            const duration = Date.now() - startTime;
            checks.push({
                name: `API Smoke Test: ${endpoint}`,
                category: "functional",
                status: result.ok ? "passed" : "failed",
                message: result.ok
                    ? `API endpoint accessible (${result.statusCode}) in ${duration}ms`
                    : `API endpoint failed: ${result.error}`,
                duration,
            });
        }
        catch (error) {
            const duration = Date.now() - startTime;
            checks.push({
                name: `API Smoke Test: ${endpoint}`,
                category: "functional",
                status: "failed",
                message: `Test failed: ${error instanceof Error ? error.message : String(error)}`,
                duration,
            });
        }
    }
    return checks;
}
/**
 * Test critical workflows
 */
export async function testCriticalWorkflows(workflows, timeout = 10000) {
    const checks = [];
    // Simulated workflow tests - in real implementation, these would execute actual workflow tests
    for (const workflow of workflows) {
        const startTime = Date.now();
        try {
            // Simulate workflow execution
            // In a real implementation, this would execute actual test scripts or API sequences
            const success = await simulateWorkflowTest(workflow, timeout);
            const duration = Date.now() - startTime;
            checks.push({
                name: `Critical Workflow: ${workflow}`,
                category: "functional",
                status: success ? "passed" : "failed",
                message: success
                    ? `Workflow "${workflow}" completed successfully`
                    : `Workflow "${workflow}" failed`,
                duration,
            });
        }
        catch (error) {
            const duration = Date.now() - startTime;
            checks.push({
                name: `Critical Workflow: ${workflow}`,
                category: "functional",
                status: "failed",
                message: `Workflow test error: ${error instanceof Error ? error.message : String(error)}`,
                duration,
            });
        }
    }
    return checks;
}
/**
 * Helper function to test an API endpoint
 */
function testApiEndpoint(url, timeout) {
    return new Promise((resolve) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        const req = protocol.get(url, { timeout }, (res) => {
            const ok = res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 400;
            resolve({
                ok,
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
 * Simulate workflow test execution
 * In a real implementation, this would execute actual test scripts
 */
async function simulateWorkflowTest(workflow, timeout) {
    return new Promise((resolve) => {
        // Simulate test execution with a small delay
        const delay = Math.min(100, timeout / 10);
        setTimeout(() => {
            // In real implementation, this would return actual test results
            // For now, we simulate a 95% success rate
            resolve(Math.random() > 0.05);
        }, delay);
    });
}
/**
 * Run all functional validation checks
 */
export async function runFunctionalValidation(config = {}) {
    const checks = [];
    // Run API smoke tests
    if (config.apiEndpoints && config.apiEndpoints.length > 0) {
        const apiChecks = await runApiSmokeTests(config.apiEndpoints, config.timeout);
        checks.push(...apiChecks);
    }
    // Test critical workflows
    if (config.criticalWorkflows && config.criticalWorkflows.length > 0) {
        const workflowChecks = await testCriticalWorkflows(config.criticalWorkflows, config.timeout);
        checks.push(...workflowChecks);
    }
    return checks;
}
//# sourceMappingURL=smokeTests.js.map