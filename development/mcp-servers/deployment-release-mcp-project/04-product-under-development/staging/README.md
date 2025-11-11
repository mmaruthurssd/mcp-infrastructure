# Deployment & Release MCP Server

**Version:** 1.0.0  
**Status:** Production Ready

Automated deployment workflows, release coordination, rollback management, and health monitoring for the MCP ecosystem.

---

## Overview

The Deployment & Release MCP Server provides comprehensive deployment automation with:

- **6 Deployment Tools** covering the full deployment lifecycle
- **Multi-Strategy Deployments** (rolling, blue-green, canary, recreate)
- **Quality Gates Integration** with code-review, testing-validation, and security-compliance MCPs
- **Automated Rollback** with state preservation and safety checks
- **Multi-Service Coordination** with dependency resolution
- **Release Notes Generation** from git commits
- **Continuous Health Monitoring** with alerting

---

## Features

### 1. Automated Deployments (`deploy_application`)

Deploy applications with pre-deployment quality gates and multiple strategies:

```typescript
{
  projectPath: "/path/to/project",
  environment: "production",
  strategy: "blue-green",  // rolling, blue-green, canary, recreate
  preChecks: true,         // Run quality gates
  dryRun: false           // Simulate without executing
}
```

**Quality Gates (Pre-Deployment):**
- Code quality checks (via code-review-mcp)
- Test execution and coverage (via testing-validation-mcp)
- Security scans (via security-compliance-mcp)

### 2. Safe Rollbacks (`rollback_deployment`)

Rollback to previous stable versions with safety validation:

```typescript
{
  projectPath: "/path/to/project",
  environment: "production",
  deploymentId: "dep-123",  // Optional: specific deployment
  preserveData: true,       // Preserve database state
  reason: "Critical bug in v2.0" // Required for audit
}
```

**Safety Checks:**
- Schema compatibility validation
- Configuration compatibility
- Service dependency verification
- Health checks after rollback

### 3. Deployment Validation (`validate_deployment`)

Comprehensive health checks across 5 categories:

```typescript
{
  projectPath: "/path/to/project",
  environment: "production",
  checks: ["service-health", "functional", "performance", "data", "integration"]
}
```

**Returns:** Health status (healthy/degraded/unhealthy) + recommendation (proceed/monitor/rollback)

### 4. Multi-Service Releases (`coordinate_release`)

Orchestrate complex releases with dependency resolution:

```typescript
{
  projectPath: "/path/to/project",
  releaseName: "v2.0-backend-migration",
  environment: "production",
  services: [
    { name: "database", version: "2.0.0", dependencies: [] },
    { name: "api", version: "2.0.0", dependencies: ["database"] },
    { name: "frontend", version: "2.0.0", dependencies: ["api"] }
  ],
  strategy: "dependency-order",  // Topological ordering
  rollbackOnFailure: true
}
```

**Features:**
- Automatic dependency graph construction
- Topological sort for deployment order
- Circular dependency detection
- Auto-rollback on failure

### 5. Release Notes (`generate_release_notes`)

Generate comprehensive changelogs from git commits:

```typescript
{
  projectPath: "/path/to/project",
  fromVersion: "v1.0.0",
  toVersion: "v2.0.0",
  format: "markdown",  // markdown, html, json
  includeBreakingChanges: true,
  includeAuthors: true
}
```

**Output Sections:**
- Breaking Changes
- New Features
- Bug Fixes
- Enhancements
- Performance Improvements
- Security Updates
- Contributors

### 6. Health Monitoring (`monitor_deployment_health`)

Continuous monitoring with metrics and alerting:

```typescript
{
  projectPath: "/path/to/project",
  environment: "production",
  duration: 300,  // 5 minutes
  interval: 30,   // Check every 30 seconds
  alertThresholds: {
    errorRate: 5,        // 5%
    responseTime: 1000,  // 1000ms
    cpuUsage: 80,        // 80%
    memoryUsage: 85      // 85%
  }
}
```

**Monitors:**
- Application metrics (error rate, response time, request rate)
- System metrics (CPU, memory)
- Service health endpoints
- Trend analysis (improving/stable/degrading)

---

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Build

```bash
npm run build
```

### 3. Register with MCP Config Manager

```json
{
  "mcpServers": {
    "deployment-release": {
      "command": "node",
      "args": ["/path/to/deployment-release-mcp-server/dist/index.js"]
    }
  }
}
```

---

## Integration Examples

### Complete Deployment Workflow

```typescript
// 1. Deploy to staging
const deployResult = await deploy_application({
  projectPath: "/my-app",
  environment: "staging",
  strategy: "rolling",
  preChecks: true
});

// 2. Validate deployment
const validationResult = await validate_deployment({
  projectPath: "/my-app",
  environment: "staging",
  deploymentId: deployResult.deploymentId
});

if (validationResult.recommendation === "rollback") {
  // 3. Rollback if validation fails
  await rollback_deployment({
    projectPath: "/my-app",
    environment: "staging",
    reason: "Validation failed"
  });
}

// 4. Monitor for 5 minutes
const monitorResult = await monitor_deployment_health({
  projectPath: "/my-app",
  environment: "staging",
  duration: 300
});

// 5. Generate release notes
await generate_release_notes({
  projectPath: "/my-app",
  fromVersion: "v1.0.0",
  toVersion: "v2.0.0",
  format: "markdown"
});
```

