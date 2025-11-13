import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { ConfigurableWorkspaceAdapter } from '../adapters/workspace-adapter.js';
import {
  DocumentationIssue,
  HealthAnalysisResult,
  IssueType,
  Evidence,
  ConfidenceFactors,
  OverlapAnalysis,
  SeverityLevel
} from './types.js';
import { EnhancedRedundancyDetector, DocumentationPatternConfig } from './enhanced-redundancy-detector.js';

/**
 * Phase 4: Documentation Health Analyzer
 *
 * Detects superseded, redundant, and stale documentation with confidence-based scoring.
 */
export class DocumentationHealthAnalyzer {
  private adapter: ConfigurableWorkspaceAdapter;
  private config: any;

  constructor(adapter: ConfigurableWorkspaceAdapter) {
    this.adapter = adapter;
    this.config = adapter.getConfig();
  }

  /**
   * Analyze workspace documentation health
   */
  async analyzeHealth(): Promise<HealthAnalysisResult> {
    const startTime = Date.now();
    const issues: DocumentationIssue[] = [];

    // Find all markdown files
    const workspaceRoot = this.adapter.getWorkspaceRoot();
    const mdFiles = await this.findMarkdownFiles(workspaceRoot);

    console.error(`[HealthAnalyzer] Scanning ${mdFiles.length} markdown files...`);

    // Detect issues for each file
    for (const file of mdFiles) {
      // Skip critical docs
      if (this.adapter.isCriticalDoc(file)) {
        console.error(`[HealthAnalyzer] Skipping critical doc: ${file}`);
        continue;
      }

      const relativePath = this.adapter.getRelativePath(file);

      // Check for supersession
      const supersessionIssues = await this.detectSupersession(file, relativePath);
      issues.push(...supersessionIssues);

      // Check for staleness
      if (!this.adapter.isStalenessExempt(file)) {
        const stalenessIssue = await this.detectStaleness(file, relativePath);
        if (stalenessIssue) {
          issues.push(stalenessIssue);
        }
      }
    }

    // Check for redundancy (requires comparing multiple files)
    const redundancyIssues = await this.detectRedundancy(mdFiles);
    issues.push(...redundancyIssues);

    const elapsed = Date.now() - startTime;
    console.error(`[HealthAnalyzer] Analysis complete in ${elapsed}ms. Found ${issues.length} issues.`);

    // Build summary
    const summary = this.buildSummary(issues);

    // Generate recommendations
    const recommendations = this.generateRecommendations(issues, summary);

    return {
      scannedFiles: mdFiles.length,
      issuesDetected: issues.length,
      summary,
      issues,
      recommendations,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Find all markdown files in workspace
   */
  private async findMarkdownFiles(workspaceRoot: string): Promise<string[]> {
    const patterns = ['**/*.md'];
    const ignore = [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
      '**/.telemetry/**'
    ];

    try {
      const files = await glob(patterns, {
        cwd: workspaceRoot,
        ignore,
        absolute: true,
        nodir: true
      });
      return files;
    } catch (error) {
      console.error(`[HealthAnalyzer] Error finding markdown files:`, error);
      return [];
    }
  }

  /**
   * Detect if a document has been superseded
   */
  private async detectSupersession(
    filePath: string,
    relativePath: string
  ): Promise<DocumentationIssue[]> {
    const issues: DocumentationIssue[] = [];

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const evidence: Evidence[] = [];

      // Check for supersession keywords
      const keywords = this.config.detection_patterns.supersession_keywords;
      for (const keyword of keywords) {
        const regex = new RegExp(keyword, 'gi');
        const matches = content.match(regex);
        if (matches) {
          evidence.push({
            type: 'keyword',
            description: `Found supersession keyword: "${keyword}"`,
            location: `${relativePath}`,
            weight: 0.9
          });
        }
      }

      // Check if a framework has replaced this doc
      const frameworkMatch = await this.findSupersedingFramework(filePath, content);
      if (frameworkMatch) {
        evidence.push({
          type: 'framework_match',
          description: `Superseded by framework: ${frameworkMatch.frameworkPath}`,
          location: frameworkMatch.frameworkPath,
          weight: 0.85
        });
      }

      // Check for cross-references to newer docs
      const newerDocRefs = await this.findNewerDocumentReferences(filePath, content);
      if (newerDocRefs.length > 0) {
        evidence.push({
          type: 'cross_reference',
          description: `References to newer documentation found`,
          location: newerDocRefs.join(', '),
          weight: 0.75
        });
      }

      // If we have evidence, create an issue
      if (evidence.length > 0) {
        const confidenceFactors = this.calculateConfidence(
          'superseded',
          evidence,
          frameworkMatch ? 0.9 : 0.8, // complexity penalty
          1.0, // reversibility (archiving is fully reversible)
          frameworkMatch ? 0.95 : 0.7 // context clarity
        );

        const confidence = this.aggregateConfidence(confidenceFactors);

        issues.push({
          id: this.generateIssueId('superseded', relativePath),
          type: 'superseded',
          confidence,
          confidenceFactors,
          severity: confidence >= 0.85 ? 'critical' : 'warning',
          files: [relativePath],
          analysis: {
            reason: 'Document appears to have been superseded',
            evidence,
            supersededBy: frameworkMatch?.frameworkPath || newerDocRefs[0]
          },
          recommendedAction: {
            operation: 'archive',
            description: 'Archive superseded documentation and create replacement',
            steps: [
              `Archive ${relativePath} to archive/`,
              frameworkMatch
                ? `Create replacement pointing to ${frameworkMatch.frameworkPath}`
                : 'Create minimal replacement doc',
              'Update cross-references in other docs'
            ],
            requiresApproval: confidence < this.config.thresholds.auto_execute
          },
          detectedAt: new Date().toISOString(),
          firstTimePattern: await this.isFirstTimePattern('superseded')
        });
      }
    } catch (error) {
      console.error(`[HealthAnalyzer] Error analyzing ${relativePath}:`, error);
    }

    return issues;
  }

  /**
   * Detect redundant documentation (multiple docs with high overlap)
   * Enhanced version with cross-directory comparison and pattern-based clustering
   */
  private async detectRedundancy(files: string[]): Promise<DocumentationIssue[]> {
    // Get documentation patterns from config (or use defaults)
    const patterns: DocumentationPatternConfig = this.config.documentation_patterns || {
      'workspace-architecture-family': {
        patterns: ['**/WORKSPACE*.md', '**/workspace*.md'],
        minOverlap: 0.35,
        description: 'WORKSPACE_GUIDE.md, WORKSPACE_ARCHITECTURE.md, and similar workspace overview docs'
      },
      'mcp-documentation-sprawl': {
        patterns: ['**/MCP*.md', '**/mcp*.md'],
        minOverlap: 0.40,
        description: 'MCP configuration, setup, and usage documentation'
      },
      'setup-guide-redundancy': {
        patterns: ['**/SETUP*.md', '**/INSTALL*.md', '**/setup*.md', '**/install*.md'],
        minOverlap: 0.45,
        description: 'Setup, installation, and onboarding documentation'
      },
      'configuration-guide-overlap': {
        patterns: ['**/CONFIG*.md', '**/config*.md', '**/CONFIGURATION*.md'],
        minOverlap: 0.40,
        description: 'Configuration guides and reference documentation'
      }
    };

    const patternCount = Object.keys(patterns).length;
    console.error(`[HealthAnalyzer] Running enhanced redundancy detection with ${patternCount} patterns...`);

    // Create enhanced detector
    const detector = new EnhancedRedundancyDetector(this.adapter, patterns);

    // Detect cross-directory redundancy with pattern-based clustering
    // The enhanced detector returns DocumentationIssue[] directly
    const issues = await detector.detectCrossDirectoryRedundancy(files);

    console.error(`[HealthAnalyzer] Found ${issues.length} redundancy issues`);

    return issues;
  }

  /**
   * Detect stale documentation (old and unreferenced)
   */
  private async detectStaleness(
    filePath: string,
    relativePath: string
  ): Promise<DocumentationIssue | null> {
    try {
      const stats = await fs.stat(filePath);
      const ageMonths = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24 * 30);
      const stalenessThreshold = this.config.detection_patterns.staleness_months;

      if (ageMonths < stalenessThreshold) {
        return null; // Not old enough
      }

      // Check if file is referenced by other docs
      const references = await this.findReferences(filePath);

      if (references.length > 0) {
        return null; // Still referenced, not stale
      }

      const evidence: Evidence[] = [
        {
          type: 'age',
          description: `File is ${ageMonths.toFixed(1)} months old`,
          location: relativePath,
          weight: Math.min(ageMonths / 24, 0.8) // Cap at 0.8
        },
        {
          type: 'pattern',
          description: 'No references from other documentation',
          weight: 0.6
        }
      ];

      const confidenceFactors = this.calculateConfidence(
        'stale',
        evidence,
        0.7, // complexity penalty
        0.9, // reversibility
        0.4 // context clarity (unclear what replaces it)
      );

      const confidence = this.aggregateConfidence(confidenceFactors);

      return {
        id: this.generateIssueId('stale', relativePath),
        type: 'stale',
        confidence,
        confidenceFactors,
        severity: 'info',
        files: [relativePath],
        analysis: {
          reason: `Document is ${ageMonths.toFixed(1)} months old with no references`,
          evidence
        },
        recommendedAction: {
          operation: 'archive',
          description: 'Consider archiving stale documentation',
          steps: [
            'Review document for current relevance',
            'Check if content is duplicated elsewhere',
            'Archive if truly obsolete'
          ],
          requiresApproval: true // Always require approval for staleness
        },
        detectedAt: new Date().toISOString(),
        firstTimePattern: await this.isFirstTimePattern('stale')
      };
    } catch (error) {
      console.error(`[HealthAnalyzer] Error checking staleness for ${relativePath}:`, error);
      return null;
    }
  }

