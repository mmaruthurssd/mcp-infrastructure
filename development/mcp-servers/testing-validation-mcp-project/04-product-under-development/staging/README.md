---
type: readme
tags: [mcp, testing, validation, quality-gates, dev-instance]
---

# Testing & Validation MCP Server

**Version:** 0.1.0
**Status:** Ready for Rollout
**Last Updated:** 2025-10-29

Automated testing framework for quality assurance across all MCP servers in the workspace.

---

## Overview

The Testing & Validation MCP provides comprehensive automated testing and validation tools for MCP server development:

- **Test Execution**: Run unit and integration tests with coverage reporting
- **Standards Validation**: Validate MCP implementations against workspace conventions
- **Quality Gates**: Automate ROLLOUT-CHECKLIST.md validation
- **Coverage Reporting**: Generate detailed test coverage analysis
- **Smoke Testing**: Quick functionality checks for MCP tools
- **Schema Validation**: Validate tool parameter schemas

**Production Location:** `/local-instances/mcp-servers/testing-validation-mcp-server/` (pending rollout)

---

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Start MCP server
npm start
```

---

## Tools

### 1. `run_mcp_tests`

Execute unit and integration tests for an MCP server with optional coverage reporting.

**Parameters:**
```typescript
{
  mcpPath: string;              // Path to MCP dev-instance or local-instance
  testType?: "unit" | "integration" | "all";  // Default: "all"
  coverage?: boolean;           // Generate coverage report (default: false)
  verbose?: boolean;            // Detailed output (default: false)
}
```

**Example:**
```typescript
{
  "mcpPath": "/path/to/my-mcp/dev-instance",
  "testType": "all",
  "coverage": true,
  "verbose": false
}
```

**Output:**
- Test results (passed/failed/skipped counts)
- Execution time
- Coverage report (if requested)
- Detailed failure information

---

### 2. `validate_mcp_implementation`

Validate MCP against workspace standards and best practices.

**Parameters:**
```typescript
{
  mcpPath: string;              // Path to MCP project root
  standards?: string[];         // ["fileStructure", "naming", "documentation", "code", "mcp"]
                                // Default: all
}
```

**Example:**
```typescript
{
  "mcpPath": "/path/to/my-mcp-project",
  "standards": ["fileStructure", "documentation", "mcp"]
}
```

**Validates:**
- File structure (8-folder system, dev-instance location)
- Naming conventions (kebab-case, descriptive names)
- Documentation (YAML frontmatter, required sections)
- Code standards (TypeScript, error handling, exports)
- MCP standards (tool schemas, SDK usage, parameter validation)

---

### 3. `check_quality_gates`

Execute ROLLOUT-CHECKLIST.md quality gates to determine rollout readiness.

**Parameters:**
```typescript
{
  mcpPath: string;              // Path to MCP project root
  phase?: "pre-development" | "development" | "testing" |
          "documentation" | "pre-rollout" | "all";  // Default: "all"
}
```

**Example:**
```typescript
{
  "mcpPath": "/path/to/my-mcp-project",
  "phase": "all"
}
```

**Quality Gates:**
- **Pre-development**: Specification exists, dependencies documented
- **Development**: Code complete, follows standards, builds successfully
- **Testing**: Unit tests pass, integration tests pass, coverage >70%, security scan clean
- **Documentation**: README complete, API documented, CHANGELOG updated
- **Pre-rollout**: Staging validation, code review, deployment plan

---

### 4. `generate_coverage_report`

Generate detailed test coverage report in multiple formats.

**Parameters:**
```typescript
{
  mcpPath: string;              // Path to MCP dev-instance
  format?: "text" | "html" | "json";  // Default: "text"
  outputPath?: string;          // Where to save report (optional)
}
```

**Example:**
```typescript
{
  "mcpPath": "/path/to/my-mcp/dev-instance",
  "format": "html",
  "outputPath": "/path/to/coverage-report.html"
}
```

---

### 5. `run_smoke_tests`

Run basic smoke tests on MCP tools to verify availability and basic functionality.

**Parameters:**
```typescript
{
  mcpPath: string;              // Path to MCP project
  tools?: string[];             // Specific tools to test (default: all)
}
```

**Example:**
```typescript
{
  "mcpPath": "/path/to/my-mcp-project",
  "tools": ["create_goal", "evaluate_goal"]
}
```

**Tests:**
- Tool availability check
- Parameter schema validation
- Basic invocation test
- Response format validation
- Error handling test

---

### 6. `validate_tool_schema`

Validate MCP tool parameter schemas for correctness and completeness.

**Parameters:**
```typescript
{
  mcpPath: string;              // Path to MCP project
  toolName?: string;            // Specific tool (default: all tools)
}
```

**Example:**
```typescript
{
  "mcpPath": "/path/to/my-mcp-project",
  "toolName": "create_goal"
}
```

---

## Usage Examples

### Pre-Rollout Validation Workflow

```bash
# 1. Run all tests
run_mcp_tests({
  mcpPath: "/path/to/my-mcp/dev-instance",
  testType: "all",
  coverage: true
})

