import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { ConfigurableWorkspaceAdapter } from '../adapters/workspace-adapter.js';
import { DocumentationHealthAnalyzer } from './documentation-health-analyzer.js';
import { HealthAnalysisResult } from './types.js';

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
    healthScore: number; // 0-100
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
export class HealthReportGenerator {
  private adapter: ConfigurableWorkspaceAdapter;
  private analyzer: DocumentationHealthAnalyzer;

  constructor(adapter: ConfigurableWorkspaceAdapter) {
    this.adapter = adapter;
    this.analyzer = new DocumentationHealthAnalyzer(adapter);
  }

  /**
   * Generate comprehensive health report
   */
  async generateReport(reportType: 'monthly' | 'quarterly'= 'quarterly'): Promise<HealthReport> {
    console.error(`[HealthReportGenerator] Generating ${reportType} health report...`);

    const workspaceRoot = this.adapter.getWorkspaceRoot();

    // Step 1: Collect current metrics
    const metrics = await this.collectMetrics();

    // Step 2: Load historical metrics for trend analysis
    const previousMetrics = await this.loadPreviousMetrics(reportType);
    const trends = this.calculateTrends(metrics, previousMetrics);

    // Step 3: Run health analysis to detect issues
    const analysisResult = await this.analyzer.analyzeHealth();

    // Step 4: Identify consolidation opportunities
    const opportunities = this.identifyConsolidationOpportunities(analysisResult);

    // Step 5: Calculate overall health score
    const healthScore = this.calculateHealthScore(metrics, analysisResult);
    const overallHealth = this.categorizeHealth(healthScore);

    // Step 6: Generate recommendations
    const recommendations = this.generateRecommendations(
      metrics,
      trends,
      opportunities,
      analysisResult
    );

    // Step 7: Identify key findings
    const keyFindings = this.identifyKeyFindings(metrics, trends, analysisResult);

    // Step 8: Save metrics for future trend analysis
    await this.saveMetrics(metrics, reportType);

    const report: HealthReport = {
      generatedAt: new Date().toISOString(),
      reportPeriod: reportType === 'monthly' ? 'Last 30 days' : 'Last 90 days',
      summary: {
        overallHealth,
        healthScore,
        keyFindings
      },
      metrics,
      trends,
      consolidationOpportunities: opportunities,
      recommendations
    };

    console.error(`[HealthReportGenerator] Report generated:`);
    console.error(`[HealthReportGenerator]   Health: ${overallHealth} (${healthScore}/100)`);
    console.error(`[HealthReportGenerator]   Opportunities: ${opportunities.length}`);
    console.error(`[HealthReportGenerator]   Recommendations: ${recommendations.length}`);

    return report;
  }

