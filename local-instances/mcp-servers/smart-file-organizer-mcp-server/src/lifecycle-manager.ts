import fs from 'fs/promises';
import path from 'path';

/**
 * Lifecycle Manager
 * Manages file lifecycle transitions (planning → active → development → stable → archived)
 */

export type LifecycleStage = 'planning' | 'active' | 'development' | 'stable' | 'static' | 'archived' | 'temporary';

export interface LifecycleTransition {
  from: LifecycleStage;
  to: LifecycleStage;
  reason: string;
  confidence: number;
  suggestedAction: string;
}

export interface LifecycleInfo {
  currentStage: LifecycleStage;
  suggestedStage: LifecycleStage;
  shouldTransition: boolean;
  transition?: LifecycleTransition;
  reasoning: string[];
}

export class LifecycleManager {
  private folderMap: any;

  constructor(folderMap: any) {
    this.folderMap = folderMap;
  }

  /**
   * Determine current lifecycle stage based on file location
   */
  determineCurrentStage(filePath: string, projectRoot: string): LifecycleStage {
    const relativePath = path.relative(projectRoot, filePath);
    const topLevelFolder = relativePath.split(path.sep)[0];

    // Map folder to lifecycle stage
    const folderToStage: Record<string, LifecycleStage> = {
      'future-ideas': 'planning',
      'active-work': 'active',
      'projects-in-development': 'development',
      'projects': 'stable',
      'reference': 'static',
      'Templates-for-tools-frameworks-mcp-servers': 'static',
      'archived': 'archived',
      'temp': 'temporary'
    };

    return folderToStage[topLevelFolder] || 'active'; // Default to active
  }

  /**
   * Analyze if a file should transition to a different lifecycle stage
   */
  async analyzeLifecycle(filePath: string, projectRoot: string): Promise<LifecycleInfo> {
    const currentStage = this.determineCurrentStage(filePath, projectRoot);
    const result: LifecycleInfo = {
      currentStage,
      suggestedStage: currentStage,
      shouldTransition: false,
      reasoning: []
    };

    try {
      // Get file/directory stats
      const stats = await fs.stat(filePath);
      const isDirectory = stats.isDirectory();
      const daysSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

      // Check for transition based on current stage
      switch (currentStage) {
        case 'planning':
          result.reasoning.push('Currently in planning stage (future-ideas)');
          // If files are being actively modified, might be ready for active development
          if (daysSinceModified < 7) {
            result.suggestedStage = 'active';
            result.shouldTransition = true;
            result.transition = {
              from: 'planning',
              to: 'active',
              reason: 'Recent activity suggests work has begun',
              confidence: 0.7,
              suggestedAction: 'Move to active-work/ and create a task folder'
            };
          }
          break;

        case 'active':
          result.reasoning.push('Currently in active development (active-work)');
          // Check if it should graduate to development or archived
          if (isDirectory) {
            const shouldGraduate = await this.checkForGraduation(filePath, daysSinceModified);
            if (shouldGraduate.shouldTransition) {
              result.suggestedStage = shouldGraduate.to;
              result.shouldTransition = true;
              result.transition = shouldGraduate.transition;
              result.reasoning.push(...shouldGraduate.reasoning);
            }
          } else {
            // Single files that haven't been modified in 90+ days might be abandoned
            if (daysSinceModified > 90) {
              result.suggestedStage = 'archived';
              result.shouldTransition = true;
              result.transition = {
                from: 'active',
                to: 'archived',
                reason: `No activity in ${Math.floor(daysSinceModified)} days - might be abandoned`,
                confidence: 0.6,
                suggestedAction: 'Move to archived/ or delete if no longer needed'
              };
            }
          }
          break;

        case 'development':
          result.reasoning.push('Currently in development stage (projects-in-development)');
          // Check if stable enough for projects/
          if (isDirectory) {
            const stabilityCheck = await this.checkStability(filePath, daysSinceModified);
            if (stabilityCheck.shouldTransition) {
              result.suggestedStage = stabilityCheck.to;
              result.shouldTransition = true;
              result.transition = stabilityCheck.transition;
              result.reasoning.push(...stabilityCheck.reasoning);
            }
          }
          break;

        case 'stable':
          result.reasoning.push('Currently stable (projects)');
          // Check if should be archived
          if (isDirectory) {
            const archiveCheck = await this.checkForArchival(filePath, daysSinceModified);
            if (archiveCheck.shouldTransition) {
              result.suggestedStage = 'archived';
              result.shouldTransition = true;
              result.transition = archiveCheck.transition;
              result.reasoning.push(...archiveCheck.reasoning);
            }
          }
          break;

        case 'temporary':
          result.reasoning.push('Currently in temp/ folder');
          // Temp files older than 30 days should be deleted
          if (daysSinceModified > 30) {
            result.reasoning.push(`Temp file not modified in ${Math.floor(daysSinceModified)} days - consider deleting`);
          }
          break;

        case 'static':
          result.reasoning.push('Static reference material - no lifecycle transitions expected');
          break;

        case 'archived':
          result.reasoning.push('Already archived - no further transitions needed');
          break;
      }

    } catch (error) {
      result.reasoning.push(`Error analyzing lifecycle: ${error}`);
    }

    return result;
  }

