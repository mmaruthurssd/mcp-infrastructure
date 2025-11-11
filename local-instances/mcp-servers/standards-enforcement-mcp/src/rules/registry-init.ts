import { StandardRule } from '../types/rules.js';
import { RulesRegistryManager } from '../core/rules-registry.js';
import { ValidatorRegistry } from '../core/rules-engine.js';
import {
  validateDualEnvironment,
  validateDevProdSync,
  validateTemplateExists,
  validateProjectStructure,
  validateConfiguration,
  validateDocumentation,
  validateSecurity,
  validateHIPAACompliance,
} from '../validators/index.js';

/**
 * Initialize rules registry with all standard rules
 */
export async function initializeRulesRegistry(
  registry: RulesRegistryManager,
  validators: ValidatorRegistry
): Promise<void> {
  // Register validator functions
  validators.register('validateDualEnvironment', validateDualEnvironment);
  validators.register('validateDevProdSync', validateDevProdSync);
  validators.register('validateTemplateExists', validateTemplateExists);
  validators.register('validateProjectStructure', validateProjectStructure);
  validators.register('validateConfiguration', validateConfiguration);
  validators.register('validateDocumentation', validateDocumentation);
  validators.register('validateSecurity', validateSecurity);
  validators.register('validateHIPAACompliance', validateHIPAACompliance);

  // Register rules
  const rules = getRuleDefinitions();

  for (const rule of rules) {
    registry.registerRule(rule);
  }
}

/**
 * Get all rule definitions
 */
