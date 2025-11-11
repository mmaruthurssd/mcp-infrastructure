import { validateCoverageParams } from '../utils/validation-utils.js';
import { findCoverageFile, parseCoverageFile, calculateOverallCoverage, findUncoveredFiles, generateRecommendations, } from '../generators/coverage-analyzer.js';
/**
 * MCP Tool: analyze_coverage_gaps
 * Analyze test coverage gaps and identify files needing tests
 */
export async function analyzeCoverageGaps(params) {
    try {
        // Validate parameters
        const validation = await validateCoverageParams(params);
        if (!validation.valid) {
            return {
                success: false,
                overallCoverage: { statements: 0, branches: 0, functions: 0, lines: 0 },
                uncoveredFiles: [],
                recommendations: [],
                meetsThreshold: false,
                error: validation.error,
            };
        }
        // Find coverage file
        const coverageFilePath = params.coverageFile || (await findCoverageFile(params.projectPath));
        if (!coverageFilePath) {
            return {
                success: false,
                overallCoverage: { statements: 0, branches: 0, functions: 0, lines: 0 },
                uncoveredFiles: [],
                recommendations: [],
                meetsThreshold: false,
                error: 'No coverage file found. Run tests with --coverage first.',
            };
        }
        // Parse coverage data
        const coverageData = await parseCoverageFile(coverageFilePath);
        // Calculate overall coverage
        const overallCoverage = calculateOverallCoverage(coverageData);
        // Set defaults
        const threshold = params.threshold ?? 80;
        const excludePatterns = params.excludePatterns ?? ['node_modules', 'dist', 'build', '*.test.ts', '*.spec.ts'];
        // Find uncovered files
        const uncoveredFiles = findUncoveredFiles(coverageData, threshold, excludePatterns);
        // Generate recommendations
        const recommendations = generateRecommendations(uncoveredFiles);
        // Check if meets threshold
        const meetsThreshold = overallCoverage.statements >= threshold &&
            overallCoverage.branches >= threshold &&
            overallCoverage.functions >= threshold &&
            overallCoverage.lines >= threshold;
        return {
            success: true,
            overallCoverage,
            uncoveredFiles,
            recommendations,
            meetsThreshold,
        };
    }
    catch (error) {
        return {
            success: false,
            overallCoverage: { statements: 0, branches: 0, functions: 0, lines: 0 },
            uncoveredFiles: [],
            recommendations: [],
            meetsThreshold: false,
            error: `Unexpected error: ${error.message}`,
        };
    }
}
//# sourceMappingURL=analyze-coverage-gaps.js.map