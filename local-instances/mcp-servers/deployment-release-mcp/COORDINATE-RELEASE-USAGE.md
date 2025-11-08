# Coordinate Release Tool - Usage Guide

## Overview
The `coordinate_release` tool orchestrates multi-service deployments with automatic dependency resolution, parallel execution, and rollback capabilities.

## Basic Usage

### Simple Sequential Deployment
```typescript
const result = await coordinateRelease({
  projectPath: "/path/to/project",
  releaseName: "v2.0.0-release",
  environment: "staging",
  services: [
    { name: "api", version: "2.0.0" },
    { name: "web", version: "2.0.0" },
    { name: "worker", version: "2.0.0" }
  ],
  strategy: "sequential"
});
```

### Dependency-Based Deployment
```typescript
const result = await coordinateRelease({
  projectPath: "/path/to/project",
  releaseName: "microservices-v3",
  environment: "production",
  services: [
    {
      name: "web-app",
      version: "3.0.0",
      dependencies: ["api-gateway", "auth-service"]
    },
    {
      name: "api-gateway",
      version: "2.5.0",
      dependencies: ["database"]
    },
    {
      name: "auth-service",
      version: "1.8.0",
      dependencies: ["database"]
    },
    {
      name: "database",
      version: "5.7.0",
      dependencies: []
    }
  ],
  strategy: "dependency-order" // Default
});
```

### Parallel Deployment with Rollback
```typescript
const result = await coordinateRelease({
  projectPath: "/path/to/project",
  releaseName: "fast-deploy",
  environment: "staging",
  services: [
    { name: "service-1", version: "1.0.0" },
    { name: "service-2", version: "1.0.0" },
    { name: "service-3", version: "1.0.0" }
  ],
  strategy: "parallel",
  rollbackOnFailure: true, // Auto-rollback on any failure
  notifyChannels: ["slack://releases", "email://team@example.com"]
});
```

## Parameters

### CoordinateReleaseParams

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `projectPath` | string | ✓ | - | Absolute path to project directory |
| `releaseName` | string | ✓ | - | Human-readable release name |
| `environment` | "staging" \| "production" | ✓ | - | Target environment |
| `services` | ServiceConfig[] | ✓ | - | List of services to deploy |
| `strategy` | "sequential" \| "parallel" \| "dependency-order" | | "dependency-order" | Deployment strategy |
| `rollbackOnFailure` | boolean | | false | Auto-rollback on failure |
| `notifyChannels` | string[] | | [] | Notification channels |

### ServiceConfig

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | ✓ | Unique service identifier |
| `version` | string | ✓ | Version to deploy |
| `dependencies` | string[] | | List of service names this service depends on |
| `config` | Record<string, any> | | Service-specific configuration |

## Return Value

### CoordinateReleaseResult

```typescript
{
  success: boolean;              // Overall success
  releaseId: string;             // Unique release ID
  environment: string;           // Target environment
  timestamp: string;             // ISO timestamp
  summary: {
    totalServices: number;       // Total services
    deployed: number;            // Successfully deployed
    failed: number;              // Failed deployments
    rolledBack: number;          // Rolled back services
    duration: number;            // Total duration (ms)
  };
  deploymentOrder: string[];     // Actual deployment order
  serviceResults: ServiceResult[]; // Per-service results
  overallHealth: "healthy" | "degraded" | "unhealthy";
  releaseNotes: string;          // Path to release notes
}
```

### ServiceResult

```typescript
{
  service: string;               // Service name
  status: "success" | "failed" | "rolled-back";
  deploymentId: string;          // Deployment ID
  version: string;               // Deployed version
  duration: number;              // Deployment duration (ms)
  healthStatus: string;          // Health status
}
```

## Deployment Strategies

### 1. Sequential (`strategy: "sequential"`)
- Deploys services **one at a time** in order
- Each deployment completes before next starts
- Safest option, slowest execution
- **Use case**: Production deployments, risk-averse scenarios

**Example deployment order**:
```
Service A → Service B → Service C
  |           |           |
  1min       2min        1min
Total: 4 minutes
```

### 2. Parallel (`strategy: "parallel"`)
- Deploys **all services simultaneously**
- Ignores dependencies (assumes independence)
- Fastest execution, highest risk
- **Use case**: Independent microservices, development environments

