import { validateIntegrationTestParams } from '../utils/validation-utils.js';
import { generateTestFilePath, writeFileSafe } from '../utils/file-utils.js';
import { formatCode, addFileHeader, cleanupCode } from '../utils/format-utils.js';
import { analyzeSourceFile } from '../generators/ast-analyzer.js';
/**
 * MCP Tool: generate_integration_tests
 * Generate integration tests for APIs and modules
 */
export async function generateIntegrationTests(params) {
    try {
        // Validate parameters
        const validation = await validateIntegrationTestParams(params);
        if (!validation.valid) {
            return {
                success: false,
                testFilePath: '',
                testsGenerated: 0,
                scenariosCovered: [],
                setupIncluded: false,
                generatedCode: '',
                error: validation.error,
            };
        }
        // Parse target module to understand structure
        const { functions, error: parseError } = await analyzeSourceFile(params.targetModule);
        if (parseError) {
            return {
                success: false,
                testFilePath: '',
                testsGenerated: 0,
                scenariosCovered: [],
                setupIncluded: false,
                generatedCode: '',
                error: parseError,
            };
        }
        // Set defaults
        const framework = params.framework || 'jest';
        const includeSetup = params.includeSetup ?? true;
        const testFilePath = generateTestFilePath(params.targetModule, framework).replace('.test.ts', '.integration.test.ts');
        // Generate test code
        let testCode = '';
        // Add imports
        if (framework === 'supertest') {
            testCode += `import request from 'supertest';\n`;
            testCode += `import app from '../app'; // Adjust path as needed\n\n`;
        }
        else {
            testCode += `import { ${functions.map(f => f.name).join(', ')} } from './${params.targetModule.split('/').pop()?.replace('.ts', '')}';\n\n`;
        }
        // Add setup/teardown if requested
        if (includeSetup) {
            testCode += `describe('Integration Tests', () => {\n`;
            testCode += `  beforeAll(async () => {\n`;
            testCode += `    // Setup: Initialize database, start server, etc.\n`;
            testCode += `    console.log('Setting up integration tests...');\n`;
            testCode += `  });\n\n`;
            testCode += `  afterAll(async () => {\n`;
            testCode += `    // Teardown: Clean up resources\n`;
            testCode += `    console.log('Tearing down integration tests...');\n`;
            testCode += `  });\n\n`;
        }
        // Generate test scenarios
        const scenariosCovered = [];
        if (params.scenarios && params.scenarios.length > 0) {
            // Use user-provided scenarios
            for (const scenario of params.scenarios) {
                testCode += generateAPITestScenario(scenario);
                scenariosCovered.push(scenario.name);
            }
        }
        else {
            // Generate basic integration tests from functions
            for (const func of functions) {
                if (func.isExported) {
                    testCode += generateModuleIntegrationTest(func);
                    scenariosCovered.push(`${func.name} integration`);
                }
            }
        }
        if (includeSetup) {
            testCode += `});\n`;
        }
        // Add file header
        const header = addFileHeader(params.targetModule, framework);
        testCode = header + testCode;
        // Clean up and format
        testCode = cleanupCode(testCode);
        testCode = await formatCode(testCode, 'typescript');
        // Write to file
        const writeSuccess = await writeFileSafe(testFilePath, testCode);
        if (!writeSuccess) {
            return {
                success: false,
                testFilePath,
                testsGenerated: 0,
                scenariosCovered,
                setupIncluded: includeSetup,
                generatedCode: testCode,
                error: `Failed to write test file: ${testFilePath}`,
            };
        }
        return {
            success: true,
            testFilePath,
            testsGenerated: scenariosCovered.length,
            scenariosCovered,
            setupIncluded: includeSetup,
            generatedCode: testCode,
        };
    }
    catch (error) {
        return {
            success: false,
            testFilePath: '',
            testsGenerated: 0,
            scenariosCovered: [],
            setupIncluded: false,
            generatedCode: '',
            error: `Unexpected error: ${error.message}`,
        };
    }
}
/**
 * Generate API test scenario using supertest
 */
function generateAPITestScenario(scenario) {
    const methodLower = scenario.method.toLowerCase();
    let code = `  describe('${scenario.method} ${scenario.endpoint}', () => {\n`;
    code += `    it('${scenario.name}', async () => {\n`;
    code += `      const response = await request(app)\n`;
    code += `        .${methodLower}('${scenario.endpoint}')\n`;
    if (scenario.body) {
        code += `        .send(${JSON.stringify(scenario.body)})\n`;
    }
    code += `        .expect(${scenario.expectedStatus});\n\n`;
    code += `      expect(response.body).toBeDefined();\n`;
    code += `    });\n`;
    code += `  });\n\n`;
    return code;
}
/**
 * Generate module integration test
 */
function generateModuleIntegrationTest(func) {
    let code = `  describe('${func.name} integration', () => {\n`;
    code += `    it('should integrate with other modules', ${func.isAsync ? 'async ' : ''}() => {\n`;
    code += `      // Arrange: Setup test data and dependencies\n`;
    code += `      const testInput = {}; // Replace with actual test data\n\n`;
    code += `      // Act: Call the function\n`;
    const callExpr = func.isAsync
        ? `await ${func.name}(testInput)`
        : `${func.name}(testInput)`;
    code += `      const result = ${callExpr};\n\n`;
    code += `      // Assert: Verify integration worked\n`;
    code += `      expect(result).toBeDefined();\n`;
    code += `    });\n`;
    code += `  });\n\n`;
    return code;
}
//# sourceMappingURL=generate-integration-tests.js.map