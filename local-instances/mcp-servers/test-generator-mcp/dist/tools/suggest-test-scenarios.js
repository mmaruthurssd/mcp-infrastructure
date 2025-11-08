import { validateScenariosParams } from '../utils/validation-utils.js';
import { analyzeSourceFile } from '../generators/ast-analyzer.js';
/**
 * MCP Tool: suggest_test_scenarios
 * Suggest test scenarios based on code analysis
 */
export async function suggestTestScenarios(params) {
    try {
        // Validate parameters
        const validation = await validateScenariosParams(params);
        if (!validation.valid) {
            return {
                success: false,
                scenarios: [],
                totalSuggestions: 0,
                error: validation.error,
            };
        }
        // Parse source file
        const { functions, error: parseError } = await analyzeSourceFile(params.sourceFile);
        if (parseError) {
            return {
                success: false,
                scenarios: [],
                totalSuggestions: 0,
                error: parseError,
            };
        }
        if (functions.length === 0) {
            return {
                success: true,
                scenarios: [],
                totalSuggestions: 0,
            };
        }
        // Set defaults
        const scenarioTypes = params.scenarioTypes ?? ['happy-path', 'edge-cases', 'error-handling'];
        const maxSuggestions = params.maxSuggestions ?? 10;
        // Generate suggestions for each function
        const allSuggestions = [];
        for (const func of functions) {
            if (!func.isExported)
                continue;
            const suggestions = generateSuggestionsForFunction(func, scenarioTypes, params.context);
            allSuggestions.push(...suggestions);
        }
        // Sort by priority
        allSuggestions.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        // Limit to maxSuggestions
        const scenarios = allSuggestions.slice(0, maxSuggestions);
        return {
            success: true,
            scenarios,
            totalSuggestions: scenarios.length,
        };
    }
    catch (error) {
        return {
            success: false,
            scenarios: [],
            totalSuggestions: 0,
            error: `Unexpected error: ${error.message}`,
        };
    }
}
/**
 * Generate test scenario suggestions for a function
 */
