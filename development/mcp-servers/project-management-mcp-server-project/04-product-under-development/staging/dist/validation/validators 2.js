/**
 * Validation utility functions integrating Zod schemas with hierarchical utilities
 *
 * @module validation/validators
 * @description High-level validation functions for all hierarchical entities
 */
import { ProjectOverviewSchema, ComponentSchema, SubAreaSchema, MajorGoalSchema, SubGoalSchema, TaskWorkflowSchema, TaskSchema, ProgressInfoSchema, } from './schemas.js';
import { createValidationResult, createValidationError, zodErrorToValidationErrors, EntityValidationError, } from './validation-errors.js';
import { getEntityType, hasRequiredParentIds, } from './type-guards.js';
import { validateParentReferences, validateProgress, buildNavigationContext, } from '../utils/hierarchical-utils.js';
/**
 * Validate entity using appropriate Zod schema
 */
export function validateEntity(entity, entityType) {
    const errors = [];
    const warnings = [];
    // Determine schema based on entity type
    let schema;
    let detectedType = entityType;
    if (!entityType) {
        const type = getEntityType(entity);
        if (!type) {
            detectedType = '';
        }
        else {
            detectedType = type;
        }
        if (!detectedType) {
            errors.push(createValidationError('type-mismatch', 'entity', 'Unable to determine entity type'));
            return createValidationResult(errors, warnings, [], 'unknown', entity.id);
        }
    }
    // Select appropriate schema
    switch (detectedType) {
        case 'project-overview':
            schema = ProjectOverviewSchema;
            break;
        case 'component':
            schema = ComponentSchema;
            break;
        case 'sub-area':
            schema = SubAreaSchema;
            break;
        case 'major-goal':
            schema = MajorGoalSchema;
            break;
        case 'sub-goal':
            schema = SubGoalSchema;
            break;
        case 'task-workflow':
            schema = TaskWorkflowSchema;
            break;
        case 'task':
            schema = TaskSchema;
            break;
        default:
            errors.push(createValidationError('type-mismatch', 'entity', `Unknown entity type: ${detectedType}`));
            return createValidationResult(errors, warnings, [], detectedType, entity.id);
    }
    // Validate with Zod schema
    const result = schema.safeParse(entity);
    if (!result.success) {
        errors.push(...zodErrorToValidationErrors(result.error, 'error'));
    }
    // Additional validation: Check parent IDs based on hierarchy level
    const levelMap = {
        'project-overview': 2,
        'component': 3,
        'sub-area': 4,
        'major-goal': 5,
        'sub-goal': 6,
        'task-workflow': 7,
        'task': 7,
    };
    const level = levelMap[detectedType];
    if (level && !hasRequiredParentIds(entity, level)) {
        errors.push(createValidationError('relationship-integrity', 'parentIds', `Missing required parent IDs for hierarchy level ${level}`, {
            suggestion: 'Ensure all parent entity IDs are present (projectId, componentId, etc.)',
        }));
    }
    // Validate progress if present
    if (entity.progress) {
        const progressResult = validateProgress(entity.progress);
        if (!progressResult.valid) {
            errors.push(...progressResult.errors.map(err => createValidationError('progress-inconsistency', `progress.${err}`, err, { severity: 'warning' })));
        }
    }
    return createValidationResult(errors, warnings, [], detectedType, entity.id);
}
/**
 * Validate PROJECT OVERVIEW entity
 */
export function validateProjectOverview(entity) {
    return validateEntity(entity, 'project-overview');
}
/**
 * Validate Component entity
 */
export function validateComponent(entity) {
    return validateEntity(entity, 'component');
}
/**
 * Validate Sub-Area entity
 */
export function validateSubArea(entity) {
    return validateEntity(entity, 'sub-area');
}
/**
 * Validate Major Goal entity
 */
export function validateMajorGoal(entity) {
    return validateEntity(entity, 'major-goal');
}
/**
 * Validate Sub-Goal entity
 */
