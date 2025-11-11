/**
 * Tool: scan_for_phi
 *
 * Scan files for Protected Health Information (PHI)
 */

import * as fs from 'fs/promises';
import { execSync } from 'child_process';
import { PHIScanner, type PHIScanResult, type PHIScanOptions } from '../scanners/phi-scanner.js';
import type { PHIDetectionResult, PHICategory, RiskLevel } from '../types/index.js';
import {
  auditPHIScan,
  auditPHIViolation,
  generateCorrelationId,
} from '../audit/audit-helper.js';

export interface ScanForPHIArgs {
  target: string;
  mode: 'file' | 'directory' | 'staged' | 'commit';
  commitHash?: string;
  minConfidence?: number;
  sensitivity?: 'low' | 'medium' | 'high';
  categories?: PHICategory[];
  exclude?: string[];
}

/**
 * Scan for PHI based on mode
 */
export async function scanForPHI(args: ScanForPHIArgs): Promise<PHIDetectionResult> {
  const scannerOptions: PHIScanOptions = {
    minConfidence: args.minConfidence,
    sensitivity: args.sensitivity || 'medium',
    categories: args.categories,
  };

  const scanner = new PHIScanner(scannerOptions);
  let results: PHIScanResult[];

  switch (args.mode) {
    case 'file':
      results = [await scanner.scanFile(args.target)];
      break;

    case 'directory':
      const files = await findFilesInDirectory(args.target, args.exclude || []);
      results = await scanner.scanFiles(files);
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
  const allFindings = results.flatMap((r) => r.findings);

  // Determine overall risk level
  const overallRisk = determineOverallRisk(results);

  // Get unique categories
  const categoriesDetected = [...new Set(allFindings.map((f) => f.category))];

  // Determine compliance impact
  const complianceImpact = determineComplianceImpact(allFindings, overallRisk);

  // Audit logging
  const correlationId = generateCorrelationId();
  const outcome = allFindings.length === 0 ? 'success' : 'blocked';

  await auditPHIScan(args.target, args.mode, allFindings.length, outcome, correlationId);

  // Log each PHI violation
  for (const finding of allFindings) {
    await auditPHIViolation(
      finding.file,
      finding.category,
      finding.pattern,
      correlationId
    );
  }

  return {
    success: allFindings.length === 0,
    phiDetected: allFindings.length > 0,
    findings: allFindings,
    summary: {
      filesScanned: results.length,
      phiInstancesFound: allFindings.length,
      categoriesDetected,
      riskLevel: overallRisk,
    },
    complianceImpact,
  };
}

/**
 * Scan git staged files
 */
async function scanStagedFiles(scanner: PHIScanner): Promise<PHIScanResult[]> {
  try {
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

    const results: PHIScanResult[] = [];
    for (const file of stagedFiles) {
      try {
        await fs.access(file);
        const result = await scanner.scanFile(file);
        results.push(result);
      } catch (error) {
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
async function scanCommit(scanner: PHIScanner, commitHash: string): Promise<PHIScanResult[]> {
  try {
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

    const results: PHIScanResult[] = [];
    for (const file of changedFiles) {
      try {
        const content = execSync(`git show ${commitHash}:${file}`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore'],
        });

        const findings = scanner.scanText(content, file);
        const riskLevel = scanner['calculateRiskLevel'](findings);

        results.push({
          filePath: file,
          findings,
          clean: findings.length === 0,
          riskLevel,
          scannedAt: new Date().toISOString(),
        });
      } catch (error) {
        continue;
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Failed to scan commit ${commitHash}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Find files in directory
 */
async function findFilesInDirectory(dirPath: string, exclude: string[]): Promise<string[]> {
  const files: string[] = [];
  const defaultExclude = ['node_modules', '.git', 'dist', 'build', 'coverage', ...exclude];

  async function walk(currentPath: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = `${currentPath}/${entry.name}`;

      if (defaultExclude.includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  await walk(dirPath);
  return files;
}

/**
 * Determine overall risk level from multiple scan results
 */
function determineOverallRisk(results: PHIScanResult[]): RiskLevel {
  const risks = results.map((r) => r.riskLevel);

  if (risks.includes('critical')) return 'critical';
  if (risks.includes('high')) return 'high';
  if (risks.includes('medium')) return 'medium';
  return 'low';
}

/**
 * Determine compliance impact message
 */
function determineComplianceImpact(findings: any[], riskLevel: RiskLevel): string {
  if (findings.length === 0) {
    return 'No PHI detected. No HIPAA compliance concerns.';
  }

  const impacts = {
    critical: 'CRITICAL: Direct patient identifiers detected. HIPAA breach risk is HIGH. Immediate remediation required.',
    high: 'HIGH: Multiple PHI categories detected. Potential HIPAA violation. Review and anonymize immediately.',
    medium: 'MEDIUM: PHI detected. May require de-identification before sharing or committing.',
    low: 'LOW: Limited PHI detected. Review to ensure proper handling.',
  };

  return impacts[riskLevel];
}

/**
 * Format PHI scan results for display
 */
export function formatPHIScanResults(result: PHIDetectionResult): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('PHI DETECTION SCAN RESULTS');
  lines.push('='.repeat(80));
  lines.push('');

  // Summary
  lines.push('Summary:');
  lines.push(`  Files scanned: ${result.summary.filesScanned}`);
  lines.push(`  PHI instances found: ${result.summary.phiInstancesFound}`);
  lines.push(`  Risk level: ${result.summary.riskLevel.toUpperCase()}`);
  lines.push('');

  // Compliance impact
  const riskIcon = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🔵',
  }[result.summary.riskLevel];

  lines.push(`${riskIcon} Compliance Impact:`);
  lines.push(`  ${result.complianceImpact}`);
  lines.push('');

  // Categories detected
  if (result.summary.categoriesDetected.length > 0) {
    lines.push('PHI Categories Detected:');
    result.summary.categoriesDetected.forEach((cat) => {
      const categoryIcon = {
        identifier: '🆔',
        demographic: '👤',
        medical: '⚕️',
        financial: '💰',
      }[cat];
      lines.push(`  ${categoryIcon} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`);
    });
    lines.push('');
  }

  // Findings detail
  if (result.findings.length > 0) {
    lines.push('Findings:');
    lines.push('-'.repeat(80));

    // Group by file
    const byFile = new Map<string, typeof result.findings>();
    result.findings.forEach((f) => {
      if (!byFile.has(f.file)) {
        byFile.set(f.file, []);
      }
      byFile.get(f.file)!.push(f);
    });

    byFile.forEach((findings, file) => {
      lines.push('');
      lines.push(`📄 ${file}`);
      lines.push('');

      findings.forEach((f, index) => {
        const categoryIcon = {
          identifier: '🆔',
          demographic: '👤',
          medical: '⚕️',
          financial: '💰',
        }[f.category];

        lines.push(`  ${index + 1}. ${categoryIcon} ${f.pattern} (confidence: ${(f.confidence * 100).toFixed(0)}%)`);
        lines.push(`     Location: Line ${f.line}`);
        lines.push(`     Anonymization: ${f.anonymizationSuggestion}`);
        lines.push('');
      });
    });

    lines.push('-'.repeat(80));
    lines.push('');
    lines.push('HIPAA Compliance Notice:');
    lines.push('  • PHI must be de-identified before sharing outside secure systems');
    lines.push('  • Use Safe Harbor or Expert Determination methods for de-identification');
    lines.push('  • Document all PHI handling in audit logs');
    lines.push('  • Never commit actual patient data to version control');
  } else {
    lines.push('✅ No PHI detected. All files are clean!');
  }

  lines.push('');
  lines.push('='.repeat(80));

  return lines.join('\n');
}
