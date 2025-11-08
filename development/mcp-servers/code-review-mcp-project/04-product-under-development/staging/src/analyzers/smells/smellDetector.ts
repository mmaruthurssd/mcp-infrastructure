/**
 * Code smell detection
 */
import { CodeSmell } from '../../types.js';

export function detectCodeSmells(content: string, filePath: string, language: string): CodeSmell[] {
  const smells: CodeSmell[] = [];
  const lines = content.split('\n');

  // Detect long methods
  const longMethods = detectLongMethods(lines, filePath);
  smells.push(...longMethods);

  // Detect magic numbers
  const magicNumbers = detectMagicNumbers(lines, filePath);
  smells.push(...magicNumbers);

  // Detect complex conditionals
  const complexConditionals = detectComplexConditionals(lines, filePath);
  smells.push(...complexConditionals);

  // Apps Script specific smells
  if (language === 'appsscript') {
    const appsScriptSmells = detectAppsScriptSmells(lines, filePath);
    smells.push(...appsScriptSmells);
  }

  return smells;
}

function detectLongMethods(lines: string[], filePath: string): CodeSmell[] {
  const smells: CodeSmell[] = [];
  let inFunction = false;
  let functionStart = 0;
  let braceCount = 0;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.match(/^(function|const.*=.*function|async\s+function)/)) {
      inFunction = true;
      functionStart = index + 1;
      braceCount = 0;
    }

    if (inFunction) {
      braceCount += (trimmed.match(/{/g) || []).length;
      braceCount -= (trimmed.match(/}/g) || []).length;

      if (braceCount === 0 && functionStart > 0) {
        const functionLength = index - functionStart + 1;
        if (functionLength > 50) {
          smells.push({
            file: filePath,
            line: functionStart,
            category: 'Long Method',
            severity: 'major',
            description: `Function is ${functionLength} lines long (threshold: 50)`,
            example: lines[functionStart - 1],
            refactoringHint: 'Extract smaller functions to improve readability',
          });
        }
        inFunction = false;
      }
    }
  });

  return smells;
}

function detectMagicNumbers(lines: string[], filePath: string): CodeSmell[] {
  const smells: CodeSmell[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    // Look for hardcoded numbers (excluding 0, 1, -1)
    const magicRegex = /(?<![a-zA-Z0-9_])(?!0|1|-1)[0-9]{2,}(?![a-zA-Z0-9_])/g;
    const matches = trimmed.match(magicRegex);

    if (matches && !trimmed.includes('const') && !trimmed.includes('//')) {
      smells.push({
        file: filePath,
        line: index + 1,
        category: 'Magic Number',
        severity: 'minor',
        description: `Hardcoded number found: ${matches[0]}`,
        example: trimmed,
        refactoringHint: 'Extract to named constant for clarity',
      });
    }
  });

  return smells;
}

function detectComplexConditionals(lines: string[], filePath: string): CodeSmell[] {
  const smells: CodeSmell[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const operators = (trimmed.match(/&&|\|\|/g) || []).length;

    if (operators >= 3) {
      smells.push({
        file: filePath,
        line: index + 1,
        category: 'Complex Conditional',
        severity: 'major',
        description: `Conditional has ${operators} logical operators`,
        example: trimmed,
        refactoringHint: 'Extract to well-named boolean variables or functions',
      });
    }
  });

  return smells;
}

function detectAppsScriptSmells(lines: string[], filePath: string): CodeSmell[] {
  const smells: CodeSmell[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Excessive SpreadsheetApp.getActiveSpreadsheet() calls
    if (trimmed.includes('SpreadsheetApp.getActiveSpreadsheet()')) {
      smells.push({
        file: filePath,
        line: index + 1,
        category: 'Apps Script: Repeated API Call',
        severity: 'minor',
        description: 'Repeated getActiveSpreadsheet() call',
        example: trimmed,
        refactoringHint: 'Cache the spreadsheet reference at function start',
      });
    }

    // setValue in loop (should use setValues batch)
    if (trimmed.includes('.setValue(') && lines[index - 1]?.trim().match(/for\s*\(/)) {
      smells.push({
        file: filePath,
        line: index + 1,
        category: 'Apps Script: No Batch Operation',
        severity: 'critical',
        description: 'setValue() inside loop - performance issue',
        example: trimmed,
        refactoringHint: 'Use range.setValues() with 2D array instead',
      });
    }
  });

  return smells;
}