export function validateSubGoal(entity) {
    return validateEntity(entity, 'sub-goal');
}
/**
 * Validate Task Workflow entity
 */
export function validateTaskWorkflow(entity) {
    return validateEntity(entity, 'task-workflow');
}
/**
 * Validate Task entity
 */
export function validateTask(entity) {
    return validateEntity(entity, 'task');
}
/**
 * Validate progress information
 */
export function validateProgressInfo(progress) {
    const errors = [];
    const warnings = [];
    const result = ProgressInfoSchema.safeParse(progress);
    if (!result.success) {
        errors.push(...zodErrorToValidationErrors(result.error, 'error'));
    }
    // Additional progress validation from hierarchical-utils
    const progressValidation = validateProgress(progress);
    if (!progressValidation.valid) {
        warnings.push(...progressValidation.warnings.map(warn => createValidationError('progress-inconsistency', warn, warn, { severity: 'warning' })));
    }
    return createValidationResult(errors, warnings, [], 'progress-info');
}
/**
 * Validate entity with parent reference checking
 */
export function validateEntityWithParents(entity, entityType, existingIds) {
    const errors = [];
    const warnings = [];
    // First validate the entity itself
    const entityValidation = validateEntity(entity, entityType);
    errors.push(...entityValidation.errors);
    warnings.push(...entityValidation.warnings);
    // If entity validation passed, check parent references
    if (entityValidation.valid) {
        const context = buildNavigationContext(entity);
        const parentValidation = validateParentReferences(context, existingIds);
        if (!parentValidation.valid) {
            errors.push(...parentValidation.errors.map(err => createValidationError('relationship-integrity', 'parentReferences', err, {
                suggestion: 'Ensure all referenced parent entities exist in the system',
            })));
        }
        warnings.push(...parentValidation.warnings.map(warn => createValidationError('relationship-integrity', 'parentReferences', warn, {
            severity: 'warning',
        })));
    }
    return createValidationResult(errors, warnings, [], entityType, entity.id);
}
/**
 * Validate and throw if invalid
 */
export function validateAndThrow(entity, entityType) {
    const result = validateEntity(entity, entityType);
    if (!result.valid) {
        throw new EntityValidationError(entityType, result, entity.id);
    }
}
/**
 * Validate multiple entities of the same type
 */
export function validateEntities(entities, entityType) {
    const allErrors = [];
    const allWarnings = [];
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const result = validateEntity(entity, entityType);
        // Prefix errors/warnings with entity index for clarity
        allErrors.push(...result.errors.map(err => ({
            ...err,
            field: `[${i}].${err.field}`,
        })));
        allWarnings.push(...result.warnings.map(warn => ({
            ...warn,
            field: `[${i}].${warn.field}`,
        })));
    }
    return createValidationResult(allErrors, allWarnings, [], entityType);
}
/**
 * Create a validator function for a specific entity type
 */
export function createValidator(entityType) {
    return (entity) => validateEntity(entity, entityType);
}
/**
 * Partial validation - only validate specified fields
 */
export function validateFields(entity, entityType, fields) {
    const errors = [];
    const warnings = [];
    // First do full validation to get all errors
    const fullValidation = validateEntity(entity, entityType);
    // Filter to only errors/warnings for specified fields
    const fieldSet = new Set(fields);
    const filteredErrors = fullValidation.errors.filter(err => {
        const topLevelField = err.field.split('.')[0];
        return fieldSet.has(topLevelField);
    });
    const filteredWarnings = fullValidation.warnings.filter(warn => {
        const topLevelField = warn.field.split('.')[0];
        return fieldSet.has(topLevelField);
    });
    errors.push(...filteredErrors);
    warnings.push(...filteredWarnings);
    return createValidationResult(errors, warnings, [], entityType, entity.id);
}
/**
 * Check if entity passes validation (returns boolean)
 */
export function isValid(entity, entityType) {
    const type = entityType || getEntityType(entity);
    if (!type)
        return false;
    const result = validateEntity(entity, type);
    return result.valid;
}
//# sourceMappingURL=validators.js.map