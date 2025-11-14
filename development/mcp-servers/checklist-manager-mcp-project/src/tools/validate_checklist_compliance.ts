/**
 * Tool: validate_checklist_compliance
 * Validates that all mandatory checklists are completed before allowing operations
 */

import { RegistryManager } from '../core/registry.js';
import { ChecklistParser } from '../core/parser.js';
import type {
  ValidateChecklistComplianceParams,
  ValidateChecklistComplianceResponse,
} from '../types/index.js';

export async function validateChecklistCompliance(
  params: ValidateChecklistComplianceParams
): Promise<ValidateChecklistComplianceResponse> {
  try {
    const registry = new RegistryManager();
    const parser = new ChecklistParser();

    // Get all checklists matching the operation type
    const checklists = registry.getAll({
      type: params.operation_type,
    });

    // Filter for mandatory checklists only
    const mandatoryChecklists = checklists.filter(
      (checklist) => checklist.metadata.enforcement === 'mandatory'
    );

    if (mandatoryChecklists.length === 0) {
      return {
        success: true,
        compliant: true,
        message: `No mandatory checklists found for operation type: ${params.operation_type}`,
        violations: [],
        blocking: false,
      };
    }

    const violations: Array<{
      checklist_id: string;
      checklist_path: string;
      issue: string;
      pending_items: string[];
    }> = [];

    // Check each mandatory checklist for completion
    for (const checklist of mandatoryChecklists) {
      try {
        const { items } = parser.parse(checklist.path);
        const pending = parser.getPendingItems(items);

        if (pending.length > 0) {
          violations.push({
            checklist_id: checklist.id,
            checklist_path: checklist.path,
            issue: `Checklist incomplete: ${pending.length} items pending`,
            pending_items: pending,
          });
        }
      } catch (error) {
        // If checklist file is missing or invalid, that's also a violation
        violations.push({
          checklist_id: checklist.id,
          checklist_path: checklist.path,
          issue: 'Checklist file not found or invalid',
          pending_items: [],
        });
      }
    }

    const compliant = violations.length === 0;
    const blocking = !compliant && !params.skip_enforcement;

    return {
      success: true,
      compliant,
      message: compliant
        ? `All ${mandatoryChecklists.length} mandatory checklists completed`
        : `${violations.length} mandatory checklist(s) incomplete`,
      violations,
      blocking,
      total_mandatory: mandatoryChecklists.length,
      completed_mandatory: mandatoryChecklists.length - violations.length,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      compliant: false,
      message: `Validation failed: ${errorMessage}`,
      violations: [],
      blocking: true,
    };
  }
}