  /**
   * Find framework that may have superseded this doc
   */
  private async findSupersedingFramework(
    filePath: string,
    content: string
  ): Promise<{ frameworkPath: string; confidence: number } | null> {
    const frameworks = this.adapter.getFrameworkPaths();

    for (const framework of frameworks) {
      const frameworkName = path.basename(framework);
      // Check if content mentions this framework
      const regex = new RegExp(frameworkName.replace(/-/g, '[-\\s]'), 'gi');
      if (regex.test(content)) {
        // Check if framework README exists
        const frameworkReadme = path.join(
          this.adapter.getWorkspaceRoot(),
          framework,
          'README.md'
        );
        try {
          await fs.access(frameworkReadme);
          return {
            frameworkPath: path.join(framework, 'README.md'),
            confidence: 0.85
          };
        } catch {
          // Framework exists but no README
        }
      }
    }

    return null;
  }

  /**
   * Find references to newer documentation
   */
  private async findNewerDocumentReferences(
    filePath: string,
    content: string
  ): Promise<string[]> {
    const references: string[] = [];

    // Look for markdown links: [text](path)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const linkedPath = match[2];
      // Check if it's a relative path to another markdown file
      if (linkedPath.endsWith('.md') && !linkedPath.startsWith('http')) {
        const absolutePath = path.resolve(path.dirname(filePath), linkedPath);
        try {
          const stats = await fs.stat(absolutePath);
          const fileStats = await fs.stat(filePath);
          // If linked doc is newer, it might have superseded this one
          if (stats.mtime > fileStats.mtime) {
            references.push(this.adapter.getRelativePath(absolutePath));
          }
        } catch {
          // Linked file doesn't exist
        }
      }
    }

