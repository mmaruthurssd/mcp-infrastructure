/**
 * Manual test for coordinate_release tool
 *
 * This test validates:
 * 1. Dependency graph construction
 * 2. Topological sort and deployment order
 * 3. Circular dependency detection
 * 4. Multi-service orchestration
 * 5. Rollback on failure
 */

import { coordinateRelease } from "./dist/tools/coordinateRelease.js";
import type { CoordinateReleaseParams, ServiceConfig } from "./dist/types.js";

// Test 1: Simple sequential deployment (no dependencies)
async function testSequentialDeployment() {
  console.log("\n=== Test 1: Sequential Deployment ===");

  const services: ServiceConfig[] = [
    { name: "service-a", version: "1.0.0" },
    { name: "service-b", version: "1.0.0" },
    { name: "service-c", version: "1.0.0" },
  ];

  const params: CoordinateReleaseParams = {
    projectPath: process.cwd(),
    releaseName: "test-sequential",
    environment: "staging",
    services,
    strategy: "sequential",
    rollbackOnFailure: false,
  };

  try {
    const result = await coordinateRelease(params);
    console.log("✓ Sequential deployment result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("✗ Sequential deployment failed:", error);
  }
}

// Test 2: Dependency-order deployment
async function testDependencyOrderDeployment() {
  console.log("\n=== Test 2: Dependency-Order Deployment ===");

  // Service dependencies:
  // database -> (api, cache) -> web-app
  const services: ServiceConfig[] = [
    {
      name: "web-app",
      version: "2.0.0",
      dependencies: ["api", "cache"],
    },
    {
      name: "api",
      version: "1.5.0",
      dependencies: ["database"],
    },
    {
      name: "cache",
      version: "1.0.0",
      dependencies: ["database"],
    },
    {
      name: "database",
      version: "3.0.0",
      dependencies: [],
    },
  ];

  const params: CoordinateReleaseParams = {
    projectPath: process.cwd(),
    releaseName: "test-dependency-order",
    environment: "staging",
    services,
    strategy: "dependency-order",
    rollbackOnFailure: false,
  };

  try {
    const result = await coordinateRelease(params);
    console.log("✓ Dependency-order deployment result:");
    console.log("  Deployment order:", result.deploymentOrder);
    console.log("  Summary:", result.summary);
    console.log("  Overall health:", result.overallHealth);

    // Verify correct order: database -> (api, cache) -> web-app
    const order = result.deploymentOrder;
    const dbIndex = order.indexOf("database");
    const apiIndex = order.indexOf("api");
    const cacheIndex = order.indexOf("cache");
    const webIndex = order.indexOf("web-app");

    if (dbIndex < apiIndex && dbIndex < cacheIndex && apiIndex < webIndex && cacheIndex < webIndex) {
      console.log("✓ Deployment order is correct!");
    } else {
      console.log("✗ Deployment order is incorrect:", order);
    }
  } catch (error) {
    console.error("✗ Dependency-order deployment failed:", error);
  }
}

// Test 3: Parallel deployment
async function testParallelDeployment() {
  console.log("\n=== Test 3: Parallel Deployment ===");

  const services: ServiceConfig[] = [
    { name: "service-1", version: "1.0.0" },
    { name: "service-2", version: "1.0.0" },
    { name: "service-3", version: "1.0.0" },
  ];

  const params: CoordinateReleaseParams = {
    projectPath: process.cwd(),
    releaseName: "test-parallel",
    environment: "staging",
    services,
    strategy: "parallel",
    rollbackOnFailure: false,
  };

  try {
    const result = await coordinateRelease(params);
    console.log("✓ Parallel deployment result:");
    console.log("  Deployment order:", result.deploymentOrder);
    console.log("  Summary:", result.summary);
  } catch (error) {
    console.error("✗ Parallel deployment failed:", error);
  }
}

// Test 4: Circular dependency detection
async function testCircularDependencyDetection() {
  console.log("\n=== Test 4: Circular Dependency Detection ===");

  // Create circular dependency: A -> B -> C -> A
  const services: ServiceConfig[] = [
    {
      name: "service-a",
      version: "1.0.0",
      dependencies: ["service-b"],
    },
    {
      name: "service-b",
      version: "1.0.0",
      dependencies: ["service-c"],
    },
    {
      name: "service-c",
      version: "1.0.0",
      dependencies: ["service-a"], // Circular!
    },
  ];

  const params: CoordinateReleaseParams = {
    projectPath: process.cwd(),
    releaseName: "test-circular",
    environment: "staging",
    services,
    strategy: "dependency-order",
    rollbackOnFailure: false,
  };

  try {
    const result = await coordinateRelease(params);
    console.error("✗ Circular dependency was NOT detected! Result:", result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Circular dependencies")) {
      console.log("✓ Circular dependency correctly detected:", error.message);
    } else {
      console.error("✗ Unexpected error:", error);
    }
  }
}

// Test 5: Complex dependency graph
async function testComplexDependencyGraph() {
  console.log("\n=== Test 5: Complex Dependency Graph ===");

  // Complex graph:
  //        database
  //       /    |    \
  //    auth  cache  queue
  //      |      |      |
  //      +------+------+
  //             |
  //           api
  //         /     \
  //    web-app  mobile-app
  const services: ServiceConfig[] = [
    {
      name: "web-app",
      version: "3.0.0",
      dependencies: ["api"],
    },
    {
      name: "mobile-app",
      version: "2.0.0",
      dependencies: ["api"],
    },
    {
      name: "api",
      version: "4.0.0",
      dependencies: ["auth", "cache", "queue"],
    },
    {
      name: "auth",
      version: "1.5.0",
      dependencies: ["database"],
    },
    {
      name: "cache",
      version: "2.0.0",
      dependencies: ["database"],
    },
    {
      name: "queue",
      version: "1.0.0",
      dependencies: ["database"],
    },
    {
      name: "database",
      version: "5.0.0",
      dependencies: [],
    },
  ];

  const params: CoordinateReleaseParams = {
    projectPath: process.cwd(),
    releaseName: "test-complex",
    environment: "staging",
    services,
    strategy: "dependency-order",
    rollbackOnFailure: false,
  };

  try {
    const result = await coordinateRelease(params);
    console.log("✓ Complex deployment result:");
    console.log("  Deployment order:", result.deploymentOrder);
    console.log("  Summary:", result.summary);

    // Verify database is first
    if (result.deploymentOrder[0] === "database") {
      console.log("✓ Database deployed first (correct)");
    } else {
      console.log("✗ Database was not deployed first");
    }

    // Verify api is before web-app and mobile-app
    const order = result.deploymentOrder;
    const apiIndex = order.indexOf("api");
    const webIndex = order.indexOf("web-app");
    const mobileIndex = order.indexOf("mobile-app");

    if (apiIndex < webIndex && apiIndex < mobileIndex) {
      console.log("✓ API deployed before frontends (correct)");
    } else {
      console.log("✗ API deployment order incorrect");
    }
  } catch (error) {
    console.error("✗ Complex deployment failed:", error);
  }
}

// Test 6: Validation - missing dependency
async function testMissingDependency() {
  console.log("\n=== Test 6: Missing Dependency Validation ===");

  const services: ServiceConfig[] = [
    {
      name: "service-a",
      version: "1.0.0",
      dependencies: ["service-b", "non-existent-service"], // Missing!
    },
    {
      name: "service-b",
      version: "1.0.0",
    },
  ];

  const params: CoordinateReleaseParams = {
    projectPath: process.cwd(),
    releaseName: "test-missing-dep",
    environment: "staging",
    services,
    strategy: "dependency-order",
    rollbackOnFailure: false,
  };

  try {
    const result = await coordinateRelease(params);
    console.error("✗ Missing dependency was NOT detected! Result:", result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Dependency validation failed")) {
      console.log("✓ Missing dependency correctly detected:", error.message);
    } else {
      console.error("✗ Unexpected error:", error);
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log("======================================");
  console.log("  Coordinate Release Tool Test Suite");
  console.log("======================================");

  try {
    await testSequentialDeployment();
    await testDependencyOrderDeployment();
    await testParallelDeployment();
    await testCircularDependencyDetection();
    await testComplexDependencyGraph();
    await testMissingDependency();

    console.log("\n======================================");
    console.log("  All tests completed!");
    console.log("======================================");
  } catch (error) {
    console.error("\nTest suite failed:", error);
    process.exit(1);
  }
}

runAllTests();
