/**
 * SmokeTester Utility
 *
 * Performs basic smoke tests on MCP tools to verify they're callable
 * and handle basic scenarios correctly.
 */
import type { RunSmokeTestsOutput } from '../types.js';
export declare class SmokeTester {
    private mcpPath;
    private tools;
    constructor(mcpPath: string, tools?: string[]);
    /**
     * Run smoke tests
     */
    run(): Promise<RunSmokeTestsOutput>;
    /**
     * Test individual tool
     */
    private testTool;
    /**
     * Extract tool names from server.ts
     */
    private extractTools;
    /**
     * Check if tool schema is properly defined
     */
    private checkToolSchema;
    /**
     * Check if tool handler is implemented
     */
    private checkToolHandler;
    /**
     * Check if response structure is valid
     */
    private checkResponseStructure;
    /**
     * Check if error handling is present
     */
    private checkErrorHandling;
    /**
     * Create error result
     */
    private createErrorResult;
}
//# sourceMappingURL=smoke-tester.d.ts.map