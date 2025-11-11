"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectCodeSmells = detectCodeSmells;
function detectCodeSmells(content, filePath, language) {
    var smells = [];
    var lines = content.split('\n');
    // Detect long methods
    var longMethods = detectLongMethods(lines, filePath);
    smells.push.apply(smells, longMethods);
    // Detect magic numbers
    var magicNumbers = detectMagicNumbers(lines, filePath);
    smells.push.apply(smells, magicNumbers);
    // Detect complex conditionals
    var complexConditionals = detectComplexConditionals(lines, filePath);
    smells.push.apply(smells, complexConditionals);
    // Apps Script specific smells
    if (language === 'appsscript') {
        var appsScriptSmells = detectAppsScriptSmells(lines, filePath);
        smells.push.apply(smells, appsScriptSmells);
    }
    return smells;
}
function detectLongMethods(lines, filePath) {
    var smells = [];
    var inFunction = false;
    var functionStart = 0;
    var braceCount = 0;
    lines.forEach(function (line, index) {
        var trimmed = line.trim();
        if (trimmed.match(/^(function|const.*=.*function|async\s+function)/)) {
            inFunction = true;
            functionStart = index + 1;
            braceCount = 0;
        }
        if (inFunction) {
            braceCount += (trimmed.match(/{/g) || []).length;
            braceCount -= (trimmed.match(/}/g) || []).length;
            if (braceCount === 0 && functionStart > 0) {
                var functionLength = index - functionStart + 1;
                if (functionLength > 50) {
                    smells.push({
                        file: filePath,
                        line: functionStart,
                        category: 'Long Method',
                        severity: 'major',
                        description: "Function is ".concat(functionLength, " lines long (threshold: 50)"),
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
function detectMagicNumbers(lines, filePath) {
    var smells = [];
    lines.forEach(function (line, index) {
        var trimmed = line.trim();
        // Look for hardcoded numbers (excluding 0, 1, -1)
        var magicRegex = /(?<![a-zA-Z0-9_])(?!0|1|-1)[0-9]{2,}(?![a-zA-Z0-9_])/g;
        var matches = trimmed.match(magicRegex);
        if (matches && !trimmed.includes('const') && !trimmed.includes('//')) {
            smells.push({
                file: filePath,
                line: index + 1,
                category: 'Magic Number',
                severity: 'minor',
                description: "Hardcoded number found: ".concat(matches[0]),
                example: trimmed,
                refactoringHint: 'Extract to named constant for clarity',
            });
        }
    });
    return smells;
}
function detectComplexConditionals(lines, filePath) {
    var smells = [];
    lines.forEach(function (line, index) {
        var trimmed = line.trim();
        var operators = (trimmed.match(/&&|\|\|/g) || []).length;
        if (operators >= 3) {
            smells.push({
                file: filePath,
                line: index + 1,
                category: 'Complex Conditional',
                severity: 'major',
                description: "Conditional has ".concat(operators, " logical operators"),
                example: trimmed,
                refactoringHint: 'Extract to well-named boolean variables or functions',
            });
        }
    });
    return smells;
}
function detectAppsScriptSmells(lines, filePath) {
    var smells = [];
    lines.forEach(function (line, index) {
        var _a;
        var trimmed = line.trim();
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
        if (trimmed.includes('.setValue(') && ((_a = lines[index - 1]) === null || _a === void 0 ? void 0 : _a.trim().match(/for\s*\(/))) {
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
