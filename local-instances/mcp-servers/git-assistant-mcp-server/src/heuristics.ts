// Commit readiness heuristics engine

import { CommitReadinessResult, HeuristicScore, DiffSummary } from './types.js';

export class HeuristicsEngine {
  private userPreferences: {
    typical_file_count?: number;
    typical_line_count?: number;
    typical_commit_frequency?: number; // in minutes
  };

  constructor(userPreferences?: any) {
    this.userPreferences = userPreferences || {};
  }

  analyzeCommitReadiness(
    diffSummary: DiffSummary,
    timeSinceLastCommit: number,
    hasStagedFiles: boolean
  ): CommitReadinessResult {
    const scores: HeuristicScore[] = [];
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Heuristic 1: File count
    const fileCountScore = this.evaluateFileCount(diffSummary.total_files_changed);
    scores.push(fileCountScore);
    reasons.push(fileCountScore.reason);

    // Heuristic 2: Line changes
    const lineChangeScore = this.evaluateLineChanges(diffSummary.insertions + diffSummary.deletions);
    scores.push(lineChangeScore);
    reasons.push(lineChangeScore.reason);

    // Heuristic 3: Time-based
    const timeScore = this.evaluateTimeSinceLastCommit(timeSinceLastCommit);
    scores.push(timeScore);
    reasons.push(timeScore.reason);

    // Heuristic 4: Staged files check
    if (!hasStagedFiles && diffSummary.total_files_changed > 0) {
      warnings.push('No files staged yet - remember to stage files before committing');
    }

    // Heuristic 5: Check for debug code (basic detection)
    const debugWarnings = this.checkForDebugCode(diffSummary);
    warnings.push(...debugWarnings);

    // Calculate weighted confidence
    const totalWeight = scores.reduce((sum, score) => sum + score.weight, 0);
    const weightedScore = scores.reduce((sum, score) => sum + (score.score * score.weight), 0);
    const confidence = weightedScore / totalWeight;

    // Determine readiness
    const ready_to_commit = confidence >= 0.6 && diffSummary.total_files_changed > 0;

    // Generate recommendation
    const recommendation = this.generateRecommendation(confidence, diffSummary, timeSinceLastCommit);

    // Suggested next steps
    const suggested_next_steps = this.generateNextSteps(ready_to_commit, hasStagedFiles);

    return {
      ready_to_commit,
      confidence,
      recommendation,
      reasons,
      warnings,
      suggested_next_steps,
    };
  }

  private evaluateFileCount(fileCount: number): HeuristicScore {
    const typicalCount = this.userPreferences.typical_file_count || 3.5;

    if (fileCount === 0) {
      return {
        score: 0,
        reason: 'No files changed',
        weight: 1.5,
      };
    } else if (fileCount <= 3) {
      return {
        score: 1.0,
        reason: `Good commit size (${fileCount} files)`,
        weight: 1.5,
      };
    } else if (fileCount <= 7) {
      if (fileCount <= typicalCount * 1.2) {
        return {
          score: 0.8,
          reason: `Moderate size (${fileCount} files) - consider if changes are related`,
          weight: 1.5,
        };
      } else {
        return {
          score: 0.6,
          reason: `Larger than your typical commits (${fileCount} files, avg: ${typicalCount.toFixed(1)})`,
          weight: 1.5,
        };
      }
    } else {
      return {
        score: 0.3,
        reason: `Too many files (${fileCount}) - consider splitting into multiple commits`,
        weight: 1.5,
      };
    }
  }

  private evaluateLineChanges(totalLines: number): HeuristicScore {
    const typicalLines = this.userPreferences.typical_line_count || 100;

    if (totalLines < 50) {
      return {
        score: 1.0,
        reason: `Small, focused change (${totalLines} lines)`,
        weight: 1.2,
      };
    } else if (totalLines <= 200) {
      return {
        score: 0.9,
        reason: `Moderate change (${totalLines} lines)`,
        weight: 1.2,
      };
    } else if (totalLines <= 500) {
      if (totalLines <= typicalLines * 1.5) {
        return {
          score: 0.7,
          reason: `Large change (${totalLines} lines) - ensure it's cohesive`,
          weight: 1.2,
        };
      } else {
        return {
          score: 0.5,
          reason: `Much larger than your typical commits (${totalLines} lines, avg: ${typicalLines})`,
          weight: 1.2,
        };
      }
    } else {
      return {
        score: 0.3,
        reason: `Very large change (${totalLines} lines) - strongly consider breaking up`,
        weight: 1.2,
      };
    }
  }

  private evaluateTimeSinceLastCommit(minutes: number): HeuristicScore {
    const typicalFrequency = this.userPreferences.typical_commit_frequency || 60;

    if (minutes < 15) {
      return {
        score: 0.4,
        reason: `Only ${minutes} minutes since last commit - might be too soon`,
        weight: 0.8,
      };
    } else if (minutes <= 60) {
      return {
        score: 1.0,
        reason: `Good timing (${minutes} minutes since last commit)`,
        weight: 0.8,
      };
    } else if (minutes <= 240) {
      if (minutes >= typicalFrequency * 1.5) {
        return {
          score: 0.8,
          reason: `Longer than your typical frequency (${minutes} min, avg: ${typicalFrequency} min) - commit soon`,
          weight: 0.8,
        };
      } else {
        return {
          score: 0.9,
          reason: `Been a while (${minutes} minutes) - good time to commit`,
          weight: 0.8,
        };
      }
    } else {
      return {
        score: 0.7,
        reason: `Long gap (${Math.floor(minutes / 60)} hours) - definitely commit soon`,
        weight: 0.8,
      };
    }
  }

  private checkForDebugCode(diffSummary: DiffSummary): string[] {
    const warnings: string[] = [];

    // This is a basic heuristic - in a real implementation,
    // you'd parse the actual diff to detect console.log, debugger, etc.
    if (diffSummary.insertions > 50) {
      warnings.push('Review changes to ensure no debug code (console.log, debugger) remains');
    }

    return warnings;
  }

  private generateRecommendation(confidence: number, diffSummary: DiffSummary, timeSinceLastCommit: number): string {
    if (confidence >= 0.8) {
      return 'Excellent time to commit - changes are well-scoped and timely';
    } else if (confidence >= 0.6) {
      return 'Good time to commit - changes look reasonable';
    } else if (confidence >= 0.4) {
      return 'Consider reviewing changes before committing - some concerns noted';
    } else {
      return 'Hold off on committing - address concerns first';
    }
  }

  private generateNextSteps(readyToCommit: boolean, hasStagedFiles: boolean): string[] {
    const steps: string[] = [];

    if (readyToCommit) {
      steps.push('Review changes: git diff');

      if (!hasStagedFiles) {
        steps.push('Stage files: git add <files>');
      }

      steps.push('Commit with message: git commit -m "your message"');
      steps.push('Or use suggest_commit_message tool for AI-generated message');
    } else {
      steps.push('Continue working on current changes');
      steps.push('Use check_commit_readiness again when you\'re ready');
    }

    return steps;
  }
}