### Multi-Service Production Release

```typescript
const releaseResult = await coordinate_release({
  projectPath: "/microservices",
  releaseName: "v3.0-migration",
  environment: "production",
  services: [
    { name: "database", version: "3.0.0", dependencies: [] },
    { name: "auth-service", version: "3.0.0", dependencies: ["database"] },
    { name: "api-gateway", version: "3.0.0", dependencies: ["auth-service"] },
    { name: "frontend", version: "3.0.0", dependencies: ["api-gateway"] }
  ],
  strategy: "dependency-order",
  rollbackOnFailure: true,
  notifyChannels: ["#deployments-prod"]
});

console.log(`Deployed ${releaseResult.summary.deployed} services`);
console.log(`Deployment order: ${releaseResult.deploymentOrder.join(" → ")}`);
```

---

## Data Storage

### Deployment Registry

```
{projectPath}/.deployments/
├── registry.json                    # All deployment records
├── logs/
│   └── {deploymentId}.log          # Individual deployment logs
└── rollback-snapshots/
    └── {rollbackId}/               # Rollback state snapshots
        ├── metadata.json
        ├── config/
        └── state/
```

### Release Registry

```
{projectPath}/.deployment-registry/
└── releases.json                    # Multi-service release records
```

---

## Configuration

### Environment Configuration (Optional)

Create `deployment-config.json` in your project root:

```json
{
  "dev": {
    "healthEndpoints": ["http://localhost:3000/health"],
    "maxResponseTime": 2000,
    "maxCpuUsage": 90
  },
  "staging": {
    "healthEndpoints": ["https://staging.example.com/health"],
    "maxResponseTime": 1500,
    "maxCpuUsage": 85
  },
  "production": {
    "healthEndpoints": ["https://api.example.com/health"],
    "maxResponseTime": 1000,
    "maxCpuUsage": 80,
    "maxMemoryUsage": 85
  }
}
```

---

## Deployment Strategies

### Rolling Deployment
- **Use Case:** Standard updates with minimal downtime
- **Behavior:** Updates instances incrementally (default: 2 at a time)
- **Downtime:** Minimal (brief capacity reduction)

### Blue-Green Deployment
- **Use Case:** Zero-downtime production updates
- **Behavior:** Deploy to green, validate, switch traffic, keep blue for rollback
- **Downtime:** None

### Canary Deployment
- **Use Case:** Gradual rollout with risk mitigation
- **Behavior:** Traffic gradually increases (10% → 25% → 50% → 75% → 100%)
- **Downtime:** None

### Recreate Deployment
- **Use Case:** Development environments, database schema changes
- **Behavior:** Stop all instances, deploy new version, start all
- **Downtime:** Full (brief maintenance window)

---

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage
```

---

## Architecture

```
deployment-release-mcp-server/
├── src/
│   ├── tools/                      # 6 MCP tools
│   ├── deployment/                 # Deployment strategies & orchestration
│   ├── rollback/                   # Rollback management
│   ├── validation/                 # Health checks & validation
│   ├── coordination/               # Multi-service release coordination
│   ├── release-notes/              # Changelog generation
│   ├── monitoring/                 # Health monitoring & metrics
│   └── utils/                      # Registry management
├── tests/                          # Unit tests
└── config/                         # Environment configurations
```

---

## Error Handling

All tools include comprehensive error handling:

- **Graceful Degradation:** Optional MCP integrations fail gracefully
- **Detailed Error Messages:** Clear context for troubleshooting
- **Audit Trail:** All deployments and rollbacks logged
- **Automatic Rollback:** Failed releases automatically rollback when `rollbackOnFailure=true`

---

## Best Practices

1. **Always Enable Pre-Checks:** Set `preChecks: true` for production deployments
2. **Use Dry-Run First:** Test deployments with `dryRun: true` before executing
3. **Validate After Deploy:** Run `validate_deployment` after every deployment
4. **Monitor New Deployments:** Use `monitor_deployment_health` for 5-10 minutes post-deploy
5. **Document Rollback Reasons:** Always provide detailed `reason` for rollbacks
6. **Use Dependency-Order Strategy:** For multi-service releases, let the system calculate optimal order
7. **Generate Release Notes:** Document changes for every production release

---

## Contributing

Built following MCP Server best practices with:
- TypeScript strict mode
- Comprehensive type safety
- >70% test coverage target
- Integration with workspace MCPs
- Dual-environment pattern (dev-instance + staging project)

---

## License

MIT

---

**Status:** ✅ Production Ready  
**Build:** ✅ Zero TypeScript Errors  
**Tests:** ✅ Comprehensive Coverage  
**Integration:** ✅ Compatible with code-review, testing-validation, security-compliance MCPs
