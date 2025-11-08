import * as fs from "fs";
import * as path from "path";
/**
 * Parse the MCP_CONFIGURATION_GUIDE.md file and extract server requirements
 */
export function parseConfigurationGuide(workspaceRoot) {
    const guidePath = path.join(workspaceRoot, "local-instances", "mcp-servers", "MCP_CONFIGURATION_GUIDE.md");
    if (!fs.existsSync(guidePath)) {
        console.error(`Configuration guide not found at: ${guidePath}`);
        return new Map();
    }
    const content = fs.readFileSync(guidePath, "utf-8");
    const lines = content.split("\n");
    const servers = new Map();
    // Parse the status summary table first (lines 18-29)
    const statusMap = parseStatusTable(lines);
    // Parse individual server sections
    let currentSection = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Detect server section headers (e.g., "### 1. project-management-mcp-server")
        const headerMatch = line.match(/^### \d+\. (.+)$/);
        if (headerMatch) {
            // Save previous section if exists
            if (currentSection) {
                const requirements = parseServerSection(currentSection, statusMap.get(currentSection.name));
                if (requirements) {
                    servers.set(currentSection.name, requirements);
                }
            }
            // Start new section
            const fullName = headerMatch[1].trim();
            const name = fullName.replace(/-mcp-server$/, "");
            currentSection = {
                name,
                displayName: fullName,
                startLine: i + 1,
                lines: [],
            };
            continue;
        }
        // Detect end of server section (next header or separator)
        if (currentSection && (line.startsWith("##") || line === "---")) {
            const requirements = parseServerSection(currentSection, statusMap.get(currentSection.name));
            if (requirements) {
                requirements.guideSection.endLine = i;
                servers.set(currentSection.name, requirements);
            }
            currentSection = null;
            continue;
        }
        // Collect lines for current section
        if (currentSection) {
            currentSection.lines.push(line);
        }
    }
    // Handle last section if exists
    if (currentSection) {
        const requirements = parseServerSection(currentSection, statusMap.get(currentSection.name));
        if (requirements) {
            requirements.guideSection.endLine = lines.length;
            servers.set(currentSection.name, requirements);
        }
    }
    return servers;
}
/**
 * Parse the status summary table
 */
function parseStatusTable(lines) {
    const statusMap = new Map();
    // Find the status table (starts around line 18)
    let inTable = false;
    for (const line of lines) {
        // Detect table start
        if (line.includes("| Server | In .mcp.json |")) {
            inTable = true;
            continue;
        }
        // Skip table header separator
        if (inTable && line.includes("|-----")) {
            continue;
        }
        // Parse table rows
        if (inTable && line.startsWith("|")) {
            const cells = line
                .split("|")
                .map((c) => c.trim())
                .filter((c) => c);
            if (cells.length >= 4) {
                const serverName = cells[0].replace(/^\*\*|\*\*$/g, ""); // Remove markdown bold
                const status = cells[3];
                statusMap.set(serverName, {
                    inConfig: cells[1],
                    envVars: cells[2],
                    configDir: cells[2],
                    status,
                });
            }
            continue;
        }
        // Exit table on empty line after starting
        if (inTable && line.trim() === "") {
            break;
        }
    }
    return statusMap;
}
/**
 * Parse an individual server section
 */
