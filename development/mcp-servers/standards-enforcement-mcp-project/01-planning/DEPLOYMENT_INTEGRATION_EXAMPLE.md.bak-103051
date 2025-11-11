# Standards Enforcement + Deployment-Release Integration

## Implementation Example

### Step 1: Update deployment-release-mcp/src/tools/deploy-application.ts

Add standards validation before deployment:

```typescript
import { ValidateMcpComplianceParams } from '../../../standards-enforcement-mcp/types/tool-params.js';

async function deploy_application(params: DeployApplicationParams) {
  const { projectPath, environment, target } = params;

  // ============================================
  // STANDARDS ENFORCEMENT GATE
  // ============================================
  console.log('🔍 Running pre-deployment compliance check...');

  // Call standards-enforcement-mcp via MCP Client
  const validation = await callMcpTool('standards-enforcement-mcp', 'validate_mcp_compliance', {
    mcpName: target || extractMcpName(projectPath),
    categories: ['security', 'dual-environment', 'configuration'],
    failFast: false,
    includeWarnings: environment === 'production', // Stricter for prod
  });

  // Check compliance
  if (!validation.compliant) {
    const summary = validation.summary;

    // Production: Block on critical violations
    if (environment === 'production' && summary.criticalViolations > 0) {
      throw new Error(
        `🛑 DEPLOYMENT BLOCKED TO PRODUCTION\\n` +
        `Critical Violations: ${summary.criticalViolations}\\n` +
        `Compliance Score: ${summary.complianceScore}/100\\n\\n` +
        `Fix critical violations before deploying to production.\\n` +
        `Run: validate_mcp_compliance({mcpName: "${target}"})`
      );
    }

    // Staging/Dev: Warn but allow
    if (environment !== 'production') {
      console.warn(
        `⚠️  Compliance issues detected (Score: ${summary.complianceScore}/100)\\n` +
        `${summary.criticalViolations} critical, ${summary.warningViolations} warnings\\n` +
        `Deployment proceeding to ${environment}...`
      );
    }
  } else {
    console.log(`✅ Compliance check passed (Score: ${validation.summary.complianceScore}/100)`);
  }

  // ============================================
  // PROCEED WITH DEPLOYMENT
  // ============================================
  // ... existing deployment logic
}
```

### Step 2: Helper Function for MCP Tool Calls

```typescript
// deployment-release-mcp/src/utils/mcp-client.ts

/**
 * Call a tool from another MCP server
 */
async function callMcpTool(
  serverName: string,
  toolName: string,
  args: any
): Promise<any> {
  // In Claude Code, MCPs can call each other via stdio
  // This is a simplified example - actual implementation may vary

  const { spawn } = require('child_process');
  const path = require('path');

  return new Promise((resolve, reject) => {
    const mcpPath = path.join(
      process.env.HOME,
      'Desktop/medical-practice-workspace/local-instances/mcp-servers',
      serverName,
      'dist/index.js'
    );

    const child = spawn('node', [mcpPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Send tool call request
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    };

    child.stdin.write(JSON.stringify(request) + '\\n');
    child.stdin.end();

    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result.result);
        } catch (e) {
          reject(new Error('Failed to parse MCP response'));
        }
      } else {
        reject(new Error(`MCP call failed with code ${code}`));
      }
    });
  });
}
```

### Step 3: Configuration

Add to deployment-release-mcp settings:

```json
{
  "preDeploymentValidation": {
    "enabled": true,
    "production": {
      "blockOnCritical": true,
      "minimumScore": 90,
      "requiredCategories": [
        "security",
        "dual-environment",
        "configuration"
      ]
    },
    "staging": {
      "blockOnCritical": false,
      "minimumScore": 70,
      "warnOnly": true
    },
    "dev": {
      "enabled": false
    }
  }
}
```

## Testing the Integration

```bash
# Test deployment with compliance check
claude mcp call deployment-release-mcp deploy_application '{
  "projectPath": "/path/to/mcp-project",
  "environment": "production",
  "target": "my-mcp"
}'

# Expected output:
# 🔍 Running pre-deployment compliance check...
# ✅ Compliance check passed (Score: 95/100)
# ✅ Deploying to production...
```

## Rollout Plan

### Week 1: Development Environment
- [x] Add standards validation to deployment-release-mcp
- [x] Test with dev environment deployments
- [x] Set blockOnCritical: false for testing

### Week 2: Staging Environment
- [ ] Enable for staging deployments
- [ ] Set blockOnCritical: true
- [ ] Monitor for false positives

### Week 3: Production Environment
- [ ] Enable for production deployments
- [ ] Require minimumScore: 90
- [ ] Full enforcement of all critical violations

## Metrics to Track

After integration:

1. **Deployments Blocked**: Count of production deployments prevented
2. **Issues Caught**: Types of violations caught pre-deployment
3. **Compliance Trends**: Average score over time
4. **False Positives**: Rules that need adjustment