**Example deployment order**:
```
Service A
Service B  } All deploy simultaneously
Service C
  |
 2min (longest service)
Total: 2 minutes
```

### 3. Dependency-Order (`strategy: "dependency-order"`) [DEFAULT]
- Uses **topological sort** for optimal ordering
- Deploys in **batches** based on dependencies
- Services with satisfied dependencies deploy in parallel
- **Use case**: Complex microservice architectures

**Example deployment order**:
```
Batch 1: Database
         |
Batch 2: Auth, Cache, Queue  } Parallel
         |
Batch 3: API
         |
Batch 4: Web-App, Mobile-App } Parallel

Total: Sum of batch durations
```

## Dependency Graph Rules

### Valid Dependency Structures

✓ **Linear Chain**
```
A → B → C → D
```

✓ **Diamond Pattern**
```
    A
   / \
  B   C
   \ /
    D
```

✓ **Tree Structure**
```
      A
    / | \
   B  C  D
  /|  |  |\
 E F  G  H I
```

### Invalid Dependency Structures

✗ **Circular Dependency**
```
A → B → C → A  (cycle detected)
```

✗ **Self-Dependency**
```
A → A  (invalid)
```

✗ **Missing Dependency**
```
A → B (but B not in service list)
```

## Error Handling

### Validation Errors (Pre-Deployment)

**Missing Dependency**
```typescript
// Error: "Service 'api' depends on 'database', but 'database' is not defined"
```

**Circular Dependency**
```typescript
// Error: "Circular dependencies detected: A -> B -> C -> A"
```

**Duplicate Service**
```typescript
// Error: "Duplicate service name: 'api' appears 2 times"
```

### Deployment Errors (During Execution)

**Service Deployment Failed**
```typescript
{
  success: false,
  serviceResults: [
    {
      service: "api",
      status: "failed",
      healthStatus: "unhealthy"
    }
  ]
}
```

**Batch Failed (stops subsequent batches)**
```typescript
// If rollbackOnFailure: false
// Stops deployment, returns partial results

// If rollbackOnFailure: true
// Rolls back all deployed services in reverse order
```

## Rollback Behavior

When `rollbackOnFailure: true`:

1. **Track Deployments**: Records all successfully deployed services
2. **Detect Failure**: Any service failure triggers rollback
3. **Reverse Order**: Rolls back in reverse deployment order
4. **Update Status**: Changes service status to "rolled-back"
5. **Final Result**: Returns release with "rolled-back" status

**Example**:
```
Deployment: DB → Cache → API (FAILED)
                  ↓
Rollback:   DB ← Cache (reverse order)
```

## Complete Example: Production Release

```typescript
import { coordinateRelease } from "./dist/tools/coordinateRelease.js";

// Define microservice architecture
const services = [
  // Frontend applications
  {
    name: "customer-portal",
    version: "4.2.0",
    dependencies: ["api-gateway", "cdn"]
  },
  {
    name: "admin-dashboard",
    version: "2.1.0",
    dependencies: ["api-gateway"]
  },

  // Backend services
  {
    name: "api-gateway",
    version: "3.5.0",
    dependencies: ["auth-service", "rate-limiter"]
  },
  {
    name: "auth-service",
    version: "2.8.0",
    dependencies: ["user-database", "session-cache"]
  },
  {
    name: "rate-limiter",
    version: "1.4.0",
    dependencies: ["redis-cache"]
  },

  // Data layer
  {
    name: "user-database",
    version: "5.7.0",
    dependencies: []
  },
  {
    name: "session-cache",
    version: "6.2.0",
    dependencies: []
  },
  {
    name: "redis-cache",
    version: "6.2.0",
    dependencies: []
  },

  // Infrastructure
  {
    name: "cdn",
    version: "1.0.0",
    dependencies: []
  }
];

// Execute coordinated release
const result = await coordinateRelease({
  projectPath: "/var/www/production",
  releaseName: "Q4-2025-Release",
  environment: "production",
  services,
  strategy: "dependency-order",
  rollbackOnFailure: true,
  notifyChannels: [
    "slack://engineering-releases",
    "email://devops@company.com"
  ]
});

// Check results
if (result.success) {
  console.log(`✓ Release ${result.releaseId} successful!`);
  console.log(`  Deployed ${result.summary.deployed}/${result.summary.totalServices} services`);
  console.log(`  Duration: ${result.summary.duration}ms`);
  console.log(`  Health: ${result.overallHealth}`);
} else {
  console.error(`✗ Release ${result.releaseId} failed!`);
  console.error(`  Failed: ${result.summary.failed} services`);
  console.error(`  Rolled back: ${result.summary.rolledBack} services`);

  // Check which services failed
  result.serviceResults
    .filter(r => r.status === "failed")
    .forEach(r => {
      console.error(`  - ${r.service}: ${r.healthStatus}`);
    });
}
```