function parseServerSection(section, statusInfo) {
    const envVars = [];
    let configDir = null;
    let recommendedConfig = null;
    // Determine status
    let status = "not-configured";
    let statusEmoji = "🔴";
    if (statusInfo) {
        if (statusInfo.status.includes("🟢")) {
            status = "configured";
            statusEmoji = "🟢";
        }
        else if (statusInfo.status.includes("🟡 NEEDS SECRETS")) {
            status = "needs-secrets";
            statusEmoji = "🟡";
        }
        else if (statusInfo.status.includes("🟡 MISSING DIR")) {
            status = "missing-dir";
            statusEmoji = "🟡";
        }
    }
    // Parse environment variables section
    let inEnvVarsSection = false;
    let inRecommendedConfig = false;
    let configJsonLines = [];
    for (const line of section.lines) {
        // Detect "Required environment variables" section
        if (line.includes("**Required environment variables:**")) {
            inEnvVarsSection = true;
            continue;
        }
        // Parse env var bullets
        if (inEnvVarsSection && line.match(/^\s*-\s+`([^`]+)`/)) {
            const match = line.match(/^\s*-\s+`([^`]+)`\s*-\s*(.+)$/);
            if (match) {
                const varName = match[1];
                const description = match[2];
                // Check if required or has default
                const required = !description.toLowerCase().includes("default:");
                const defaultMatch = description.match(/default:\s*`([^`]+)`/i);
                envVars.push({
                    name: varName,
                    required,
                    description: description.replace(/\(default:.*?\)/i, "").trim(),
                    defaultValue: defaultMatch ? defaultMatch[1] : undefined,
                });
            }
            continue;
        }
        // Exit env vars section
        if (inEnvVarsSection &&
            (line.startsWith("**") || line.trim() === "")) {
            inEnvVarsSection = false;
        }
        // Detect configuration directory
        if (line.includes("**Configuration directory:**")) {
            const dirMatch = line.match(/`([^`]+)`/);
            if (dirMatch) {
                const dirPath = dirMatch[1];
                const required = !line.includes("Not required");
                configDir = { path: dirPath, required };
            }
            continue;
        }
        // Detect recommended .mcp.json entry
        if (line.includes("**Recommended .mcp.json entry:**") ||
            line.includes("**Current .mcp.json entry:**")) {
            inRecommendedConfig = true;
            configJsonLines = [];
            continue;
        }
        // Collect JSON config lines
        if (inRecommendedConfig && (line.includes('"') || line.includes('}'))) {
            configJsonLines.push(line);
            // Check if we've reached the end of the JSON block
            if (line.trim() === "```") {
                inRecommendedConfig = false;
                // Parse the collected JSON
                try {
                    const jsonText = configJsonLines
                        .join("\n")
                        .replace(/^```json\s*/, "")
                        .replace(/```$/, "")
                        .trim();
                    // Extract just the server config object (inside the quotes)
                    const serverConfigMatch = jsonText.match(/"[^"]+": (\{[\s\S]*?\})\s*$/m);
                    if (serverConfigMatch) {
                        recommendedConfig = JSON.parse(serverConfigMatch[1]);
                    }
                }
                catch (e) {
                    console.error(`Failed to parse recommended config for ${section.name}:`, e);
                }
            }
        }
    }
    return {
        name: section.name,
        displayName: section.displayName,
        status,
        statusEmoji,
        envVars,
        configDir,
        guideSection: {
            startLine: section.startLine,
            endLine: section.startLine + section.lines.length,
        },
        recommendedConfig,
    };
}
export function validateServerConfig(workspaceRoot, serverName, actualConfig, requirements) {
    const issues = [];
    // 1. Check if registered
    if (!actualConfig) {
        issues.push({
            severity: "error",
            category: "guide-compliance",
            message: `Server '${serverName}' is not registered in any config file`,
            fix: `Use register_mcp_server("${serverName}") to register`,
            guideReference: `MCP_CONFIGURATION_GUIDE.md:${requirements.guideSection.startLine}`,
        });
        return issues;
    }
    // 2. Check environment variables
    for (const envVar of requirements.envVars) {
        const actualValue = actualConfig.env?.[envVar.name];
        if (envVar.required && !actualValue) {
            issues.push({
                severity: "error",
                category: "env-var",
                message: `Missing required environment variable: ${envVar.name}`,
                fix: `Add to config: "${envVar.name}": "${envVar.description.includes("workspaceFolder") ? "${workspaceFolder}" : "[value]"}"`,
                guideReference: `MCP_CONFIGURATION_GUIDE.md:${requirements.guideSection.startLine}`,
            });
        }
        // Check if using ${workspaceFolder} vs hardcoded paths
        if (actualValue && actualValue.includes(workspaceRoot)) {
            issues.push({
                severity: "warning",
                category: "path-portability",
                message: `Environment variable ${envVar.name} uses hardcoded path instead of \${workspaceFolder}`,
                fix: `Replace "${workspaceRoot}" with "\${workspaceFolder}"`,
            });
        }
    }
    // 3. Check configuration directory
    if (requirements.configDir && requirements.configDir.required) {
        const configDirPath = requirements.configDir.path.replace(/\$\{workspaceFolder\}/g, workspaceRoot);
        if (!fs.existsSync(configDirPath)) {
            issues.push({
                severity: "warning",
                category: "config-dir",
                message: `Configuration directory does not exist: ${requirements.configDir.path}`,
                fix: `Create directory: mkdir -p ${configDirPath}`,
                guideReference: `MCP_CONFIGURATION_GUIDE.md:${requirements.guideSection.startLine}`,
            });
        }
    }
    // 4. Check path portability in args
    for (const arg of actualConfig.args) {
        if (arg.includes(workspaceRoot) && !arg.includes("${workspaceFolder}")) {
            issues.push({
                severity: "warning",
                category: "path-portability",
                message: `Server args use hardcoded path instead of \${workspaceFolder}`,
                fix: `Replace "${workspaceRoot}" with "\${workspaceFolder}" in args`,
            });
            break;
        }
    }
    return issues;
}
//# sourceMappingURL=guide-parser.js.map