# 2. Validate standards compliance
validate_mcp_implementation({
  mcpPath: "/path/to/my-mcp-project"
})

# 3. Check quality gates
check_quality_gates({
  mcpPath: "/path/to/my-mcp-project",
  phase: "all"
})

# 4. Run smoke tests
run_smoke_tests({
  mcpPath: "/path/to/my-mcp-project"
})

# If all pass → Ready for rollout!
```

### Quick Health Check

```bash
# Quick check if MCP is working
run_smoke_tests({
  mcpPath: "/path/to/my-mcp-project"
})
```

### Focused Testing

```bash
# Test only unit tests
run_mcp_tests({
  mcpPath: "/path/to/my-mcp/dev-instance",
  testType: "unit",
  verbose: true
})

# Validate only documentation
validate_mcp_implementation({
  mcpPath: "/path/to/my-mcp-project",
  standards: ["documentation"]
})

# Check only testing phase gates
check_quality_gates({
  mcpPath: "/path/to/my-mcp-project",
  phase: "testing"
})
```

---

## Project Structure

```
dev-instance/
├── src/
│   ├── server.ts                       # Main MCP server entry point
│   ├── types.ts                        # Type definitions (213 lines)
│   ├── tools/                          # Tool implementations (6 tools)
│   │   ├── run-mcp-tests.ts            # Test execution (180 lines)
│   │   ├── validate-mcp-implementation.ts  # Standards validation (226 lines)
│   │   ├── check-quality-gates.ts      # Quality gates (203 lines)
│   │   ├── generate-coverage-report.ts # Coverage reporting (69 lines)
│   │   ├── run-smoke-tests.ts          # Smoke testing (158 lines)
│   │   └── validate-tool-schema.ts     # Schema validation (163 lines)
│   └── utils/                          # Utility classes (5 utilities)
│       ├── test-runner.ts              # Test execution logic (396 lines)
│       ├── standards-validator.ts      # Standards checking (664 lines)
│       ├── quality-gate-validator.ts   # Gate validation (410 lines)
│       ├── coverage-reporter.ts        # Coverage analysis (494 lines)
│       ├── smoke-tester.ts             # Smoke test logic (253 lines)
│       └── schema-validator.ts         # Schema validation (337 lines)
├── tests/
│   ├── unit/                           # Unit tests (27 tests, all passing)
│   │   ├── test-runner.test.ts
│   │   ├── standards-validator.test.ts
│   │   ├── quality-gate-validator.test.ts
│   │   └── coverage-reporter.test.ts
│   └── integration/                    # Integration tests (16 tests, all passing)
│       └── tools.integration.test.ts
├── dist/                               # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md (this file)
```

**Total Implementation:** ~3,800+ lines of TypeScript code + 43 passing tests

---

## Test Results

```
Unit Tests:        27 passed, 27 total (2.019s)
Integration Tests: 16 passed, 16 total (1.383s)
Total Tests:       43 passed, 43 total
Build Status:      ✅ Success (zero errors)
Server Startup:    ✅ Success
```

---

## Development Status

**Status:** ✅ **Implementation Complete - Ready for Rollout**

### Completed ✅
- [x] All 6 tools implemented and tested
- [x] All 5 utility classes implemented
- [x] Complete type definitions
- [x] 27 unit tests passing
- [x] 16 integration tests passing
- [x] Build succeeds with zero errors
- [x] Server starts successfully
- [x] Comprehensive error handling
- [x] Formatted output for all tools
- [x] Documentation complete

### Ready for Rollout ✅
- [x] Tests: 43/43 passing (100%)
- [x] Build: Clean compilation
- [x] Coverage: Well-tested utilities
- [x] Documentation: Complete
- [x] Quality: Production-ready

---

## Testing

```bash
# Run all tests (unit + integration)
npm test

