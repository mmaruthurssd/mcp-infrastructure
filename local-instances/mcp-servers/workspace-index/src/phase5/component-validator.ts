/**
 * Phase 5: Component Documentation Validator
 */

import { promises as fs } from 'fs';
import path from 'path';
import type {
  ComponentType,
  DocumentationViolation,
  ValidationResult,
  DocumentationRequirement
} from './types.js';

const DOCUMENTATION_REQUIREMENTS: DocumentationRequirement[] = [
  {
    file: 'SYSTEM-COMPONENTS.md',
    required: true,
    conditions: { isPermanent: true },
    validationMethod: 'section-exists',
    searchPatterns: ['### {componentName}', '**Location:** `{location}`', '**Location:**`{location}`']
  },
  {
    file: 'WORKSPACE_ARCHITECTURE.md',
    required: false,
    conditions: {
      componentType: ['infrastructure', 'protection'],
      isCritical: true
    },
    validationMethod: 'section-exists',
    searchPatterns: ['## {componentName}', '### {componentName}']
  },
  {
    file: 'START_HERE.md',
    required: false,
    conditions: { isCritical: true },
    validationMethod: 'keyword-match',
    searchPatterns: ['{componentName}', '{location}']
  },
  {
    file: 'WORKFLOW_PLAYBOOK.md',
    required: false,
    conditions: { componentType: ['automation'] },
    validationMethod: 'keyword-match',
    searchPatterns: ['{componentName}']
  }
];

export class ComponentValidator {
  constructor(private projectRoot: string) {}

  async validateComponentDocumentation(
    componentName: string,
    location: string,
    type: ComponentType,
    isCritical: boolean = false,
    isPermanent: boolean = true
  ): Promise<ValidationResult> {
    const violations: DocumentationViolation[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check each documentation requirement
    for (const requirement of DOCUMENTATION_REQUIREMENTS) {
      // Check if this requirement applies
      if (!this.requirementApplies(requirement, type, isCritical, isPermanent)) {
        continue;
      }

      const violation = await this.checkRequirement(
        requirement,
        componentName,
        location,
        type
      );

      if (violation) {
        if (requirement.required) {
          violations.push(violation);
        } else {
          warnings.push(violation.message);
        }
      }
    }

    // Generate suggestions
    if (violations.length === 0 && warnings.length === 0) {
      if (type === 'infrastructure' || type === 'protection') {
        suggestions.push('Consider adding architecture diagram to WORKSPACE_ARCHITECTURE.md');
      }
      if (type === 'automation') {
        suggestions.push('Consider adding automation schedule details to WORKFLOW_PLAYBOOK.md');
      }
    }

    return {
      component: componentName,
      isFullyDocumented: violations.length === 0,
      violations,
      warnings,
      suggestions
    };
  }

  private requirementApplies(
    requirement: DocumentationRequirement,
    type: ComponentType,
    isCritical: boolean,
    isPermanent: boolean
  ): boolean {
    if (!requirement.conditions) {
      return true;
    }

    const { componentType, isCritical: criticalRequired, isPermanent: permanentRequired } = requirement.conditions;

    // Check component type
    if (componentType && !componentType.includes(type)) {
      return false;
    }

    // Check critical requirement
    if (criticalRequired !== undefined && isCritical !== criticalRequired) {
      return false;
    }

    // Check permanent requirement
    if (permanentRequired !== undefined && isPermanent !== permanentRequired) {
      return false;
    }

    return true;
  }

  private async checkRequirement(
    requirement: DocumentationRequirement,
    componentName: string,
    location: string,
    type: ComponentType
  ): Promise<DocumentationViolation | null> {
    const filePath = path.join(this.projectRoot, requirement.file);

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Replace placeholders in search patterns
      const patterns = requirement.searchPatterns.map(pattern =>
        pattern
          .replace('{componentName}', componentName)
          .replace('{location}', location)
      );

      // Check based on validation method
      let found = false;

      if (requirement.validationMethod === 'section-exists') {
        // Must find at least one pattern
        found = patterns.some(pattern => content.includes(pattern));
      } else if (requirement.validationMethod === 'keyword-match') {
        // Must find all patterns
        found = patterns.every(pattern => content.includes(pattern));
      } else if (requirement.validationMethod === 'yaml-frontmatter') {
        // Check YAML frontmatter (simplified)
        const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (yamlMatch) {
          found = patterns.some(pattern => yamlMatch[1].includes(pattern));
        }
      }

      if (!found) {
        return {
          file: requirement.file,
          severity: requirement.required ? 'error' : 'warning',
          message: `Component "${componentName}" not found in ${requirement.file}`,
          expectedPattern: patterns.join(' OR '),
          autoFixable: true
        };
      }

      return null;
    } catch (error) {
      // File doesn't exist
      if (requirement.required) {
        return {
          file: requirement.file,
          severity: 'error',
          message: `Required documentation file ${requirement.file} does not exist`,
          expectedPattern: 'File should exist',
          autoFixable: false
        };
      }
      return null;
    }
  }

  async validateMultipleComponents(
    components: Array<{
      name: string;
      location: string;
      type: ComponentType;
      isCritical?: boolean;
      isPermanent?: boolean;
    }>
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const component of components) {
      const result = await this.validateComponentDocumentation(
        component.name,
        component.location,
        component.type,
        component.isCritical || false,
        component.isPermanent !== false
      );
      results.push(result);
    }

    return results;
  }

  async getDocumentationGaps(): Promise<{
    missingFromSystemComponents: number;
    missingFromWorkspaceArchitecture: number;
    missingFromStartHere: number;
    totalGaps: number;
  }> {
    // This would scan all components and return gap statistics
    // Implementation placeholder for future enhancement
    return {
      missingFromSystemComponents: 0,
      missingFromWorkspaceArchitecture: 0,
      missingFromStartHere: 0,
      totalGaps: 0
    };
  }
}
