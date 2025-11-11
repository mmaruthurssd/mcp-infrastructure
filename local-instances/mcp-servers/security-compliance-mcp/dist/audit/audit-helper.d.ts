/**
 * Audit helper for easy integration
 *
 * Provides convenience methods for logging common security events
 */
import { AuditLogger } from './audit-logger.js';
import type { AuditOutcome } from '../types/audit.js';
/**
 * Generate correlation ID for related events
 */
export declare function generateCorrelationId(): string;
/**
 * Log credential scan event
 */
export declare function auditCredentialScan(target: string, mode: string, violationsFound: number, outcome: AuditOutcome, correlationId?: string): Promise<string>;
/**
 * Log credential violation detection
 */
export declare function auditCredentialViolation(file: string, patternName: string, severity: 'low' | 'medium' | 'high' | 'critical', correlationId?: string): Promise<string>;
/**
 * Log PHI scan event
 */
export declare function auditPHIScan(target: string, mode: string, phiInstancesFound: number, outcome: AuditOutcome, correlationId?: string): Promise<string>;
/**
 * Log PHI violation detection
 */
export declare function auditPHIViolation(file: string, category: string, patternName: string, correlationId?: string): Promise<string>;
/**
 * Log secret encryption
 */
export declare function auditSecretEncrypted(key: string, correlationId?: string): Promise<string>;
/**
 * Log secret decryption
 */
export declare function auditSecretDecrypted(key: string, correlationId?: string): Promise<string>;
/**
 * Log secret rotation
 */
export declare function auditSecretRotated(key: string, correlationId?: string): Promise<string>;
/**
 * Log secret rotation warning
 */
export declare function auditSecretRotationWarning(key: string, daysUntilExpiry: number, correlationId?: string): Promise<string>;
/**
 * Log pre-commit hook installation
 */
export declare function auditHookInstalled(gitDir: string, correlationId?: string): Promise<string>;
/**
 * Log pre-commit hook uninstallation
 */
export declare function auditHookUninstalled(gitDir: string, correlationId?: string): Promise<string>;
/**
 * Log pre-commit hook trigger
 */
export declare function auditHookTriggered(gitDir: string, outcome: AuditOutcome, violationsFound: number, correlationId?: string): Promise<string>;
/**
 * Log pre-commit hook blocking commit
 */
export declare function auditHookBlocked(gitDir: string, reason: string, correlationId?: string): Promise<string>;
/**
 * Log allow-list entry added
 */
export declare function auditAllowListAdded(entry: any, correlationId?: string): Promise<string>;
/**
 * Log allow-list entry removed
 */
export declare function auditAllowListRemoved(index: number, entry: any, correlationId?: string): Promise<string>;
/**
 * Get audit logger for direct access
 */
export declare function getAudit(): AuditLogger;
//# sourceMappingURL=audit-helper.d.ts.map