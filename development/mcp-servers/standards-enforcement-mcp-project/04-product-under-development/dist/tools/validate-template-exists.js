import * as path from 'path';
import * as os from 'os';
import { RulesEngine, ValidatorRegistry, RulesRegistryManager, ComplianceCalculator } from '../core/index.js';
import { validateTemplateExists } from '../validators/index.js';
/**
 * Tool 3: validate_template_exists
 * Validates that MCP has a corresponding template
 */
export async function validateTemplateExistsTool(params) {
    const { mcpName, checkInstallable, checkMetadata } = params;
    // Initialize registry and engine
    const registry = new RulesRegistryManager();
    const validators = new ValidatorRegistry();
    const calculator = new ComplianceCalculator();
    // Register validator
    validators.register('validateTemplateExists', validateTemplateExists);
    // Register template validation rule
    registry.registerRule({
        id: 'template-validation',
        name: 'Template Existence Validation',
        category: 'template-first',
        severity: 'critical',
        description: 'Validate MCP template existence and completeness',
        rationale: 'Templates enable replication and consistency',
        validator: 'validateTemplateExists',
        documentation: {
            rationale: 'Every production MCP should have a template for reuse',
            examples: {
                good: ['templates-and-patterns/mcp-server-templates/my-mcp-template/'],
                bad: ['No template directory'],
            },
            fixes: ['Create template directory with required files'],
            references: ['TEMPLATE_FIRST_DEVELOPMENT.md'],
        },
        enabled: true,
    });
    const engine = new RulesEngine(registry, validators, calculator);
    // Determine workspace path
    const workspacePath = getWorkspacePath();
    // Create validation context (use new template path)
    const context = {
        workspacePath,
        targetPath: path.join(workspacePath, 'templates-and-patterns', 'mcp-server-templates', `${mcpName}-template`),
        targetType: 'mcp',
        mcpName,
    };
    // Execute validation
    const result = await engine.validate(context);
    // Filter results based on params
    if (!checkMetadata) {
        result.violations = result.violations.filter((v) => !v.ruleId.includes('metadata') && !v.ruleId.includes('template-json'));
    }
    if (!checkInstallable) {
        result.violations = result.violations.filter((v) => !v.ruleId.includes('installable') && !v.ruleId.includes('install-script'));
    }
    // Recalculate summary if filtered
    if (!checkMetadata || !checkInstallable) {
        const issues = result.violations.map((v) => ({
            ruleId: v.ruleId,
            severity: v.severity,
            message: v.message,
            location: v.location,
        }));
        result.summary = calculator.calculateSummary(1, issues);
    }
    return result;
}
/**
 * Get workspace path
 */
function getWorkspacePath() {
    const envPath = process.env.WORKSPACE_PATH;
    if (envPath) {
        return envPath;
    }
    return path.join(os.homedir(), 'Desktop', 'operations-workspace');
}
//# sourceMappingURL=validate-template-exists.js.map