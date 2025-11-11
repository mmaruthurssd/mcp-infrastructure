---
type: reference
tags: [api-docs, deployment-mcp, tool-reference]
---

# Deployment & Release MCP - API Reference

**Version:** 1.0.0
**Last Updated:** 2025-10-30

## Tools

### 1. deploy_to_environment

Deploy application to specified environment with automated build and validation.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| environment | string | Yes | - | Target environment: 'dev', 'staging', or 'production' |
| version | string | Yes | - | Version to deploy (e.g., "1.2.3") |
| buildCommand | string | No | "npm run build" | Custom build command |
| runTests | boolean | No | true | Run tests before deployment |
| rollbackOnFailure | boolean | No | true | Auto-rollback on failure |

**Returns:**

```typescript
{
  success: boolean;
  environment: Environment;
  version: string;
  timestamp: string;
  duration?: number;
  artifacts?: string[];
  error?: string;
}
```

**Example:**

```json
{
  "tool": "deploy_to_environment",
  "arguments": {
    "environment": "staging",
    "version": "1.2.0",
    "runTests": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "environment": "staging",
  "version": "1.2.0",
  "timestamp": "2025-10-30T18:45:00.000Z",
  "duration": 45000,
  "artifacts": ["dist/", "package.json"]
}
```

---

### 2. rollback_deployment

Rollback deployment to previous version with state restoration.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| environment | string | Yes | - | Environment to rollback |
| toVersion | string | No | (previous) | Specific version to rollback to |
| validateAfter | boolean | No | true | Validate after rollback |

**Returns:**

```typescript
{
  success: boolean;
  environment: Environment;
  fromVersion: string;
  toVersion: string;
  timestamp: string;
  stateRestored: boolean;
  error?: string;
}
```

**Example:**

```json
{
  "tool": "rollback_deployment",
  "arguments": {
    "environment": "production",
    "validateAfter": true
  }
}
```

---

### 3. validate_deployment

Validate deployment with comprehensive checks.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| environment | string | Yes | - | Environment to validate |
| runSmokeTests | boolean | No | true | Run smoke tests |
| runHealthChecks | boolean | No | true | Run health checks |
| checkIntegrations | boolean | No | false | Check integrations |

**Returns:**

```typescript
{
  passed: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    severity: 'error' | 'warning' | 'info';
    message: string;
  }>;
}
```

**Example:**

```json
{
  "tool": "validate_deployment",
  "arguments": {
    "environment": "staging",
    "runSmokeTests": true,
    "checkIntegrations": true
  }
}
```

---

### 4. coordinate_release

Coordinate multi-system release with dependency management.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| systems | string[] | Yes | - | List of systems to deploy |
| version | string | Yes | - | Release version |
| environment | string | Yes | - | Target environment |
| sequential | boolean | No | true | Deploy sequentially vs parallel |

**Returns:**

```typescript
{
  success: boolean;
  version: string;
  environment: string;
  systemsDeployed: number;
  results: Array<{
    system: string;
    success: boolean;
    timestamp: string;
    message: string;
  }>;
  duration: number;
}
```

**Example:**

```json
{
  "tool": "coordinate_release",
  "arguments": {
    "systems": ["api-server", "web-frontend", "worker-service"],
    "version": "2.0.0",
    "environment": "production",
    "sequential": true
  }
}
```

---

### 5. generate_release_notes

Auto-generate release notes from git commits.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| fromVersion | string | Yes | - | Starting version |
| toVersion | string | Yes | - | Ending version |
| format | string | No | "markdown" | Output format: 'markdown', 'html', 'json' |

**Returns:**

```typescript
{
  version: string;
  date: string;
  changes: Array<{
    type: 'feature' | 'fix' | 'breaking' | 'docs' | 'refactor';
    description: string;
    commit?: string;
  }>;
  contributors?: string[];
}
```

**Example:**

```json
{
  "tool": "generate_release_notes",
  "arguments": {
    "fromVersion": "v1.0.0",
    "toVersion": "v1.1.0",
    "format": "markdown"
  }
}
```

---

### 6. check_deployment_health

Health check post-deployment with performance metrics.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| environment | string | Yes | - | Environment to check |
| healthCheckUrl | string | No | - | Custom health check URL |
| timeout | number | No | 30000 | Timeout in milliseconds |

**Returns:**

```typescript
{
  healthy: boolean;
  responseTime?: number;
  checks: Array<{
    name: string;
    passed: boolean;
    message?: string;
  }>;
}
```

**Example:**

```json
{
  "tool": "check_deployment_health",
  "arguments": {
    "environment": "production",
    "timeout": 10000
  }
}
```

---

## Error Handling

All tools return structured error responses:

```json
{
  "success": false,
  "error": "Error message description",
  "message": "User-friendly error message"
}
```

## Best Practices

1. **Always run tests** before production deployments
2. **Enable rollbackOnFailure** for production environments
3. **Validate deployments** after completion
4. **Use sequential mode** for coordinated releases to production
5. **Generate release notes** for all production releases
6. **Run health checks** after every deployment

## Integration Examples

### Full Deployment Workflow

```typescript
// 1. Deploy to staging
await deployToEnvironment({
  environment: 'staging',
  version: '1.2.0',
  runTests: true
});

// 2. Validate staging deployment
await validateDeployment({
  environment: 'staging',
  runSmokeTests: true,
  checkIntegrations: true
});

// 3. Check health
await checkDeploymentHealth({
  environment: 'staging'
});

// 4. Deploy to production (if staging passes)
await deployToEnvironment({
  environment: 'production',
  version: '1.2.0',
  runTests: true,
  rollbackOnFailure: true
});

// 5. Generate release notes
await generateReleaseNotes({
  fromVersion: 'v1.1.0',
  toVersion: 'v1.2.0',
  format: 'markdown'
});
```

---

## Support

For issues or questions, see `TROUBLESHOOTING.md` in the resources directory.
