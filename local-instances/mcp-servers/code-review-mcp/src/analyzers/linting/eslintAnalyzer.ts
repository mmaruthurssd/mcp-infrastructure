/**
 * ESLint analyzer for TypeScript/JavaScript/Apps Script
 */
import { ESLint } from 'eslint';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { CodeIssue } from '../../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function analyzeWithESLint(files: string[], includeAppsScript: boolean = false): Promise<CodeIssue[]> {
  // Resolve plugins and parser relative to this MCP's node_modules
  const mcpRoot = join(__dirname, '..', '..', '..');

  // Define Apps Script globals if analyzing .gs files
  const appsScriptGlobals = includeAppsScript ? {
    // Apps Script built-in services
    SpreadsheetApp: 'readonly' as const,
    DriveApp: 'readonly' as const,
    Logger: 'readonly' as const,
    ScriptApp: 'readonly' as const,
    Session: 'readonly' as const,
    PropertiesService: 'readonly' as const,
    UrlFetchApp: 'readonly' as const,
    Utilities: 'readonly' as const,
    ContentService: 'readonly' as const,
    HtmlService: 'readonly' as const,
    CacheService: 'readonly' as const,
    LockService: 'readonly' as const,
    MailApp: 'readonly' as const,
    GmailApp: 'readonly' as const,
    CalendarApp: 'readonly' as const,
    DocumentApp: 'readonly' as const,
    FormApp: 'readonly' as const,
    SlidesApp: 'readonly' as const,
    // Common Apps Script classes
    Browser: 'readonly' as const,
    XmlService: 'readonly' as const,
  } : {};

  const eslint = new ESLint({
    useEslintrc: false,
    cwd: mcpRoot,
    resolvePluginsRelativeTo: mcpRoot,
    overrideConfig: {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint'],
      env: {
        node: true,
        es2022: true,
      },
      globals: {
        ...appsScriptGlobals,
      } as Record<string, boolean | 'readonly' | 'off' | 'readable' | 'writable' | 'writeable'>,
      rules: {
        // ESLint core rules
        'no-unused-vars': 'off',
        'no-undef': 'error',
        'no-console': 'off',
        'complexity': ['warn', 10],
        'max-lines-per-function': ['warn', { max: 50 }],
        'max-depth': ['warn', 4],
        'no-var': 'error',
        'prefer-const': 'warn',
        'eqeqeq': ['error', 'always'],
        'curly': ['error', 'all'],

        // TypeScript rules
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
      },
    },
  });

  const results = await eslint.lintFiles(files);
  const issues: CodeIssue[] = [];

  for (const result of results) {
    for (const message of result.messages) {
      issues.push({
        file: result.filePath,
        line: message.line,
        column: message.column,
        rule: message.ruleId || 'unknown',
        severity: message.severity === 2 ? 'error' : message.severity === 1 ? 'warning' : 'info',
        message: message.message,
        fixable: message.fix !== undefined,
      });
    }
  }

  return issues;
}
