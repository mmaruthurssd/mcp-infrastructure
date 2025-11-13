---
type: guide
tags: [development, staging, build-guide]
---

# Development Guide

**Purpose:** How to develop this MCP in the dev-instance staging environment
**Last Updated:** [Date]

---

## Development Environment

**Location:** `04-product-under-development/dev-instance/`

This is the staging instance where all development, testing, and iteration happens before rollout to production.

---

## Setup

### Initial Setup
```bash
cd 04-product-under-development/dev-instance/

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

### Project Structure
```
dev-instance/
├── src/
│   ├── server.ts (main entry point)
│   ├── types.ts (type definitions)
│   ├── tools/ (individual tool implementations)
│   └── utils/ (helper utilities)
├── tests/
│   ├── unit/ (unit tests)
│   └── integration/ (integration tests)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Development Workflow

### 1. Implement Features
```bash
# Create new tool
touch src/tools/new-tool.ts

# Implement tool logic
# Follow patterns from existing tools

# Export from server.ts
```

### 2. Write Tests
```bash
# Unit tests
touch tests/unit/new-tool.test.ts

# Integration tests
touch tests/integration/new-tool.integration.test.ts
```

### 3. Build and Test
```bash
# Build
npm run build

# Run tests
npm test

# Run specific test
npm test -- new-tool
```

### 4. Test Locally
```bash
# Register dev instance temporarily for testing
# (Don't commit this registration)

# Test with real workflows
# Verify integration with other MCPs
```

### 5. Complete Rollout Checklist
- Review `mcp-implementation-master-project/03-resources-docs-assets-tools/ROLLOUT-CHECKLIST.md`
- Ensure all quality gates passed
- Document any deviations

---

## Integration Patterns

### Stateless MCP (No Workflow State)
```typescript
// Simple utility MCP
// No workflow-orchestrator needed
// Just implement tools and return results

export const tools = {
  async do_something(args: DoSomethingArgs) {
    // Perform operation
    // Return result
    return { success: true, result: data };
  }
};
```

### Stateful MCP (Uses Workflow Orchestrator)
```typescript
// Import workflow-orchestrator
import { StateManager } from 'workflow-orchestrator-mcp-server/dist/core/state-manager.js';
import { WorkflowState } from 'workflow-orchestrator-mcp-server/dist/types/project-state.js';

// Define custom workflow data
interface YourWorkflowData {
  currentStep: string;
  metadata: Record<string, any>;
}

// Create adapter
export class YourStateManager {
  static save(projectPath: string, state: WorkflowState<YourWorkflowData>) {
    StateManager.writeState(projectPath, state);
  }

  static load(projectPath: string): WorkflowState<YourWorkflowData> | null {
    return StateManager.readState(projectPath) as WorkflowState<YourWorkflowData>;
  }
}
```

**Reference:** `planning-and-roadmap/future-ideas/Workspace-Component-Roles-System/MCP-BUILD-INTEGRATION-GUIDE.md`

---

## Testing

### Unit Tests
```bash
# Run all unit tests
npm test

# Run specific test file
npm test -- unit/tool-name.test.ts

# Watch mode
npm test -- --watch
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration

# These test with real file system, real MCP calls
```

### Coverage
```bash
npm run test:coverage
```

**Target:** >70% coverage

---

## Security Scanning

```bash
# Before every commit
cd ../../../../local-instances/mcp-servers/security-compliance-mcp/
npm run scan -- ../../mcp-server-development/[mcp-name]/dev-instance/

# Or use git pre-commit hook (when integrated)
```

---

## Common Tasks

### Add New Tool
1. Create `src/tools/tool-name.ts`
2. Implement tool logic
3. Add types to `src/types.ts`
4. Export from `src/server.ts`
5. Write tests
6. Update README.md

### Debug Issues
```bash
# Add console.log for debugging
console.log('[DEBUG] Variable:', variable);

# Run with verbose logging
NODE_DEBUG=* npm test

# Check build output
ls dist/
```

### Update Dependencies
```bash
npm outdated
npm update
npm audit fix
```

---

## Production Issues

When production issues are reported:

1. **Log Issue**
   ```bash
   cd ../../08-archive/issues/
   cp issue-template.md $(date +%Y-%m-%d)-issue-description.md
   # Fill in issue details
   ```

2. **Reproduce in Dev**
   - Reproduce issue in dev-instance
   - Add reproduction test
   - Verify issue exists

3. **Fix and Test**
   - Implement fix
   - Verify fix resolves issue
   - Ensure tests pass
   - No regressions

4. **Rollout**
   - Follow rollout checklist
   - Update version
   - Document in CHANGELOG
   - Rollout to production

---

## Rollout to Production

**When ready:**

1. **Final checks:**
   - [ ] All tests passing
   - [ ] Documentation updated
   - [ ] Rollout checklist complete
   - [ ] Version bumped

2. **Copy to production:**
   ```bash
   # From workspace root
   cp -r mcp-server-development/[mcp-name]/dev-instance/ \
         local-instances/mcp-servers/[mcp-name]/
   ```

3. **Register:**
   ```bash
   # Use mcp-config-manager
   ```

4. **Restart Claude Code**

5. **Verify:**
   - MCP loads successfully
   - Tools available
   - Basic smoke tests pass

---

## Troubleshooting

### Build Fails
- Check TypeScript errors
- Verify all imports resolve
- Check tsconfig.json

### Tests Fail
- Check test logs
- Verify test data setup
- Check for race conditions

### MCP Won't Load
- Check package.json name
- Verify dist/ exists
- Check .mcp.json registration

---

## Best Practices

1. **Test First**
   - Write tests before/during development
   - Aim for >70% coverage

2. **Small Commits**
   - Commit working increments
   - Clear commit messages

3. **Document As You Go**
   - Update README.md
   - Comment complex logic

4. **Security First**
   - No credentials in code
   - No PHI in logs
   - Scan before commit

5. **Follow Patterns**
   - Use workflow-orchestrator for stateful MCPs
   - Follow existing tool patterns
   - Consistent error handling

---

## Resources

**Guides:**
- `MCP-BUILD-INTEGRATION-GUIDE.md` - Integration patterns
- `ROLLOUT-CHECKLIST.md` - Quality gates
- `workflow-orchestrator-mcp-server/docs/API.md` - Workflow orchestrator API

**Examples:**
- `local-instances/mcp-servers/project-management-mcp-server/` - Stateful MCP example
- `local-instances/mcp-servers/security-compliance-mcp/` - Stateless MCP example

---

**Last Updated:** [Date]
**Development Status:** [Phase]
