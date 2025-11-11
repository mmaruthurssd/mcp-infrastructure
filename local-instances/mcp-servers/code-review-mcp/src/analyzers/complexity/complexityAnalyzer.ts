/**
 * Complexity analysis using escomplex
 */
import { ComplexityFunction } from '../../types.js';

// Simple cyclomatic complexity calculator
export function calculateComplexity(content: string, filePath: string): ComplexityFunction[] {
  const functions: ComplexityFunction[] = [];
  const lines = content.split('\n');

  // Simple regex-based function detection
  const functionRegex = /(function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*\(.*\)\s*{)/g;
  let match;
  const functionStarts: Array<{ name: string; line: number }> = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.match(/^(function|const.*=.*function|async\s+function|.*=>\s*{)/)) {
      const nameMatch = trimmed.match(/(?:function\s+)?(\w+)/);
      if (nameMatch) {
        functionStarts.push({ name: nameMatch[1], line: index + 1 });
      }
    }
  });

  // Calculate basic complexity for each function
  functionStarts.forEach((func) => {
    const cyclomatic = calculateCyclomaticComplexity(content, func.line);
    const cognitive = Math.round(cyclomatic * 1.2); // Approximate cognitive from cyclomatic
    const nestingDepth = calculateNestingDepth(content, func.line);

    let recommendation = 'Good';
    if (cyclomatic > 15) recommendation = 'Consider refactoring - high complexity';
    else if (cyclomatic > 10) recommendation = 'Review for simplification opportunities';

    functions.push({
      file: filePath,
      function: func.name,
      line: func.line,
      cyclomatic,
      cognitive,
      nestingDepth,
      recommendation,
    });
  });

  return functions;
}

function calculateCyclomaticComplexity(content: string, startLine: number): number {
  // Count decision points: if, for, while, case, &&, ||, ?
  const lines = content.split('\n').slice(startLine - 1);
  let complexity = 1; // Base complexity
  let braceCount = 0;
  let inFunction = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Track function scope
    braceCount += (trimmed.match(/{/g) || []).length;
    braceCount -= (trimmed.match(/}/g) || []).length;

    if (braceCount > 0) {
      inFunction = true;
    } else if (inFunction) {
      break; // Exited function
    }

    if (inFunction) {
      // Count decision points
      if (trimmed.match(/\bif\s*\(/)) complexity++;
      if (trimmed.match(/\bfor\s*\(/)) complexity++;
      if (trimmed.match(/\bwhile\s*\(/)) complexity++;
      if (trimmed.match(/\bcase\s+/)) complexity++;
      if (trimmed.match(/\bcatch\s*\(/)) complexity++;
      complexity += (trimmed.match(/&&|\|\|/g) || []).length;
      complexity += (trimmed.match(/\?/g) || []).length;
    }
  }

  return complexity;
}

function calculateNestingDepth(content: string, startLine: number): number {
  const lines = content.split('\n').slice(startLine - 1);
  let maxDepth = 0;
  let currentDepth = 0;
  let braceCount = 0;
  let inFunction = false;

  for (const line of lines) {
    const trimmed = line.trim();

    braceCount += (trimmed.match(/{/g) || []).length;
    if (braceCount > 0) inFunction = true;

    if (inFunction) {
      currentDepth += (trimmed.match(/{/g) || []).length;
      maxDepth = Math.max(maxDepth, currentDepth);
      currentDepth -= (trimmed.match(/}/g) || []).length;
    }

    braceCount -= (trimmed.match(/}/g) || []).length;
    if (braceCount <= 0 && inFunction) break;
  }

  return maxDepth;
}
