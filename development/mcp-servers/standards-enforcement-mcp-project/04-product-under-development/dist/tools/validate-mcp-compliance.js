import * as path from 'path';
import * as os from 'os';
import { RulesEngine, ValidatorRegistry, RulesRegistryManager, ComplianceCalculator } from '../core/index.js';
import { initializeRulesRegistry } from '../rules/registry-init.js';
/**
 * Tool 1: validate_mcp_compliance
 * Validates MCP against workspace standards
 */
export async function validateMcpCompliance(params) {
    const { mcpName, categories, failFast, includeWarnings } = params;
    // Initialize rules registry and engine
    const registry = new RulesRegistryManager();
    const validators = new ValidatorRegistry();
    const calculator = new ComplianceCalculator();
    // Register all rules and validators
    await initializeRulesRegistry(registry, validators);
    const engine = new RulesEngine(registry, validators, calculator);
    // Determine workspace path
    const workspacePath = getWorkspacePath();
    // Create validation context for MCP
    const context = {
        workspacePath,
        targetPath: path.join(workspacePath, 'local-instances', 'mcp-servers', mcpName),
        targetType: 'mcp',
        mcpName,
    };
    // Parse categories if provided
    const categoryFilter = categories
        ? categories
        : undefined;
    // Execute validation
    let result;
    if (failFast) {
        result = await engine.validateFailFast(context, categoryFilter);
    }
    else if (categoryFilter) {
        result = await engine.validateCategories(context, categoryFilter);
    }
    else {
        result = await engine.validate(context);
    }
    // Filter out warnings if not included
    if (!includeWarnings) {
        result.violations = result.violations.filter((v) => v.severity !== 'info' && v.severity !== 'warning');
        // Recalculate summary
        const issues = result.violations.map((v) => ({
            ruleId: v.ruleId,
            severity: v.severity,
            message: v.message,
            location: v.location,
        }));
        result.summary = calculator.calculateSummary(result.summary.totalRules, issues);
    }
    return result;
}
/**
 * Get workspace path
 * Defaults to ~/Desktop/medical-practice-workspace
 */
function getWorkspacePath() {
    // Check environment variable first
    const envPath = process.env.WORKSPACE_PATH;
    if (envPath) {
        return envPath;
    }
    // Default to standard location
    return path.join(os.homedir(), 'Desktop', 'medical-practice-workspace');
}
//# sourceMappingURL=validate-mcp-compliance.js.map