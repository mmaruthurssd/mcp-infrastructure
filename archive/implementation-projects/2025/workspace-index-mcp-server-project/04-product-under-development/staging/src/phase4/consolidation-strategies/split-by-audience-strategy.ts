import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigurableWorkspaceAdapter } from '../../adapters/workspace-adapter.js';
import {
  IConsolidationStrategy,
  ConsolidationPlan,
  ConsolidationResult
} from './types.js';

/**
 * Split-by-Audience Consolidation Strategy
 *
 * Approach:
 * 1. Detect if files serve different audiences (technical vs non-technical)
 * 2. If audiences are different, recommend NO consolidation
 * 3. If audiences overlap, suggest adding cross-references
 * 4. Keep all files intact
 *
 * Best for: Documentation serving different user groups
 */
export class SplitByAudienceStrategy implements IConsolidationStrategy {
  private adapter: ConfigurableWorkspaceAdapter;

  constructor(adapter: ConfigurableWorkspaceAdapter) {
    this.adapter = adapter;
  }

  getName(): string {
    return 'split-by-audience';
  }

  getDescription(): string {
    return 'Recognize different audiences, keep files separate, add cross-references where appropriate';
  }

  /**
   * Analyze files to detect audience differences
   */
  async analyze(files: string[], overlaps: any[]): Promise<ConsolidationPlan> {
    // Detect audience for each file
    const audiences = await Promise.all(
      files.map(async (file) => ({
        file,
        audience: await this.detectAudience(file)
      }))
    );

    // Check if all files have the same audience
    const uniqueAudiences = new Set(audiences.map(a => a.audience));
    const hasDifferentAudiences = uniqueAudiences.size > 1;

    const filesToModify: ConsolidationPlan['filesToModify'] = [];
    const warnings: string[] = [];

    if (hasDifferentAudiences) {
      // Different audiences - no consolidation, just add cross-references
      warnings.push('Files serve different audiences - consolidation not recommended');
      warnings.push('Adding cross-references for discoverability');

      for (const { file, audience } of audiences) {
        filesToModify.push({
          file: this.adapter.getRelativePath(file),
          action: 'add-references',
          referenceTarget: audiences
            .filter(a => a.file !== file)
            .map(a => this.adapter.getRelativePath(a.file))
            .join(', ')
        });
      }
    } else {
      // Same audience - defer to another strategy
      warnings.push('Files serve the same audience - consider hierarchical or merge-and-redirect strategy');

      for (const file of files) {
        filesToModify.push({
          file: this.adapter.getRelativePath(file),
          action: 'no-change'
        });
      }
    }

    // Pick first file as nominal "primary"
    const primaryFile = this.adapter.getRelativePath(files[0]);

    return {
      strategy: 'split-by-audience',
      primaryFile,
      filesToModify,
      description: hasDifferentAudiences
        ? `Files serve different audiences (${Array.from(uniqueAudiences).join(', ')}) - keep separate with cross-references`
        : 'Files serve same audience - no consolidation needed',
      estimatedLineReduction: 0, // No line reduction for this strategy
      warnings
    };
  }

  /**
   * Execute consolidation plan
   */
  async execute(plan: ConsolidationPlan, dryRun: boolean = false): Promise<ConsolidationResult> {
    const changedFiles: string[] = [];

    try {
      for (const modification of plan.filesToModify) {
        if (modification.action === 'no-change') {
          continue;
        }

        const workspaceRoot = this.adapter.getWorkspaceRoot();
        const filePath = path.join(workspaceRoot, modification.file);

        if (modification.action === 'add-references' && modification.referenceTarget) {
          // Add cross-references to related documentation
          const result = await this.addCrossReferences(
            filePath,
            modification.referenceTarget.split(', '),
            dryRun
          );

          if (result.modified) {
            changedFiles.push(modification.file);
          }
        }
      }

      return {
        success: true,
        plan,
        changedFiles,
        linesRemoved: 0 // This strategy doesn't remove lines
      };
    } catch (error) {
      return {
        success: false,
        plan,
        changedFiles,
        linesRemoved: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Detect the intended audience of a document
   */
  private async detectAudience(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lowerContent = content.toLowerCase();

      // Technical indicators
      const technicalIndicators = [
        'api', 'implementation', 'architecture', 'developer',
        'technical', 'configuration', 'setup', 'install',
        'code', 'function', 'class', 'method', 'interface'
      ];

      // Non-technical indicators
      const nonTechnicalIndicators = [
        'overview', 'introduction', 'getting started', 'user guide',
        'beginner', 'quick start', 'tutorial', 'guide',
        'what is', 'how to use', 'benefits'
      ];

      const technicalScore = technicalIndicators.filter(indicator =>
        lowerContent.includes(indicator)
      ).length;

      const nonTechnicalScore = nonTechnicalIndicators.filter(indicator =>
        lowerContent.includes(indicator)
      ).length;

      if (technicalScore > nonTechnicalScore * 1.5) {
        return 'technical';
      } else if (nonTechnicalScore > technicalScore * 1.5) {
        return 'non-technical';
      } else {
        return 'mixed';
      }
    } catch (error) {
      console.error(`[SplitByAudienceStrategy] Error detecting audience for ${filePath}:`, error);
      return 'unknown';
    }
  }

  /**
   * Add cross-references to related documentation
   */
  private async addCrossReferences(
    filePath: string,
    relatedFiles: string[],
    dryRun: boolean
  ): Promise<{ modified: boolean }> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Check if cross-references section already exists
      if (content.includes('## Related Documentation') || content.includes('## See Also')) {
        return { modified: false };
      }

      // Add cross-references section at the end
      let newContent = content.trimEnd();
      newContent += '\n\n## Related Documentation\n\n';

      for (const relatedFile of relatedFiles) {
        if (relatedFile) {
          newContent += `- [${path.basename(relatedFile, '.md')}](${relatedFile})\n`;
        }
      }

      if (!dryRun) {
        await fs.writeFile(filePath, newContent);
      }

      return { modified: true };
    } catch (error) {
      console.error(`[SplitByAudienceStrategy] Error adding cross-references to ${filePath}:`, error);
      return { modified: false };
    }
  }
}
