/**
 * TestRunner Utility
 *
 * Executes unit and integration tests for MCP servers.
 * Supports Jest test framework with coverage reporting.
 */
import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
export class TestRunner {
    mcpPath;
    verbose;
    constructor(mcpPath, verbose = false) {
        this.mcpPath = mcpPath;
        this.verbose = verbose;
    }
    /**
     * Execute tests for the MCP server
     */
    async run(testType = 'all', coverage = false) {
        try {
            // Validate MCP path
            const validationError = this.validateMcpPath();
            if (validationError) {
                return {
                    success: false,
                    results: { total: { passed: 0, failed: 0, skipped: 0, executionTime: 0 } },
                    error: validationError,
                };
            }
            // Check if package.json exists and has test script
            const packageJsonPath = join(this.mcpPath, 'package.json');
            if (!existsSync(packageJsonPath)) {
                return {
                    success: false,
                    results: { total: { passed: 0, failed: 0, skipped: 0, executionTime: 0 } },
                    error: 'package.json not found in MCP path',
                };
            }
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            if (!packageJson.scripts?.test) {
                return {
                    success: false,
                    results: { total: { passed: 0, failed: 0, skipped: 0, executionTime: 0 } },
                    error: 'No test script defined in package.json',
                };
            }
            // Execute tests based on type
            const startTime = Date.now();
            let testResults;
            if (testType === 'all') {
                const unitResults = await this.executeTests('unit', coverage);
                const integrationResults = await this.executeTests('integration', coverage);
                testResults = this.combineResults(unitResults, integrationResults);
            }
            else {
                testResults = await this.executeTests(testType, coverage);
            }
            const executionTime = Date.now() - startTime;
            testResults.results.total.executionTime = executionTime;
            return testResults;
        }
        catch (error) {
            return {
                success: false,
                results: { total: { passed: 0, failed: 0, skipped: 0, executionTime: 0 } },
                error: `Test execution failed: ${error}`,
            };
        }
    }
    /**
     * Execute specific test type
     */
    async executeTests(testType, coverage) {
        const testMatch = testType === 'unit' ? '**/unit/**/*.test.ts' : '**/integration/**/*.test.ts';
        const args = ['test'];
        // Add test match pattern
        if (testType !== 'unit') {
            // For integration, use the integration script if available
            const packageJsonPath = join(this.mcpPath, 'package.json');
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            if (packageJson.scripts?.['test:integration']) {
                args[0] = 'run';
                args.push('test:integration');
            }
            else {
                args.push('--testMatch=' + testMatch);
            }
        }
        // Add coverage flag
        if (coverage) {
            args.push('--coverage');
            args.push('--coverageReporters=json');
            args.push('--coverageReporters=text');
        }
        // Add JSON reporter for parsing results
        args.push('--json');
        args.push('--testLocationInResults');
        if (this.verbose) {
            args.push('--verbose');
        }
        const result = await this.runCommand('npm', args);
        if (!result.success) {
            return {
                success: false,
                results: {
                    total: { passed: 0, failed: 0, skipped: 0, executionTime: 0 },
                },
                error: result.error || 'Test execution failed',
            };
        }
        // Parse test results
        const parsedResults = this.parseTestResults(result.stdout, testType);
        // Parse coverage if requested
        if (coverage) {
            const coverageReport = this.parseCoverage();
            if (coverageReport) {
                parsedResults.coverage = coverageReport;
            }
        }
        return parsedResults;
    }
    /**
     * Run command in MCP directory
     */
    runCommand(command, args) {
        return new Promise((resolve) => {
            const proc = spawn(command, args, {
                cwd: this.mcpPath,
                shell: true,
            });
            let stdout = '';
            let stderr = '';
            proc.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            proc.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            proc.on('close', (code) => {
                if (code === 0) {
                    resolve({ success: true, stdout, stderr });
                }
                else {
                    resolve({
                        success: false,
                        stdout,
                        stderr,
                        error: `Command exited with code ${code}`,
                    });
                }
            });
            proc.on('error', (error) => {
                resolve({
                    success: false,
                    stdout,
                    stderr,
                    error: error.message,
                });
            });
        });
    }
    /**
     * Parse Jest JSON output
     */
    parseTestResults(jsonOutput, testType) {
        try {
            const jestResult = JSON.parse(jsonOutput);
            const results = {
                passed: jestResult.numPassedTests || 0,
                failed: jestResult.numFailedTests || 0,
                skipped: jestResult.numPendingTests || 0,
                executionTime: jestResult.testResults?.reduce((sum, r) => sum + (r.perfStats?.runtime || 0), 0) || 0,
            };
            const failures = [];
            // Extract failures
            if (jestResult.testResults) {
                for (const testFile of jestResult.testResults) {
                    if (testFile.status === 'failed') {
                        for (const testCase of testFile.assertionResults || []) {
                            if (testCase.status === 'failed') {
                                failures.push({
                                    test: testCase.title,
                                    suite: testFile.name,
                                    error: testCase.failureMessages?.join('\n') || 'Unknown error',
                                    stack: testCase.failureMessages?.join('\n') || '',
                                });
                            }
                        }
                    }
                }
            }
            const output = {
                success: jestResult.success,
                results: {
                    total: results,
                },
            };
            // Add test type specific results
            if (testType === 'unit') {
                output.results.unit = results;
            }
            else {
                output.results.integration = results;
            }
            if (failures.length > 0) {
                output.failures = failures;
            }
            return output;
        }
        catch (error) {
            return {
                success: false,
                results: {
                    total: { passed: 0, failed: 0, skipped: 0, executionTime: 0 },
                },
                error: `Failed to parse test results: ${error}`,
            };
        }
    }
    /**
     * Parse coverage report
     */
    parseCoverage() {
        try {
            const coveragePath = join(this.mcpPath, 'coverage', 'coverage-final.json');
            if (!existsSync(coveragePath)) {
                return undefined;
            }
            const coverageData = JSON.parse(readFileSync(coveragePath, 'utf-8'));
            let totalStatements = 0;
            let coveredStatements = 0;
            let totalBranches = 0;
            let coveredBranches = 0;
            let totalFunctions = 0;
            let coveredFunctions = 0;
            let totalLines = 0;
            let coveredLines = 0;
            const files = [];
            for (const [filePath, fileData] of Object.entries(coverageData)) {
                const data = fileData;
                // Calculate file coverage
                const stmtTotal = Object.keys(data.s || {}).length;
                const stmtCovered = Object.values(data.s || {}).filter((v) => v > 0).length;
                const branchTotal = Object.keys(data.b || {}).length;
                const branchCovered = Object.values(data.b || {}).filter((arr) => arr.some((v) => v > 0)).length;
                const funcTotal = Object.keys(data.f || {}).length;
                const funcCovered = Object.values(data.f || {}).filter((v) => v > 0).length;
                const lineTotal = Object.keys(data.statementMap || {}).length;
                const lineCovered = Object.values(data.s || {}).filter((v) => v > 0).length;
                totalStatements += stmtTotal;
                coveredStatements += stmtCovered;
                totalBranches += branchTotal;
                coveredBranches += branchCovered;
                totalFunctions += funcTotal;
                coveredFunctions += funcCovered;
                totalLines += lineTotal;
                coveredLines += lineCovered;
                // Find uncovered lines
                const uncoveredLines = [];
                for (const [lineNum, count] of Object.entries(data.s || {})) {
                    if (count === 0) {
                        const line = data.statementMap?.[lineNum]?.start?.line;
                        if (line) {
                            uncoveredLines.push(line);
                        }
                    }
                }
                files.push({
                    path: filePath.replace(this.mcpPath, '').replace(/^\//, ''),
                    statements: stmtTotal > 0 ? Math.round((stmtCovered / stmtTotal) * 100) : 0,
                    branches: branchTotal > 0 ? Math.round((branchCovered / branchTotal) * 100) : 0,
                    functions: funcTotal > 0 ? Math.round((funcCovered / funcTotal) * 100) : 0,
                    lines: lineTotal > 0 ? Math.round((lineCovered / lineTotal) * 100) : 0,
                    uncoveredLines,
                });
            }
            return {
                overall: totalStatements > 0 ? Math.round((coveredStatements / totalStatements) * 100) : 0,
                statements: totalStatements > 0 ? Math.round((coveredStatements / totalStatements) * 100) : 0,
                branches: totalBranches > 0 ? Math.round((coveredBranches / totalBranches) * 100) : 0,
                functions: totalFunctions > 0 ? Math.round((coveredFunctions / totalFunctions) * 100) : 0,
                lines: totalLines > 0 ? Math.round((coveredLines / totalLines) * 100) : 0,
                files,
            };
        }
        catch (error) {
            if (this.verbose) {
                console.error('Failed to parse coverage:', error);
            }
            return undefined;
        }
    }
    /**
     * Combine unit and integration test results
     */
    combineResults(unitResults, integrationResults) {
        const combined = {
            success: unitResults.success && integrationResults.success,
            results: {
                unit: unitResults.results.unit || unitResults.results.total,
                integration: integrationResults.results.integration || integrationResults.results.total,
                total: {
                    passed: (unitResults.results.total.passed || 0) + (integrationResults.results.total.passed || 0),
                    failed: (unitResults.results.total.failed || 0) + (integrationResults.results.total.failed || 0),
                    skipped: (unitResults.results.total.skipped || 0) + (integrationResults.results.total.skipped || 0),
                    executionTime: (unitResults.results.total.executionTime || 0) + (integrationResults.results.total.executionTime || 0),
                },
            },
        };
        // Combine failures
        const failures = [...(unitResults.failures || []), ...(integrationResults.failures || [])];
        if (failures.length > 0) {
            combined.failures = failures;
        }
        // Use coverage from unit tests if available (typically unit tests generate coverage)
        if (unitResults.coverage) {
            combined.coverage = unitResults.coverage;
        }
        else if (integrationResults.coverage) {
            combined.coverage = integrationResults.coverage;
        }
        return combined;
    }
    /**
     * Validate MCP path exists and is accessible
     */
    validateMcpPath() {
        if (!this.mcpPath) {
            return 'MCP path is required';
        }
        if (!existsSync(this.mcpPath)) {
            return `MCP path does not exist: ${this.mcpPath}`;
        }
        // Check if tests directory exists
        const testsPath = join(this.mcpPath, 'tests');
        if (!existsSync(testsPath)) {
            return 'Tests directory not found in MCP path';
        }
        return null;
    }
}
//# sourceMappingURL=test-runner.js.map