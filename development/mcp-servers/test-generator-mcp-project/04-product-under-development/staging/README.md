# Test Generator MCP

Automated test generation for TypeScript/JavaScript projects using the Model Context Protocol (MCP).

## Features

- **Unit Test Generation**: Generate Jest/Mocha/Vitest unit tests from source code
- **Integration Test Generation**: Create integration tests for APIs and modules
- **Coverage Analysis**: Identify test coverage gaps and prioritize files
- **Test Scenario Suggestions**: AI-powered suggestions for test cases

## Tools

### 1. `generate_unit_tests`
Generate unit tests for functions and classes with configurable coverage levels.

**Parameters:**
- `sourceFile` (required): Path to source file
- `targetFile` (optional): Where to save tests
- `framework` (optional): jest | mocha | vitest
- `coverage` (optional): basic | comprehensive | edge-cases

**Returns:**
- Test file path
- Number of tests generated
- Coverage estimate
- Generated test code

### 2. `generate_integration_tests`
Generate integration tests for APIs and module interactions.

**Parameters:**
- `targetModule` (required): Module or API file to test
- `apiSpec` (optional): OpenAPI/Swagger spec
- `framework` (optional): jest | supertest
- `scenarios` (optional): Custom test scenarios
- `includeSetup` (optional): Include setup/teardown

**Returns:**
- Test file path
- Number of tests generated
- Scenarios covered
- Generated test code

### 3. `analyze_coverage_gaps`
Analyze project for missing test coverage.

**Parameters:**
- `projectPath` (required): Project root directory
- `coverageFile` (optional): Coverage JSON file path
- `threshold` (optional): Minimum coverage % (default: 80)
- `reportFormat` (optional): summary | detailed | file-by-file

**Returns:**
- Overall coverage metrics
- Uncovered files with priorities
- Recommendations

### 4. `suggest_test_scenarios`
Suggest test scenarios based on code analysis.

**Parameters:**
- `sourceFile` (required): File to analyze
- `context` (optional): Context about usage
- `scenarioTypes` (optional): Types of scenarios to suggest
- `maxSuggestions` (optional): Limit suggestions (default: 10)

**Returns:**
- Test scenario suggestions with inputs/outputs
- Priority rankings
- Reasoning for each suggestion

## Installation

```bash
npm install
npm run build
```

## Usage

### Via MCP Protocol
This server is designed to be used with MCP clients like Claude Code.

### Standalone
```typescript
import { generateUnitTests } from './tools/generate-unit-tests';

const result = await generateUnitTests({
  sourceFile: '/path/to/utils.ts',
  coverage: 'comprehensive'
});

console.log(`Generated ${result.testsGenerated} tests in ${result.testFilePath}`);
```

## Development

```bash
npm run dev      # Watch mode
npm test         # Run tests
npm run lint     # Lint code
npm run format   # Format code
```

## Architecture

- **Stateless Design**: No persistent state management
- **AST Parsing**: Uses Babel for TypeScript analysis
- **Template Generation**: Jest-based test templates
- **Coverage Analysis**: Parses Istanbul/NYC coverage reports

## Integration

### With Testing & Validation MCP
```typescript
// Workflow: Generate tests → Run tests → Validate coverage
const gaps = await analyzeCoverageGaps({ projectPath });
await generateUnitTests({ sourceFile: gaps.uncoveredFiles[0].path });
await testingValidationMCP.runMCPTests({ mcpPath: projectPath });
```

### With Code Review MCP
```typescript
// Generate tests for high-complexity functions
const { complexFunctions } = await codeReviewMCP.detectComplexity({ filePath });
for (const func of complexFunctions) {
  await generateUnitTests({
    sourceFile: filePath,
    functions: [func.name],
    coverage: 'edge-cases'
  });
}
```

## Requirements

- Node.js 18+
- TypeScript 5.0+

## License

MIT
