/**
 * Standards Enforcement MCP Client
 *
 * Reusable helper for calling standards-enforcement-mcp from other MCPs
 * Can be copied into any MCP that needs to validate compliance
 */
import { spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';
/**
 * Standards Validator Client
 * Calls standards-enforcement-mcp to validate compliance
 */
export class StandardsValidator {
    standardsMcpPath;
    constructor() {
        // Path to standards-enforcement-mcp
        const workspacePath = process.env.WORKSPACE_PATH ||
            path.join(os.homedir(), 'Desktop', 'medical-practice-workspace');
        this.standardsMcpPath = path.join(workspacePath, 'development', 'mcp-servers', 'standards-enforcement-mcp-project', '04-product-under-development', 'dist', 'index.js');
    }
    /**
     * Validate MCP compliance
     */
    async validateMcpCompliance(options) {
        const { mcpName, categories, failFast = false, includeWarnings = true } = options;
        console.log(`🔍 Running standards validation for: ${mcpName}`);
        try {
            const result = await this.callStandardsTool('validate_mcp_compliance', {
                mcpName,
                categories,
                failFast,
                includeWarnings,
            });
            return result;
        }
        catch (error) {
            throw new Error(`Standards validation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Check if MCP passes compliance
     * Returns true if compliant, throws error with details if not
     */
    async requireCompliance(options) {
        const result = await this.validateMcpCompliance(options);
        if (!result.compliant) {
            const { summary } = result;
            let errorMessage = `🛑 COMPLIANCE FAILED FOR "${options.mcpName}"\n\n`;
            errorMessage += `Compliance Score: ${summary.complianceScore}/100\n`;
            errorMessage += `Critical Violations: ${summary.criticalViolations}\n`;
            errorMessage += `Warnings: ${summary.warningViolations}\n\n`;
            // Add critical violations details
            const criticalViolations = result.violations.filter((v) => v.severity === 'critical');
            if (criticalViolations.length > 0) {
                errorMessage += 'Critical Issues:\n';
                criticalViolations.forEach((v, i) => {
                    errorMessage += `  ${i + 1}. [${v.category}] ${v.message}\n`;
                    errorMessage += `     📍 ${v.location.path}\n`;
                    errorMessage += `     💡 ${v.suggestion}\n\n`;
                });
            }
            errorMessage += `Fix violations and re-run validation.\n`;
            throw new Error(errorMessage);
        }
        console.log(`✅ Compliance check passed (Score: ${result.summary.complianceScore}/100)`);
    }
    /**
     * Check compliance and return boolean (non-throwing)
     */
    async isCompliant(options) {
        try {
            const result = await this.validateMcpCompliance(options);
            return result.compliant;
        }
        catch {
            return false;
        }
    }
    /**
     * Get compliance score (0-100)
     */
    async getComplianceScore(options) {
        try {
            const result = await this.validateMcpCompliance(options);
            return result.summary.complianceScore;
        }
        catch {
            return 0;
        }
    }
    /**
     * Internal: Call a standards-enforcement-mcp tool
     */
    async callStandardsTool(toolName, args) {
        return new Promise((resolve, reject) => {
            const child = spawn('node', [this.standardsMcpPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
            });
            // Build MCP request
            const request = {
                jsonrpc: '2.0',
                id: 1,
                method: 'tools/call',
                params: {
                    name: toolName,
                    arguments: args,
                },
            };
            let stdout = '';
            let stderr = '';
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            child.on('error', (error) => {
                reject(new Error(`Failed to spawn MCP process: ${error.message}`));
            });
            child.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`MCP process exited with code ${code}. Stderr: ${stderr}`));
                    return;
                }
                try {
                    // Parse MCP response (stdio transport returns JSON-RPC)
                    const lines = stdout.trim().split('\n');
                    // Find the response line (ignore server initialization messages)
                    for (const line of lines) {
                        try {
                            const response = JSON.parse(line);
                            if (response.id === 1 && response.result) {
                                // Parse the content from MCP tool result
                                const content = response.result.content;
                                if (content && content[0] && content[0].text) {
                                    // The result is in markdown format, we need to parse it
                                    // For now, return a simplified version
                                    // TODO: Parse markdown to extract structured data
                                    resolve(this.parseMarkdownResult(content[0].text));
                                    return;
                                }
                                resolve(response.result);
                                return;
                            }
                        }
                        catch {
                            // Not JSON, skip
                            continue;
                        }
                    }
                    reject(new Error('No valid MCP response found'));
                }
                catch (error) {
                    reject(new Error(`Failed to parse MCP response: ${error instanceof Error ? error.message : String(error)}`));
                }
            });
            // Send request
            child.stdin.write(JSON.stringify(request) + '\n');
            child.stdin.end();
        });
    }
    /**
     * Parse markdown result from MCP (temporary implementation)
     * TODO: Return structured JSON from MCP instead of markdown
     */
    parseMarkdownResult(markdown) {
        // Extract compliance score
        const scoreMatch = markdown.match(/Compliance Score.*?(\d+)\/100/);
        const complianceScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;
        // Extract violation counts
        const criticalMatch = markdown.match(/Critical Violations:\s*(\d+)/);
        const warningMatch = markdown.match(/Warnings:\s*(\d+)/);
        const infoMatch = markdown.match(/Info:\s*(\d+)/);
        const criticalViolations = criticalMatch ? parseInt(criticalMatch[1]) : 0;
        const warningViolations = warningMatch ? parseInt(warningMatch[1]) : 0;
        const infoViolations = infoMatch ? parseInt(infoMatch[1]) : 0;
        // Extract passed/failed rules
        const passedMatch = markdown.match(/Passed:\s*(\d+)/);
        const failedMatch = markdown.match(/Failed:\s*(\d+)/);
        const totalMatch = markdown.match(/Total Rules Checked:\s*(\d+)/);
        const passedRules = passedMatch ? parseInt(passedMatch[1]) : 0;
        const failedRules = failedMatch ? parseInt(failedMatch[1]) : 0;
        const totalRules = totalMatch ? parseInt(totalMatch[1]) : passedRules + failedRules;
        // Determine compliance
        const compliant = markdown.includes('✅ COMPLIANT');
        return {
            success: true,
            compliant,
            violations: [], // TODO: Parse violations from markdown
            summary: {
                totalRules,
                passedRules,
                failedRules,
                criticalViolations,
                warningViolations,
                infoViolations,
                complianceScore,
            },
            timestamp: new Date().toISOString(),
        };
    }
}
/**
 * Singleton instance
 */
export const standardsValidator = new StandardsValidator();
/**
 * Quick validation functions
 */
/**
 * Validate MCP compliance (throws on failure)
 */
export async function validateOrThrow(mcpName, categories) {
    await standardsValidator.requireCompliance({ mcpName, categories });
}
/**
 * Check if MCP is compliant (boolean)
 */
export async function isCompliant(mcpName, categories) {
    return standardsValidator.isCompliant({ mcpName, categories });
}
/**
 * Get compliance score (0-100)
 */
export async function getComplianceScore(mcpName) {
    return standardsValidator.getComplianceScore({ mcpName });
}
//# sourceMappingURL=standards-validator-client.js.map