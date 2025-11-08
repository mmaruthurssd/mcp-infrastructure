import type { CoverageMetrics, UncoveredFile, CoverageRecommendation } from '../types/index.js';
/**
 * Find coverage file in standard locations
 */
export declare function findCoverageFile(projectPath: string): Promise<string | null>;
/**
 * Parse coverage JSON file (Istanbul/NYC format)
 */
export declare function parseCoverageFile(coverageFilePath: string): Promise<any>;
/**
 * Calculate overall coverage metrics
 */
export declare function calculateOverallCoverage(coverageData: any): CoverageMetrics;
/**
 * Identify uncovered files
 */
export declare function findUncoveredFiles(coverageData: any, threshold: number, excludePatterns: string[]): UncoveredFile[];
/**
 * Generate recommendations for which files to test first
 */
export declare function generateRecommendations(uncoveredFiles: UncoveredFile[]): CoverageRecommendation[];
/**
 * Format coverage metrics for display
 */
export declare function formatCoverageMetrics(metrics: CoverageMetrics): string;
//# sourceMappingURL=coverage-analyzer.d.ts.map