/**
 * PHI (Protected Health Information) scanner engine
 *
 * Scans files and text for HIPAA-regulated PHI
 */
import * as fs from 'fs/promises';
import { PHI_PATTERNS } from '../patterns/phi-patterns.js';
/**
 * PHI scanner class
 */
export class PHIScanner {
    patterns;
    minConfidence;
    categories;
    contextLines;
    constructor(options = {}) {
        this.patterns = options.patterns || PHI_PATTERNS;
        this.minConfidence = options.minConfidence ?? this.getSensitivityThreshold(options.sensitivity || 'medium');
        this.categories = options.categories || ['identifier', 'demographic', 'medical', 'financial'];
        this.contextLines = options.contextLines ?? 2;
    }
    /**
     * Get confidence threshold based on sensitivity level
     */
    getSensitivityThreshold(sensitivity) {
        const thresholds = {
            low: 0.9, // Only very high confidence matches
            medium: 0.7, // Moderate confidence
            high: 0.5, // Include lower confidence (more false positives, fewer false negatives)
        };
        return thresholds[sensitivity];
    }
    /**
     * Scan a file for PHI
     */
    async scanFile(filePath) {
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
        }
        catch (error) {
            throw new Error(`Failed to scan file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Scan text content for PHI
     */
    scanText(content, filePath = '<text>') {
        const lines = content.split('\n');
        const findings = [];
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
                let match;
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
    async scanFiles(filePaths) {
        const results = [];
        for (const filePath of filePaths) {
            try {
                const result = await this.scanFile(filePath);
                results.push(result);
            }
            catch (error) {
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
    detectMedicalContext(content, filePath) {
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
    calculateRiskLevel(findings) {
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
    extractContext(lines, lineIndex) {
        const start = Math.max(0, lineIndex - this.contextLines);
        const end = Math.min(lines.length, lineIndex + this.contextLines + 1);
        const contextLines = [];
        for (let i = start; i < end; i++) {
            const prefix = i === lineIndex ? '> ' : '  ';
            contextLines.push(`${prefix}${i + 1}: ${lines[i]}`);
        }
        return contextLines.join('\n');
    }
    /**
     * Generate anonymization suggestion
     */
    generateAnonymizationSuggestion(pattern, _matchedText) {
        const suggestions = {
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
export async function scanFileForPHI(filePath, options) {
    const scanner = new PHIScanner(options);
    return scanner.scanFile(filePath);
}
/**
 * Convenience function to scan text for PHI
 */
export function scanTextForPHI(content, filePath, options) {
    const scanner = new PHIScanner(options);
    return scanner.scanText(content, filePath);
}
/**
 * Convenience function to scan multiple files for PHI
 */
export async function scanFilesForPHI(filePaths, options) {
    const scanner = new PHIScanner(options);
    return scanner.scanFiles(filePaths);
}
//# sourceMappingURL=phi-scanner.js.map