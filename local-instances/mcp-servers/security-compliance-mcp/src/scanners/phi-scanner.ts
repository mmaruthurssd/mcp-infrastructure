/**
 * PHI (Protected Health Information) scanner engine
 *
 * Scans files and text for HIPAA-regulated PHI
 */

import * as fs from 'fs/promises';
import { PHI_PATTERNS } from '../patterns/phi-patterns.js';
import type { PHIFinding, PHIPattern, PHICategory, RiskLevel } from '../types/index.js';

/**
 * PHI scanner options
 */
export interface PHIScanOptions {
  /** Custom patterns to use */
  patterns?: PHIPattern[];
  /** Minimum confidence threshold */
  minConfidence?: number;
  /** Categories to scan for */
  categories?: PHICategory[];
  /** Context lines to include */
  contextLines?: number;
  /** Sensitivity level */
  sensitivity?: 'low' | 'medium' | 'high';
}

/**
 * Result of scanning a single file for PHI
 */
export interface PHIScanResult {
  filePath: string;
  findings: PHIFinding[];
  clean: boolean;
  riskLevel: RiskLevel;
  scannedAt: string;
  error?: string;
}

/**
 * PHI scanner class
 */
export class PHIScanner {
  private patterns: PHIPattern[];
  private minConfidence: number;
  private categories: PHICategory[];
  private contextLines: number;

  constructor(options: PHIScanOptions = {}) {
    this.patterns = options.patterns || PHI_PATTERNS;
    this.minConfidence = options.minConfidence ?? this.getSensitivityThreshold(options.sensitivity || 'medium');
    this.categories = options.categories || ['identifier', 'demographic', 'medical', 'financial'];
    this.contextLines = options.contextLines ?? 2;
  }

  /**
   * Get confidence threshold based on sensitivity level
   */
  private getSensitivityThreshold(sensitivity: 'low' | 'medium' | 'high'): number {
    const thresholds = {
      low: 0.9,    // Only very high confidence matches
      medium: 0.7, // Moderate confidence
      high: 0.5,   // Include lower confidence (more false positives, fewer false negatives)
    };
    return thresholds[sensitivity];
  }

  /**
   * Scan a file for PHI
   */
  async scanFile(filePath: string): Promise<PHIScanResult> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const findings = this.scanText(content, filePath);
      const riskLevel = this.calculateRiskLevel(findings);

      return {
        filePath,
        findings,
        clean: findings.length === 0,
        riskLevel,
        scannedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to scan file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Scan text content for PHI
   */
  scanText(content: string, filePath: string = '<text>'): PHIFinding[] {
    const lines = content.split('\n');
    const findings: PHIFinding[] = [];

    // Check if this is likely medical context
    const isMedicalContext = this.detectMedicalContext(content, filePath);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineNumber = lineIndex + 1;

      for (const pattern of this.patterns) {
        // Skip if pattern doesn't meet minimum confidence
        if (pattern.confidence < this.minConfidence) {
          continue;
        }

        // Skip if category not included
        if (!this.categories.includes(pattern.category)) {
          continue;
        }

        // Reset regex lastIndex
        pattern.pattern.lastIndex = 0;

        let match: RegExpExecArray | null;
        while ((match = pattern.pattern.exec(line)) !== null) {
          // Adjust confidence based on context
          let adjustedConfidence = pattern.confidence;
          if (isMedicalContext) {
            adjustedConfidence = Math.min(1.0, adjustedConfidence * 1.1);
          }

          // Extract context
          const context = this.extractContext(lines, lineIndex);

          // Generate anonymization suggestion
          const anonymizationSuggestion = this.generateAnonymizationSuggestion(pattern, match[0]);

          findings.push({
            file: filePath,
            line: lineNumber,
            category: pattern.category,
            pattern: pattern.name,
            confidence: adjustedConfidence,
            context,
            anonymizationSuggestion,
          });
        }
      }
    }

    return findings;
  }

