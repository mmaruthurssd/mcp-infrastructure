import type { GenerateUnitTestsParams, GenerateUnitTestsResult } from '../types/index.js';
import { validateUnitTestParams } from '../utils/validation-utils.js';
import { generateTestFilePath, writeFileSafe } from '../utils/file-utils.js';
import { formatCode, addFileHeader, cleanupCode } from '../utils/format-utils.js';
import { analyzeSourceFile, filterFunctionsByName, getExportedFunctions } from '../generators/ast-analyzer.js';
import { generateJestUnitTests } from '../generators/jest-unit-generator.js';

/**
 * MCP Tool: generate_unit_tests
 * Generate unit tests for TypeScript/JavaScript functions and classes
 */
export async function generateUnitTests(params: GenerateUnitTestsParams): Promise<GenerateUnitTestsResult> {
  try {
    // Validate parameters
    const validation = await validateUnitTestParams(params);
    if (!validation.valid) {
      return {
        success: false,
        testFilePath: '',
        testsGenerated: 0,
        functionsAnalyzed: [],
        coverageEstimate: 0,
        generatedCode: '',
        error: validation.error,
      };
    }

    // Parse source file with AST
    const { functions, classes, error: parseError } = await analyzeSourceFile(params.sourceFile);
    if (parseError) {
      return {
        success: false,
        testFilePath: '',
        testsGenerated: 0,
        functionsAnalyzed: [],
        coverageEstimate: 0,
        generatedCode: '',
        error: parseError,
      };
    }

    // Filter functions if specific names provided
    let targetFunctions = params.functions
      ? filterFunctionsByName(functions, params.functions)
      : getExportedFunctions(functions);

    // Add class methods to functions list
    for (const classInfo of classes) {
      if (classInfo.isExported) {
        targetFunctions.push(...classInfo.methods.map(m => ({ ...m, name: `${classInfo.name}.${m.name}` })));
      }
    }

    if (targetFunctions.length === 0) {
      return {
        success: true,
        testFilePath: '',
        testsGenerated: 0,
        functionsAnalyzed: [],
        coverageEstimate: 0,
        generatedCode: '',
        warnings: ['No exported functions found in source file'],
      };
    }

    // Determine target test file path
    const framework = params.framework || 'jest';
    const testFilePath = params.targetFile || generateTestFilePath(params.sourceFile, framework);

    // Generate test code
    const coverage = params.coverage || 'comprehensive';
    let testCode = generateJestUnitTests(targetFunctions, params.sourceFile, testFilePath, coverage);

    // Add file header
    const header = addFileHeader(params.sourceFile, framework);
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
        functionsAnalyzed: targetFunctions.map(f => f.name),
        coverageEstimate: 0,
        generatedCode: testCode,
        error: `Failed to write test file: ${testFilePath}`,
      };
    }

    // Calculate coverage estimate
    const coverageEstimate = calculateCoverageEstimate(coverage);

    // Calculate number of tests generated
    const testsGenerated = calculateTestsGenerated(targetFunctions.length, coverage);

    return {
      success: true,
      testFilePath,
      testsGenerated,
      functionsAnalyzed: targetFunctions.map(f => f.name),
      coverageEstimate,
      generatedCode: testCode,
    };
  } catch (error) {
    return {
      success: false,
      testFilePath: '',
      testsGenerated: 0,
      functionsAnalyzed: [],
      coverageEstimate: 0,
      generatedCode: '',
      error: `Unexpected error: ${(error as Error).message}`,
    };
  }
}

/**
 * Calculate estimated coverage based on level
 */
function calculateCoverageEstimate(coverage: string): number {
  switch (coverage) {
    case 'basic':
      return 50; // Only happy path
    case 'comprehensive':
      return 75; // Happy path + error handling
    case 'edge-cases':
      return 90; // All scenarios
    default:
      return 70;
  }
}

/**
 * Calculate number of tests generated
 */
function calculateTestsGenerated(functionCount: number, coverage: string): number {
  let testsPerFunction = 1;
  switch (coverage) {
    case 'basic':
      testsPerFunction = 1;
      break;
    case 'comprehensive':
      testsPerFunction = 3;
      break;
    case 'edge-cases':
      testsPerFunction = 5;
      break;
  }
  return functionCount * testsPerFunction;
}
