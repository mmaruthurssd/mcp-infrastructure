/**
 * TestRunner Utility
 *
 * Executes unit and integration tests for MCP servers.
 * Supports Jest test framework with coverage reporting.
 */
import type { TestType, RunMcpTestsOutput } from '../types.js';
export declare class TestRunner {
    private mcpPath;
    private verbose;
    constructor(mcpPath: string, verbose?: boolean);
    /**
     * Execute tests for the MCP server
     */
    run(testType?: TestType, coverage?: boolean): Promise<RunMcpTestsOutput>;
    /**
     * Execute specific test type
     */
    private executeTests;
    /**
     * Run command in MCP directory
     */
    private runCommand;
    /**
     * Parse Jest JSON output
     */
    private parseTestResults;
    /**
     * Parse coverage report
     */
    private parseCoverage;
    /**
     * Combine unit and integration test results
     */
    private combineResults;
    /**
     * Validate MCP path exists and is accessible
     */
    private validateMcpPath;
}
//# sourceMappingURL=test-runner.d.ts.map