function generateSuggestionsForFunction(func, scenarioTypes, context) {
    const suggestions = [];
    // Happy path scenarios
    if (scenarioTypes.includes('happy-path')) {
        suggestions.push({
            type: 'happy-path',
            description: `Test ${func.name} with valid inputs and verify expected output`,
            functionName: func.name,
            inputs: func.params.map(p => generateSampleInput(p.type, 'valid')),
            expectedOutput: generateExpectedOutput(func.returnType),
            priority: 'high',
            reasoning: 'Every function should have at least one happy path test',
        });
    }
    // Edge case scenarios
    if (scenarioTypes.includes('edge-cases')) {
        // Null/undefined tests
        for (const param of func.params) {
            if (!param.optional) {
                suggestions.push({
                    type: 'edge-cases',
                    description: `Test ${func.name} when ${param.name} is null/undefined`,
                    functionName: func.name,
                    inputs: func.params.map(p => (p.name === param.name ? null : generateSampleInput(p.type, 'valid'))),
                    expectedOutput: 'throw error or return null',
                    priority: 'medium',
                    reasoning: `Required parameter ${param.name} should be validated`,
                });
            }
        }
        // Boundary conditions
        for (const param of func.params) {
            if (param.type === 'number') {
                suggestions.push({
                    type: 'edge-cases',
                    description: `Test ${func.name} with ${param.name} = 0`,
                    functionName: func.name,
                    inputs: func.params.map(p => (p.name === param.name ? 0 : generateSampleInput(p.type, 'valid'))),
                    expectedOutput: generateExpectedOutput(func.returnType),
                    priority: 'medium',
                    reasoning: 'Zero is a common boundary condition for numbers',
                });
                suggestions.push({
                    type: 'edge-cases',
                    description: `Test ${func.name} with negative ${param.name}`,
                    functionName: func.name,
                    inputs: func.params.map(p => (p.name === param.name ? -1 : generateSampleInput(p.type, 'valid'))),
                    expectedOutput: generateExpectedOutput(func.returnType),
                    priority: 'low',
                    reasoning: 'Negative values may cause unexpected behavior',
                });
            }
            else if (param.type === 'string') {
                suggestions.push({
                    type: 'edge-cases',
                    description: `Test ${func.name} with empty ${param.name}`,
                    functionName: func.name,
                    inputs: func.params.map(p => (p.name === param.name ? '' : generateSampleInput(p.type, 'valid'))),
                    expectedOutput: generateExpectedOutput(func.returnType),
                    priority: 'medium',
                    reasoning: 'Empty strings are common edge cases',
                });
            }
            else if (param.type === 'array') {
                suggestions.push({
                    type: 'edge-cases',
                    description: `Test ${func.name} with empty ${param.name} array`,
                    functionName: func.name,
                    inputs: func.params.map(p => (p.name === param.name ? [] : generateSampleInput(p.type, 'valid'))),
                    expectedOutput: generateExpectedOutput(func.returnType),
                    priority: 'medium',
                    reasoning: 'Empty arrays should be handled gracefully',
                });
            }
        }
    }
    // Error handling scenarios
    if (scenarioTypes.includes('error-handling')) {
        suggestions.push({
            type: 'error-handling',
            description: `Test ${func.name} error handling with invalid inputs`,
            functionName: func.name,
            inputs: func.params.map(p => generateSampleInput(p.type, 'invalid')),
            expectedOutput: 'throw error',
            priority: 'high',
            reasoning: 'Functions should handle invalid inputs gracefully',
        });
        // Type validation
        for (const param of func.params) {
            suggestions.push({
                type: 'error-handling',
                description: `Test ${func.name} with wrong type for ${param.name}`,
                functionName: func.name,
                inputs: func.params.map(p => p.name === param.name ? generateSampleInput(getOppositeType(p.type), 'valid') : generateSampleInput(p.type, 'valid')),
                expectedOutput: 'throw TypeError',
                priority: 'medium',
                reasoning: 'Type validation prevents runtime errors',
            });
        }
    }
    // Security scenarios (if context suggests sensitive operations)
    if (scenarioTypes.includes('security')) {
        if (context?.toLowerCase().includes('auth') || context?.toLowerCase().includes('password')) {
            suggestions.push({
                type: 'security',
                description: `Test ${func.name} for injection attacks`,
                functionName: func.name,
                inputs: func.params.map(p => p.type === 'string' ? "'; DROP TABLE users--" : generateSampleInput(p.type, 'valid')),
                expectedOutput: 'sanitized output or error',
                priority: 'high',
                reasoning: 'Authentication functions must prevent injection attacks',
            });
        }
    }
    // Boundary conditions
    if (scenarioTypes.includes('boundary-conditions')) {
        // Large inputs
        suggestions.push({
            type: 'boundary-conditions',
            description: `Test ${func.name} with very large inputs`,
            functionName: func.name,
            inputs: func.params.map(p => generateSampleInput(p.type, 'large')),
            expectedOutput: generateExpectedOutput(func.returnType),
            priority: 'low',
            reasoning: 'Ensure function handles large inputs efficiently',
        });
    }
    return suggestions;
}
/**
 * Generate sample input based on type and validity
 */
function generateSampleInput(type, validity) {
    if (validity === 'valid') {
        switch (type) {
            case 'string':
                return 'test';
            case 'number':
                return 42;
            case 'boolean':
                return true;
            case 'array':
                return [1, 2, 3];
            case 'object':
                return { id: 1 };
            default:
                return {};
        }
    }
    else if (validity === 'invalid') {
        return null;
    }
    else {
        // large
        switch (type) {
            case 'string':
                return 'a'.repeat(10000);
            case 'number':
                return Number.MAX_SAFE_INTEGER;
            case 'array':
                return Array(10000).fill(1);
            default:
                return {};
        }
    }
}
/**
 * Generate expected output based on return type
 */
function generateExpectedOutput(returnType) {
    switch (returnType) {
        case 'string':
            return 'string value';
        case 'number':
            return 'numeric value';
        case 'boolean':
            return 'boolean value';
        case 'array':
            return 'array value';
        case 'Promise':
            return 'promise resolving to value';
        default:
            return 'defined value';
    }
}
/**
 * Get opposite type for type validation testing
 */
function getOppositeType(type) {
    switch (type) {
        case 'string':
            return 'number';
        case 'number':
            return 'string';
        case 'boolean':
            return 'string';
        case 'array':
            return 'object';
        case 'object':
            return 'array';
        default:
            return 'string';
    }
}
//# sourceMappingURL=suggest-test-scenarios.js.map