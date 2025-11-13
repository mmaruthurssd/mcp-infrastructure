import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigurableWorkspaceAdapter } from '../adapters/workspace-adapter.js';
import {
  DocumentationIssue,
  Evidence,
  OverlapAnalysis,
  ConfidenceFactors
} from './types.js';

/**
 * Enhanced redundancy detector with cross-directory comparison and pattern-based clustering
 *
 * Enhancements over original:
 * 1. Cross-directory comparison (not just same directory)
 * 2. Pattern-based clustering (workspace-architecture-family, etc.)
 * 3. Section-level overlap identification
 * 4. Configurable similarity thresholds
 */
export class EnhancedRedundancyDetector {
  private adapter: ConfigurableWorkspaceAdapter;
  private config: any;
  private patterns: DocumentationPatternConfig;

  constructor(adapter: ConfigurableWorkspaceAdapter, patterns: DocumentationPatternConfig) {
    this.adapter = adapter;
    this.config = adapter.getConfig();
    this.patterns = patterns;
  }

  /**
   * Detect redundancy across ALL files (cross-directory)
   */
  async detectCrossDirectoryRedundancy(files: string[]): Promise<DocumentationIssue[]> {
    const issues: DocumentationIssue[] = [];
    const threshold = this.config.detection_patterns?.redundancy_threshold || 0.35;

    console.error(`[EnhancedRedundancy] Scanning ${files.length} files for cross-directory overlap (threshold: ${threshold})...`);

    // First, try pattern-based clustering
    const clusterIssues = await this.detectPatternBasedClusters(files, threshold);
    issues.push(...clusterIssues);

    // Then, do pairwise comparison for files not in clusters
    const filesInClusters = new Set(
      clusterIssues.flatMap(issue => issue.files)
    );

    const remainingFiles = files.filter(f =>
      !filesInClusters.has(this.adapter.getRelativePath(f)) &&
      !this.adapter.isCriticalDoc(f)
    );

    const pairwiseIssues = await this.detectPairwiseRedundancy(remainingFiles, threshold);
    issues.push(...pairwiseIssues);

    console.error(`[EnhancedRedundancy] Found ${issues.length} redundancy clusters`);

    return issues;
  }

  /**
   * Detect redundancy using configured patterns (e.g., workspace-architecture-family)
   */
  private async detectPatternBasedClusters(
    allFiles: string[],
    threshold: number
  ): Promise<DocumentationIssue[]> {
    const issues: DocumentationIssue[] = [];

    for (const [patternName, patternConfig] of Object.entries(this.patterns)) {
      const matchingFiles = this.findMatchingFiles(allFiles, patternConfig.patterns);

      if (matchingFiles.length < 2) {
        continue; // Need at least 2 files for redundancy
      }

      console.error(`[EnhancedRedundancy] Pattern "${patternName}": ${matchingFiles.length} files`);

      // Calculate pairwise overlaps within this cluster
      const overlaps: OverlapAnalysis[] = [];
      const overlapMatrix: Map<string, Map<string, number>> = new Map();

      for (let i = 0; i < matchingFiles.length - 1; i++) {
        for (let j = i + 1; j < matchingFiles.length; j++) {
          const overlap = await this.calculateDetailedOverlap(matchingFiles[i], matchingFiles[j]);

          if (overlap.percentage >= threshold) {
            overlaps.push({
              file: this.adapter.getRelativePath(matchingFiles[j]),
              percentage: overlap.percentage,
              similarSections: overlap.similarSections
            });

            // Store in matrix for analysis
            const file1 = this.adapter.getRelativePath(matchingFiles[i]);
            const file2 = this.adapter.getRelativePath(matchingFiles[j]);

            if (!overlapMatrix.has(file1)) {
              overlapMatrix.set(file1, new Map());
            }
            overlapMatrix.get(file1)!.set(file2, overlap.percentage);
          }
        }
      }

      if (overlaps.length > 0) {
        const relativePaths = matchingFiles.map(f => this.adapter.getRelativePath(f));
        const avgOverlap = overlaps.reduce((sum, o) => sum + o.percentage, 0) / overlaps.length;

        // Identify the most comprehensive doc (highest total overlap with others)
        const primaryDoc = this.identifyPrimaryDocument(overlapMatrix, relativePaths);

        const confidenceFactors = this.calculateConfidence(
          'redundant',
          [
            {
              type: 'pattern',
              description: `Pattern "${patternName}": ${matchingFiles.length} files with ${(avgOverlap * 100).toFixed(0)}% average overlap`,
              location: patternName,
              weight: 0.9 // High weight for pattern-based detection
            },
            {
              type: 'overlap',
              description: `${overlaps.length} overlapping file pairs detected`,
              location: patternName,
              weight: avgOverlap
            }
          ],
          0.70, // complexity (pattern-based is less complex than ad-hoc)
          0.85, // reversibility
          0.80  // context clarity (pattern gives context)
        );

        const confidence = this.aggregateConfidence(confidenceFactors);

        issues.push({
          id: this.generateIssueId('redundant', `pattern-${patternName}`),
          type: 'redundant',
          confidence,
          confidenceFactors,
          severity: confidence >= 0.85 ? 'critical' : 'warning',
          files: relativePaths,
          analysis: {
            reason: `Documentation pattern "${patternName}" has significant redundancy`,
            evidence: [
              {
                type: 'pattern',
                description: `Pattern: ${patternName}`,
                location: patternConfig.description || patternName,
                weight: 0.9
              },
              {
                type: 'overlap',
                description: `${overlaps.length} overlapping file pairs`,
                location: 'cross-file analysis',
                weight: avgOverlap
              }
            ],
            overlaps,
            consolidationTarget: primaryDoc
          },
          recommendedAction: {
            operation: 'consolidate',
            description: `Consolidate ${patternName} documentation using ${patternConfig.suggested_strategy || 'hierarchical'} strategy`,
            steps: this.generateConsolidationSteps(
              patternConfig.suggested_strategy || 'hierarchical',
              primaryDoc,
              relativePaths
            ),
            requiresApproval: confidence < (this.config.thresholds?.auto_execute || 0.85)
          },
          detectedAt: new Date().toISOString(),
          firstTimePattern: await this.isFirstTimePattern(`redundant-${patternName}`)
        });
      }
    }

    return issues;
  }

