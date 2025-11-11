/**
 * Credential detection patterns
 *
 * Regex patterns for detecting common credentials in code
 */
import type { CredentialPattern } from '../types/index.js';
/**
 * Credential detection patterns
 *
 * IMPORTANT: These patterns are designed to err on the side of caution.
 * Better to have false positives than miss actual credentials.
 */
export declare const CREDENTIAL_PATTERNS: CredentialPattern[];
/**
 * Test a pattern against a string
 * Useful for pattern validation and testing
 */
export declare function testPattern(pattern: CredentialPattern, text: string): boolean;
/**
 * Get all patterns above a certain confidence threshold
 */
export declare function getHighConfidencePatterns(minConfidence?: number): CredentialPattern[];
/**
 * Get patterns by severity level
 */
export declare function getPatternsBySeverity(severity: CredentialPattern['severity']): CredentialPattern[];
/**
 * Get critical patterns (severity: critical)
 */
export declare function getCriticalPatterns(): CredentialPattern[];
//# sourceMappingURL=credential-patterns.d.ts.map