"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeWithESLint = analyzeWithESLint;
/**
 * ESLint analyzer for TypeScript/JavaScript/Apps Script
 */
var eslint_1 = require("eslint");
var url_1 = require("url");
var path_1 = require("path");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = (0, path_1.dirname)(__filename);
function analyzeWithESLint(files_1) {
    return __awaiter(this, arguments, void 0, function (files, includeAppsScript) {
        var mcpRoot, appsScriptGlobals, eslint, results, issues, _i, results_1, result, _a, _b, message;
        if (includeAppsScript === void 0) { includeAppsScript = false; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    mcpRoot = (0, path_1.join)(__dirname, '..', '..', '..');
                    appsScriptGlobals = includeAppsScript ? {
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
                    eslint = new eslint_1.ESLint({
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
                            globals: __assign({}, appsScriptGlobals),
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
                    return [4 /*yield*/, eslint.lintFiles(files)];
                case 1:
                    results = _c.sent();
                    issues = [];
                    for (_i = 0, results_1 = results; _i < results_1.length; _i++) {
                        result = results_1[_i];
                        for (_a = 0, _b = result.messages; _a < _b.length; _a++) {
                            message = _b[_a];
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
                    return [2 /*return*/, issues];
            }
        });
    });
}
