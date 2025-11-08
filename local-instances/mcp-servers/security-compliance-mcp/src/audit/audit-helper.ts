/**
 * Audit helper for easy integration
 *
 * Provides convenience methods for logging common security events
 */

import { AuditLogger } from './audit-logger.js';
import type { AuditSeverity, AuditOutcome } from '../types/audit.js';
import * as os from 'os';
import { loadConfig } from '../config/security-config.js';

let auditLogger: AuditLogger | null = null;

/**
 * Get or create audit logger instance
 */
function getAuditLogger(): AuditLogger {
  if (!auditLogger) {
    const config = loadConfig();
    auditLogger = new AuditLogger(config.auditLogging.storePath);
  }
  return auditLogger;
}

/**
 * Get actor (current user or system)
 */
function getActor(): string {
  return process.env.USER || os.userInfo().username || 'system';
}

/**
 * Generate correlation ID for related events
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Log credential scan event
 */
export async function auditCredentialScan(
  target: string,
  mode: string,
  violationsFound: number,
  outcome: AuditOutcome,
  correlationId?: string
): Promise<string> {
  const logger = getAuditLogger();
  await logger.initialize();

  const severity: AuditSeverity = violationsFound > 0 ? 'critical' : 'info';

  return await logger.logEvent(
    'credential_scan_completed',
    severity,
    outcome,
    getActor(),
    {
      target,
      mode,
      violationsFound,
    },
    {
      target,
      correlationId,
    }
  );
}

/**
 * Log credential violation detection
 */
export async function auditCredentialViolation(
  file: string,
  patternName: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  correlationId?: string
): Promise<string> {
  const logger = getAuditLogger();
  await logger.initialize();

  return await logger.logEvent(
    'credential_violation_detected',
    severity as AuditSeverity,
    'blocked',
    getActor(),
    {
      file,
      patternName,
      severity,
    },
    {
      target: file,
      correlationId,
    }
  );
}

/**
 * Log PHI scan event
 */
export async function auditPHIScan(
  target: string,
  mode: string,
  phiInstancesFound: number,
  outcome: AuditOutcome,
  correlationId?: string
): Promise<string> {
  const logger = getAuditLogger();
  await logger.initialize();

  const severity: AuditSeverity = phiInstancesFound > 0 ? 'critical' : 'info';

  return await logger.logEvent(
    'phi_scan_completed',
    severity,
    outcome,
    getActor(),
    {
      target,
      mode,
      phiInstancesFound,
    },
    {
      target,
      phiAccessed: phiInstancesFound > 0,
      correlationId,
    }
  );
}

/**
 * Log PHI violation detection
 */
export async function auditPHIViolation(
  file: string,
  category: string,
  patternName: string,
  correlationId?: string
): Promise<string> {
  const logger = getAuditLogger();
  await logger.initialize();

  return await logger.logEvent(
    'phi_violation_detected',
    'critical',
    'blocked',
    getActor(),
    {
      file,
      category,
      patternName,
    },
    {
      target: file,
      phiAccessed: true,
      correlationId,
    }
  );
}

/**
 * Log secret encryption
 */
export async function auditSecretEncrypted(key: string, correlationId?: string): Promise<string> {
  const logger = getAuditLogger();
  await logger.initialize();

  return await logger.logEvent(
    'secret_encrypted',
    'info',
    'success',
    getActor(),
    {
      key,
      action: 'encrypt',
    },
    {
      target: key,
      correlationId,
    }
  );
}

/**
 * Log secret decryption
 */
export async function auditSecretDecrypted(key: string, correlationId?: string): Promise<string> {
  const logger = getAuditLogger();
  await logger.initialize();

  return await logger.logEvent(
    'secret_decrypted',
    'warning',
    'success',
    getActor(),
    {
      key,
      action: 'decrypt',
    },
    {
      target: key,
      correlationId,
    }
  );
}

/**
 * Log secret rotation
 */
export async function auditSecretRotated(key: string, correlationId?: string): Promise<string> {
  const logger = getAuditLogger();
  await logger.initialize();

  return await logger.logEvent(
    'secret_rotated',
    'info',
    'success',
    getActor(),
    {
      key,
      action: 'rotate',
    },
    {
      target: key,
      correlationId,
    }
  );
}

/**
 * Log secret rotation warning
 */
export async function auditSecretRotationWarning(
  key: string,
  daysUntilExpiry: number,
  correlationId?: string
): Promise<string> {
  const logger = getAuditLogger();
  await logger.initialize();

  return await logger.logEvent(
    'secret_rotation_warning',
    'warning',
    'success',
    getActor(),
    {
      key,
      daysUntilExpiry,
    },
    {
      target: key,
      correlationId,
    }
  );
}

/**
 * Log pre-commit hook installation
 */
export async function auditHookInstalled(gitDir: string, correlationId?: string): Promise<string> {
  const logger = getAuditLogger();
  await logger.initialize();

  return await logger.logEvent(
    'pre_commit_hook_installed',
    'info',
    'success',
    getActor(),
    {
      gitDir,
    },
    {
      target: gitDir,
      correlationId,
    }
  );
}

/**
 * Log pre-commit hook uninstallation
 */
export async function auditHookUninstalled(gitDir: string, correlationId?: string): Promise<string> {
  const logger = getAuditLogger();
  await logger.initialize();

  return await logger.logEvent(
    'pre_commit_hook_uninstalled',
    'info',
    'success',
    getActor(),
    {
      gitDir,
    },
    {
      target: gitDir,
      correlationId,
    }
  );
}

/**
 * Log pre-commit hook trigger
 */
export async function auditHookTriggered(
  gitDir: string,
  outcome: AuditOutcome,
  violationsFound: number,
  correlationId?: string
): Promise<string> {
  const logger = getAuditLogger();
  await logger.initialize();

  const severity: AuditSeverity = violationsFound > 0 ? 'critical' : 'info';

  return await logger.logEvent(
    'pre_commit_hook_triggered',
    severity,
    outcome,
    getActor(),
    {
      gitDir,
      violationsFound,
    },
    {
      target: gitDir,
      correlationId,
    }
  );
}

/**
 * Log pre-commit hook blocking commit
 */
export async function auditHookBlocked(
  gitDir: string,
  reason: string,
  correlationId?: string
): Promise<string> {
  const logger = getAuditLogger();
  await logger.initialize();

  return await logger.logEvent(
    'pre_commit_hook_blocked',
    'critical',
    'blocked',
    getActor(),
    {
      gitDir,
      reason,
    },
    {
      target: gitDir,
      correlationId,
    }
  );
}

/**
 * Log allow-list entry added
 */
export async function auditAllowListAdded(
  entry: any,
  correlationId?: string
): Promise<string> {
  const logger = getAuditLogger();
  await logger.initialize();

  return await logger.logEvent(
    'allowlist_entry_added',
    'info',
    'success',
    getActor(),
    {
      entry,
    },
    {
      correlationId,
    }
  );
}

/**
 * Log allow-list entry removed
 */
export async function auditAllowListRemoved(
  index: number,
  entry: any,
  correlationId?: string
): Promise<string> {
  const logger = getAuditLogger();
  await logger.initialize();

  return await logger.logEvent(
    'allowlist_entry_removed',
    'info',
    'success',
    getActor(),
    {
      index,
      entry,
    },
    {
      correlationId,
    }
  );
}

/**
 * Get audit logger for direct access
 */
export function getAudit(): AuditLogger {
  const logger = getAuditLogger();
  return logger;
}
