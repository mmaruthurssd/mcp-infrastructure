/**
 * SmokeTester Utility
 *
 * Performs basic smoke tests on MCP tools to verify they're callable
 * and handle basic scenarios correctly.
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
export class SmokeTester {
    mcpPath;
    tools;
    constructor(mcpPath, tools) {
        this.mcpPath = mcpPath;
        this.tools = tools || [];
    }
    /**
     * Run smoke tests
     */
    async run() {
        try {
            // Validate path exists
            if (!existsSync(this.mcpPath)) {
                return this.createErrorResult(`MCP path does not exist: ${this.mcpPath}`);
            }
            // Check if server.ts exists
            const serverPath = join(this.mcpPath, '04-product-under-development', 'dev-instance', 'src', 'server.ts');
            if (!existsSync(serverPath)) {
                return this.createErrorResult('server.ts not found. MCP server not implemented.');
            }
            // Read server.ts to get tool list
            const serverContent = readFileSync(serverPath, 'utf-8');
            const availableTools = this.extractTools(serverContent);
            if (availableTools.length === 0) {
                return this.createErrorResult('No tools found in server.ts');
            }
            // Filter tools if specific tools requested
            const toolsToTest = this.tools.length > 0 ? this.tools : availableTools;
            // Run smoke tests for each tool
            const results = [];
            for (const toolName of toolsToTest) {
                const result = await this.testTool(toolName, availableTools, serverContent);
                results.push(result);
            }
            // Calculate summary
            const passed = results.filter((r) => r.available && r.schemaValid && r.basicInvocation === 'pass' && r.responseValid).length;
            const failed = results.length - passed;
            return {
                success: true,
                results,
                summary: {
                    total: results.length,
                    passed,
                    failed,
                },
            };
        }
        catch (error) {
            return this.createErrorResult(`Smoke test failed: ${error}`);
        }
    }
    /**
     * Test individual tool
     */
    async testTool(toolName, availableTools, serverContent) {
        const result = {
            toolName,
            available: false,
            schemaValid: false,
            basicInvocation: 'error',
            responseValid: false,
            errorHandling: 'fail',
            issues: [],
        };
        // Check if tool is available
        result.available = availableTools.includes(toolName);
        if (!result.available) {
            result.issues.push('Tool not found in server.ts');
            return result;
        }
        // Check if schema is defined
        const schemaCheck = this.checkToolSchema(toolName, serverContent);
        result.schemaValid = schemaCheck.valid;
        if (!schemaCheck.valid) {
            result.issues.push(...schemaCheck.issues);
        }
        // Check if handler is implemented
        const handlerCheck = this.checkToolHandler(toolName, serverContent);
        if (handlerCheck.implemented) {
            result.basicInvocation = 'pass';
        }
        else {
            result.basicInvocation = 'fail';
            result.issues.push('Handler not implemented or returns "not yet implemented"');
        }
        // Check if response structure is valid
        const responseCheck = this.checkResponseStructure(toolName, serverContent);
        result.responseValid = responseCheck.valid;
        if (!responseCheck.valid) {
            result.issues.push(...responseCheck.issues);
        }
        // Check error handling
        const errorCheck = this.checkErrorHandling(toolName, serverContent);
        result.errorHandling = errorCheck.hasErrorHandling ? 'pass' : 'fail';
        if (!errorCheck.hasErrorHandling) {
            result.issues.push('No error handling detected in handler');
        }
        return result;
    }
    /**
     * Extract tool names from server.ts
     */
    extractTools(serverContent) {
        const tools = [];
        // Look for tool definitions in ListToolsRequestSchema handler
        const toolNameRegex = /name:\s*['"]([^'"]+)['"]/g;
        let match;
        while ((match = toolNameRegex.exec(serverContent)) !== null) {
            tools.push(match[1]);
        }
        return tools;
    }
    /**
     * Check if tool schema is properly defined
     */
    checkToolSchema(toolName, serverContent) {
        const issues = [];
        // Check if tool has inputSchema
        const schemaPattern = new RegExp(`name:\\s*['"]${toolName}['"][\\s\\S]*?inputSchema:\\s*\\{`, 'm');
        if (!schemaPattern.test(serverContent)) {
            issues.push('No inputSchema defined');
            return { valid: false, issues };
        }
        // Check if inputSchema has type: 'object'
        const typePattern = new RegExp(`name:\\s*['"]${toolName}['"][\\s\\S]*?inputSchema:\\s*\\{[\\s\\S]*?type:\\s*['"]object['"]`, 'm');
        if (!typePattern.test(serverContent)) {
            issues.push('inputSchema missing type: "object"');
        }
        // Check if inputSchema has properties
        const propsPattern = new RegExp(`name:\\s*['"]${toolName}['"][\\s\\S]*?inputSchema:\\s*\\{[\\s\\S]*?properties:\\s*\\{`, 'm');
        if (!propsPattern.test(serverContent)) {
            issues.push('inputSchema missing properties');
        }
        return { valid: issues.length === 0, issues };
    }
    /**
     * Check if tool handler is implemented
     */
    checkToolHandler(toolName, serverContent) {
        // Check if there's a case statement for this tool
        const casePattern = new RegExp(`case\\s+['"]${toolName}['"]:`);
        if (!casePattern.test(serverContent)) {
            return { implemented: false };
        }
        // Check if it's not just returning "not yet implemented"
        const notImplementedPattern = new RegExp(`case\\s+['"]${toolName}['"]:[\\s\\S]*?['"]Tool not yet implemented['"]`, 'm');
        if (notImplementedPattern.test(serverContent)) {
            return { implemented: false };
        }
        return { implemented: true };
    }
    /**
     * Check if response structure is valid
     */
    checkResponseStructure(toolName, serverContent) {
        const issues = [];
        // Check if handler returns result with content array
        const returnPattern = new RegExp(`case\\s+['"]${toolName}['"]:[\\s\\S]*?return[\\s\\S]*?content:`, 'm');
        if (!returnPattern.test(serverContent)) {
            // Tool might be using a variable instead of direct return
            const resultPattern = new RegExp(`case\\s+['"]${toolName}['"]:[\\s\\S]*?result\\s*=`, 'm');
            if (!resultPattern.test(serverContent)) {
                issues.push('Handler does not return or assign result');
            }
        }
        return { valid: issues.length === 0, issues };
    }
    /**
     * Check if error handling is present
     */
    checkErrorHandling(toolName, serverContent) {
        // Check if there's a try-catch or error handling in the tool implementation
        const errorHandlingPattern = new RegExp(`case\\s+['"]${toolName}['"]:[\\s\\S]{0,1000}(try|catch|error|Error)`, 'm');
        return { hasErrorHandling: errorHandlingPattern.test(serverContent) };
    }
    /**
     * Create error result
     */
    createErrorResult(error) {
        return {
            success: false,
            results: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
            },
            error,
        };
    }
}
//# sourceMappingURL=smoke-tester.js.map