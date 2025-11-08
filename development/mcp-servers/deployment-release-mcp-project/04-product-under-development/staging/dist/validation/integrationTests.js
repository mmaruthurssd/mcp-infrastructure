import * as http from "http";
import * as https from "https";
/**
 * Test connectivity to external services
 */
export async function testExternalServices(services, timeout = 5000) {
    const checks = [];
    for (const service of services) {
        const startTime = Date.now();
        try {
            const result = await pingService(service, timeout);
            const duration = Date.now() - startTime;
            checks.push({
                name: `External Service: ${service}`,
                category: "integration",
                status: result.accessible ? "passed" : "warning",
                message: result.accessible
                    ? `Service accessible in ${duration}ms`
                    : `Service unreachable: ${result.error}`,
                duration,
            });
        }
        catch (error) {
            const duration = Date.now() - startTime;
            checks.push({
                name: `External Service: ${service}`,
                category: "integration",
                status: "warning",
                message: `Connectivity test failed: ${error instanceof Error ? error.message : String(error)}`,
                duration,
            });
        }
    }
    return checks;
}
/**
 * Test API integrations
 */
export async function testApiIntegrations(integrations, timeout = 5000) {
    const checks = [];
    for (const integration of integrations) {
        const startTime = Date.now();
        try {
            const result = await testApiIntegration(integration.endpoint, timeout);
            const duration = Date.now() - startTime;
            checks.push({
                name: `API Integration: ${integration.name}`,
                category: "integration",
                status: result.ok ? "passed" : "failed",
                message: result.ok
                    ? `Integration working (status ${result.statusCode}) in ${duration}ms`
                    : `Integration failed: ${result.error}`,
                duration,
            });
        }
        catch (error) {
            const duration = Date.now() - startTime;
            checks.push({
                name: `API Integration: ${integration.name}`,
                category: "integration",
                status: "failed",
                message: `Integration test error: ${error instanceof Error ? error.message : String(error)}`,
                duration,
            });
        }
    }
    return checks;
}
/**
 * Test webhook endpoints
 */
export async function testWebhooks(webhookEndpoints, timeout = 5000) {
    const checks = [];
    for (const endpoint of webhookEndpoints) {
        const startTime = Date.now();
        try {
            // Test webhook by sending a test POST request
            const result = await sendTestWebhook(endpoint, timeout);
            const duration = Date.now() - startTime;
            checks.push({
                name: `Webhook: ${endpoint}`,
                category: "integration",
                status: result.ok ? "passed" : "warning",
                message: result.ok
                    ? `Webhook responding (${result.statusCode})`
                    : `Webhook issue: ${result.error}`,
                duration,
            });
        }
        catch (error) {
            const duration = Date.now() - startTime;
            checks.push({
                name: `Webhook: ${endpoint}`,
                category: "integration",
                status: "warning",
                message: `Webhook test failed: ${error instanceof Error ? error.message : String(error)}`,
                duration,
            });
        }
    }
    return checks;
}
/**
 * Ping a service to check connectivity
 */
function pingService(url, timeout) {
    return new Promise((resolve) => {
        try {
            const urlObj = new URL(url);
            const protocol = urlObj.protocol === 'https:' ? https : http;
            const req = protocol.get(url, { timeout }, (res) => {
                resolve({ accessible: true });
                res.resume(); // Consume response data
            });
            req.on('error', (error) => {
                resolve({
                    accessible: false,
                    error: error.message,
                });
            });
            req.on('timeout', () => {
                req.destroy();
                resolve({
                    accessible: false,
                    error: `Timeout after ${timeout}ms`,
                });
            });
        }
        catch (error) {
            resolve({
                accessible: false,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });
}
/**
 * Test an API integration endpoint
 */
function testApiIntegration(url, timeout) {
    return new Promise((resolve) => {
        try {
            const urlObj = new URL(url);
            const protocol = urlObj.protocol === 'https:' ? https : http;
            const req = protocol.get(url, { timeout }, (res) => {
                const ok = res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 500;
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
        }
        catch (error) {
            resolve({
                ok: false,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });
}
/**
 * Send test webhook
 */
function sendTestWebhook(url, timeout) {
    return new Promise((resolve) => {
        try {
            const urlObj = new URL(url);
            const protocol = urlObj.protocol === 'https:' ? https : http;
            const data = JSON.stringify({ test: true, timestamp: new Date().toISOString() });
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length,
                },
                timeout,
            };
            const req = protocol.request(url, options, (res) => {
                const ok = res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 500;
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
            req.write(data);
            req.end();
        }
        catch (error) {
            resolve({
                ok: false,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });
}
/**
 * Run all integration validation checks
 */
export async function runIntegrationValidation(config = {}) {
    const checks = [];
    // Test external services
    if (config.externalServices && config.externalServices.length > 0) {
        const serviceChecks = await testExternalServices(config.externalServices, config.timeout);
        checks.push(...serviceChecks);
    }
    // Test API integrations
    if (config.apiIntegrations && config.apiIntegrations.length > 0) {
        const integrationChecks = await testApiIntegrations(config.apiIntegrations, config.timeout);
        checks.push(...integrationChecks);
    }
    return checks;
}
//# sourceMappingURL=integrationTests.js.map