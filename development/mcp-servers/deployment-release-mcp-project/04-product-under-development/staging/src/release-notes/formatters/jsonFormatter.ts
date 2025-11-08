import type { BreakingChange } from "../../types.js";
import type { ParsedCommit, CommitCategory } from "../commitParser.js";

export interface JsonFormatterOptions {
  version: string;
  releaseDate: string;
  includeBreakingChanges: boolean;
  includeAuthors: boolean;
  sections?: string[];
}

export interface ReleaseNotesJson {
  version: string;
  releaseDate: string;
  summary: {
    totalCommits: number;
    features: number;
    fixes: number;
    enhancements: number;
    performance: number;
    security: number;
    dependencies: number;
    breakingChanges: number;
  };
  breakingChanges?: BreakingChange[];
  features?: CommitData[];
  enhancements?: CommitData[];
  fixes?: CommitData[];
  performance?: CommitData[];
  security?: CommitData[];
  dependencies?: CommitData[];
  contributors?: string[];
}

interface CommitData {
  hash: string;
  type: string;
  scope?: string;
  subject: string;
  author: string;
  date: string;
  references: string[];
}

/**
 * Format release notes as JSON
 */
export function formatJson(
  categories: CommitCategory,
  breakingChanges: BreakingChange[],
  contributors: string[],
  options: JsonFormatterOptions
): string {
  const totalCommits = Object.values(categories).reduce((sum, commits) => sum + commits.length, 0);

  const releaseNotes: ReleaseNotesJson = {
    version: options.version,
    releaseDate: options.releaseDate,
    summary: {
      totalCommits,
      features: categories.features.length,
      fixes: categories.fixes.length,
      enhancements: categories.enhancements.length,
      performance: categories.performance.length,
      security: categories.security.length,
      dependencies: categories.dependencies.length,
      breakingChanges: breakingChanges.length,
    },
  };

  // Add breaking changes if requested
  if (options.includeBreakingChanges && breakingChanges.length > 0) {
    releaseNotes.breakingChanges = breakingChanges;
  }

  // Add features
  if (categories.features.length > 0) {
    releaseNotes.features = categories.features.map(convertCommitToData);
  }

  // Add enhancements
  if (categories.enhancements.length > 0) {
    releaseNotes.enhancements = categories.enhancements.map(convertCommitToData);
  }

  // Add fixes
  if (categories.fixes.length > 0) {
    releaseNotes.fixes = categories.fixes.map(convertCommitToData);
  }

  // Add performance
  if (categories.performance.length > 0) {
    releaseNotes.performance = categories.performance.map(convertCommitToData);
  }

  // Add security
  if (categories.security.length > 0) {
    releaseNotes.security = categories.security.map(convertCommitToData);
  }

  // Add dependencies
  if (categories.dependencies.length > 0) {
    releaseNotes.dependencies = categories.dependencies.map(convertCommitToData);
  }

  // Add contributors if requested
  if (options.includeAuthors && contributors.length > 0) {
    releaseNotes.contributors = contributors;
  }

  return JSON.stringify(releaseNotes, null, 2);
}

/**
 * Convert ParsedCommit to simplified CommitData
 */
function convertCommitToData(commit: ParsedCommit): CommitData {
  return {
    hash: commit.hash,
    type: commit.type,
    scope: commit.scope,
    subject: commit.subject,
    author: commit.author,
    date: commit.date,
    references: commit.references,
  };
}
