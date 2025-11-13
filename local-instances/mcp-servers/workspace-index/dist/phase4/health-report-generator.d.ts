import { ConfigurableWorkspaceAdapter } from '../adapters/workspace-adapter.js';
/**
 * Documentation metrics for a specific time period
 */
export interface DocumentationMetrics {
    totalFiles: number;
    totalLines: number;
    averageFileSize: number;
    redundancyClusters: number;
    staleDocs: number;
    supersededDocs: number;
}
/**
 * Trend data showing change over time
 */
export interface TrendData {
    metric: string;
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    trend: 'increasing' | 'decreasing' | 'stable';
}
/**
 * Consolidation opportunity
 */
export interface ConsolidationOpportunity {
    clusterId: string;
    files: string[];
    estimatedLineReduction: number;
    confidence: number;
    priority: 'high' | 'medium' | 'low';
    suggestedStrategy: string;
}
/**
 * Health report
 */
export interface HealthReport {
    generatedAt: string;
    reportPeriod: string;
    summary: {
        overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
        healthScore: number;
        keyFindings: string[];
    };
    metrics: DocumentationMetrics;
    trends: TrendData[];
    consolidationOpportunities: ConsolidationOpportunity[];
    recommendations: string[];
}
/**
 * HealthReportGenerator - Generate quarterly documentation health reports
 *
 * Features:
 * - Scan all documentation and collect metrics
 * - Track metrics over time to identify trends
 * - Detect consolidation opportunities
 * - Calculate documentation vs code growth rate
 * - Generate actionable recommendations
 */
export declare class HealthReportGenerator {
    private adapter;
    private analyzer;
    constructor(adapter: ConfigurableWorkspaceAdapter);
    /**
     * Generate comprehensive health report
     */
    generateReport(reportType?: 'monthly' | 'quarterly'): Promise<HealthReport>;
    /**
     * Generate markdown-formatted report
     */
    generateMarkdownReport(reportType?: 'monthly' | 'quarterly'): Promise<string>;
    /**
     * Collect current documentation metrics
     */
    private collectMetrics;
    /**
     * Load previous metrics for comparison
     */
    private loadPreviousMetrics;
    /**
     * Save metrics for future trend analysis
     */
    private saveMetrics;
    /**
     * Calculate trends by comparing current and previous metrics
     */
    private calculateTrends;
    /**
     * Identify consolidation opportunities from analysis results
     */
    private identifyConsolidationOpportunities;
    /**
     * Suggest best consolidation strategy
     */
    private suggestStrategy;
    /**
     * Calculate overall health score (0-100)
     */
    private calculateHealthScore;
    /**
     * Categorize health based on score
     */
    private categorizeHealth;
    /**
     * Generate actionable recommendations
     */
    private generateRecommendations;
    /**
     * Identify key findings
     */
    private identifyKeyFindings;
}