  /**
   * Check if active work should graduate to projects-in-development or projects
   */
  private async checkForGraduation(dirPath: string, daysSinceModified: number): Promise<{
    shouldTransition: boolean;
    to: LifecycleStage;
    transition?: LifecycleTransition;
    reasoning: string[];
  }> {
    const result: {
      shouldTransition: boolean;
      to: LifecycleStage;
      transition?: LifecycleTransition;
      reasoning: string[];
    } = {
      shouldTransition: false,
      to: 'active' as LifecycleStage,
      reasoning: [] as string[]
    };

    // Check for project indicators
    const hasPackageJson = await this.fileExists(path.join(dirPath, 'package.json'));
    const hasReadme = await this.fileExists(path.join(dirPath, 'README.md'));
    const hasSrcFolder = await this.directoryExists(path.join(dirPath, 'src'));

    let confidence = 0;

    if (hasPackageJson) {
      confidence += 0.3;
      result.reasoning.push('Has package.json');
    }

    if (hasReadme) {
      confidence += 0.2;
      result.reasoning.push('Has README.md');
    }

    if (hasSrcFolder) {
      confidence += 0.2;
      result.reasoning.push('Has src/ folder');
    }

    // If not modified recently, it's more stable
    if (daysSinceModified > 14) {
      confidence += 0.2;
      result.reasoning.push(`No changes in ${Math.floor(daysSinceModified)} days`);
    }

    // Decide on graduation
    if (confidence >= 0.7) {
      // High confidence → stable project
      result.shouldTransition = true;
      result.to = 'stable';
      result.transition = {
        from: 'active',
        to: 'stable',
        reason: 'Project appears complete and stable',
        confidence,
        suggestedAction: 'Move to projects/'
      };
    } else if (confidence >= 0.4) {
      // Medium confidence → project in development
      result.shouldTransition = true;
      result.to = 'development';
      result.transition = {
        from: 'active',
        to: 'development',
        reason: 'Project structure detected but not yet stable',
        confidence,
        suggestedAction: 'Move to projects-in-development/'
      };
    } else {
      result.reasoning.push(`Confidence ${confidence.toFixed(2)} not high enough for graduation`);
    }

    return result;
  }

