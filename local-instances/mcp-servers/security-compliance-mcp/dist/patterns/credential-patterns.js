/**
 * Credential detection patterns
 *
 * Regex patterns for detecting common credentials in code
 */
/**
 * Credential detection patterns
 *
 * IMPORTANT: These patterns are designed to err on the side of caution.
 * Better to have false positives than miss actual credentials.
 */
export const CREDENTIAL_PATTERNS = [
    // AWS Access Keys
    {
        name: 'AWS Access Key ID',
        pattern: /\b(AKIA[0-9A-Z]{16})\b/g,
        severity: 'critical',
        confidence: 1.0,
        description: 'AWS Access Key ID (20 characters starting with AKIA)',
    },
    {
        name: 'AWS Secret Access Key',
        pattern: /\b([A-Za-z0-9/+=]{40})\b/g,
        severity: 'critical',
        confidence: 0.7, // Lower confidence as this could be many things
        description: 'Potential AWS Secret Access Key (40 characters)',
    },
    // Generic API Keys
    {
        name: 'Generic API Key',
        pattern: /(?:api[_-]?key|apikey)[_-]?[:=]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi,
        severity: 'high',
        confidence: 0.9,
        description: 'Generic API key pattern',
    },
    {
        name: 'Bearer Token',
        pattern: /bearer\s+[a-zA-Z0-9_\-\.]{20,}/gi,
        severity: 'high',
        confidence: 0.95,
        description: 'Bearer token in Authorization header',
    },
    // JWT Tokens
    {
        name: 'JWT Token',
        pattern: /\beyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g,
        severity: 'high',
        confidence: 0.95,
        description: 'JSON Web Token (JWT)',
    },
    // Private Keys
    {
        name: 'RSA Private Key',
        pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi,
        severity: 'critical',
        confidence: 1.0,
        description: 'RSA private key header',
    },
    {
        name: 'EC Private Key',
        pattern: /-----BEGIN\s+EC\s+PRIVATE\s+KEY-----/gi,
        severity: 'critical',
        confidence: 1.0,
        description: 'Elliptic Curve private key header',
    },
    {
        name: 'OpenSSH Private Key',
        pattern: /-----BEGIN\s+OPENSSH\s+PRIVATE\s+KEY-----/gi,
        severity: 'critical',
        confidence: 1.0,
        description: 'OpenSSH private key header',
    },
    // Passwords and Secrets
    {
        name: 'Generic Password',
        pattern: /(?:password|passwd|pwd)[_-]?[:=]\s*['"]([^'"]{8,})['"]?/gi,
        severity: 'high',
        confidence: 0.7,
        description: 'Generic password pattern',
    },
    {
        name: 'Generic Secret',
        pattern: /(?:secret|secret_key)[_-]?[:=]\s*['"]([^'"]{8,})['"]?/gi,
        severity: 'high',
        confidence: 0.7,
        description: 'Generic secret pattern',
    },
    // Database Credentials
    {
        name: 'Database URL with Password',
        pattern: /(?:postgres|mysql|mongodb):\/\/[^:]+:([^@]+)@/gi,
        severity: 'critical',
        confidence: 0.95,
        description: 'Database connection string with password',
    },
    // Cloud Provider Keys
    {
        name: 'Google Cloud API Key',
        pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
        severity: 'critical',
        confidence: 0.95,
        description: 'Google Cloud API key',
    },
    {
        name: 'Google OAuth Client Secret',
        pattern: /\b[0-9]+-[a-zA-Z0-9_]{32}\.apps\.googleusercontent\.com\b/g,
        severity: 'critical',
        confidence: 0.95,
        description: 'Google OAuth client ID',
    },
    // GitHub
    {
        name: 'GitHub Personal Access Token',
        pattern: /\bghp_[a-zA-Z0-9]{36}\b/g,
        severity: 'critical',
        confidence: 1.0,
        description: 'GitHub personal access token',
    },
    {
        name: 'GitHub OAuth Token',
        pattern: /\bgho_[a-zA-Z0-9]{36}\b/g,
        severity: 'critical',
        confidence: 1.0,
        description: 'GitHub OAuth access token',
    },
    // Slack
    {
        name: 'Slack Webhook',
        pattern: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]+\/B[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+/g,
        severity: 'high',
        confidence: 1.0,
        description: 'Slack webhook URL',
    },
    {
        name: 'Slack API Token',
        pattern: /\bxox[baprs]-[a-zA-Z0-9-]+\b/g,
        severity: 'critical',
        confidence: 1.0,
        description: 'Slack API token',
    },
    // Stripe
    {
        name: 'Stripe Secret Key',
        pattern: /\bsk_live_[a-zA-Z0-9]{24,}\b/g,
        severity: 'critical',
        confidence: 1.0,
        description: 'Stripe secret key (live)',
    },
    {
        name: 'Stripe Publishable Key',
        pattern: /\bpk_live_[a-zA-Z0-9]{24,}\b/g,
        severity: 'medium',
        confidence: 1.0,
        description: 'Stripe publishable key (live) - lower severity but still sensitive',
    },
    // Twilio
    {
        name: 'Twilio API Key',
        pattern: /\bSK[a-z0-9]{32}\b/g,
        severity: 'critical',
        confidence: 0.9,
        description: 'Twilio API key',
    },
    // Generic Tokens
    {
        name: 'Generic Access Token',
        pattern: /(?:access[_-]?token|auth[_-]?token)[_-]?[:=]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi,
        severity: 'high',
        confidence: 0.85,
        description: 'Generic access token pattern',
    },
];
/**
 * Test a pattern against a string
 * Useful for pattern validation and testing
 */
export function testPattern(pattern, text) {
    return pattern.pattern.test(text);
}
/**
 * Get all patterns above a certain confidence threshold
 */
export function getHighConfidencePatterns(minConfidence = 0.9) {
    return CREDENTIAL_PATTERNS.filter((p) => p.confidence >= minConfidence);
}
/**
 * Get patterns by severity level
 */
export function getPatternsBySeverity(severity) {
    return CREDENTIAL_PATTERNS.filter((p) => p.severity === severity);
}
/**
 * Get critical patterns (severity: critical)
 */
export function getCriticalPatterns() {
    return getPatternsBySeverity('critical');
}
//# sourceMappingURL=credential-patterns.js.map