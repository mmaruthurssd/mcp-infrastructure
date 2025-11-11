/**
 * SchemaValidator Utility
 *
 * Validates MCP tool parameter schemas to ensure they follow
 * proper JSON Schema structure and MCP standards.
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
export class SchemaValidator {
    mcpPath;
    toolName;
    constructor(mcpPath, toolName) {
        this.mcpPath = mcpPath;
        this.toolName = toolName;
    }
    /**
     * Validate tool schemas
     */
    async validate() {
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
            // Read server.ts to extract tool definitions
            const serverContent = readFileSync(serverPath, 'utf-8');
            const toolDefinitions = this.extractToolDefinitions(serverContent);
            if (toolDefinitions.length === 0) {
                return this.createErrorResult('No tool definitions found in server.ts');
            }
            // Filter by toolName if specified
            const toolsToValidate = this.toolName
                ? toolDefinitions.filter((t) => t.name === this.toolName)
                : toolDefinitions;
            if (toolsToValidate.length === 0 && this.toolName) {
                return this.createErrorResult(`Tool not found: ${this.toolName}`);
            }
            // Validate each tool schema
            const tools = [];
            for (const tool of toolsToValidate) {
                const validation = this.validateToolSchema(tool);
                tools.push(validation);
            }
            return {
                success: true,
                tools,
            };
        }
        catch (error) {
            return this.createErrorResult(`Schema validation failed: ${error}`);
        }
    }
    /**
     * Extract tool definitions from server.ts
     */
    extractToolDefinitions(serverContent) {
        const tools = [];
        try {
            // Look for tools array in ListToolsRequestSchema handler
            const toolsArrayMatch = serverContent.match(/return\s*\{\s*tools:\s*\[([\s\S]*?)\]\s*\}/);
            if (!toolsArrayMatch) {
                return tools;
            }
            const toolsArrayContent = toolsArrayMatch[1];
            // Split by objects (look for } followed by , followed by {)
            const toolObjects = toolsArrayContent.split(/\},\s*\{/);
            for (let i = 0; i < toolObjects.length; i++) {
                let toolStr = toolObjects[i];
                // Add back the braces that were removed by split
                if (i > 0)
                    toolStr = '{' + toolStr;
                if (i < toolObjects.length - 1)
                    toolStr = toolStr + '}';
                // Extract tool name
                const nameMatch = toolStr.match(/name:\s*['"]([^'"]+)['"]/);
                if (!nameMatch)
                    continue;
                const name = nameMatch[1];
                // Extract description
                const descMatch = toolStr.match(/description:\s*['"]([^'"]+)['"]/);
                const description = descMatch ? descMatch[1] : '';
                // Extract inputSchema
                const schemaMatch = toolStr.match(/inputSchema:\s*(\{[\s\S]*)/);
                let inputSchema = {};
                if (schemaMatch) {
                    try {
                        // Try to parse the schema object
                        // This is a simplified extraction - in production you'd use proper AST parsing
                        const schemaStr = this.extractObject(schemaMatch[1]);
                        inputSchema = this.parseSchemaString(schemaStr);
                    }
                    catch (error) {
                        inputSchema = { _parseError: true };
                    }
                }
                tools.push({
                    name,
                    description,
                    inputSchema,
                });
            }
        }
        catch (error) {
            console.error('Failed to extract tool definitions:', error);
        }
        return tools;
    }
    /**
     * Extract object from string (simple bracket matching)
     */
    extractObject(str) {
        let depth = 0;
        let start = -1;
        let end = -1;
        for (let i = 0; i < str.length; i++) {
            if (str[i] === '{') {
                if (start === -1)
                    start = i;
                depth++;
            }
            else if (str[i] === '}') {
                depth--;
                if (depth === 0) {
                    end = i + 1;
                    break;
                }
            }
        }
        return start !== -1 && end !== -1 ? str.substring(start, end) : str;
    }
    /**
     * Parse schema string to object (simplified)
     */
    parseSchemaString(schemaStr) {
        try {
            // Replace single quotes with double quotes for JSON parsing
            let jsonStr = schemaStr
                .replace(/'/g, '"')
                .replace(/(\w+):/g, '"$1":') // Add quotes to keys
                .replace(/,\s*}/g, '}') // Remove trailing commas
                .replace(/,\s*]/g, ']');
            return JSON.parse(jsonStr);
        }
        catch (error) {
            // If parsing fails, return a simplified structure
            return { _parseError: true };
        }
    }
    /**
     * Validate individual tool schema
     */
    validateToolSchema(tool) {
        const issues = [];
        const parameters = [];
        // Check if inputSchema exists
        if (!tool.inputSchema) {
            issues.push({
                type: 'error',
                message: 'Missing inputSchema',
            });
            return {
                name: tool.name,
                schemaValid: false,
                issues,
                parameters,
            };
        }
        // Check if schema has parse error
        if (tool.inputSchema._parseError) {
            issues.push({
                type: 'warning',
                message: 'Could not parse inputSchema - validation limited',
            });
        }
        // Validate schema structure
        this.validateSchemaStructure(tool.inputSchema, issues);
        // Extract and validate parameters
        if (tool.inputSchema.properties) {
            this.extractParameters(tool.inputSchema, parameters, issues);
        }
        return {
            name: tool.name,
            schemaValid: issues.filter((i) => i.type === 'error').length === 0,
            issues,
            parameters,
        };
    }
    /**
     * Validate schema structure
     */
    validateSchemaStructure(schema, issues) {
        // Check for required type field
        if (!schema.type) {
            issues.push({
                type: 'error',
                message: 'Missing required field: type',
            });
        }
        else if (schema.type !== 'object') {
            issues.push({
                type: 'warning',
                message: `Expected type "object", got "${schema.type}"`,
            });
        }
        // Check for properties
        if (!schema.properties) {
            issues.push({
                type: 'error',
                message: 'Missing properties field',
            });
        }
        else if (typeof schema.properties !== 'object') {
            issues.push({
                type: 'error',
                message: 'properties must be an object',
            });
        }
        // Check if required is an array
        if (schema.required && !Array.isArray(schema.required)) {
            issues.push({
                type: 'error',
                message: 'required must be an array',
            });
        }
        // Check if all required fields exist in properties
        if (schema.required && Array.isArray(schema.required) && schema.properties) {
            for (const requiredField of schema.required) {
                if (!schema.properties[requiredField]) {
                    issues.push({
                        type: 'error',
                        message: `Required field "${requiredField}" not found in properties`,
                        field: requiredField,
                    });
                }
            }
        }
    }
    /**
     * Extract parameters from schema
     */
    extractParameters(schema, parameters, issues) {
        const required = schema.required || [];
        for (const [name, propSchema] of Object.entries(schema.properties)) {
            const prop = propSchema;
            // Validate parameter has type
            if (!prop.type) {
                issues.push({
                    type: 'error',
                    message: `Parameter "${name}" missing type`,
                    field: name,
                });
            }
            parameters.push({
                name,
                required: required.includes(name),
                type: prop.type || 'unknown',
                valid: !!prop.type,
            });
            // Check for description
            if (!prop.description) {
                issues.push({
                    type: 'warning',
                    message: `Parameter "${name}" missing description`,
                    field: name,
                });
            }
            // Validate enum if present
            if (prop.enum && !Array.isArray(prop.enum)) {
                issues.push({
                    type: 'error',
                    message: `Parameter "${name}" enum must be an array`,
                    field: name,
                });
            }
            // Validate array items if type is array
            if (prop.type === 'array' && !prop.items) {
                issues.push({
                    type: 'error',
                    message: `Parameter "${name}" of type array must have items`,
                    field: name,
                });
            }
        }
    }
    /**
     * Create error result
     */
    createErrorResult(error) {
        return {
            success: false,
            tools: [],
            error,
        };
    }
}
//# sourceMappingURL=schema-validator.js.map