  /**
   * Detect redundancy via pairwise comparison (for files not in patterns)
   */
  private async detectPairwiseRedundancy(
    files: string[],
    threshold: number
  ): Promise<DocumentationIssue[]> {
    const issues: DocumentationIssue[] = [];
    const processedPairs = new Set<string>();

    for (let i = 0; i < files.length - 1; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const file1 = files[i];
        const file2 = files[j];
        const pairKey = [file1, file2].sort().join('::');

        if (processedPairs.has(pairKey)) {
          continue;
        }
        processedPairs.add(pairKey);

        const overlap = await this.calculateDetailedOverlap(file1, file2);

        if (overlap.percentage >= threshold) {
          const relativePaths = [file1, file2].map(f => this.adapter.getRelativePath(f));

          const confidenceFactors = this.calculateConfidence(
            'redundant',
            [
              {
                type: 'overlap',
                description: `${(overlap.percentage * 100).toFixed(0)}% content overlap detected`,
                location: 'pairwise comparison',
                weight: overlap.percentage
              }
            ],
            0.65, // complexity (pairwise is more complex - no pattern context)
            0.80, // reversibility
            0.70  // context clarity (less clear without pattern)
          );

          const confidence = this.aggregateConfidence(confidenceFactors);

          issues.push({
            id: this.generateIssueId('redundant', relativePaths.join('+')),
            type: 'redundant',
            confidence,
            confidenceFactors,
            severity: 'warning',
            files: relativePaths,
            analysis: {
              reason: 'Significant content overlap detected between unrelated files',
              evidence: [
                {
                  type: 'overlap',
                  description: `${(overlap.percentage * 100).toFixed(0)}% overlap`,
                  location: 'content comparison',
                  weight: overlap.percentage
                }
              ],
              overlaps: [
                {
                  file: relativePaths[1],
                  percentage: overlap.percentage,
                  similarSections: overlap.similarSections
                }
              ],
              consolidationTarget: relativePaths[0] // First file as primary
            },
            recommendedAction: {
              operation: 'consolidate',
              description: 'Consolidate redundant documentation',
              steps: this.generateConsolidationSteps('hierarchical', relativePaths[0], relativePaths),
              requiresApproval: true // Always require approval for pairwise (no pattern context)
            },
            detectedAt: new Date().toISOString(),
            firstTimePattern: await this.isFirstTimePattern('redundant-pairwise')
          });
        }
      }
    }