  /**
   * Generate markdown-formatted report
   */
  async generateMarkdownReport(reportType: 'monthly' | 'quarterly' = 'quarterly'): Promise<string> {
    const report = await this.generateReport(reportType);

    let markdown = `# Documentation Health Report\n\n`;
    markdown += `**Generated:** ${new Date(report.generatedAt).toLocaleString()}\n`;
    markdown += `**Period:** ${report.reportPeriod}\n\n`;

    // Summary
    markdown += `## Executive Summary\n\n`;
    markdown += `**Overall Health:** ${report.summary.overallHealth.toUpperCase()} (${report.summary.healthScore}/100)\n\n`;

    if (report.summary.keyFindings.length > 0) {
      markdown += `### Key Findings\n\n`;
      report.summary.keyFindings.forEach(finding => {
        markdown += `- ${finding}\n`;
      });
      markdown += `\n`;
    }

    // Metrics
    markdown += `## Current Metrics\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Files | ${report.metrics.totalFiles} |\n`;
    markdown += `| Total Lines | ${report.metrics.totalLines.toLocaleString()} |\n`;
    markdown += `| Average File Size | ${report.metrics.averageFileSize} lines |\n`;
    markdown += `| Redundancy Clusters | ${report.metrics.redundancyClusters} |\n`;
    markdown += `| Stale Documents | ${report.metrics.staleDocs} |\n`;
    markdown += `| Superseded Documents | ${report.metrics.supersededDocs} |\n\n`;

    // Trends
    if (report.trends.length > 0) {
      markdown += `## Trends\n\n`;
      markdown += `| Metric | Current | Previous | Change | Trend |\n`;
      markdown += `|--------|---------|----------|--------|-------|\n`;

      for (const trend of report.trends) {
        const changeStr = trend.change >= 0 ? `+${trend.change}` : `${trend.change}`;
        const percentStr = `(${trend.changePercent >= 0 ? '+' : ''}${trend.changePercent.toFixed(1)}%)`;
        const trendEmoji = trend.trend === 'increasing' ? '📈' : trend.trend === 'decreasing' ? '📉' : '➡️';

        markdown += `| ${trend.metric} | ${trend.current} | ${trend.previous} | ${changeStr} ${percentStr} | ${trendEmoji} ${trend.trend} |\n`;
      }
      markdown += `\n`;
    }

    // Consolidation Opportunities
    if (report.consolidationOpportunities.length > 0) {
      markdown += `## Consolidation Opportunities\n\n`;

      // Group by priority
      const highPriority = report.consolidationOpportunities.filter(o => o.priority === 'high');
      const mediumPriority = report.consolidationOpportunities.filter(o => o.priority === 'medium');
      const lowPriority = report.consolidationOpportunities.filter(o => o.priority === 'low');

      if (highPriority.length > 0) {
        markdown += `### High Priority\n\n`;
        highPriority.forEach((opp, i) => {
          markdown += `${i + 1}. **${opp.clusterId}**\n`;
          markdown += `   - Files: ${opp.files.length}\n`;
          markdown += `   - Est. line reduction: ${opp.estimatedLineReduction}\n`;
          markdown += `   - Suggested strategy: ${opp.suggestedStrategy}\n`;
          markdown += `   - Confidence: ${(opp.confidence * 100).toFixed(0)}%\n\n`;
        });
      }

      if (mediumPriority.length > 0) {
        markdown += `### Medium Priority\n\n`;
        mediumPriority.forEach((opp, i) => {
          markdown += `${i + 1}. **${opp.clusterId}** (${opp.files.length} files, ~${opp.estimatedLineReduction} lines)\n`;
        });
        markdown += `\n`;
      }

      if (lowPriority.length > 0) {
        markdown += `### Low Priority\n\n`;
        markdown += `${lowPriority.length} additional opportunities identified.\n\n`;
      }
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      markdown += `## Recommendations\n\n`;
      report.recommendations.forEach((rec, i) => {
        markdown += `${i + 1}. ${rec}\n`;
      });
      markdown += `\n`;
    }

    markdown += `---\n\n`;
    markdown += `*Generated by workspace-index Phase 4 Documentation Health Analyzer*\n`;

    return markdown;
  }

  /**
   * Collect current documentation metrics
   */
  private async collectMetrics(): Promise<DocumentationMetrics> {
    const workspaceRoot = this.adapter.getWorkspaceRoot();
    const mdFiles = await glob(['**/*.md'], {
      cwd: workspaceRoot,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
      absolute: true,
      nodir: true
    });

    let totalLines = 0;
    for (const file of mdFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        totalLines += content.split('\n').length;
      } catch {
        // Skip files that can't be read
      }
    }

    const analysisResult = await this.analyzer.analyzeHealth();

