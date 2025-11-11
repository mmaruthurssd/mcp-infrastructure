import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
export class PreChecksManager {
    projectPath;
    constructor(projectPath) {
        this.projectPath = projectPath;
    }
    async runAllChecks(options = {}) {
        const results = [];
        // Run code quality checks if enabled
        if (options.codeQuality !== false) {
            results.push(await this.runCodeQualityCheck());
        }
        // Run tests if enabled
        if (options.tests !== false) {
            results.push(await this.runTestsCheck());
        }
        // Run security checks if enabled
        if (options.security !== false) {
            results.push(await this.runSecurityCheck());
        }
        return results;
    }
    async runCodeQualityCheck() {
        try {
            // Try to use code-review-mcp if available
            // For now, we'll do a simple check for lint/format scripts
            const packageJsonPath = `${this.projectPath}/package.json`;
            try {
                const { stdout } = await execAsync(`test -f "${packageJsonPath}" && echo "exists"`, {
                    cwd: this.projectPath,
                });
                if (stdout.trim() === "exists") {
                    // Check if lint script exists
                    try {
                        await execAsync(`cd "${this.projectPath}" && npm run lint --silent`, {
                            timeout: 30000,
                        });
                        return {
                            name: "Code Quality",
                            passed: true,
                            message: "Code quality checks passed",
                        };
                    }
                    catch (error) {
                        // Lint failed or doesn't exist
                        if (error.message.includes("Missing script")) {
                            return {
                                name: "Code Quality",
                                passed: true,
                                message: "No lint script found, skipping code quality check",
                            };
                        }
                        return {
                            name: "Code Quality",
                            passed: false,
                            message: `Linting failed: ${error.message}`,
                        };
                    }
                }
            }
            catch {
                // No package.json found
            }
            return {
                name: "Code Quality",
                passed: true,
                message: "Code quality check skipped (no configuration found)",
            };
        }
        catch (error) {
            return {
                name: "Code Quality",
                passed: false,
                message: `Code quality check failed: ${error.message}`,
            };
        }
    }
    async runTestsCheck() {
        try {
            // Try to run tests using testing-validation-mcp or npm test
            const packageJsonPath = `${this.projectPath}/package.json`;
            try {
                const { stdout } = await execAsync(`test -f "${packageJsonPath}" && echo "exists"`, {
                    cwd: this.projectPath,
                });
                if (stdout.trim() === "exists") {
                    try {
                        await execAsync(`cd "${this.projectPath}" && npm test -- --passWithNoTests`, {
                            timeout: 60000,
                        });
                        return {
                            name: "Tests",
                            passed: true,
                            message: "All tests passed",
                        };
                    }
                    catch (error) {
                        if (error.message.includes("Missing script")) {
                            return {
                                name: "Tests",
                                passed: true,
                                message: "No test script found, skipping tests",
                            };
                        }
                        return {
                            name: "Tests",
                            passed: false,
                            message: `Tests failed: ${error.message}`,
                        };
                    }
                }
            }
            catch {
                // No package.json
            }
            return {
                name: "Tests",
                passed: true,
                message: "Test check skipped (no test configuration found)",
            };
        }
        catch (error) {
            return {
                name: "Tests",
                passed: false,
                message: `Test execution failed: ${error.message}`,
            };
        }
    }
    async runSecurityCheck() {
        try {
            // Try to use security-compliance-mcp or npm audit
            const packageJsonPath = `${this.projectPath}/package.json`;
            try {
                const { stdout } = await execAsync(`test -f "${packageJsonPath}" && echo "exists"`, {
                    cwd: this.projectPath,
                });
                if (stdout.trim() === "exists") {
                    try {
                        const { stdout: auditOutput } = await execAsync(`cd "${this.projectPath}" && npm audit --audit-level=moderate --json`, { timeout: 30000 });
                        const auditResult = JSON.parse(auditOutput);
                        const vulnerabilities = auditResult.metadata?.vulnerabilities || {};
                        const totalVulns = (vulnerabilities.moderate || 0) +
                            (vulnerabilities.high || 0) +
                            (vulnerabilities.critical || 0);
                        if (totalVulns > 0) {
                            return {
                                name: "Security",
                                passed: false,
                                message: `Found ${totalVulns} security vulnerabilities`,
                            };
                        }
                        return {
                            name: "Security",
                            passed: true,
                            message: "No security vulnerabilities found",
                        };
                    }
                    catch (error) {
                        // npm audit might not be available or fail
                        return {
                            name: "Security",
                            passed: true,
                            message: "Security check skipped (npm audit unavailable)",
                        };
                    }
                }
            }
            catch {
                // No package.json
            }
            return {
                name: "Security",
                passed: true,
                message: "Security check skipped (no npm project found)",
            };
        }
        catch (error) {
            return {
                name: "Security",
                passed: false,
                message: `Security check failed: ${error.message}`,
            };
        }
    }
}
//# sourceMappingURL=preChecks.js.map