**Expected deployment order**:
```
Batch 1: user-database, session-cache, redis-cache, cdn
Batch 2: auth-service, rate-limiter
Batch 3: api-gateway
Batch 4: customer-portal, admin-dashboard
```

## Best Practices

### 1. Define Clear Dependencies
```typescript
// ✓ Good: Explicit dependencies
{
  name: "api",
  dependencies: ["database", "cache"]
}

// ✗ Bad: Implicit dependencies (not tracked)
{
  name: "api"
  // api actually needs database, but not declared
}
```

### 2. Use Semantic Versioning
```typescript
// ✓ Good
{ name: "api", version: "2.1.0" }

// ✗ Bad
{ name: "api", version: "latest" }
```

### 3. Enable Rollback in Production
```typescript
// ✓ Good: Production with rollback
{
  environment: "production",
  rollbackOnFailure: true
}

// ✓ Acceptable: Staging without rollback
{
  environment: "staging",
  rollbackOnFailure: false
}
```

### 4. Use Dependency-Order for Complex Systems
```typescript
// ✓ Good: Complex microservices
{
  strategy: "dependency-order",
  services: [/* many interdependent services */]
}

// ✗ Bad: Parallel with dependencies
{
  strategy: "parallel", // Ignores dependencies!
  services: [/* services with dependencies */]
}
```

### 5. Monitor Release Health
```typescript
const result = await coordinateRelease(params);

// Check overall health
if (result.overallHealth === "degraded") {
  // Some services unhealthy, investigate
  console.warn("Release completed but health is degraded");
}

// Check individual service health
result.serviceResults.forEach(service => {
  if (service.healthStatus !== "healthy") {
    console.error(`Service ${service.service} is ${service.healthStatus}`);
  }
});
```

## Troubleshooting

### Problem: "Circular dependencies detected"
**Cause**: Services have circular dependency chain
**Solution**: Restructure dependencies to remove cycles

### Problem: "Service 'X' not found in service list"
**Cause**: Dependency references non-existent service
**Solution**: Add missing service or remove invalid dependency

### Problem: All deployments fail immediately
**Cause**: Pre-deployment checks failing
**Solution**: Check project path, environment configuration, and service definitions

### Problem: Slow parallel deployments
**Cause**: Many dependencies forcing sequential batches
**Solution**: Review dependency graph, reduce unnecessary dependencies

### Problem: Rollback fails after deployment failure
**Cause**: Previous deployment not tracked in registry
**Solution**: Ensure deployment registry is properly initialized

## Registry Storage

Releases are stored in `.deployment-registry/releases.json`:

```json
{
  "version": "1.0.0",
  "projectPath": "/path/to/project",
  "lastUpdated": "2025-10-31T00:00:00.000Z",
  "releases": [
    {
      "releaseId": "release-q4-2025-1234567890-abc123",
      "releaseName": "Q4-2025-Release",
      "environment": "production",
      "timestamp": "2025-10-31T00:00:00.000Z",
      "status": "success",
      "services": ["api", "web", "worker"],
      "deploymentOrder": ["api", "web", "worker"],
      "serviceResults": [...],
      "duration": 45000,
      "overallHealth": "healthy",
      "releaseNotesPath": ".deployment-registry/release-notes/..."
    }
  ]
}
```

## Next Steps

1. Review implementation in `COORDINATE-RELEASE-IMPLEMENTATION.md`
2. Run test suite: `node manual-test-coordinate-release.ts`
3. Integrate with CI/CD pipeline
4. Configure notification channels
5. Set up monitoring and alerting