    return {
      totalFiles: mdFiles.length,
      totalLines,
      averageFileSize: mdFiles.length > 0 ? Math.round(totalLines / mdFiles.length) : 0,
      redundancyClusters: analysisResult.summary.redundant,
      staleDocs: analysisResult.summary.stale,
      supersededDocs: analysisResult.summary.superseded
    };
  }

  /**
   * Load previous metrics for comparison
   */
  private async loadPreviousMetrics(reportType: string): Promise<DocumentationMetrics | null> {
    try {
      const metricsPath = path.join(
        this.adapter.getWorkspaceRoot(),
        '.doc-health-metrics',
        `${reportType}-latest.json`
      );

      const content = await fs.readFile(metricsPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null; // No previous metrics
    }
  }

  /**
   * Save metrics for future trend analysis
   */
  private async saveMetrics(metrics: DocumentationMetrics, reportType: string): Promise<void> {
    try {
      const metricsDir = path.join(this.adapter.getWorkspaceRoot(), '.doc-health-metrics');
      await fs.mkdir(metricsDir, { recursive: true });

      const metricsPath = path.join(metricsDir, `${reportType}-latest.json`);
      await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2));

      // Also save with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const archivePath = path.join(metricsDir, `${reportType}-${timestamp}.json`);
      await fs.writeFile(archivePath, JSON.stringify(metrics, null, 2));
    } catch (error) {
      console.error(`[HealthReportGenerator] Failed to save metrics:`, error);
    }
  }

  /**
   * Calculate trends by comparing current and previous metrics
   */
  private calculateTrends(
    current: DocumentationMetrics,
    previous: DocumentationMetrics | null
  ): TrendData[] {
    if (!previous) {
      return []; // No previous data to compare
    }

    const trends: TrendData[] = [];

    const comparisons: Array<{
      metric: string;
      current: number;
      previous: number;
    }> = [
      { metric: 'Total Files', current: current.totalFiles, previous: previous.totalFiles },
      { metric: 'Total Lines', current: current.totalLines, previous: previous.totalLines },
      { metric: 'Redundancy Clusters', current: current.redundancyClusters, previous: previous.redundancyClusters },
      { metric: 'Stale Documents', current: current.staleDocs, previous: previous.staleDocs }
    ];

    for (const comp of comparisons) {
      const change = comp.current - comp.previous;
      const changePercent = comp.previous > 0 ? (change / comp.previous) * 100 : 0;

      let trend: TrendData['trend'];
      if (Math.abs(changePercent) < 2) {
        trend = 'stable';
      } else if (change > 0) {
        trend = 'increasing';
      } else {
        trend = 'decreasing';
      }

      trends.push({
        metric: comp.metric,
        current: comp.current,
        previous: comp.previous,
        change,
        changePercent,
        trend
      });
    }

    return trends;
  }

  /**
   * Identify consolidation opportunities from analysis results
   */
  private identifyConsolidationOpportunities(
    analysis: HealthAnalysisResult
  ): ConsolidationOpportunity[] {
    const opportunities: ConsolidationOpportunity[] = [];

    // Extract redundancy issues
    const redundancyIssues = analysis.issues.filter(issue => issue.type === 'redundant');

    for (const issue of redundancyIssues) {
      const estimatedReduction = issue.analysis.overlaps
        ? issue.analysis.overlaps.reduce((sum, o) => sum + Math.round(o.percentage * 100), 0)
        : 50; // Default estimate

      const priority =
        issue.confidence >= 0.85 ? 'high' :
        issue.confidence >= 0.70 ? 'medium' :
        'low';

      opportunities.push({
        clusterId: issue.id,
        files: issue.files,
        estimatedLineReduction: estimatedReduction,
        confidence: issue.confidence,
        priority,
        suggestedStrategy: this.suggestStrategy(issue.files.length, issue.confidence)
      });
    }

    // Sort by priority (high first) and then by estimated reduction
    opportunities.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.estimatedLineReduction - a.estimatedLineReduction;
    });

    return opportunities;
  }

  /**
   * Suggest best consolidation strategy
   */
  private suggestStrategy(fileCount: number, confidence: number): string {
    if (fileCount === 2 && confidence >= 0.85) {
      return 'merge-and-redirect';
    } else if (fileCount > 3) {
      return 'hierarchical';
    } else {
      return 'split-by-audience';
    }
  }

  /**
   * Calculate overall health score (0-100)
   */
  private calculateHealthScore(
    metrics: DocumentationMetrics,
    analysis: HealthAnalysisResult
  ): number {
    let score = 100;

    // Penalize for redundancy (up to -30 points)
    const redundancyRatio = metrics.totalFiles > 0 ? metrics.redundancyClusters / metrics.totalFiles : 0;
    score -= Math.min(30, redundancyRatio * 100);

    // Penalize for stale docs (up to -20 points)
    const staleRatio = metrics.totalFiles > 0 ? metrics.staleDocs / metrics.totalFiles : 0;
    score -= Math.min(20, staleRatio * 50);

    // Penalize for superseded docs (up to -20 points)
    const supersededRatio = metrics.totalFiles > 0 ? metrics.supersededDocs / metrics.totalFiles : 0;
    score -= Math.min(20, supersededRatio * 50);

    // Bonus for having some consolidation opportunities ready (shows proactive detection)
    if (analysis.summary.highConfidence > 0) {
      score += 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Categorize health based on score
   */
  private categorizeHealth(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    metrics: DocumentationMetrics,
    trends: TrendData[],
    opportunities: ConsolidationOpportunity[],
    analysis: HealthAnalysisResult
  ): string[] {
    const recommendations: string[] = [];

    // Recommendation based on high-priority opportunities
    const highPriorityOpps = opportunities.filter(o => o.priority === 'high');
    if (highPriorityOpps.length > 0) {
      recommendations.push(
        `Address ${highPriorityOpps.length} high-priority consolidation opportunity(ies) to reduce ~${highPriorityOpps.reduce((sum, o) => sum + o.estimatedLineReduction, 0)} lines`
      );
    }

    // Recommendation based on growth trends
    const filesGrowth = trends.find(t => t.metric === 'Total Files');
    if (filesGrowth && filesGrowth.trend === 'increasing' && filesGrowth.changePercent > 10) {
      recommendations.push(
        `Documentation files growing rapidly (${filesGrowth.changePercent.toFixed(1)}%) - consider consolidation to maintain manageability`
      );
    }

    // Recommendation based on redundancy
    if (metrics.redundancyClusters > 5) {
      recommendations.push(
        `${metrics.redundancyClusters} redundancy clusters detected - schedule consolidation sprint to reduce maintenance burden`
      );
    }

    // Recommendation based on stale docs
    if (metrics.staleDocs > 10) {
      recommendations.push(
        `${metrics.staleDocs} stale documents identified - review for archival or updates`
      );
    }

    // General maintenance recommendation
    if (recommendations.length === 0) {
      recommendations.push('Documentation health is good - continue quarterly reviews to maintain quality');
    }

    return recommendations;
  }

  /**
   * Identify key findings
   */
  private identifyKeyFindings(
    metrics: DocumentationMetrics,
    trends: TrendData[],
    analysis: HealthAnalysisResult
  ): string[] {
    const findings: string[] = [];

    // Significant growth
    const linesGrowth = trends.find(t => t.metric === 'Total Lines');
    if (linesGrowth && Math.abs(linesGrowth.changePercent) > 15) {
      findings.push(
        `Documentation ${linesGrowth.trend === 'increasing' ? 'grew' : 'reduced'} by ${Math.abs(linesGrowth.changePercent).toFixed(1)}% (${Math.abs(linesGrowth.change).toLocaleString()} lines)`
      );
    }

    // High confidence issues
    if (analysis.summary.highConfidence > 0) {
      findings.push(
        `${analysis.summary.highConfidence} issue(s) detected with high confidence (>85%) - ready for autonomous resolution`
      );
    }

    // Redundancy concerns
    const redundancyRatio = metrics.totalFiles > 0 ? (metrics.redundancyClusters / metrics.totalFiles) * 100 : 0;
    if (redundancyRatio > 10) {
      findings.push(
        `${redundancyRatio.toFixed(1)}% of files are in redundancy clusters - consolidation recommended`
      );
    }

    return findings;
  }
}