    return issues;
  }

  /**
   * Calculate detailed overlap including section-level analysis
   */
  private async calculateDetailedOverlap(
    file1: string,
    file2: string
  ): Promise<{ percentage: number; similarSections: Array<{ section1: string; section2: string; similarity: number }> }> {
    try {
      const content1Raw = await fs.readFile(file1, 'utf-8');
      const content2Raw = await fs.readFile(file2, 'utf-8');
      const content1 = this.normalizeContent(content1Raw);
      const content2 = this.normalizeContent(content2Raw);

      // Extract sections (markdown headers)
      const sections1 = this.extractSections(content1Raw);
      const sections2 = this.extractSections(content2Raw);

      // Find similar sections by header name and content
      const similarSections: Array<{ section1: string; section2: string; similarity: number }> = [];
      for (const [header1, sectionContent1] of sections1.entries()) {
        for (const [header2, sectionContent2] of sections2.entries()) {
          // Similar header names (case-insensitive, normalized)
          const normalizedHeader1 = this.normalizeHeader(header1);
          const normalizedHeader2 = this.normalizeHeader(header2);

          if (normalizedHeader1 === normalizedHeader2 ||
              this.calculateStringSimilarity(normalizedHeader1, normalizedHeader2) > 0.8) {
            // Check content similarity
            const contentSimilarity = this.calculateStringSimilarity(sectionContent1, sectionContent2);
            if (contentSimilarity > 0.6) {
              similarSections.push({
                section1: header1,
                section2: header2,
                similarity: contentSimilarity
              });
            }
          }
        }
      }

      // Calculate overall percentage using Jaccard similarity on words
      const words1 = new Set(content1.toLowerCase().split(/\s+/));
      const words2 = new Set(content2.toLowerCase().split(/\s+/));

      const intersection = new Set([...words1].filter(word => words2.has(word)));
      const union = new Set([...words1, ...words2]);

      const percentage = union.size > 0 ? intersection.size / union.size : 0;

      return {
        percentage,
        similarSections
      };
    } catch (error) {
      console.error(`[EnhancedRedundancy] Error calculating overlap:`, error);
      return { percentage: 0, similarSections: [] };
    }
  }

  /**
   * Normalize content for comparison (remove boilerplate, code blocks, etc.)
   */
  private normalizeContent(content: string): string {
    return content
      // Remove YAML frontmatter
      .replace(/^---\n[\s\S]*?\n---\n/m, '')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`[^`]+`/g, '')
      // Remove links
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Remove images
      .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract sections from markdown content
   */
  private extractSections(content: string): Map<string, string> {
    const sections = new Map<string, string>();
    const lines = content.split('\n');
    let currentHeader = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        // Save previous section
        if (currentHeader) {
          sections.set(currentHeader, currentContent.join('\n'));
        }
        // Start new section
        currentHeader = headerMatch[2];
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentHeader) {
      sections.set(currentHeader, currentContent.join('\n'));
    }

    return sections;
  }

  /**
   * Normalize header for comparison
   */
  private normalizeHeader(header: string): string {
    return header
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }

  /**
   * Calculate string similarity using Levenshtein distance ratio
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Find files matching a pattern configuration
   */
  private findMatchingFiles(allFiles: string[], patterns: string[]): string[] {
    const matching: string[] = [];

    for (const file of allFiles) {
      const relativePath = this.adapter.getRelativePath(file);
      const basename = path.basename(file);

      for (const pattern of patterns) {
        // Support wildcards and exact matches
        const regex = new RegExp(
          pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.')
        );

        if (regex.test(relativePath) || regex.test(basename)) {
          matching.push(file);
          break;
        }
      }
    }

    return matching;
  }

  /**
   * Identify the most comprehensive document in a cluster
   */
  private identifyPrimaryDocument(
    overlapMatrix: Map<string, Map<string, number>>,
    allFiles: string[]
  ): string {
    let maxScore = -1;
    let primaryDoc = allFiles[0];

    for (const file of allFiles) {
      // Score = sum of overlap percentages with all other files
      let score = 0;
      const overlaps = overlapMatrix.get(file);

      if (overlaps) {
        for (const overlapPct of overlaps.values()) {
          score += overlapPct;
        }
      }

      if (score > maxScore) {
        maxScore = score;
        primaryDoc = file;
      }
    }

    return primaryDoc;
  }

  /**
   * Generate consolidation steps based on strategy
   */
  private generateConsolidationSteps(
    strategy: string,
    primaryDoc: string,
    allDocs: string[]
  ): string[] {
    const secondaryDocs = allDocs.filter(d => d !== primaryDoc);

    switch (strategy) {
      case 'hierarchical':
        return [
          `Backup all files: ${allDocs.join(', ')}`,
          `Identify unique content in: ${secondaryDocs.join(', ')}`,
          `Keep ${primaryDoc} as primary comprehensive doc`,
          `Remove redundant sections from: ${secondaryDocs.join(', ')}`,
          `Add reference links to ${primaryDoc}`,
          'Validate all cross-references',
          'Archive original versions'
        ];

      case 'split-by-audience':
        return [
          `Backup all files: ${allDocs.join(', ')}`,
          'Identify audience for each file (technical vs non-technical)',
          'Keep files if they serve distinct audiences',
          'Consolidate only if audiences overlap',
          'Update navigation to clarify audience separation'
        ];

      case 'merge-and-redirect':
        return [
          `Backup all files: ${allDocs.join(', ')}`,
          `Merge all unique content into ${primaryDoc}`,
          `Create table of contents for merged doc`,
          `Delete or archive: ${secondaryDocs.join(', ')}`,
          'Update all cross-references to point to merged doc',
          'Validate all links'
        ];

      default:
        return [
          `Backup all files: ${allDocs.join(', ')}`,
          'Manual consolidation required - review overlapping content',
          'Determine best consolidation approach',
          'Execute consolidation',
          'Validate results'
        ];
    }
  }

  // Helper methods (reuse from original analyzer or implement)

  private calculateConfidence(
    type: string,
    evidence: Evidence[],
    complexityPenalty: number,
    reversibility: number,
    contextClarity: number
  ): ConfidenceFactors {
    const evidenceScore = evidence.reduce((sum, e) => sum + e.weight, 0) / evidence.length;

    return {
      patternMatch: evidenceScore,
      historicalSuccess: 0.5, // Will be updated by workspace-brain integration
      complexityPenalty,
      reversibility,
      contextClarity
    };
  }

  private aggregateConfidence(factors: ConfidenceFactors): number {
    // Weighted average of confidence factors
    return (
      factors.patternMatch * 0.40 +
      factors.historicalSuccess * 0.30 +
      factors.reversibility * 0.15 +
      factors.contextClarity * 0.15
    ) * factors.complexityPenalty; // Apply complexity penalty
  }

  private generateIssueId(type: string, identifier: string): string {
    return `${type}-${identifier.replace(/[^a-zA-Z0-9]/g, '-')}`;
  }

  private async isFirstTimePattern(pattern: string): Promise<boolean> {
    // TODO: Query workspace-brain for historical consolidations
    // For now, assume first time
    return true;
  }
}

/**
 * Configuration for documentation patterns
 */
export interface DocumentationPatternConfig {
  [patternName: string]: {
    description: string;
    patterns: string[]; // File patterns to match
    suggested_strategy: 'hierarchical' | 'split-by-audience' | 'merge-and-redirect';
  };
}

/**
 * Default documentation patterns
 */
export const DEFAULT_DOCUMENTATION_PATTERNS: DocumentationPatternConfig = {
  'workspace-architecture-family': {
    description: 'Workspace architecture documentation family',
    patterns: [
      '**/WORKSPACE_ARCHITECTURE.md',
      '**/WORKSPACE_GUIDE.md',
      '**/WORKSPACE-MANAGEMENT-SYSTEM-OVERVIEW.md',
      '**/THREE-WORKSPACE-ARCHITECTURE.md'
    ],
    suggested_strategy: 'hierarchical'
  },
  'mcp-documentation-sprawl': {
    description: 'MCP configuration and setup documentation',
    patterns: [
      '**/MCP-*.md',
      '**/mcp-*.md',
      '**/*-MCP-*.md'
    ],
    suggested_strategy: 'hierarchical'
  },
  'setup-guide-redundancy': {
    description: 'Setup and onboarding documentation',
    patterns: [
      '**/NEW-COMPUTER-SETUP.md',
      '**/SYSTEM-SETUP-CHECKLIST.md',
      '**/ONBOARDING-*.md',
      '**/SETUP-*.md'
    ],
    suggested_strategy: 'merge-and-redirect'
  },
  'configuration-guide-overlap': {
    description: 'Configuration and credential documentation',
    patterns: [
      '**/CONFIGURATION-*.md',
      '**/CONFIG-*.md',
      '**/CREDENTIALS-*.md',
      '**/AUTHENTICATION-*.md'
    ],
    suggested_strategy: 'hierarchical'
  }
};
