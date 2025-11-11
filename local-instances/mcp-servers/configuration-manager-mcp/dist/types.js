/**
 * Configuration Manager MCP - Type Definitions
 * Version: 1.0.0
 */
export class ConfigurationError extends Error {
    code;
    details;
    suggestions;
    constructor(code, message, details, suggestions) {
        super(message);
        this.name = "ConfigurationError";
        this.code = code;
        this.details = details;
        this.suggestions = suggestions;
    }
}
export class SecretError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.name = "SecretError";
        this.code = code;
        this.details = details;
    }
}
export class ValidationError extends Error {
    code;
    errors;
    constructor(code, message, errors) {
        super(message);
        this.name = "ValidationError";
        this.code = code;
        this.errors = errors;
    }
}
//# sourceMappingURL=types.js.map