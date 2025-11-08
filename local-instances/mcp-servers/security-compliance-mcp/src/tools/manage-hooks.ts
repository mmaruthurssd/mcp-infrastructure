/**
 * Tool: manage_hooks
 *
 * Install, uninstall, and check status of git pre-commit hooks
 */

import {
  installPreCommitHook,
  uninstallPreCommitHook,
  checkHookStatus,
} from '../hooks/hook-manager.js';
import {
  auditHookInstalled,
  auditHookUninstalled,
  generateCorrelationId,
} from '../audit/audit-helper.js';

export interface ManageHooksArgs {
  action: 'install' | 'uninstall' | 'status';
  gitDir?: string;
}

export interface ManageHooksResult {
  success: boolean;
  action: string;
  message: string;
  details?: {
    installed?: boolean;
    hookPath?: string;
    hasBackup?: boolean;
  };
}

/**
 * Manage git hooks
 */
export async function manageHooks(args: ManageHooksArgs): Promise<ManageHooksResult> {
  const correlationId = generateCorrelationId();
  const gitDir = args.gitDir || process.cwd();

  switch (args.action) {
    case 'install': {
      const result = await installPreCommitHook(args.gitDir);

      // Audit event
      if (result.success) {
        await auditHookInstalled(gitDir, correlationId);
      }

      return {
        success: result.success,
        action: 'install',
        message: result.message,
        details: {
          hookPath: result.hookPath,
          hasBackup: !!result.backupPath,
        },
      };
    }

    case 'uninstall': {
      const result = await uninstallPreCommitHook(args.gitDir);

      // Audit event
      if (result.success) {
        await auditHookUninstalled(gitDir, correlationId);
      }

      return {
        success: result.success,
        action: 'uninstall',
        message: result.message,
        details: {
          hookPath: result.hookPath,
        },
      };
    }

    case 'status': {
      const result = await checkHookStatus(args.gitDir);
      return {
        success: true,
        action: 'status',
        message: result.message,
        details: {
          installed: result.installed,
          hookPath: result.hookPath,
          hasBackup: result.hasBackup,
        },
      };
    }

    default:
      throw new Error(`Unknown action: ${args.action}`);
  }
}

/**
 * Format hook management results for display
 */
export function formatHookManagementResult(result: ManageHooksResult): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('GIT HOOK MANAGEMENT');
  lines.push('='.repeat(80));
  lines.push('');

  // Action header
  const actionIcon = {
    install: '⚙️',
    uninstall: '🗑️',
    status: 'ℹ️',
  }[result.action];

  lines.push(`${actionIcon} Action: ${result.action.toUpperCase()}`);
  lines.push('');

  // Status
  if (result.success) {
    lines.push(`✅ ${result.message}`);
  } else {
    lines.push(`❌ ${result.message}`);
  }

  lines.push('');

  // Details
  if (result.details) {
    lines.push('Details:');

    if (result.details.installed !== undefined) {
      lines.push(`  Installed: ${result.details.installed ? 'Yes' : 'No'}`);
    }

    if (result.details.hookPath) {
      lines.push(`  Hook Path: ${result.details.hookPath}`);
    }

    if (result.details.hasBackup !== undefined && result.details.hasBackup) {
      lines.push(`  Backup: ${result.details.hasBackup ? 'Yes (previous hook backed up)' : 'No'}`);
    }

    lines.push('');
  }

  // Usage hints
  if (result.action === 'install' && result.success) {
    lines.push('Usage:');
    lines.push('  The pre-commit hook will now run automatically before each commit.');
    lines.push('  To bypass: SKIP_SECURITY_HOOKS=true git commit -m "message"');
    lines.push('');
  }

  if (result.action === 'status' && result.details?.installed) {
    lines.push('The hook will:');
    lines.push('  • Scan staged files for credentials before each commit');
    lines.push('  • Block commits if violations are found');
    lines.push('  • Can be bypassed with SKIP_SECURITY_HOOKS=true (use with caution)');
    lines.push('');
  }

  lines.push('='.repeat(80));

  return lines.join('\n');
}
