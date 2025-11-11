/**
 * Tool: scan_for_credentials
 *
 * Scan files, directories, or git commits for exposed credentials
 */

import * as fs from 'fs/promises';
import { execSync } from 'child_process';
import { CredentialScanner } from '../scanners/credential-scanner.js';
import type { ScanResult, CredentialScanResult } from '../types/index.js';
import { loadConfig } from '../config/security-config.js';
import {
  auditCredentialScan,
  auditCredentialViolation,
  generateCorrelationId,
} from '../audit/audit-helper.js';

export interface ScanForCredentialsArgs {
  target: string;
  mode: 'file' | 'directory' | 'staged' | 'commit';
  commitHash?: string;
  minConfidence?: number;
  exclude?: string[];
}

/**
 * Scan for credentials based on mode
 */
export async function scanForCredentials(args: ScanForCredentialsArgs): Promise<CredentialScanResult> {
  const startTime = Date.now();
  const config = loadConfig();

  // Create scanner with config
  const scanner = new CredentialScanner({
    allowList: config.allowList,
    minConfidence: args.minConfidence ?? 0.5,
  });

  let results: ScanResult[];

  switch (args.mode) {
    case 'file':
      results = [await scanner.scanFile(args.target)];
      break;

    case 'directory':
      results = await scanner.scanDirectory(args.target, { exclude: args.exclude });
      break;

    case 'staged':
      results = await scanStagedFiles(scanner);
      break;

    case 'commit':
      if (!args.commitHash) {
        throw new Error('commitHash required for commit mode');
      }
      results = await scanCommit(scanner, args.commitHash);
      break;

    default:
      throw new Error(`Unknown scan mode: ${args.mode}`);
  }

  // Aggregate results
  const allViolations = results.flatMap((r) => r.violations);
  const scanTime = Date.now() - startTime;

  // Count by severity
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  allViolations.forEach((v) => {
    severityCounts[v.severity]++;
  });

  // Audit logging
  const correlationId = generateCorrelationId();
  const outcome = allViolations.length === 0 ? 'success' : 'blocked';

  await auditCredentialScan(args.target, args.mode, allViolations.length, outcome, correlationId);

  // Log each violation
  for (const violation of allViolations) {
    await auditCredentialViolation(
      violation.file,
      violation.pattern,
      violation.severity,
      correlationId
    );
  }

  return {
    success: allViolations.length === 0,
    violations: allViolations,
    summary: {
      filesScanned: results.length,
      violationsFound: allViolations.length,
      criticalCount: severityCounts.critical,
      highCount: severityCounts.high,
      mediumCount: severityCounts.medium,
      lowCount: severityCounts.low,
      scanTime,
    },
  };
}

/**
 * Scan git staged files
 */
async function scanStagedFiles(scanner: CredentialScanner): Promise<ScanResult[]> {
  try {
    // Get list of staged files
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });

    const stagedFiles = output
      .trim()
      .split('\n')
      .filter((f) => f.length > 0);

    if (stagedFiles.length === 0) {
      return [];
    }

    // Scan each staged file
    const results: ScanResult[] = [];
    for (const file of stagedFiles) {
      try {
        // Check if file exists (might have been deleted)
        await fs.access(file);
        const result = await scanner.scanFile(file);
        results.push(result);
      } catch (error) {
        // File might be deleted or not accessible, skip it
        continue;
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Failed to scan staged files: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Scan files changed in a specific commit
 */
async function scanCommit(scanner: CredentialScanner, commitHash: string): Promise<ScanResult[]> {
  try {
    // Get list of files changed in commit
    const output = execSync(`git diff-tree --no-commit-id --name-only -r ${commitHash}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });

    const changedFiles = output
      .trim()
      .split('\n')
      .filter((f) => f.length > 0);

    if (changedFiles.length === 0) {
      return [];
    }

    // Get content of each file at that commit
    const results: ScanResult[] = [];
    for (const file of changedFiles) {
      try {
        const content = execSync(`git show ${commitHash}:${file}`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore'],
        });

        const violations = scanner.scanText(content, file);
        results.push({
          filePath: file,
          violations,
          clean: violations.length === 0,
          scannedAt: new Date().toISOString(),
        });
      } catch (error) {
        // File might be binary or not accessible, skip it
        continue;
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Failed to scan commit ${commitHash}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Format scan results for display
 */
export function formatScanResults(result: CredentialScanResult): string {
  const lines: string[] = [];

  // Header
  lines.push('='.repeat(80));
  lines.push('CREDENTIAL SCAN RESULTS');
  lines.push('='.repeat(80));
  lines.push('');

  // Summary
  lines.push('Summary:');
  lines.push(`  Files scanned: ${result.summary.filesScanned}`);
  lines.push(`  Violations found: ${result.summary.violationsFound}`);
  lines.push(`  Scan time: ${result.summary.scanTime}ms`);
  lines.push('');

  // Severity breakdown
  if (result.summary.violationsFound > 0) {
    lines.push('Severity Breakdown:');
    if (result.summary.criticalCount > 0) {
      lines.push(`  🔴 Critical: ${result.summary.criticalCount}`);
    }
    if (result.summary.highCount > 0) {
      lines.push(`  🟠 High: ${result.summary.highCount}`);
    }
    if (result.summary.mediumCount > 0) {
      lines.push(`  🟡 Medium: ${result.summary.mediumCount}`);
    }
    if (result.summary.lowCount > 0) {
      lines.push(`  🔵 Low: ${result.summary.lowCount}`);
    }
    lines.push('');
  }

  // Violations detail
  if (result.violations.length > 0) {
    lines.push('Violations:');
    lines.push('-'.repeat(80));

    // Group by file
    const byFile = new Map<string, typeof result.violations>();
    result.violations.forEach((v) => {
      if (!byFile.has(v.file)) {
        byFile.set(v.file, []);
      }
      byFile.get(v.file)!.push(v);
    });

    byFile.forEach((violations, file) => {
      lines.push('');
      lines.push(`📄 ${file}`);
      lines.push('');

      violations.forEach((v, index) => {
        const severityIcon = {
          critical: '🔴',
          high: '🟠',
          medium: '🟡',
          low: '🔵',
        }[v.severity];

        lines.push(`  ${index + 1}. ${severityIcon} ${v.pattern} (${v.severity}, confidence: ${(v.confidence * 100).toFixed(0)}%)`);
        lines.push(`     Location: Line ${v.line}, Column ${v.column}`);
        lines.push(`     Suggestion: ${v.suggestion}`);
        lines.push('');
        lines.push('     Context:');
        v.context.split('\n').forEach((line) => {
          lines.push(`     ${line}`);
        });
        lines.push('');
      });
    });

    lines.push('-'.repeat(80));
  } else {
    lines.push('✅ No credentials detected. All files are clean!');
  }

  lines.push('');
  lines.push('='.repeat(80));

  return lines.join('\n');
}
