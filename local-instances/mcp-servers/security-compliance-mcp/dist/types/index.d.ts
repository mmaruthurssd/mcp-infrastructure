/**
 * Type definitions for Security & Compliance MCP
 */
export * from './audit.js';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type ConfidenceLevel = number;
/**
 * Pattern for detecting credentials
 */
export interface CredentialPattern {
    name: string;
    pattern: RegExp;
    severity: SeverityLevel;
    confidence: ConfidenceLevel;
    description?: string;
}
/**
 * A detected security violation
 */
export interface Violation {
    file: string;
    line: number;
    column: number;
    pattern: string;
    severity: SeverityLevel;
    confidence: ConfidenceLevel;
    context: string;
    suggestion: string;
}
/**
 * Result of scanning a single file
 */
export interface ScanResult {
    filePath: string;
    violations: Violation[];
    clean: boolean;
    scannedAt: string;
    error?: string;
}
/**
 * Result of a credential scan
 */
export interface CredentialScanResult {
    success: boolean;
    violations: Violation[];
    summary: {
        filesScanned: number;
        violationsFound: number;
        criticalCount: number;
        highCount: number;
        mediumCount: number;
        lowCount: number;
        scanTime: number;
    };
    auditLogEntry?: string;
}
export type PHICategory = 'identifier' | 'demographic' | 'medical' | 'financial';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
/**
 * Pattern for detecting PHI
 */
export interface PHIPattern {
    name: string;
    pattern: RegExp;
    severity: SeverityLevel;
    confidence: ConfidenceLevel;
    category: PHICategory;
    description?: string;
}
/**
 * A detected PHI instance
 */
export interface PHIFinding {
    file: string;
    line: number;
    category: PHICategory;
    pattern: string;
    confidence: ConfidenceLevel;
    context: string;
    anonymizationSuggestion: string;
}
/**
 * Result of PHI detection scan
 */
export interface PHIDetectionResult {
    success: boolean;
    phiDetected: boolean;
    findings: PHIFinding[];
    summary: {
        filesScanned: number;
        phiInstancesFound: number;
        categoriesDetected: PHICategory[];
        riskLevel: RiskLevel;
    };
    complianceImpact: string;
}
export type AuditEventType = 'credential-scan' | 'phi-detection' | 'secret-access' | 'hook-execution' | 'config-change' | 'compliance-check';
export type AuditResult = 'passed' | 'failed' | 'blocked' | 'detected';
/**
 * Security audit event
 */
export interface AuditEvent {
    eventId: string;
    timestamp: string;
    type: AuditEventType;
    actor: string;
    action: string;
    result: AuditResult;
    details: Record<string, unknown>;
    checksum: string;
}
/**
 * Audit trail query result
 */
export interface AuditTrailResult {
    success: boolean;
    events: AuditEvent[];
    summary: {
        totalEvents: number;
        dateRange: {
            start: string;
            end: string;
        };
        eventTypes: Record<string, number>;
        violationCount: number;
    };
    exportPath?: string;
}
export type SecretAction = 'encrypt' | 'decrypt' | 'rotate' | 'status';
export type RotationStatus = 'current' | 'expiring' | 'expired';
/**
 * Secret metadata
 */
export interface SecretMetadata {
    key: string;
    rotationStatus: RotationStatus;
    lastRotated: string;
    nextRotation: string;
}
/**
 * Secrets operation result
 */
export interface SecretsResult {
    success: boolean;
    action: SecretAction;
    encrypted?: boolean;
    secrets?: SecretMetadata[];
    message: string;
}
/**
 * Compliance check result
 */
export interface ComplianceCheck {
    name: string;
    passed: boolean;
    severity: SeverityLevel;
    details: string;
    recommendation?: string;
}
/**
 * Compliance validation result
 */
export interface ComplianceResult {
    success: boolean;
    compliant: boolean;
    checks: ComplianceCheck[];
    summary: {
        totalChecks: number;
        passed: number;
        failed: number;
        criticalFailures: number;
    };
    reportPath?: string;
}
/**
 * Allow-list entry for filtering out known false positives
 */
export interface AllowListEntry {
    /** File path pattern (supports wildcards) */
    filePath?: string;
    /** Specific line number */
    lineNumber?: number;
    /** Pattern name to allow-list */
    patternName?: string;
    /** Exact matched text to allow-list */
    matchedText?: string;
    /** Reason for allow-listing */
    reason: string;
    /** Who added this entry */
    addedBy?: string;
    /** When this was added */
    addedDate?: string;
}
/**
 * Security configuration
 */
export interface SecurityConfig {
    version: string;
    credentialPatterns: CredentialPattern[];
    phiPatterns: PHIPattern[];
    allowList: AllowListEntry[];
    preCommitHooks: {
        enabled: boolean;
        blockOnViolations: boolean;
        scanCredentials: boolean;
        scanPHI: boolean;
        phiSensitivity: 'low' | 'medium' | 'high';
    };
    auditLogging: {
        enabled: boolean;
        storePath: string;
        retentionDays: number;
    };
    secretsManagement: {
        enabled: boolean;
        keystoreType: 'macos-keychain' | 'windows-credential-manager' | 'linux-secret-service' | 'file';
        rotationDays: number;
    };
}
export type ScanMode = 'file' | 'directory' | 'staged' | 'commit';
/**
 * Options for credential scanning
 */
export interface CredentialScanOptions {
    allowList?: string[];
    severity?: SeverityLevel;
    includeContext?: boolean;
}
/**
 * Options for PHI detection
 */
export interface PHIDetectionOptions {
    categories?: PHICategory[];
    minConfidence?: ConfidenceLevel;
    suggestAnonymization?: boolean;
}
/**
 * Audit trail filter options
 */
export interface AuditTrailFilter {
    startDate?: string;
    endDate?: string;
    eventType?: AuditEventType[];
    actor?: string;
    result?: AuditResult;
}
/**
 * File scan context
 */
export interface FileScanContext {
    filePath: string;
    content: string;
    lines: string[];
    isMedicalContext: boolean;
    isTestFile: boolean;
}
/**
 * Match result from pattern scanning
 */
export interface PatternMatch {
    pattern: string;
    patternName: string;
    line: number;
    column: number;
    matchedText: string;
    confidence: ConfidenceLevel;
    severity: SeverityLevel;
}
//# sourceMappingURL=index.d.ts.map