    return references;
  }

  /**
   * Find references to this file from other docs
   */
  private async findReferences(filePath: string): Promise<string[]> {
    const references: string[] = [];
    const relativePath = this.adapter.getRelativePath(filePath);
    const basename = path.basename(filePath);

    // Search all markdown files for references
    const workspaceRoot = this.adapter.getWorkspaceRoot();
    const allMdFiles = await this.findMarkdownFiles(workspaceRoot);

    for (const otherFile of allMdFiles) {
      if (otherFile === filePath) continue;

      try {
        const content = await fs.readFile(otherFile, 'utf-8');
        // Check for references to this file
        if (content.includes(relativePath) || content.includes(basename)) {
          references.push(this.adapter.getRelativePath(otherFile));
        }
      } catch {
        // Error reading file
      }
    }

    return references;
  }

  /**
   * Calculate content overlap between two files
   */
  private async calculateOverlap(
    file1: string,
    file2: string
  ): Promise<{ percentage: number; similarSections?: any[] }> {
    try {
      const content1 = await fs.readFile(file1, 'utf-8');
      const content2 = await fs.readFile(file2, 'utf-8');

      // Simple word-based overlap calculation
      const words1 = new Set(content1.toLowerCase().split(/\s+/));
      const words2 = new Set(content2.toLowerCase().split(/\s+/));

      const intersection = new Set([...words1].filter(w => words2.has(w)));
      const union = new Set([...words1, ...words2]);

      const percentage = intersection.size / union.size;

      return { percentage };
    } catch (error) {
      return { percentage: 0 };
    }
  }

  /**
   * Calculate confidence factors for an issue
   */
  private calculateConfidence(
    issueType: IssueType,
    evidence: Evidence[],
    complexityPenalty: number,
    reversibility: number,
    contextClarity: number
  ): ConfidenceFactors {
    // Calculate pattern match from evidence weights
    const patternMatch = evidence.length > 0
      ? evidence.reduce((sum, e) => sum + e.weight, 0) / evidence.length
      : 0;

    // Historical success (placeholder - would be learned from workspace-brain)
    const historicalSuccess = 0.75; // Default to reasonable baseline

    return {
      patternMatch,
      historicalSuccess,
      complexityPenalty,
      reversibility,
      contextClarity
    };
  }

  /**
   * Aggregate confidence factors into final score
   */
  private aggregateConfidence(factors: ConfidenceFactors): number {
    const weights = this.config.confidence_weights;

    const score =
      factors.patternMatch * weights.patternMatch +
      factors.historicalSuccess * weights.historicalSuccess +
      factors.complexityPenalty * weights.complexityPenalty +
      factors.reversibility * weights.reversibility +
      factors.contextClarity * weights.contextClarity;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Check if this is a first-time pattern
   */
  private async isFirstTimePattern(issueType: IssueType): Promise<boolean> {
    // Placeholder - would check workspace-brain for historical patterns
    // For now, treat all as first-time in new workspace
    const telemetryPath = path.join(this.adapter.getWorkspaceRoot(), '.telemetry');
    try {
      await fs.access(telemetryPath);
      // Telemetry exists, assume we've seen patterns before
      return false;
    } catch {
      // No telemetry, treat as first-time
      return true;
    }
  }

  /**
   * Generate unique issue ID
   */
  private generateIssueId(type: string, path: string): string {
    const hash = path.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0) | 0;
    }, 0);
    return `${type}-${Math.abs(hash).toString(36)}`;
  }

  /**
   * Build summary from issues
   */
  private buildSummary(issues: DocumentationIssue[]) {
    const autoExecuteThreshold = this.config.thresholds.auto_execute;

    return {
      totalIssues: issues.length,
      superseded: issues.filter(i => i.type === 'superseded').length,
      redundant: issues.filter(i => i.type === 'redundant').length,
      stale: issues.filter(i => i.type === 'stale').length,
      missing: issues.filter(i => i.type === 'missing').length,
      highConfidence: issues.filter(i => i.confidence >= autoExecuteThreshold).length,
      mediumConfidence: issues.filter(
        i => i.confidence >= 0.70 && i.confidence < autoExecuteThreshold
      ).length,
      lowConfidence: issues.filter(i => i.confidence < 0.70).length,
      autoExecutable: issues.filter(
        i => i.confidence >= autoExecuteThreshold && !i.firstTimePattern
      ).length,
      requiresApproval: issues.filter(
        i => i.confidence < autoExecuteThreshold || i.firstTimePattern
      ).length
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    issues: DocumentationIssue[],
    summary: any
  ): string[] {
    const recommendations: string[] = [];

    if (summary.totalIssues === 0) {
      recommendations.push('Documentation health looks good! No issues detected.');
      return recommendations;
    }

    if (summary.autoExecutable > 0) {
      recommendations.push(
        `${summary.autoExecutable} high-confidence issue(s) can be auto-resolved. ` +
        `Consider running execute_documentation_operation() for these.`
      );
    }

    if (summary.superseded > 0) {
      recommendations.push(
        `Found ${summary.superseded} superseded document(s). Review and archive if appropriate.`
      );
    }

    if (summary.redundant > 0) {
      recommendations.push(
        `Found ${summary.redundant} redundant document(s). Consider consolidating to reduce maintenance.`
      );
    }

    if (summary.stale > 0) {
      recommendations.push(
        `Found ${summary.stale} stale document(s). Review for current relevance.`
      );
    }

    return recommendations;
  }
}
