import * as fs from "fs/promises";
import * as path from "path";
import type { ReleaseNotesFormat, BreakingChange } from "../types.js";
import type { ParsedCommit, CommitCategory } from "./commitParser.js";
import { formatMarkdown } from "./formatters/markdownFormatter.js";
import { formatHtml } from "./formatters/htmlFormatter.js";
import { formatJson } from "./formatters/jsonFormatter.js";

export interface ChangelogOptions {
  version: string;
  releaseDate: string;
  format: ReleaseNotesFormat;
  outputPath: string;
  includeBreakingChanges: boolean;
  includeAuthors: boolean;
  sections?: string[];
}

/**
 * Generate and write changelog to file
 */
export async function generateChangelog(
  categories: CommitCategory,
  breakingChanges: BreakingChange[],
  contributors: string[],
  options: ChangelogOptions
): Promise<string> {
  let content: string;

  const formatterOptions = {
    version: options.version,
    releaseDate: options.releaseDate,
    includeBreakingChanges: options.includeBreakingChanges,
    includeAuthors: options.includeAuthors,
    sections: options.sections,
  };

  // Generate content based on format
  switch (options.format) {
    case "markdown":
      content = formatMarkdown(categories, breakingChanges, contributors, formatterOptions);
      break;
    case "html":
      content = formatHtml(categories, breakingChanges, contributors, formatterOptions);
      break;
    case "json":
      content = formatJson(categories, breakingChanges, contributors, formatterOptions);
      break;
    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }

  // Ensure output directory exists
  const outputDir = path.dirname(options.outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  // Write to file
  await fs.writeFile(options.outputPath, content, "utf-8");

  return options.outputPath;
}

/**
 * Build sections summary from categorized commits
 */
export function buildSectionsSummary(categories: CommitCategory): Record<string, string[]> {
  const sections: Record<string, string[]> = {};

  if (categories.features.length > 0) {
    sections["Features"] = categories.features.map((c) => formatCommitSummary(c));
  }

  if (categories.enhancements.length > 0) {
    sections["Enhancements"] = categories.enhancements.map((c) => formatCommitSummary(c));
  }

  if (categories.fixes.length > 0) {
    sections["Bug Fixes"] = categories.fixes.map((c) => formatCommitSummary(c));
  }

  if (categories.performance.length > 0) {
    sections["Performance"] = categories.performance.map((c) => formatCommitSummary(c));
  }

  if (categories.security.length > 0) {
    sections["Security"] = categories.security.map((c) => formatCommitSummary(c));
  }

  if (categories.dependencies.length > 0) {
    sections["Dependencies"] = categories.dependencies.map((c) => formatCommitSummary(c));
  }

  return sections;
}

/**
 * Format commit for summary
 */
function formatCommitSummary(commit: ParsedCommit): string {
  const scope = commit.scope ? `${commit.scope}: ` : "";
  return `${scope}${commit.subject} (${commit.hash.substring(0, 7)})`;
}