# Run specific test suite
npm test -- test-runner

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Integration tests only
npm run test:integration

# Specific test file
npm test -- tools.integration.test.ts
```

**Current Coverage:** All critical paths tested with 43 passing tests

---

## Build and Deploy

### Build
```bash
npm run build
```

Compiles TypeScript to `dist/` directory.

### Test Server Startup
```bash
npm run build && node dist/server.js
```

Should output: "Testing & Validation MCP Server running on stdio"

### Deploy to Production

**When ready for rollout:**

1. ✅ Verify all tests pass: `npm test`
2. ✅ Build succeeds: `npm run build`
3. ✅ Review ROLLOUT-CHECKLIST.md
4. Copy to production:
   ```bash
   cp -r dev-instance/ /local-instances/mcp-servers/testing-validation-mcp-server/
   ```
5. Register with mcp-config-manager
6. Restart Claude Code
7. Verify functionality with smoke tests

---

## Integration

### With Other MCPs

**Security Scanning:**
This MCP integrates with `security-compliance-mcp` for quality gate validation:
- Credential scanning
- PHI detection
- Security best practices validation

**Project Management:**
Can be used by `project-management-mcp` for automated quality checks during development workflows.

**Workflow Orchestration:**
Stateless MCP - no workflow-orchestrator integration needed.

---

## Dependencies

**Runtime:**
- @modelcontextprotocol/sdk: ^1.0.4

**Development:**
- @types/node: ^22.10.2
- @types/jest: ^29.5.0
- jest: ^29.5.0
- ts-jest: ^29.1.0
- typescript: ^5.7.2

**External Tools:**
- npm (for test execution)
- Jest (test framework)
- File system access (reading MCP projects)

---

## Troubleshooting

### Build fails
```bash
# Check TypeScript errors
npx tsc --noEmit

# Clean and rebuild
rm -rf dist/ && npm run build
```

### Tests fail
```bash
# Run specific test
npm test -- test-runner.test.ts

# Verbose output
npm test -- --verbose

# Check test logs
cat tests/unit/*.test.ts
```

### MCP won't load
- Verify `dist/server.js` exists
- Check package.json `main` field: `"main": "dist/server.js"`
- Verify .mcp.json registration:
  ```json
  {
    "mcpServers": {
      "testing-validation": {
        "command": "node",
        "args": ["/path/to/testing-validation-mcp-server/dist/server.js"]
      }
    }
  }
  ```

---

## Performance

**Targets:**
- Test execution: < 2 minutes for typical MCP
- Quality gate validation: < 10 seconds
- Standards validation: < 5 seconds
- Coverage report generation: < 30 seconds

**Actual (Measured):**
- Unit tests: 2.019s ✅
- Integration tests: 1.383s ✅
- Server startup: ~1s ✅

---

## Resources

**Documentation:**
- Specification: `../../01-planning/SPECIFICATION.md`
- Development Guide: `../../04-product-under-development/DEVELOPMENT.md`
- Next Steps: `../../NEXT-STEPS.md`

**Master Project:**
- `../../../mcp-implementation-master-project/`
- ROLLOUT-CHECKLIST.md
- MCP-COMPLETION-TRACKER.md

---

## License

MIT

---

**Created:** 2025-10-29
**Last Updated:** 2025-10-29
**Status:** ✅ Ready for Production Rollout
