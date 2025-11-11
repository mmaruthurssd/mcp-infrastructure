#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import {
  parseConfigurationGuide,
  validateServerConfig,
  type ServerRequirements,
  type ValidationIssue,
} from "./guide-parser.js";
import { standardsValidator } from "./standards-validator-client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Types
interface MCPServer {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface MCPConfig {
  mcpServers: Record<string, MCPServer>;
}

interface ScopeInfo {
  scope: "user" | "project";
  configPath: string;
  exists: boolean;
  built?: boolean;
}

// Server setup
const server = new Server(
  {
    name: "mcp-config-manager",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Utility functions
function getWorkspaceRoot(): string {
  // Try to find workspace root by looking for .git or .mcp.json
  let currentDir = process.cwd();
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    if (
      fs.existsSync(path.join(currentDir, ".git")) ||
      fs.existsSync(path.join(currentDir, ".mcp.json"))
    ) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  return process.cwd();
}

function getConfigPaths(workspaceRoot: string): {
  global: string;
  workspace: string;
  claudeCode?: string;
  vsCode?: string;
} {
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  const platform = process.platform;

  let claudeCodePath: string | undefined;
  let vsCodePath: string | undefined;

  if (platform === "darwin") {
    // macOS
    // Note: claude_desktop_config.json is CLAUDE CODE's global config
    // (not a separate Desktop app - the filename is misleading)
    claudeCodePath = path.join(
      homeDir,
      "Library",
      "Application Support",
      "Claude",
      "claude_desktop_config.json"
    );
    vsCodePath = path.join(
      homeDir,
      "Library",
      "Application Support",
      "Code",
      "User",
      "globalStorage",
      "saoudrizwan.claude-dev",
      "settings",
      "cline_mcp_settings.json"
    );
  } else if (platform === "win32") {
    // Windows
    // Note: claude_desktop_config.json is CLAUDE CODE's global config
    claudeCodePath = path.join(
      homeDir,
      "AppData",
      "Roaming",
      "Claude",
      "claude_desktop_config.json"
    );
    vsCodePath = path.join(
      homeDir,
      "AppData",
      "Roaming",
      "Code",
      "User",
      "globalStorage",
      "saoudrizwan.claude-dev",
      "settings",
      "cline_mcp_settings.json"
    );
  }

  return {
    global: path.join(homeDir, ".claude.json"),
    workspace: path.join(workspaceRoot, ".mcp.json"),
    claudeCode: claudeCodePath,
    vsCode: vsCodePath,
  };
}

function readConfig(configPath: string): MCPConfig | null {
  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(content) as MCPConfig;
  } catch (error) {
    console.error(`Error reading config from ${configPath}:`, error);
    return null;
  }
}

function writeConfig(configPath: string, config: MCPConfig): boolean {
  try {
    // Create backup
    if (fs.existsSync(configPath)) {
      const backupPath = `${configPath}.backup`;
      fs.copyFileSync(configPath, backupPath);
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error(`Error writing config to ${configPath}:`, error);
    return false;
  }
}

function getLocalInstances(workspaceRoot: string): string[] {
  const instancesDir = path.join(
    workspaceRoot,
    "local-instances",
    "mcp-servers"
  );

  if (!fs.existsSync(instancesDir)) {
    return [];
  }

  return fs
    .readdirSync(instancesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

function checkServerBuilt(workspaceRoot: string, serverName: string): boolean {
  const serverPath = path.join(
    workspaceRoot,
    "local-instances",
    "mcp-servers",
    serverName,
    "dist",
    "server.js"
  );
  return fs.existsSync(serverPath);
}

function detectScope(
  workspaceRoot: string,
  serverName: string
): "user" | "project" {
  const serverPath = path.join(
    workspaceRoot,
    "local-instances",
    "mcp-servers",
    serverName
  );
  const packageJsonPath = path.join(serverPath, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    return "project"; // Default to project scope
  }

  try {
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, "utf-8")
    );

    // Check if it's a generic utility
    const utilityKeywords = ["git", "file", "utility", "helper"];
    const name = packageJson.name?.toLowerCase() || "";

    if (utilityKeywords.some((keyword) => name.includes(keyword))) {
      return "user";
    }

    // Default to project scope for workspace-specific servers
    return "project";
  } catch (error) {
    return "project";
  }
}

function getServerConfig(
  serverName: string,
  globalConfig: MCPConfig | null,
  workspaceConfig: MCPConfig | null,
  claudeCodeConfig: MCPConfig | null,
  vsCodeConfig: MCPConfig | null
): MCPServer | null {
  // Priority: claude-code > vscode > workspace > global
  if (claudeCodeConfig?.mcpServers[serverName]) {
    return claudeCodeConfig.mcpServers[serverName];
  }
  if (vsCodeConfig?.mcpServers[serverName]) {
    return vsCodeConfig.mcpServers[serverName];
  }
  if (workspaceConfig?.mcpServers[serverName]) {
    return workspaceConfig.mcpServers[serverName];
  }
  if (globalConfig?.mcpServers[serverName]) {
    return globalConfig.mcpServers[serverName];
  }
  return null;
}

// Tool implementations

async function syncMCPConfigs(workspaceRoot: string): Promise<string> {
  const configPaths = getConfigPaths(workspaceRoot);
  const globalConfig = readConfig(configPaths.global);
  const workspaceConfig = readConfig(configPaths.workspace);
  const claudeCodeConfig = configPaths.claudeCode
    ? readConfig(configPaths.claudeCode)
    : null;
  const vsCodeConfig = configPaths.vsCode
    ? readConfig(configPaths.vsCode)
    : null;
  const localInstances = getLocalInstances(workspaceRoot);

  const report: string[] = [];
  report.push("=== MCP Configuration Sync Report ===\n");

  // Report which configs are active
  report.push("** Active Configuration Files **");
  if (globalConfig) {
    report.push(`  ✓ Global: ${configPaths.global}`);
  }
  if (workspaceConfig) {
    report.push(`  ✓ Workspace: ${configPaths.workspace}`);
  }
  if (claudeCodeConfig && configPaths.claudeCode) {
    report.push(`  ✓ Claude Code (global): ${configPaths.claudeCode}`);
  }
  if (vsCodeConfig && configPaths.vsCode) {
    report.push(`  ✓ VS Code: ${configPaths.vsCode}`);
  }
  if (!globalConfig && !workspaceConfig && !claudeCodeConfig && !vsCodeConfig) {
    report.push("  ⚠️  No configuration files found!");
  }
  report.push("");

  // Get all registered servers
  const globalServers = new Set(
    Object.keys(globalConfig?.mcpServers || {})
  );
  const workspaceServers = new Set(
    Object.keys(workspaceConfig?.mcpServers || {})
  );
  const claudeCodeServers = new Set(
    Object.keys(claudeCodeConfig?.mcpServers || {})
  );
  const vsCodeServers = new Set(
    Object.keys(vsCodeConfig?.mcpServers || {})
  );
  const allRegistered = new Set([
    ...globalServers,
    ...workspaceServers,
    ...claudeCodeServers,
    ...vsCodeServers,
  ]);

  // Check for orphaned configs
  report.push("** Orphaned Configurations **");
  let hasOrphans = false;

  for (const serverName of allRegistered) {
    if (!localInstances.includes(serverName)) {
      const scope = globalServers.has(serverName) ? "global" : "workspace";
      report.push(`  ⚠️  ${serverName} (in ${scope} config, but no local instance)`);
      hasOrphans = true;
    }
  }

  if (!hasOrphans) {
    report.push("  ✓ No orphaned configurations");
  }

  report.push("");

  // Check for missing registrations
  report.push("** Missing Registrations **");
  let hasMissing = false;

  for (const instanceName of localInstances) {
    if (!allRegistered.has(instanceName)) {
      const suggestedScope = detectScope(workspaceRoot, instanceName);
      const built = checkServerBuilt(workspaceRoot, instanceName);
      report.push(
        `  ⚠️  ${instanceName} (not registered, suggest: ${suggestedScope} scope, built: ${built})`
      );
      hasMissing = true;
    }
  }

  if (!hasMissing) {
    report.push("  ✓ All local instances are registered");
  }

  report.push("");

  // Check for configuration conflicts
  report.push("** Configuration Conflicts **");
  let hasConflicts = false;

  for (const serverName of allRegistered) {
    const locations: string[] = [];
    const configs: { location: string; path: string }[] = [];

    if (globalServers.has(serverName)) {
      locations.push("global");
      configs.push({
        location: "global",
        path: globalConfig!.mcpServers[serverName].args[0] || "",
      });
    }
    if (workspaceServers.has(serverName)) {
      locations.push("workspace");
      configs.push({
        location: "workspace",
        path: workspaceConfig!.mcpServers[serverName].args[0] || "",
      });
    }
    if (claudeCodeServers.has(serverName)) {
      locations.push("claude-code");
      configs.push({
        location: "claude-code",
        path: claudeCodeConfig!.mcpServers[serverName].args[0] || "",
      });
    }
    if (vsCodeServers.has(serverName)) {
      locations.push("vscode");
      configs.push({
        location: "vscode",
        path: vsCodeConfig!.mcpServers[serverName].args[0] || "",
      });
    }

    // If server is in multiple configs, it's a potential conflict
    if (locations.length > 1) {
      report.push(`  ⚠️  ${serverName} - REGISTERED IN MULTIPLE LOCATIONS`);
      report.push(`     Locations: ${locations.join(", ")}`);

      // Show paths for each location
      for (const config of configs) {
        report.push(`     ${config.location}: ${config.path}`);
      }

      // Check if paths differ
      const uniquePaths = new Set(
        configs.map((c) => c.path.replace(/\$\{workspaceFolder\}/g, ""))
      );
      if (uniquePaths.size > 1) {
        report.push(
          `     ❌ PATHS DIFFER - This WILL cause loading issues!`
        );
        report.push(
          `     Claude Code may only load from one location, others will fail.`
        );
      } else {
        report.push(
          `     ⚠️  Paths are same but multiple registrations can cause issues.`
        );
      }

      report.push(
        `     Recommendation: Keep in ONE location only. Remove from others.`
      );
      if (locations.includes("claude-code")) {
        report.push(
          `     Suggested: Keep in claude-code (Claude Code's primary config), remove from workspace/global.`
        );
      } else if (locations.includes("vscode")) {
        report.push(
          `     Suggested: Keep in vscode OR claude-code depending on which you use more.`
        );
      } else {
        report.push(
          `     Suggested: Keep in claude-code (for Claude Code) or workspace (for project-specific).`
        );
      }
      hasConflicts = true;
    }
  }

  if (!hasConflicts) {
    report.push("  ✓ No configuration conflicts detected");
  }

  report.push("");

  // Check for unbuilt servers
  report.push("** Build Status **");
  let hasUnbuilt = false;

  for (const instanceName of localInstances) {
    if (allRegistered.has(instanceName)) {
      const built = checkServerBuilt(workspaceRoot, instanceName);
      if (!built) {
        report.push(`  ⚠️  ${instanceName} (registered but not built)`);
        hasUnbuilt = true;
      }
    }
  }

  if (!hasUnbuilt) {
    report.push("  ✓ All registered servers are built");
  }

  report.push("");

  // Parse configuration guide and validate
  const guideRequirements = parseConfigurationGuide(workspaceRoot);

  // Check environment variables
  report.push("** Environment Variables (Guide Compliance) **");
  let hasEnvIssues = false;

  for (const serverName of allRegistered) {
    const requirements = guideRequirements.get(serverName);
    if (!requirements || requirements.envVars.length === 0) {
      continue;
    }

    const serverConfig = getServerConfig(
      serverName,
      globalConfig,
      workspaceConfig,
      claudeCodeConfig,
      vsCodeConfig
    );

    if (serverConfig) {
      const issues = validateServerConfig(
        workspaceRoot,
        serverName,
        serverConfig,
        requirements
      ).filter((issue) => issue.category === "env-var");

      if (issues.length > 0) {
        report.push(`  ⚠️  ${serverName}:`);
        for (const issue of issues) {
          report.push(`     ${issue.message}`);
          if (issue.fix) {
            report.push(`     Fix: ${issue.fix}`);
          }
        }
        hasEnvIssues = true;
      }
    }
  }

  if (!hasEnvIssues) {
    report.push("  ✓ All registered servers have required environment variables");
  }

  report.push("");

  // Check configuration directories
  report.push("** Configuration Directories (Guide Compliance) **");
  let hasDirIssues = false;

  for (const serverName of allRegistered) {
    const requirements = guideRequirements.get(serverName);
    if (!requirements || !requirements.configDir) {
      continue;
    }

    const serverConfig = getServerConfig(
      serverName,
      globalConfig,
      workspaceConfig,
      claudeCodeConfig,
      vsCodeConfig
    );

    if (serverConfig) {
      const issues = validateServerConfig(
        workspaceRoot,
        serverName,
        serverConfig,
        requirements
      ).filter((issue) => issue.category === "config-dir");

      if (issues.length > 0) {
        report.push(`  ⚠️  ${serverName}:`);
        for (const issue of issues) {
          report.push(`     ${issue.message}`);
          if (issue.fix) {
            report.push(`     Fix: ${issue.fix}`);
          }
        }
        hasDirIssues = true;
      }
    }
  }

  if (!hasDirIssues) {
    report.push(
      "  ✓ All required configuration directories exist (or servers don't need them)"
    );
  }

  report.push("");

  // Check path portability
  report.push("** Path Portability **");
  let hasPathIssues = false;

  for (const serverName of allRegistered) {
    const serverConfig = getServerConfig(
      serverName,
      globalConfig,
      workspaceConfig,
      claudeCodeConfig,
      vsCodeConfig
    );

    if (serverConfig) {
      const requirements = guideRequirements.get(serverName);
      if (requirements) {
        const issues = validateServerConfig(
          workspaceRoot,
          serverName,
          serverConfig,
          requirements
        ).filter((issue) => issue.category === "path-portability");

        if (issues.length > 0) {
          report.push(`  ⚠️  ${serverName}:`);
          for (const issue of issues) {
            report.push(`     ${issue.message}`);
            if (issue.fix) {
              report.push(`     Fix: ${issue.fix}`);
            }
          }
          hasPathIssues = true;
        }
      }
    }
  }

  if (!hasPathIssues) {
    report.push("  ✓ All servers use portable paths (${workspaceFolder})");
  }

  report.push("");
  report.push("=== Summary ===");
  report.push(`Local instances: ${localInstances.length}`);
  if (globalConfig) {
    report.push(`Global config: ${globalServers.size} servers`);
  }
  if (workspaceConfig) {
    report.push(`Workspace config: ${workspaceServers.size} servers`);
  }
  if (claudeCodeConfig) {
    report.push(`Claude Code config: ${claudeCodeServers.size} servers`);
  }
  if (vsCodeConfig) {
    report.push(`VS Code config: ${vsCodeServers.size} servers`);
  }

  // Warnings summary
  const warnings: string[] = [];
  if (hasConflicts) {
    warnings.push(
      "CONFLICTS - Servers registered in multiple locations will fail to load"
    );
  }
  if (hasEnvIssues) {
    warnings.push("ENV VARS - Some servers missing required environment variables");
  }
  if (hasDirIssues) {
    warnings.push("CONFIG DIRS - Some required configuration directories don't exist");
  }
  if (hasPathIssues) {
    warnings.push("PATHS - Some servers use hardcoded paths instead of ${workspaceFolder}");
  }

  if (warnings.length > 0) {
    report.push(`\n⚠️  ISSUES DETECTED:`);
    for (const warning of warnings) {
      report.push(`   - ${warning}`);
    }
    report.push(
      `\n💡 See MCP_CONFIGURATION_GUIDE.md for detailed requirements and fixes.`
    );
  } else {
    report.push(`\n✅ All servers properly configured per MCP_CONFIGURATION_GUIDE.md`);
  }

  return report.join("\n");
}

async function registerMCPServer(
  workspaceRoot: string,
  serverName: string,
  scope?: "user" | "project"
): Promise<string> {
  const configPaths = getConfigPaths(workspaceRoot);

  // Check if server exists
  const serverPath = path.join(
    workspaceRoot,
    "local-instances",
    "mcp-servers",
    serverName
  );

  if (!fs.existsSync(serverPath)) {
    return `❌ Error: Server '${serverName}' not found in local-instances/mcp-servers/`;
  }

  // Check if built
  if (!checkServerBuilt(workspaceRoot, serverName)) {
    return `⚠️  Warning: Server '${serverName}' exists but is not built. Run 'npm run build' in ${serverPath}`;
  }

  // ============================================
  // STANDARDS COMPLIANCE CHECK
  // ============================================
  try {
    console.log(`\n🔍 Running standards compliance check for '${serverName}'...`);

    const validation = await standardsValidator.validateMcpCompliance({
      mcpName: serverName,
      categories: ['security', 'configuration', 'documentation'],
      failFast: false,
      includeWarnings: true,
    });

    const { summary } = validation;
    const complianceReport: string[] = [];

    if (!validation.compliant) {
      complianceReport.push(`\n⚠️  COMPLIANCE CHECK RESULTS:`);
      complianceReport.push(`   Compliance Score: ${summary.complianceScore}/100`);
      complianceReport.push(`   Critical Violations: ${summary.criticalViolations}`);
      complianceReport.push(`   Warnings: ${summary.warningViolations}`);
      complianceReport.push(``);

      if (summary.criticalViolations > 0) {
        complianceReport.push(`   ⚠️  This MCP has ${summary.criticalViolations} critical violation(s).`);
        complianceReport.push(`   While registration will proceed, you should fix these before deployment.`);
      }

      complianceReport.push(``);
      complianceReport.push(`   💡 Fix violations with: validate_mcp_compliance({mcpName: "${serverName}"})`);
      complianceReport.push(`   ⚠️  Note: Production deployments require score ≥ 90 and zero critical violations.`);
      complianceReport.push(``);

      // Return early with compliance warnings if violations exist
      return complianceReport.join('\n');
    } else {
      console.log(`✅ Compliance check passed (Score: ${summary.complianceScore}/100)`);
    }
  } catch (error: any) {
    // Log error but continue with registration
    console.warn(`⚠️  Compliance check failed: ${error.message}`);
    console.warn(`Proceeding with registration...`);
  }

  // Check guide requirements
  const guideRequirements = parseConfigurationGuide(workspaceRoot);
  const requirements = guideRequirements.get(serverName);

  if (requirements) {
    // Show what will be needed for this server
    const warnings: string[] = [];

    if (requirements.envVars.length > 0) {
      warnings.push(`\n📋 Environment variables needed for '${serverName}':`);
      for (const envVar of requirements.envVars) {
        const status = envVar.required ? "REQUIRED" : "optional";
        warnings.push(`   - ${envVar.name} (${status}): ${envVar.description}`);
        if (envVar.defaultValue) {
          warnings.push(`     Default: ${envVar.defaultValue}`);
        }
      }
    }

    if (requirements.configDir && requirements.configDir.required) {
      const configDirPath = requirements.configDir.path.replace(
        /\$\{workspaceFolder\}/g,
        workspaceRoot
      );
      if (!fs.existsSync(configDirPath)) {
        warnings.push(
          `\n⚠️  Configuration directory required but does not exist: ${requirements.configDir.path}`
        );
        warnings.push(`   Create with: mkdir -p ${configDirPath}`);
      }
    }

    if (warnings.length > 0) {
      warnings.unshift(
        `\n💡 Guide compliance check for '${serverName}' (per MCP_CONFIGURATION_GUIDE.md:${requirements.guideSection.startLine}):`
      );
      warnings.push(
        `\nℹ️  You can still register now, but you'll need to add these manually to your config file.`
      );
      warnings.push(
        `   See MCP_CONFIGURATION_GUIDE.md for the recommended configuration.\n`
      );
    }

    if (warnings.length > 0) {
      return warnings.join("\n");
    }
  }

  // ENFORCEMENT: Claude Code CLI ONLY uses ~/.claude.json (per MCP-CONFIGURATION-CHECKLIST.md)
  // Detect if we're in Claude Code CLI context
  const isClaudeCodeCLI = process.env.CLAUDE_CODE_CLI !== undefined ||
                          process.env.CLAUDE !== undefined ||
                          // Check if this process was started by Claude Code CLI
                          process.ppid !== undefined;

  if (isClaudeCodeCLI) {
    // For Claude Code CLI, ALWAYS use ~/.claude.json, NEVER workspace .mcp.json
    return [
      `❌ CONFIGURATION ERROR: Cannot auto-register MCPs in Claude Code CLI context`,
      ``,
      `Per MCP-CONFIGURATION-CHECKLIST.md (v1.2.0), Claude Code CLI uses ~/.claude.json ONLY.`,
      `Workspace .mcp.json should NOT exist for Claude Code CLI.`,
      ``,
      `To register '${serverName}' manually in ~/.claude.json:`,
      ``,
      `1. Open ~/.claude.json`,
      `2. Add this entry to the "mcpServers" section:`,
      ``,
      `   "${serverName}": {`,
      `     "command": "node",`,
      `     "args": ["${path.join(serverPath, "dist", "server.js")}"]`,
      `   }`,
      ``,
      `3. Save and restart Claude Code`,
      `4. Verify with: cat ~/.claude.json | jq '.mcpServers.keys'`,
      ``,
      `IMPORTANT: Follow MCP-CONFIGURATION-CHECKLIST.md for all 8 validation steps.`,
    ].join('\n');
  }

  // Detect scope if not provided
  const targetScope = scope || detectScope(workspaceRoot, serverName);
  const configPath =
    targetScope === "user" ? configPaths.global : configPaths.workspace;

  // Read config
  let config = readConfig(configPath);
  if (!config) {
    config = { mcpServers: {} };
  }

  // Check if already registered
  if (config.mcpServers[serverName]) {
    return `ℹ️  Server '${serverName}' is already registered in ${targetScope} scope`;
  }

  // Add server
  const serverJs = path.join(serverPath, "dist", "server.js");
  config.mcpServers[serverName] = {
    command: "node",
    args: [serverJs],
  };

  // Write config
  if (writeConfig(configPath, config)) {
    return `✅ Successfully registered '${serverName}' in ${targetScope} scope\n   Config: ${configPath}\n\n💡 Tip: Consider validating workspace documentation with:\n   workspace-index.validate_workspace_documentation()`;
  } else {
    return `❌ Failed to write configuration to ${configPath}`;
  }
}

async function unregisterMCPServer(
  workspaceRoot: string,
  serverName: string
): Promise<string> {
  const configPaths = getConfigPaths(workspaceRoot);
  const results: string[] = [];

  // Check global config
  const globalConfig = readConfig(configPaths.global);
  if (globalConfig && globalConfig.mcpServers[serverName]) {
    delete globalConfig.mcpServers[serverName];
    if (writeConfig(configPaths.global, globalConfig)) {
      results.push(`✅ Removed '${serverName}' from global config`);
    } else {
      results.push(`❌ Failed to remove from global config`);
    }
  }

  // Check workspace config
  const workspaceConfig = readConfig(configPaths.workspace);
  if (workspaceConfig && workspaceConfig.mcpServers[serverName]) {
    delete workspaceConfig.mcpServers[serverName];
    if (writeConfig(configPaths.workspace, workspaceConfig)) {
      results.push(`✅ Removed '${serverName}' from workspace config`);
    } else {
      results.push(`❌ Failed to remove from workspace config`);
    }
  }

  if (results.length === 0) {
    return `ℹ️  Server '${serverName}' was not found in any configuration`;
  }

  return results.join("\n") + `\n\n💡 Tip: Consider validating workspace documentation with:\n   workspace-index.validate_workspace_documentation()`;
}

async function listMCPServers(workspaceRoot: string): Promise<string> {
  const configPaths = getConfigPaths(workspaceRoot);
  const globalConfig = readConfig(configPaths.global);
  const workspaceConfig = readConfig(configPaths.workspace);
  const localInstances = getLocalInstances(workspaceRoot);

  const report: string[] = [];
  report.push("=== MCP Servers ===\n");

  // Create a map of all servers
  const serverMap = new Map<
    string,
    { scopes: Set<string>; built: boolean; exists: boolean }
  >();

  // Add global servers
  for (const name of Object.keys(globalConfig?.mcpServers || {})) {
    if (!serverMap.has(name)) {
      serverMap.set(name, { scopes: new Set(), built: false, exists: false });
    }
    serverMap.get(name)!.scopes.add("global");
  }

  // Add workspace servers
  for (const name of Object.keys(workspaceConfig?.mcpServers || {})) {
    if (!serverMap.has(name)) {
      serverMap.set(name, { scopes: new Set(), built: false, exists: false });
    }
    serverMap.get(name)!.scopes.add("workspace");
  }

  // Add local instances
  for (const name of localInstances) {
    if (!serverMap.has(name)) {
      serverMap.set(name, { scopes: new Set(), built: false, exists: true });
    }
    const info = serverMap.get(name)!;
    info.exists = true;
    info.built = checkServerBuilt(workspaceRoot, name);
  }

  // Update build status for registered servers
  for (const [name, info] of serverMap) {
    if (info.scopes.size > 0) {
      info.built = checkServerBuilt(workspaceRoot, name);
      info.exists = localInstances.includes(name);
    }
  }

  // Sort servers
  const sortedServers = Array.from(serverMap.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  // Generate report
  for (const [name, info] of sortedServers) {
    const scopes = Array.from(info.scopes).join(", ") || "not registered";
    const status = !info.exists
      ? "❌ missing"
      : !info.built
        ? "⚠️  not built"
        : "✅ ready";
    report.push(`${name}`);
    report.push(`  Scopes: ${scopes}`);
    report.push(`  Status: ${status}`);
    report.push("");
  }

  report.push(`Total servers: ${serverMap.size}`);
  report.push(`Local instances: ${localInstances.length}`);

  return report.join("\n");
}

async function validateMCPConfiguration(
  workspaceRoot: string,
  serverName?: string
): Promise<string> {
  const configPaths = getConfigPaths(workspaceRoot);
  const globalConfig = readConfig(configPaths.global);
  const workspaceConfig = readConfig(configPaths.workspace);
  const claudeCodeConfig = configPaths.claudeCode
    ? readConfig(configPaths.claudeCode)
    : null;
  const vsCodeConfig = configPaths.vsCode
    ? readConfig(configPaths.vsCode)
    : null;

  const guideRequirements = parseConfigurationGuide(workspaceRoot);
  const report: string[] = [];

  if (serverName) {
    // Validate specific server
    report.push(`=== Configuration Validation: ${serverName} ===\n`);

    const requirements = guideRequirements.get(serverName);
    if (!requirements) {
      return `❌ Server '${serverName}' not found in MCP_CONFIGURATION_GUIDE.md\n   Available servers: ${Array.from(guideRequirements.keys()).join(", ")}`;
    }

    const serverConfig = getServerConfig(
      serverName,
      globalConfig,
      workspaceConfig,
      claudeCodeConfig,
      vsCodeConfig
    );

    if (!serverConfig) {
      report.push(`❌ Server '${serverName}' is not registered in any config file`);
      report.push(
        `\n💡 Register with: register_mcp_server("${serverName}")\n`
      );
      return report.join("\n");
    }

    // Run validation
    const issues = validateServerConfig(
      workspaceRoot,
      serverName,
      serverConfig,
      requirements
    );

    // Group issues by severity and category
    const errors = issues.filter((i) => i.severity === "error");
    const warnings = issues.filter((i) => i.severity === "warning");
    const info = issues.filter((i) => i.severity === "info");

    // Show server status from guide
    report.push(`Status: ${requirements.statusEmoji} ${requirements.status}`);
    report.push(
      `Guide reference: MCP_CONFIGURATION_GUIDE.md:${requirements.guideSection.startLine}-${requirements.guideSection.endLine}\n`
    );

    // Report issues
    if (errors.length > 0) {
      report.push("** Errors **");
      for (const issue of errors) {
        report.push(`  ❌ ${issue.message}`);
        if (issue.fix) {
          report.push(`     Fix: ${issue.fix}`);
        }
        if (issue.guideReference) {
          report.push(`     See: ${issue.guideReference}`);
        }
      }
      report.push("");
    }

    if (warnings.length > 0) {
      report.push("** Warnings **");
      for (const issue of warnings) {
        report.push(`  ⚠️  ${issue.message}`);
        if (issue.fix) {
          report.push(`     Fix: ${issue.fix}`);
        }
        if (issue.guideReference) {
          report.push(`     See: ${issue.guideReference}`);
        }
      }
      report.push("");
    }

    if (info.length > 0) {
      report.push("** Info **");
      for (const issue of info) {
        report.push(`  ℹ️  ${issue.message}`);
      }
      report.push("");
    }

    if (issues.length === 0) {
      report.push("✅ No issues found - server properly configured!");
    } else {
      report.push("=== Summary ===");
      report.push(`Errors: ${errors.length}`);
      report.push(`Warnings: ${warnings.length}`);
      report.push(`Info: ${info.length}`);
    }
  } else {
    // Validate all servers
    report.push("=== Configuration Validation: All Servers ===\n");

    const allRegistered = new Set([
      ...Object.keys(globalConfig?.mcpServers || {}),
      ...Object.keys(workspaceConfig?.mcpServers || {}),
      ...Object.keys(claudeCodeConfig?.mcpServers || {}),
      ...Object.keys(vsCodeConfig?.mcpServers || {}),
    ]);

    let totalErrors = 0;
    let totalWarnings = 0;

    for (const name of allRegistered) {
      const requirements = guideRequirements.get(name);
      if (!requirements) {
        continue;
      }

      const serverConfig = getServerConfig(
        name,
        globalConfig,
        workspaceConfig,
        claudeCodeConfig,
        vsCodeConfig
      );

      if (serverConfig) {
        const issues = validateServerConfig(
          workspaceRoot,
          name,
          serverConfig,
          requirements
        );

        const errors = issues.filter((i) => i.severity === "error");
        const warnings = issues.filter((i) => i.severity === "warning");

        if (errors.length > 0 || warnings.length > 0) {
          report.push(`${name}: ${requirements.statusEmoji}`);
          report.push(
            `  Errors: ${errors.length}, Warnings: ${warnings.length}`
          );

          totalErrors += errors.length;
          totalWarnings += warnings.length;
        }
      }
    }

    report.push("");
    report.push("=== Summary ===");
    report.push(`Total servers validated: ${allRegistered.size}`);
    report.push(`Total errors: ${totalErrors}`);
    report.push(`Total warnings: ${totalWarnings}`);

    if (totalErrors === 0 && totalWarnings === 0) {
      report.push("\n✅ All servers properly configured!");
    } else {
      report.push(
        `\n💡 Run validate_mcp_configuration("<server-name>") for detailed analysis of a specific server.`
      );
    }
  }

  return report.join("\n");
}

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "sync_mcp_configs",
        description:
          "Scan local MCP server instances and compare with config files. Reports orphaned configs, missing registrations, and build status issues.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "register_mcp_server",
        description:
          "Register a local MCP server instance in the appropriate config file. Auto-detects scope (user vs project) based on server characteristics.",
        inputSchema: {
          type: "object",
          properties: {
            serverName: {
              type: "string",
              description:
                "Name of the server directory in local-instances/mcp-servers/",
            },
            scope: {
              type: "string",
              enum: ["user", "project"],
              description:
                "Optional: Force specific scope. If not provided, scope is auto-detected.",
            },
          },
          required: ["serverName"],
        },
      },
      {
        name: "unregister_mcp_server",
        description:
          "Remove an MCP server from all configuration files (both global and workspace configs).",
        inputSchema: {
          type: "object",
          properties: {
            serverName: {
              type: "string",
              description: "Name of the server to unregister",
            },
          },
          required: ["serverName"],
        },
      },
      {
        name: "list_mcp_servers",
        description:
          "List all MCP servers with their registration scopes, build status, and existence in local instances.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "validate_mcp_configuration",
        description:
          "Validate MCP server configuration against MCP_CONFIGURATION_GUIDE.md requirements. Checks environment variables, config directories, and path portability. Can validate a specific server or all servers.",
        inputSchema: {
          type: "object",
          properties: {
            serverName: {
              type: "string",
              description:
                "Optional: Name of server to validate. If not provided, validates all registered servers.",
            },
          },
          required: [],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const workspaceRoot = getWorkspaceRoot();

  switch (request.params.name) {
    case "sync_mcp_configs":
      return {
        content: [
          {
            type: "text",
            text: await syncMCPConfigs(workspaceRoot),
          },
        ],
      };

    case "register_mcp_server": {
      const { serverName, scope } = request.params.arguments as {
        serverName: string;
        scope?: "user" | "project";
      };
      return {
        content: [
          {
            type: "text",
            text: await registerMCPServer(workspaceRoot, serverName, scope),
          },
        ],
      };
    }

    case "unregister_mcp_server": {
      const { serverName } = request.params.arguments as {
        serverName: string;
      };
      return {
        content: [
          {
            type: "text",
            text: await unregisterMCPServer(workspaceRoot, serverName),
          },
        ],
      };
    }

    case "list_mcp_servers":
      return {
        content: [
          {
            type: "text",
            text: await listMCPServers(workspaceRoot),
          },
        ],
      };

    case "validate_mcp_configuration": {
      const { serverName } = request.params.arguments as {
        serverName?: string;
      };
      return {
        content: [
          {
            type: "text",
            text: await validateMCPConfiguration(workspaceRoot, serverName),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Config Manager server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
