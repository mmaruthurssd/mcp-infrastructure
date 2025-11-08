/**
 * PHI (Protected Health Information) detection patterns
 *
 * HIPAA-compliant patterns for detecting 18 PHI identifiers
 */
import type { PHIPattern } from '../types/index.js';
/**
 * PHI detection patterns
 *
 * Covers all 18 HIPAA identifiers:
 * 1. Names
 * 2. Geographic subdivisions smaller than state
 * 3. Dates (except year)
 * 4. Telephone numbers
 * 5. Fax numbers
 * 6. Email addresses
 * 7. Social Security numbers
 * 8. Medical record numbers
 * 9. Health plan beneficiary numbers
 * 10. Account numbers
 * 11. Certificate/license numbers
 * 12. Vehicle identifiers
 * 13. Device identifiers
 * 14. URLs
 * 15. IP addresses
 * 16. Biometric identifiers
 * 17. Full-face photos
 * 18. Other unique identifying numbers
 */
export declare const PHI_PATTERNS: PHIPattern[];
/**
 * Test a PHI pattern against text
 */
export declare function testPHIPattern(pattern: PHIPattern, text: string): boolean;
/**
 * Get PHI patterns by category
 */
export declare function getPHIPatternsByCategory(category: PHIPattern['category']): PHIPattern[];
/**
 * Get high-confidence PHI patterns
 */
export declare function getHighConfidencePHIPatterns(minConfidence?: number): PHIPattern[];
/**
 * Get critical PHI patterns
 */
export declare function getCriticalPHIPatterns(): PHIPattern[];
//# sourceMappingURL=phi-patterns.d.ts.map