  /**
   * Check if project in development is stable enough for projects/
   */
  private async checkStability(dirPath: string, daysSinceModified: number): Promise<{
    shouldTransition: boolean;
    to: LifecycleStage;
    transition?: LifecycleTransition;
    reasoning: string[];
  }> {
    const result: {
      shouldTransition: boolean;
      to: LifecycleStage;
      transition?: LifecycleTransition;
      reasoning: string[];
    } = {
      shouldTransition: false,
      to: 'development' as LifecycleStage,
      reasoning: [] as string[]
    };

    let confidence = 0;

    // Check for completeness
    const hasPackageJson = await this.fileExists(path.join(dirPath, 'package.json'));
    const hasReadme = await this.fileExists(path.join(dirPath, 'README.md'));
    const hasSrcFolder = await this.directoryExists(path.join(dirPath, 'src'));
    const hasDocsFolder = await this.directoryExists(path.join(dirPath, 'docs'));

    if (hasPackageJson && hasReadme && hasSrcFolder) {
      confidence += 0.4;
      result.reasoning.push('Has complete project structure');
    }

    if (hasDocsFolder) {
      confidence += 0.2;
      result.reasoning.push('Has documentation folder');
    }

    // Check stability (no changes in 30+ days)
    if (daysSinceModified > 30) {
      confidence += 0.3;
      result.reasoning.push(`Stable - no changes in ${Math.floor(daysSinceModified)} days`);
    } else if (daysSinceModified > 14) {
      confidence += 0.15;
      result.reasoning.push(`Relatively stable - no changes in ${Math.floor(daysSinceModified)} days`);
    }

    // Check for tests
    const hasTests = await this.directoryExists(path.join(dirPath, 'tests')) ||
                     await this.directoryExists(path.join(dirPath, 'test'));
    if (hasTests) {
      confidence += 0.1;
      result.reasoning.push('Has tests folder');
    }

    if (confidence >= 0.7) {
      result.shouldTransition = true;
      result.to = 'stable';
      result.transition = {
        from: 'development',
        to: 'stable',
        reason: 'Project is complete and stable',
        confidence,
        suggestedAction: 'Move to projects/'
      };
    } else {
      result.reasoning.push(`Confidence ${confidence.toFixed(2)} not high enough for stable status`);
    }

    return result;
  }

  /**
   * Check if stable project should be archived
   */
  private async checkForArchival(dirPath: string, daysSinceModified: number): Promise<{
    shouldTransition: boolean;
    transition?: LifecycleTransition;
    reasoning: string[];
  }> {
    const result: {
      shouldTransition: boolean;
      transition?: LifecycleTransition;
      reasoning: string[];
    } = {
      shouldTransition: false,
      reasoning: [] as string[]
    };

    let confidence = 0;

    // Check for deprecation markers
    const readmePath = path.join(dirPath, 'README.md');
    try {
      const readmeContent = await fs.readFile(readmePath, 'utf-8');
      const lower = readmeContent.toLowerCase();

      if (lower.includes('deprecated') || lower.includes('no longer maintained') ||
          lower.includes('obsolete') || lower.includes('archived')) {
        confidence += 0.5;
        result.reasoning.push('README indicates project is deprecated');
      }
    } catch {
      // No README or can't read
    }

    // Check for long inactivity
    if (daysSinceModified > 365) {
      confidence += 0.3;
      result.reasoning.push(`No activity in ${Math.floor(daysSinceModified)} days (over 1 year)`);
    } else if (daysSinceModified > 180) {
      confidence += 0.2;
      result.reasoning.push(`No activity in ${Math.floor(daysSinceModified)} days`);
    }

    // Check for "old" or "deprecated" in folder/file names
    const files = await fs.readdir(dirPath);
    const hasOldIndicators = files.some(f => {
      const lower = f.toLowerCase();
      return lower.includes('old') || lower.includes('deprecated') || lower.includes('obsolete');
    });

    if (hasOldIndicators) {
      confidence += 0.2;
      result.reasoning.push('Contains files marked as old/deprecated');
    }

    if (confidence >= 0.6) {
      result.shouldTransition = true;
      result.transition = {
        from: 'stable',
        to: 'archived',
        reason: 'Project appears to be deprecated or no longer maintained',
        confidence,
        suggestedAction: 'Move to archived/'
      };
    } else {
      result.reasoning.push(`Confidence ${confidence.toFixed(2)} not high enough for archival`);
    }

    return result;
  }

  /**
   * Get recommended next stage for a file/folder
   */
  getNextStage(currentStage: LifecycleStage): LifecycleStage | null {
    const stages = this.folderMap.lifecycleStages;
    return stages[currentStage]?.nextStage || null;
  }

  /**
   * Get all possible transitions from current stage
   */
  getPossibleTransitions(currentStage: LifecycleStage): LifecycleStage[] {
    const transitions: Record<LifecycleStage, LifecycleStage[]> = {
      'planning': ['active', 'archived'],
      'active': ['development', 'stable', 'archived'],
      'development': ['stable', 'archived', 'active'],
      'stable': ['archived', 'development'],
      'static': [],
      'archived': [],
      'temporary': []
    };

    return transitions[currentStage] || [];
  }

  /**
   * Helper: Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Helper: Check if directory exists
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}
