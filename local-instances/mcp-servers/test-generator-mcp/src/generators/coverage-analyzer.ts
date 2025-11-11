import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileExists } from '../utils/file-utils.js';
import type { CoverageMetrics, UncoveredFile, CoverageRecommendation } from '../types/index.js';

/**
 * Find coverage file in standard locations
 */
export async function findCoverageFile(projectPath: string): Promise<string | null> {
  const possiblePaths = [
    join(projectPath, 'coverage', 'coverage-final.json'),
    join(projectPath, 'coverage', 'coverage-summary.json'),
    join(projectPath, '.nyc_output', 'coverage-final.json'),
    join(projectPath, 'coverage.json'),
  ];

  for (const path of possiblePaths) {
    if (await fileExists(path)) {
      return path;
    }
  }

  return null;
}

/**
 * Parse coverage JSON file (Istanbul/NYC format)
 */
export async function parseCoverageFile(coverageFilePath: string): Promise<any> {
  try {
    const content = await readFile(coverageFilePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse coverage file: ${(error as Error).message}`);
  }
}

/**
 * Calculate overall coverage metrics
 */
export function calculateOverallCoverage(coverageData: any): CoverageMetrics {
  const files = Object.keys(coverageData);
  if (files.length === 0) {
    return { statements: 0, branches: 0, functions: 0, lines: 0 };
  }

  let totalStatements = 0;
  let coveredStatements = 0;
  let totalBranches = 0;
  let coveredBranches = 0;
  let totalFunctions = 0;
  let coveredFunctions = 0;
  let totalLines = 0;
  let coveredLines = 0;

  for (const file of files) {
    const fileCoverage = coverageData[file];

    // Statements
    const stmts = fileCoverage.s || {};
    totalStatements += Object.keys(stmts).length;
    coveredStatements += Object.values(stmts).filter((v: any) => v > 0).length;

    // Branches
    const branches = fileCoverage.b || {};
    for (const branch of Object.values(branches) as any[][]) {
      totalBranches += branch.length;
      coveredBranches += branch.filter(v => v > 0).length;
    }

    // Functions
    const funcs = fileCoverage.f || {};
    totalFunctions += Object.keys(funcs).length;
    coveredFunctions += Object.values(funcs).filter((v: any) => v > 0).length;

    // Lines (use statement map as approximation)
    const statementMap = fileCoverage.statementMap || {};
    totalLines += Object.keys(statementMap).length;
    coveredLines += Object.keys(statementMap).filter(
      (key) => fileCoverage.s[key] > 0
    ).length;
  }

  return {
    statements: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0,
    branches: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
    functions: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0,
    lines: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
  };
}

/**
 * Identify uncovered files
 */
export function findUncoveredFiles(
  coverageData: any,
  threshold: number,
  excludePatterns: string[]
): UncoveredFile[] {
  const uncoveredFiles: UncoveredFile[] = [];

  for (const [filePath, fileCoverage] of Object.entries<any>(coverageData)) {
    // Skip excluded patterns
    if (shouldExcludeFile(filePath, excludePatterns)) {
      continue;
    }

    // Calculate file coverage
    const stmts = fileCoverage.s || {};
    const totalStatements = Object.keys(stmts).length;
    const coveredStatements = Object.values(stmts).filter((v: any) => v > 0).length;
    const coverage = totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;

    if (coverage < threshold) {
      // Find uncovered lines
      const statementMap = fileCoverage.statementMap || {};
      const uncoveredLines: number[] = [];
      for (const [key, value] of Object.entries<any>(statementMap)) {
        if (stmts[key] === 0) {
          uncoveredLines.push(value.start.line);
        }
      }

      // Find uncovered functions
      const fnMap = fileCoverage.fnMap || {};
      const fns = fileCoverage.f || {};
      const uncoveredFunctions: string[] = [];
      for (const [key, fn] of Object.entries<any>(fnMap)) {
        if (fns[key] === 0) {
          uncoveredFunctions.push(fn.name || `anonymous_${key}`);
        }
      }

      // Determine priority
      const priority = determinePriority(coverage, uncoveredFunctions.length);

      uncoveredFiles.push({
        path: filePath,
        coverage,
        priority,
        uncoveredLines,
        uncoveredFunctions,
      });
    }
  }

  // Sort by priority and coverage
  uncoveredFiles.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.coverage - b.coverage; // Lower coverage first
  });

  return uncoveredFiles;
}

/**
 * Generate recommendations for which files to test first
 */
export function generateRecommendations(uncoveredFiles: UncoveredFile[]): CoverageRecommendation[] {
  const recommendations: CoverageRecommendation[] = [];

  for (const file of uncoveredFiles.slice(0, 10)) {
    // Top 10 files
    let reason = '';

    if (file.priority === 'high') {
      reason = 'Critical file with low coverage - high impact on system reliability';
    } else if (file.coverage === 0) {
      reason = 'No test coverage - needs immediate attention';
    } else if (file.uncoveredFunctions.length > 5) {
      reason = `Many untested functions (${file.uncoveredFunctions.length}) - potential for bugs`;
    } else {
      reason = `Coverage below threshold (${file.coverage.toFixed(1)}%)`;
    }

    // Estimate tests needed
    const estimatedTests = Math.ceil(file.uncoveredFunctions.length * 1.5);

    recommendations.push({
      file: file.path,
      reason,
      estimatedTests,
    });
  }

  return recommendations;
}

/**
 * Determine priority based on coverage and complexity
 */
function determinePriority(
  coverage: number,
  uncoveredFunctionCount: number
): 'high' | 'medium' | 'low' {
  if (coverage === 0 || uncoveredFunctionCount > 10) {
    return 'high';
  } else if (coverage < 50 || uncoveredFunctionCount > 5) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Check if file should be excluded
 */
function shouldExcludeFile(filePath: string, excludePatterns: string[]): boolean {
  return excludePatterns.some(pattern => {
    // Simple glob matching (e.g., *.test.ts, node_modules)
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filePath);
    }
    return filePath.includes(pattern);
  });
}

/**
 * Format coverage metrics for display
 */
export function formatCoverageMetrics(metrics: CoverageMetrics): string {
  return `
  Statements: ${metrics.statements.toFixed(2)}%
  Branches:   ${metrics.branches.toFixed(2)}%
  Functions:  ${metrics.functions.toFixed(2)}%
  Lines:      ${metrics.lines.toFixed(2)}%
  `.trim();
}
