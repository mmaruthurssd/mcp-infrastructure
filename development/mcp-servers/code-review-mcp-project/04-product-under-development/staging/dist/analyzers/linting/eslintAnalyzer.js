/**
 * ESLint analyzer for TypeScript/JavaScript/Apps Script
 */
import { ESLint } from 'eslint';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export async function analyzeWithESLint(files, includeAppsScript = false) {
    // Resolve plugins and parser relative to this MCP's node_modules
    const mcpRoot = join(__dirname, '..', '..', '..');
    // Define Apps Script globals if analyzing .gs files
    const appsScriptGlobals = includeAppsScript ? {
        // Apps Script built-in services
        SpreadsheetApp: 'readonly',
        DriveApp: 'readonly',
        Logger: 'readonly',
        ScriptApp: 'readonly',
        Session: 'readonly',
        PropertiesService: 'readonly',
        UrlFetchApp: 'readonly',
        Utilities: 'readonly',
        ContentService: 'readonly',
        HtmlService: 'readonly',
        CacheService: 'readonly',
        LockService: 'readonly',
        MailApp: 'readonly',
        GmailApp: 'readonly',
        CalendarApp: 'readonly',
        DocumentApp: 'readonly',
        FormApp: 'readonly',
        SlidesApp: 'readonly',
        // Common Apps Script classes
        Browser: 'readonly',
        XmlService: 'readonly',
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
            },
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
    const issues = [];
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
//# sourceMappingURL=eslintAnalyzer.js.map