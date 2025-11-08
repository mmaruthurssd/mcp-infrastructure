import { getFiles, analyzeFile, detectLanguage } from '../utils/fileUtils.js';
import { analyzeWithESLint } from '../analyzers/linting/eslintAnalyzer.js';
import { calculateComplexity } from '../analyzers/complexity/complexityAnalyzer.js';
import { detectCodeSmells } from '../analyzers/smells/smellDetector.js';
import { DebtManager } from '../debt/debtManager.js';
export async function analyzeCodeQuality(params) {
    try {
        const files = await getFiles(params.target);
        const filteredFiles = files.filter(f => {
            const lang = detectLanguage(f);
            return !params.languages || params.languages.includes(lang);
        });
        // Run ESLint on applicable files
        const tsJsFiles = filteredFiles.filter(f => {
            const lang = detectLanguage(f);
            return ['typescript', 'javascript', 'appsscript'].includes(lang);
        });
        // Only enable Apps Script support if we're actually analyzing .gs files
        const hasAppsScriptFiles = filteredFiles.some(f => detectLanguage(f) === 'appsscript');
        const issues = tsJsFiles.length > 0 ? await analyzeWithESLint(tsJsFiles, hasAppsScriptFiles) : [];
        // Filter by severity
        const filteredIssues = params.severity && params.severity !== 'all'
            ? issues.filter(i => i.severity === params.severity)
            : issues;
        // Calculate summary
        const summary = {
            totalIssues: filteredIssues.length,
            bySeverity: {
                error: filteredIssues.filter(i => i.severity === 'error').length,
                warning: filteredIssues.filter(i => i.severity === 'warning').length,
                info: filteredIssues.filter(i => i.severity === 'info').length,
            },
            fixable: filteredIssues.filter(i => i.fixable).length,
            filesAnalyzed: filteredFiles.length,
        };
        // Calculate metrics if requested
        let metrics;
        if (params.includeMetrics !== false) {
            const totalLines = await Promise.all(filteredFiles.map(async (f) => {
                const info = await analyzeFile(f);
                return info.linesOfCode;
            }));
            metrics = {
                complexity: 0, // Will be calculated by detect_complexity
                maintainability: Math.max(0, 100 - (filteredIssues.length / filteredFiles.length) * 10),
                linesOfCode: totalLines.reduce((a, b) => a + b, 0),
            };
        }
        return {
            success: true,
            summary,
            issues: filteredIssues,
            metrics,
        };
    }
    catch (error) {
        console.error('[analyzeCodeQuality] Error:', error);
        return {
            success: false,
            summary: { totalIssues: 0, bySeverity: { error: 0, warning: 0, info: 0 }, fixable: 0, filesAnalyzed: 0 },
            issues: [],
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
export async function detectComplexity(params) {
    try {
        const files = await getFiles(params.target);
        const threshold = {
            cyclomatic: params.threshold?.cyclomatic || 10,
            cognitive: params.threshold?.cognitive || 15,
            nesting: params.threshold?.nesting || 4,
        };
        const allFunctions = [];
        for (const file of files) {
            const info = await analyzeFile(file);
            const functions = calculateComplexity(info.content, info.path);
            allFunctions.push(...functions);
        }
        const filesOverThreshold = new Set(allFunctions
            .filter(f => f.cyclomatic > threshold.cyclomatic)
            .map(f => f.file)).size;
        const summary = {
            averageComplexity: allFunctions.length > 0
                ? allFunctions.reduce((sum, f) => sum + f.cyclomatic, 0) / allFunctions.length
                : 0,
            maxComplexity: allFunctions.length > 0
                ? Math.max(...allFunctions.map(f => f.cyclomatic))
                : 0,
            filesOverThreshold,
            hotspots: allFunctions.filter(f => f.cyclomatic > threshold.cyclomatic * 1.5).length,
        };
        const hotspots = params.format === 'hotspots'
            ? allFunctions
                .filter(f => f.cyclomatic > threshold.cyclomatic * 1.5)
                .map(f => ({
                file: f.file,
                complexity: f.cyclomatic,
                impact: (f.cyclomatic > 20 ? 'high' : f.cyclomatic > 15 ? 'medium' : 'low'),
                reason: `Cyclomatic complexity of ${f.cyclomatic} exceeds threshold`,
            }))
            : undefined;
        return {
            success: true,
            summary,
            functions: allFunctions,
            hotspots,
        };
    }
    catch (error) {
        return {
            success: false,
            summary: { averageComplexity: 0, maxComplexity: 0, filesOverThreshold: 0, hotspots: 0 },
            functions: [],
        };
    }
}
export async function findCodeSmells(params) {
    try {
        const files = await getFiles(params.target);
        const allSmells = [];
        for (const file of files) {
            const info = await analyzeFile(file);
            const language = params.language || info.language;
            const smells = detectCodeSmells(info.content, info.path, language);
            allSmells.push(...smells);
        }
        // Filter by severity
        const filteredSmells = params.severity && params.severity !== 'all'
            ? allSmells.filter(s => s.severity === params.severity)
            : allSmells;
        // Filter by category
        const finalSmells = params.categories
            ? filteredSmells.filter(s => params.categories.includes(s.category))
            : filteredSmells;
        const summary = {
            totalSmells: finalSmells.length,
            bySeverity: {
                critical: finalSmells.filter(s => s.severity === 'critical').length,
                major: finalSmells.filter(s => s.severity === 'major').length,
                minor: finalSmells.filter(s => s.severity === 'minor').length,
            },
            byCategory: finalSmells.reduce((acc, s) => {
                acc[s.category] = (acc[s.category] || 0) + 1;
                return acc;
            }, {}),
        };
        return {
            success: true,
            summary,
            smells: finalSmells,
        };
    }
    catch (error) {
        return {
            success: false,
            summary: { totalSmells: 0, bySeverity: { critical: 0, major: 0, minor: 0 }, byCategory: {} },
            smells: [],
        };
    }
}
export async function trackTechnicalDebt(params) {
    try {
        const manager = new DebtManager(params.projectPath);
        switch (params.action) {
            case 'add':
                if (!params.debt)
                    throw new Error('Debt details required for add action');
                const debtId = await manager.addDebt(params.debt);
                return { success: true, debtId };
            case 'list':
                const items = await manager.listDebt(params.filters);
                return { success: true, items };
            case 'update':
                if (!params.debtId)
                    throw new Error('Debt ID required for update action');
                await manager.updateDebt(params.debtId, { status: params.status, notes: params.notes ? [params.notes] : [] });
                return { success: true };
            case 'resolve':
                if (!params.debtId)
                    throw new Error('Debt ID required for resolve action');
                await manager.resolveDebt(params.debtId, params.notes);
                return { success: true };
            case 'report':
                const report = await manager.generateReport();
                return { success: true, report };
            default:
                throw new Error(`Unknown action: ${params.action}`);
        }
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
export async function suggestImprovements(params) {
    try {
        // Run quality analysis, complexity, and smell detection
        const qualityResult = await analyzeCodeQuality({ target: params.target });
        const complexityResult = await detectComplexity({ target: params.target });
        const smellResult = await findCodeSmells({ target: params.target });
        const suggestions = [];
        // Generate suggestions from issues
        const criticalIssues = qualityResult.issues.filter(i => i.severity === 'error');
        for (const issue of criticalIssues.slice(0, 5)) {
            suggestions.push({
                id: `sug-${Date.now()}-${suggestions.length}`,
                title: `Fix ${issue.rule} error`,
                category: 'Code Quality',
                priority: 'high',
                description: issue.message,
                rationale: 'Critical error blocking code quality',
                location: {
                    file: issue.file,
                    line: issue.line,
                },
                impact: {
                    maintainability: 'High - fixes critical error',
                },
                effort: 'small',
            });
        }
        // Generate suggestions from complexity
        const complexFunctions = complexityResult.functions.filter(f => f.cyclomatic > 15);
        for (const func of complexFunctions.slice(0, 3)) {
            suggestions.push({
                id: `sug-${Date.now()}-${suggestions.length}`,
                title: `Refactor ${func.function} to reduce complexity`,
                category: 'Refactoring',
                priority: 'medium',
                description: `Function has cyclomatic complexity of ${func.cyclomatic}`,
                rationale: 'High complexity makes code hard to understand and test',
                location: {
                    file: func.file,
                    line: func.line,
                    function: func.function,
                },
                impact: {
                    maintainability: 'Medium - improves code clarity',
                    readability: 'High - easier to understand',
                },
                effort: 'medium',
            });
        }
        // Generate suggestions from smells
        const criticalSmells = smellResult.smells.filter(s => s.severity === 'critical');
        for (const smell of criticalSmells) {
            suggestions.push({
                id: `sug-${Date.now()}-${suggestions.length}`,
                title: `Address ${smell.category}`,
                category: 'Best Practices',
                priority: 'high',
                description: smell.description,
                rationale: smell.refactoringHint,
                location: {
                    file: smell.file,
                    line: smell.line,
                },
                impact: {
                    performance: smell.category.includes('Performance') ? 'High' : undefined,
                },
                effort: 'small',
            });
        }
        const limitedSuggestions = suggestions.slice(0, params.maxSuggestions || 10);
        const summary = {
            totalSuggestions: limitedSuggestions.length,
            byCategory: limitedSuggestions.reduce((acc, s) => {
                acc[s.category] = (acc[s.category] || 0) + 1;
                return acc;
            }, {}),
            estimatedImpact: (limitedSuggestions.filter(s => s.priority === 'high').length > 3 ? 'high' : 'medium'),
        };
        return {
            success: true,
            summary,
            suggestions: limitedSuggestions,
        };
    }
    catch (error) {
        return {
            success: false,
            summary: { totalSuggestions: 0, byCategory: {}, estimatedImpact: 'low' },
            suggestions: [],
        };
    }
}
export async function generateReviewReport(params) {
    try {
        // Run all analyses
        const qualityResult = await analyzeCodeQuality({ target: params.target || params.projectPath });
        const complexityResult = await detectComplexity({ target: params.target || params.projectPath });
        const smellResult = await findCodeSmells({ target: params.target || params.projectPath });
        const debtResult = await trackTechnicalDebt({ action: 'report', projectPath: params.projectPath });
        // Calculate overall score
        const issueScore = Math.max(0, 100 - qualityResult.summary.totalIssues * 2);
        const complexityScore = Math.max(0, 100 - (complexityResult.summary.averageComplexity - 5) * 10);
        const smellScore = Math.max(0, 100 - smellResult.summary.totalSmells * 3);
        const overallScore = Math.round((issueScore + complexityScore + smellScore) / 3);
        const grade = overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B' : overallScore >= 70 ? 'C' : overallScore >= 60 ? 'D' : 'F';
        const report = {
            reportPath: params.outputPath || `/tmp/code-review-${Date.now()}.md`,
            summary: {
                overallScore,
                grade,
                totalIssues: qualityResult.summary.totalIssues,
                criticalIssues: qualityResult.summary.bySeverity.error + smellResult.summary.bySeverity.critical,
                technicalDebtItems: debtResult.report?.totalDebt || 0,
                filesReviewed: qualityResult.summary.filesAnalyzed,
                linesOfCode: qualityResult.metrics?.linesOfCode || 0,
            },
            metrics: {
                maintainabilityIndex: qualityResult.metrics?.maintainability || 0,
                averageComplexity: complexityResult.summary.averageComplexity,
                duplicationRate: 0, // Simplified
            },
            topIssues: Object.entries(qualityResult.issues.reduce((acc, issue) => {
                acc[issue.file] = (acc[issue.file] || 0) + 1;
                return acc;
            }, {}))
                .map(([file, count]) => ({ file, severity: 'mixed', count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5),
            recommendations: [
                qualityResult.summary.bySeverity.error > 0 ? 'Fix all error-level issues immediately' : null,
                complexityResult.summary.hotspots > 0 ? `Refactor ${complexityResult.summary.hotspots} high-complexity hotspots` : null,
                smellResult.summary.bySeverity.critical > 0 ? 'Address critical code smells' : null,
            ].filter(Boolean),
        };
        return {
            success: true,
            report,
        };
    }
    catch (error) {
        throw error;
    }
}
//# sourceMappingURL=index.js.map