  /**
   * Scan multiple files
   */
  async scanFiles(filePaths: string[]): Promise<PHIScanResult[]> {
    const results: PHIScanResult[] = [];

    for (const filePath of filePaths) {
      try {
        const result = await this.scanFile(filePath);
        results.push(result);
      } catch (error) {
        console.error(`Error scanning ${filePath}:`, error);
        results.push({
          filePath,
          findings: [],
          clean: false,
          riskLevel: 'low',
          scannedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * Detect if content is in medical context
   */
  private detectMedicalContext(content: string, filePath: string): boolean {
    // Check file path
    const medicalPathPatterns = [
      /patient/i,
      /medical/i,
      /phi/i,
      /hipaa/i,
      /health/i,
      /clinical/i,
    ];

    if (medicalPathPatterns.some((p) => p.test(filePath))) {
      return true;
    }

    // Check content for medical keywords
    const medicalKeywords = [
      'patient',
      'diagnosis',
      'treatment',
      'medical record',
      'physician',
      'healthcare',
      'clinical',
      'prescription',
    ];

    const lowerContent = content.toLowerCase();
    const keywordCount = medicalKeywords.filter((kw) => lowerContent.includes(kw)).length;

    // If 3+ medical keywords, likely medical context
    return keywordCount >= 3;
  }

  /**
   * Calculate overall risk level based on findings
   */
  private calculateRiskLevel(findings: PHIFinding[]): RiskLevel {
    if (findings.length === 0) {
      return 'low';
    }

    // Count by category
    const categoryCount = {
      identifier: 0,
      demographic: 0,
      medical: 0,
      financial: 0,
    };

    findings.forEach((f) => {
      categoryCount[f.category]++;
    });

    // Critical if identifiers found
    if (categoryCount.identifier > 0) {
      return 'critical';
    }

    // High if medical + demographic
    if (categoryCount.medical > 0 && categoryCount.demographic > 0) {
      return 'high';
    }

    // High if many findings
    if (findings.length >= 5) {
      return 'high';
    }

    // Medium if any medical or financial
    if (categoryCount.medical > 0 || categoryCount.financial > 0) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Extract context lines around a match
   */
  private extractContext(lines: string[], lineIndex: number): string {
    const start = Math.max(0, lineIndex - this.contextLines);
    const end = Math.min(lines.length, lineIndex + this.contextLines + 1);

    const contextLines: string[] = [];
    for (let i = start; i < end; i++) {
      const prefix = i === lineIndex ? '> ' : '  ';
      contextLines.push(`${prefix}${i + 1}: ${lines[i]}`);
    }

    return contextLines.join('\n');
  }

  /**
   * Generate anonymization suggestion
   */
  private generateAnonymizationSuggestion(pattern: PHIPattern, _matchedText: string): string {
    const suggestions: Record<string, string> = {
      'Social Security Number': 'Replace with: XXX-XX-XXXX or remove entirely',
      'Medical Record Number': 'Replace with: [PATIENT_ID] or use a hash',
      'Date of Birth': 'Use year only (e.g., "Year: 1980") or replace with age range',
      'Phone Number': 'Replace with: XXX-XXX-XXXX or remove',
      'Email Address': 'Replace with: [REDACTED] or use domain only',
      'Street Address': 'Use city and state only, omit street address',
      'ZIP Code': 'Use first 3 digits only (e.g., "123XX")',
      'Patient Name': 'Replace with: [PATIENT_NAME] or use initials only',
      'Diagnosis Code (ICD)': 'Keep code category only (e.g., "E11" instead of "E11.9")',
      'Procedure Code (CPT)': 'Use procedure category, not specific code',
      'Prescription Number': 'Replace with: [RX_NUMBER]',
      'Lab Result Value': 'Use ranges instead of exact values (e.g., "100-150 mg/dL")',
      'Insurance Policy Number': 'Replace with: [POLICY_ID]',
      'IP Address': 'Replace with: [IP_ADDRESS] or use subnet only',
      'Patient Chart Note': 'Remove specific patient details, keep only general information',
      'Medication with Dosage': 'Use medication class instead of specific drug name',
    };

    return suggestions[pattern.name] || 'Replace with [REDACTED] or use a de-identified equivalent';
  }
}

/**
 * Convenience function to scan a file for PHI
 */
export async function scanFileForPHI(filePath: string, options?: PHIScanOptions): Promise<PHIScanResult> {
  const scanner = new PHIScanner(options);
  return scanner.scanFile(filePath);
}

/**
 * Convenience function to scan text for PHI
 */
export function scanTextForPHI(content: string, filePath?: string, options?: PHIScanOptions): PHIFinding[] {
  const scanner = new PHIScanner(options);
  return scanner.scanText(content, filePath);
}

/**
 * Convenience function to scan multiple files for PHI
 */
export async function scanFilesForPHI(filePaths: string[], options?: PHIScanOptions): Promise<PHIScanResult[]> {
  const scanner = new PHIScanner(options);
  return scanner.scanFiles(filePaths);
}
