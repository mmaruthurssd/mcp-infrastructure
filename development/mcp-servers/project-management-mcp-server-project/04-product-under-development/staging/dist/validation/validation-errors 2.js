/**
 * Validation error types and custom error classes for hierarchical entities
 *
 * @module validation-errors
 * @description Provides structured error handling for entity validation failures
 */
/**
 * Custom error class for entity validation failures
 */
export class EntityValidationError extends Error {
    validationResult;
    entityType;
    entityId;
    constructor(entityType, validationResult, entityId) {
        const errorCount = validationResult.errors.length;
        const warningCount = validationResult.warnings.length;
        const message = `${entityType} validation failed: ${errorCount} error(s), ${warningCount} warning(s)`;
        super(message);
        this.name = 'EntityValidationError';
        this.entityType = entityType;
        this.entityId = entityId;
        this.validationResult = validationResult;
        // Capture stack trace
        Error.captureStackTrace(this, EntityValidationError);
    }
    /**
     * Get formatted error summary for logging
     */
    getFormattedSummary() {
        const lines = [
            `Validation failed for ${this.entityType}${this.entityId ? ` (ID: ${this.entityId})` : ''}`,
            '',
        ];
        if (this.validationResult.errors.length > 0) {
            lines.push('Errors:');
            this.validationResult.errors.forEach((err, idx) => {
                lines.push(`  ${idx + 1}. [${err.category}] ${err.field}: ${err.message}`);
                if (err.suggestion) {
                    lines.push(`     Suggestion: ${err.suggestion}`);
                }
            });
            lines.push('');
        }
        if (this.validationResult.warnings.length > 0) {
            lines.push('Warnings:');
            this.validationResult.warnings.forEach((warn, idx) => {
                lines.push(`  ${idx + 1}. [${warn.category}] ${warn.field}: ${warn.message}`);
            });
            lines.push('');
        }
        return lines.join('\n');
    }
}
/**
 * Convert Zod validation error to structured ValidationError array
 */
export function zodErrorToValidationErrors(zodError, severity = 'error') {
    return zodError.issues.map(err => {
        const field = err.path.join('.');
        const message = err.message;
        // Determine category based on error code
        let category = 'constraint-violation';
        if (err.code === 'invalid_type') {
            category = 'type-mismatch';
        }
        else if (err.code === 'too_small' || err.code === 'too_big') {
            category = 'constraint-violation';
        }
        else if (err.code === 'invalid_format') {
            category = 'format-invalid';
        }
        return {
            category,
            severity,
            field,
            message,
            expected: 'expected' in err ? String(err.expected) : undefined,
            actual: 'received' in err ? String(err.received) : undefined,
        };
    });
}
/**
 * Create a validation result from error arrays
 */
export function createValidationResult(errors = [], warnings = [], info = [], entityType, entityId) {
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        info,
        entityType,
        entityId,
    };
}
/**
 * Merge multiple validation results
 */
export function mergeValidationResults(...results) {
    const merged = {
        valid: true,
        errors: [],
        warnings: [],
        info: [],
    };
    for (const result of results) {
        merged.errors.push(...result.errors);
        merged.warnings.push(...result.warnings);
        merged.info.push(...result.info);
    }
    merged.valid = merged.errors.length === 0;
    return merged;
}
/**
 * Create a validation error
 */
export function createValidationError(category, field, message, options) {
    return {
        category,
        severity: options?.severity || 'error',
        field,
        message,
        expected: options?.expected,
        actual: options?.actual,
        suggestion: options?.suggestion,
    };
}
//# sourceMappingURL=validation-errors.js.map