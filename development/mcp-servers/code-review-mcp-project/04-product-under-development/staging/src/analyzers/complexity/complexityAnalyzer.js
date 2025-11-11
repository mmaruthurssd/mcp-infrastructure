"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateComplexity = calculateComplexity;
// Simple cyclomatic complexity calculator
function calculateComplexity(content, filePath) {
    var functions = [];
    var lines = content.split('\n');
    // Simple regex-based function detection
    var functionRegex = /(function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*\(.*\)\s*{)/g;
    var match;
    var functionStarts = [];
    lines.forEach(function (line, index) {
        var trimmed = line.trim();
        if (trimmed.match(/^(function|const.*=.*function|async\s+function|.*=>\s*{)/)) {
            var nameMatch = trimmed.match(/(?:function\s+)?(\w+)/);
            if (nameMatch) {
                functionStarts.push({ name: nameMatch[1], line: index + 1 });
            }
        }
    });
    // Calculate basic complexity for each function
    functionStarts.forEach(function (func) {
        var cyclomatic = calculateCyclomaticComplexity(content, func.line);
        var cognitive = Math.round(cyclomatic * 1.2); // Approximate cognitive from cyclomatic
        var nestingDepth = calculateNestingDepth(content, func.line);
        var recommendation = 'Good';
        if (cyclomatic > 15)
            recommendation = 'Consider refactoring - high complexity';
        else if (cyclomatic > 10)
            recommendation = 'Review for simplification opportunities';
        functions.push({
            file: filePath,
            function: func.name,
            line: func.line,
            cyclomatic: cyclomatic,
            cognitive: cognitive,
            nestingDepth: nestingDepth,
            recommendation: recommendation,
        });
    });
    return functions;
}
function calculateCyclomaticComplexity(content, startLine) {
    // Count decision points: if, for, while, case, &&, ||, ?
    var lines = content.split('\n').slice(startLine - 1);
    var complexity = 1; // Base complexity
    var braceCount = 0;
    var inFunction = false;
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        var trimmed = line.trim();
        // Track function scope
        braceCount += (trimmed.match(/{/g) || []).length;
        braceCount -= (trimmed.match(/}/g) || []).length;
        if (braceCount > 0) {
            inFunction = true;
        }
        else if (inFunction) {
            break; // Exited function
        }
        if (inFunction) {
            // Count decision points
            if (trimmed.match(/\bif\s*\(/))
                complexity++;
            if (trimmed.match(/\bfor\s*\(/))
                complexity++;
            if (trimmed.match(/\bwhile\s*\(/))
                complexity++;
            if (trimmed.match(/\bcase\s+/))
                complexity++;
            if (trimmed.match(/\bcatch\s*\(/))
                complexity++;
            complexity += (trimmed.match(/&&|\|\|/g) || []).length;
            complexity += (trimmed.match(/\?/g) || []).length;
        }
    }
    return complexity;
}
function calculateNestingDepth(content, startLine) {
    var lines = content.split('\n').slice(startLine - 1);
    var maxDepth = 0;
    var currentDepth = 0;
    var braceCount = 0;
    var inFunction = false;
    for (var _i = 0, lines_2 = lines; _i < lines_2.length; _i++) {
        var line = lines_2[_i];
        var trimmed = line.trim();
        braceCount += (trimmed.match(/{/g) || []).length;
        if (braceCount > 0)
            inFunction = true;
        if (inFunction) {
            currentDepth += (trimmed.match(/{/g) || []).length;
            maxDepth = Math.max(maxDepth, currentDepth);
            currentDepth -= (trimmed.match(/}/g) || []).length;
        }
        braceCount -= (trimmed.match(/}/g) || []).length;
        if (braceCount <= 0 && inFunction)
            break;
    }
    return maxDepth;
}
