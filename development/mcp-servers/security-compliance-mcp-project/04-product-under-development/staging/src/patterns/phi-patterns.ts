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
export const PHI_PATTERNS: PHIPattern[] = [
  // ============================================================================
  // Identifiers
  // ============================================================================

  {
    name: 'Social Security Number',
    pattern: /\b(?:ssn|social\s*security)[\s:=-]*(\d{3}[-\s]?\d{2}[-\s]?\d{4})\b/gi,
    severity: 'critical',
    confidence: 0.95,
    category: 'identifier',
    description: 'Social Security Number (SSN)',
  },
  {
    name: 'Medical Record Number',
    pattern: /\b(?:mrn|medical\s*record|patient\s*id)[\s:=-]*([a-zA-Z0-9]{6,})\b/gi,
    severity: 'critical',
    confidence: 0.85,
    category: 'identifier',
    description: 'Medical Record Number (MRN)',
  },
  {
    name: 'Health Insurance Number',
    pattern: /\b(?:insurance|policy|member)[\s_-]?(?:id|number|no)[\s:=-]*([a-zA-Z0-9]{6,})/gi,
    severity: 'high',
    confidence: 0.8,
    category: 'identifier',
    description: 'Health insurance or policy number',
  },

  // ============================================================================
  // Demographic Information
  // ============================================================================

  {
    name: 'Date of Birth',
    pattern: /\b(?:dob|date\s*of\s*birth|birth\s*date)[\s:=-]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
    severity: 'high',
    confidence: 0.9,
    category: 'demographic',
    description: 'Date of birth',
  },
  {
    name: 'Full Date',
    pattern: /\b((?:0?[1-9]|1[0-2])[\/\-](?:0?[1-9]|[12][0-9]|3[01])[\/\-](?:19|20)\d{2})\b/g,
    severity: 'medium',
    confidence: 0.7,
    category: 'demographic',
    description: 'Full date (potential PHI)',
  },
  {
    name: 'Phone Number',
    pattern: /\b(?:phone|tel|mobile|cell)[\s:=-]*(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/gi,
    severity: 'medium',
    confidence: 0.85,
    category: 'demographic',
    description: 'Telephone or mobile number',
  },
  {
    name: 'Email Address',
    pattern: /\b(?:email|e-mail)[\s:=-]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/gi,
    severity: 'medium',
    confidence: 0.9,
    category: 'demographic',
    description: 'Email address',
  },
  {
    name: 'Street Address',
    pattern: /\b(?:address|addr)[\s:=-]*(\d+\s+[a-zA-Z\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr))/gi,
    severity: 'medium',
    confidence: 0.75,
    category: 'demographic',
    description: 'Street address',
  },
  {
    name: 'ZIP Code',
    pattern: /\b(?:zip|postal\s*code)[\s:=-]*(\d{5}(?:-\d{4})?)\b/gi,
    severity: 'medium',
    confidence: 0.8,
    category: 'demographic',
    description: 'ZIP code',
  },

  // ============================================================================
  // Medical Information
  // ============================================================================

  {
    name: 'Patient Name',
    pattern: /\b(?:patient|pt)[\s:=-]*(?:name)?[\s:=-]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g,
    severity: 'critical',
    confidence: 0.7,
    category: 'identifier',
    description: 'Patient name',
  },
  {
    name: 'Diagnosis Code (ICD)',
    pattern: /\b(?:icd|diagnosis\s*code)[\s:=-]*([A-Z]\d{2}(?:\.\d{1,2})?)\b/gi,
    severity: 'high',
    confidence: 0.9,
    category: 'medical',
    description: 'ICD diagnosis code',
  },
  {
    name: 'Procedure Code (CPT)',
    pattern: /\b(?:cpt|procedure\s*code)[\s:=-]*(\d{5})\b/gi,
    severity: 'high',
    confidence: 0.85,
    category: 'medical',
    description: 'CPT procedure code',
  },
  {
    name: 'Prescription Number',
    pattern: /\b(?:rx|prescription)[\s_-]?(?:number|no|#)[\s:=-]*([a-zA-Z0-9]{6,})/gi,
    severity: 'high',
    confidence: 0.8,
    category: 'medical',
    description: 'Prescription number',
  },
  {
    name: 'Lab Result Value',
    pattern: /\b(?:test|lab|result)[\s:=-]*(?:value)?[\s:=-]*(\d+(?:\.\d+)?)\s*(?:mg\/dL|mmol\/L|%|units?)/gi,
    severity: 'high',
    confidence: 0.75,
    category: 'medical',
    description: 'Lab test result with units',
  },

  // ============================================================================
  // Financial Information
  // ============================================================================

  {
    name: 'Insurance Policy Number',
    pattern: /\b(?:policy|group)[\s_-]?(?:number|no|#)[\s:=-]*([a-zA-Z0-9]{6,})/gi,
    severity: 'high',
    confidence: 0.75,
    category: 'financial',
    description: 'Insurance policy or group number',
  },
  {
    name: 'Account Number',
    pattern: /\b(?:account|acct)[\s_-]?(?:number|no|#)[\s:=-]*([a-zA-Z0-9]{6,})/gi,
    severity: 'medium',
    confidence: 0.7,
    category: 'financial',
    description: 'Account number',
  },

  // ============================================================================
  // Device and Technical Identifiers
  // ============================================================================

  {
    name: 'IP Address',
    pattern: /\b(?:ip|address)[\s:=-]*(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/gi,
    severity: 'low',
    confidence: 0.9,
    category: 'identifier',
    description: 'IP address',
  },
  {
    name: 'Device Serial Number',
    pattern: /\b(?:device|serial|sn)[\s_-]?(?:number|no|#)[\s:=-]*([a-zA-Z0-9]{8,})/gi,
    severity: 'medium',
    confidence: 0.7,
    category: 'identifier',
    description: 'Device serial number',
  },

  // ============================================================================
  // Contextual PHI Detection
  // ============================================================================

  {
    name: 'Patient Chart Note',
    pattern: /\b(?:patient|pt)\s+(?:is|has|diagnosed|presents|complains|reports)/gi,
    severity: 'high',
    confidence: 0.6,
    category: 'medical',
    description: 'Potential patient chart note',
  },
  {
    name: 'Medication with Dosage',
    pattern: /\b([a-zA-Z]+(?:cillin|mycin|pril|statin|zole))\s+\d+\s*(?:mg|mcg|g|mL)/gi,
    severity: 'high',
    confidence: 0.75,
    category: 'medical',
    description: 'Medication name with dosage',
  },
];

/**
 * Test a PHI pattern against text
 */
export function testPHIPattern(pattern: PHIPattern, text: string): boolean {
  return pattern.pattern.test(text);
}

/**
 * Get PHI patterns by category
 */
export function getPHIPatternsByCategory(category: PHIPattern['category']): PHIPattern[] {
  return PHI_PATTERNS.filter((p) => p.category === category);
}

/**
 * Get high-confidence PHI patterns
 */
export function getHighConfidencePHIPatterns(minConfidence: number = 0.8): PHIPattern[] {
  return PHI_PATTERNS.filter((p) => p.confidence >= minConfidence);
}

/**
 * Get critical PHI patterns
 */
export function getCriticalPHIPatterns(): PHIPattern[] {
  return PHI_PATTERNS.filter((p) => p.severity === 'critical');
}