function getRuleDefinitions(): StandardRule[] {
  return [
    // Dual-Environment Rules
    {
      id: 'dual-env-001',
      name: 'Dual Environment Existence',
      category: 'dual-environment',
      severity: 'critical',
      description: 'MCPs must exist in both development and production environments',
      rationale: 'Dual environments ensure changes are tested before deployment',
      validator: 'validateDualEnvironment',
      documentation: {
        rationale: 'Separating development and production environments prevents untested code from affecting production',
        examples: {
          good: [
            'development/mcp-servers/my-mcp-project/',
            'local-instances/mcp-servers/my-mcp/',
          ],
          bad: [
            'Only production: local-instances/mcp-servers/my-mcp/',
            'Only development: development/mcp-servers/my-mcp-project/',
          ],
        },
        fixes: [
          'Create development directory at development/mcp-servers/{mcp-name}-project',
          'Create production directory at local-instances/mcp-servers/{mcp-name}',
        ],
        references: ['WORKSPACE_ARCHITECTURE.md', 'DUAL_ENVIRONMENT_GUIDE.md'],
      },
      enabled: true,
    },
    {
      id: 'dual-env-sync',
      name: 'Development-Production Sync',
      category: 'dual-environment',
      severity: 'warning',
      description: 'Development and production versions should be synchronized',
      rationale: 'Keeping versions in sync prevents deployment issues',
      validator: 'validateDevProdSync',
      documentation: {
        rationale: 'Version mismatches can indicate undeployed changes or regression',
        examples: {
          good: ['Dev version 1.2.0 matches Prod version 1.2.0'],
          bad: ['Dev version 1.3.0, Prod version 1.2.0'],
        },
        fixes: ['Rebuild and deploy from development to production'],
        references: ['DEPLOYMENT_GUIDE.md'],
      },
      enabled: true,
    },

    // Template-First Rules
    {
      id: 'template-001',
      name: 'Template Existence',
      category: 'template-first',
      severity: 'critical',
      description: 'Every production MCP must have a corresponding drop-in template',
      rationale: 'Templates enable easy replication and consistency across projects',
      validator: 'validateTemplateExists',
      documentation: {
        rationale: 'Templates accelerate development and ensure best practices are replicated',
        examples: {
          good: ['templates/drop-in-templates/my-mcp-template/'],
          bad: ['MCP exists but no template'],
        },
        fixes: ['Create template directory with README.md, template.json, and source code'],
        references: ['TEMPLATE_FIRST_DEVELOPMENT.md'],
      },
      enabled: true,
    },

    // Project Structure Rules
    {
      id: 'structure-001',
      name: 'Standard Folder Structure',
      category: 'project-structure',
      severity: 'critical',
      description: 'Projects must follow 8-folder or 4-folder structure',
      rationale: 'Standardized structure improves navigation and consistency',
      validator: 'validateProjectStructure',
      documentation: {
        rationale: 'Consistent structure reduces cognitive load and enables tooling',
        examples: {
          good: [
            '01-planning/, 02-research/, ..., 08-archive/',
            '01-planning/, 04-product-under-development/, 05-testing/, 08-archive/',
          ],
          bad: ['Flat structure with no numbered folders', 'Custom folder names'],
        },
        fixes: ['Create missing numbered folders', 'Reorganize files into standard structure'],
        references: ['PROJECT_STRUCTURE_GUIDE.md'],
      },
      enabled: true,
    },

    // Configuration Rules
    {
      id: 'config-001',
      name: 'Package.json Required Fields',
      category: 'configuration',
      severity: 'critical',
      description: 'package.json must have name, version, and description',
      rationale: 'Required fields enable proper dependency management',
      validator: 'validateConfiguration',
      documentation: {
        rationale: 'Standard package metadata enables npm registry and tooling',
        examples: {
          good: ['{ "name": "my-mcp", "version": "1.0.0", "description": "..." }'],
          bad: ['{ "name": "my-mcp" } // missing version and description'],
        },
        fixes: ['Add missing required fields to package.json'],
        references: ['npm documentation'],
      },
      enabled: true,
    },

    // Documentation Rules
    {
      id: 'docs-001',
      name: 'README Required',
      category: 'documentation',
      severity: 'critical',
      description: 'All projects must have a README.md',
      rationale: 'README provides essential project overview',
      validator: 'validateDocumentation',
      documentation: {
        rationale: 'README is the entry point for understanding any project',
        examples: {
          good: ['README.md with Description, Installation, and Usage sections'],
          bad: ['No README.md', 'Empty README.md'],
        },
        fixes: ['Create README.md with project overview, installation, and usage'],
        references: ['DOCUMENTATION_STANDARDS.md'],
      },
      enabled: true,
    },

    // Security Rules
    {
      id: 'security-001',
      name: 'No Hardcoded Secrets',
      category: 'security',
      severity: 'critical',
      description: 'Source code must not contain hardcoded credentials',
      rationale: 'Hardcoded secrets in code create security vulnerabilities',
      validator: 'validateSecurity',
      documentation: {
        rationale: 'Hardcoded secrets can be leaked through version control',
        examples: {
          good: ['const apiKey = process.env.API_KEY'],
          bad: ['const apiKey = "sk_live_abc123..."'],
        },
        fixes: ['Move secrets to environment variables', 'Use secure credential storage'],
        references: ['SECURITY.md', 'HIPAA_COMPLIANCE_GUIDE.md'],
      },
      enabled: true,
    },
    {
      id: 'security-hipaa',
      name: 'HIPAA Compliance',
      category: 'security',
      severity: 'critical',
      description: 'Projects handling PHI must follow HIPAA requirements',
      rationale: 'HIPAA compliance is legally required for medical data',
      validator: 'validateHIPAACompliance',
      documentation: {
        rationale: 'Non-compliance with HIPAA can result in legal penalties',
        examples: {
          good: ['Audit logging, encryption, SECURITY.md'],
          bad: ['No audit logging, PHI in code'],
        },
        fixes: [
          'Implement audit logging',
          'Add encryption',
          'Create SECURITY.md',
          'Remove PHI from code',
        ],
        references: ['HIPAA_COMPLIANCE_GUIDE.md', 'SECURITY.md'],
      },
      enabled: true,
    },
  ];
}
