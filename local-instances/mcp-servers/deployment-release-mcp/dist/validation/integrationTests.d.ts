import type { ValidationCheck } from "../types.js";
export interface IntegrationTestConfig {
    externalServices?: string[];
    apiIntegrations?: Array<{
        name: string;
        endpoint: string;
    }>;
    timeout?: number;
}
/**
 * Test connectivity to external services
 */
export declare function testExternalServices(services: string[], timeout?: number): Promise<ValidationCheck[]>;
/**
 * Test API integrations
 */
export declare function testApiIntegrations(integrations: Array<{
    name: string;
    endpoint: string;
}>, timeout?: number): Promise<ValidationCheck[]>;
/**
 * Test webhook endpoints
 */
export declare function testWebhooks(webhookEndpoints: string[], timeout?: number): Promise<ValidationCheck[]>;
/**
 * Run all integration validation checks
 */
export declare function runIntegrationValidation(config?: IntegrationTestConfig): Promise<ValidationCheck[]>;
//# sourceMappingURL=integrationTests.d.ts.map