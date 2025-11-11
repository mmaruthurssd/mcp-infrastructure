import { relative, dirname } from 'path';
/**
 * Generate Jest unit test code for functions
 */
export function generateJestUnitTests(functions, sourceFilePath, testFilePath, coverage) {
    const importPath = generateImportPath(sourceFilePath, testFilePath);
    const functionNames = functions.map(f => f.name);
    let testCode = `import { ${functionNames.join(', ')} } from '${importPath}';\n\n`;
    for (const func of functions) {
        testCode += generateFunctionTestSuite(func, coverage);
        testCode += '\n';
    }
    return testCode;
}
/**
 * Generate test suite for a single function
 */
function generateFunctionTestSuite(func, coverage) {
    const testCases = generateTestCases(func, coverage);
    let code = `describe('${func.name}', () => {\n`;
    for (const testCase of testCases) {
        code += `  it('${testCase.description}', ${func.isAsync ? 'async ' : ''}() => {\n`;
        // Arrange section
        if (testCase.arrange.length > 0) {
            code += `    // Arrange\n`;
            for (const line of testCase.arrange) {
                code += `    ${line}\n`;
            }
            code += '\n';
        }
        // Act section
        code += `    // Act\n`;
        const actCall = func.isAsync
            ? `await ${func.name}(${testCase.inputs})`
            : `${func.name}(${testCase.inputs})`;
        code += `    const result = ${actCall};\n\n`;
        // Assert section
        code += `    // Assert\n`;
        code += `    ${testCase.assertion}\n`;
        code += `  });\n\n`;
    }
    code += `});\n`;
    return code;
}
/**
 * Generate test cases based on coverage level
 */
function generateTestCases(func, coverage) {
    const testCases = [];
    // Happy path (always included)
    testCases.push(generateHappyPathTest(func));
    if (coverage === 'comprehensive' || coverage === 'edge-cases') {
        // Add error handling tests
        testCases.push(...generateErrorHandlingTests(func));
        // Add null/undefined tests
        testCases.push(...generateNullTests(func));
    }
    if (coverage === 'edge-cases') {
        // Add boundary condition tests
        testCases.push(...generateBoundaryTests(func));
        // Add type validation tests
        testCases.push(...generateTypeTests(func));
    }
    return testCases;
}
/**
 * Generate happy path test case
 */
function generateHappyPathTest(func) {
    const inputs = func.params.map(p => generateMockValue(p.type, 'valid')).join(', ');
    const assertion = generateAssertion(func.returnType, 'toBeDefined');
    return {
        description: `should return ${func.returnType} when called with valid inputs`,
        arrange: [],
        inputs,
        assertion,
    };
}
/**
 * Generate error handling test cases
 */
function generateErrorHandlingTests(func) {
    const testCases = [];
    // Test for expected errors
    if (func.params.length > 0) {
        testCases.push({
            description: 'should handle errors gracefully',
            arrange: [],
            inputs: func.params.map(p => generateMockValue(p.type, 'invalid')).join(', '),
            assertion: `expect(() => ${func.name}(${func.params.map(p => generateMockValue(p.type, 'invalid')).join(', ')})).toThrow()`,
        });
    }
    return testCases;
}
/**
 * Generate null/undefined test cases
 */
function generateNullTests(func) {
    const testCases = [];
    for (let i = 0; i < func.params.length; i++) {
        const param = func.params[i];
        if (!param.optional) {
            const inputs = func.params.map((p, idx) => idx === i ? 'null' : generateMockValue(p.type, 'valid')).join(', ');
            testCases.push({
                description: `should handle null ${param.name}`,
                arrange: [],
                inputs,
                assertion: `expect(result).toBeNull() || expect(() => result).toThrow()`,
            });
        }
    }
    return testCases;
}
/**
 * Generate boundary condition tests
 */
function generateBoundaryTests(func) {
    const testCases = [];
    for (const param of func.params) {
        if (param.type === 'number') {
            // Test with 0
            testCases.push({
                description: `should handle ${param.name} = 0`,
                arrange: [],
                inputs: func.params.map(p => p.name === param.name ? '0' : generateMockValue(p.type, 'valid')).join(', '),
                assertion: 'expect(result).toBeDefined()',
            });
            // Test with negative
            testCases.push({
                description: `should handle negative ${param.name}`,
                arrange: [],
                inputs: func.params.map(p => p.name === param.name ? '-1' : generateMockValue(p.type, 'valid')).join(', '),
                assertion: 'expect(result).toBeDefined()',
            });
        }
        else if (param.type === 'string') {
            // Test with empty string
            testCases.push({
                description: `should handle empty ${param.name}`,
                arrange: [],
                inputs: func.params.map(p => p.name === param.name ? '""' : generateMockValue(p.type, 'valid')).join(', '),
                assertion: 'expect(result).toBeDefined()',
            });
        }
        else if (param.type === 'array') {
            // Test with empty array
            testCases.push({
                description: `should handle empty ${param.name}`,
                arrange: [],
                inputs: func.params.map(p => p.name === param.name ? '[]' : generateMockValue(p.type, 'valid')).join(', '),
                assertion: 'expect(result).toBeDefined()',
            });
        }
    }
    return testCases;
}
/**
 * Generate type validation tests
 */
function generateTypeTests(func) {
    const testCases = [];
    // Test with wrong types
    for (const param of func.params) {
        const wrongType = param.type === 'string' ? '123' : '"wrong"';
        testCases.push({
            description: `should handle wrong type for ${param.name}`,
            arrange: [],
            inputs: func.params.map(p => p.name === param.name ? wrongType : generateMockValue(p.type, 'valid')).join(', '),
            assertion: `expect(() => ${func.name}(${func.params.map(p => p.name === param.name ? wrongType : generateMockValue(p.type, 'valid')).join(', ')})).toThrow() || expect(result).toBeDefined()`,
        });
    }
    return testCases;
}
/**
 * Generate mock value based on type
 */
function generateMockValue(type, validity) {
    if (validity === 'valid') {
        switch (type) {
            case 'string':
                return "'test'";
            case 'number':
                return '42';
            case 'boolean':
                return 'true';
            case 'array':
                return '[1, 2, 3]';
            case 'object':
                return '{ id: 1 }';
            case 'Promise':
                return 'Promise.resolve("test")';
            default:
                return '{}';
        }
    }
    else {
        switch (type) {
            case 'string':
                return 'null';
            case 'number':
                return 'NaN';
            case 'boolean':
                return 'null';
            case 'array':
                return 'null';
            case 'object':
                return 'null';
            default:
                return 'null';
        }
    }
}
/**
 * Generate assertion based on return type
 */
function generateAssertion(returnType, matcher = 'toBeDefined') {
    switch (returnType) {
        case 'string':
            return `expect(typeof result).toBe('string')`;
        case 'number':
            return `expect(typeof result).toBe('number')`;
        case 'boolean':
            return `expect(typeof result).toBe('boolean')`;
        case 'array':
            return `expect(Array.isArray(result)).toBe(true)`;
        case 'Promise':
            return `expect(result).toBeInstanceOf(Promise)`;
        default:
            return `expect(result).${matcher}()`;
    }
}
/**
 * Generate relative import path
 */
function generateImportPath(sourceFile, testFile) {
    const testDir = dirname(testFile);
    let relativePath = relative(testDir, sourceFile);
    // Remove .ts/.js extension
    relativePath = relativePath.replace(/\.(ts|js)$/, '');
    // Ensure it starts with ./ or ../
    if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
    }
    return relativePath;
}
//# sourceMappingURL=jest-unit-generator.js.map