import type { BreakingChange } from "../../types.js";
import type { ParsedCommit, CommitCategory } from "../commitParser.js";

export interface MarkdownFormatterOptions {
  version: string;
  releaseDate: string;
  includeBreakingChanges: boolean;
  includeAuthors: boolean;
  sections?: string[];
}

/**
 * Format release notes as Markdown
 */
export function formatMarkdown(
  categories: CommitCategory,
  breakingChanges: BreakingChange[],
  contributors: string[],
  options: MarkdownFormatterOptions
): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Release Notes - ${options.version}`);
  lines.push("");
  lines.push(`**Release Date:** ${options.releaseDate}`);
  lines.push("");

  // Summary
  const totalCommits = Object.values(categories).reduce((sum, commits) => sum + commits.length, 0);
  lines.push("## Summary");
  lines.push("");
  lines.push(`This release includes ${totalCommits} commits with the following changes:`);
  lines.push("");
  lines.push(`- **Features:** ${categories.features.length}`);
  lines.push(`- **Bug Fixes:** ${categories.fixes.length}`);
  lines.push(`- **Enhancements:** ${categories.enhancements.length}`);
  lines.push(`- **Performance:** ${categories.performance.length}`);
  lines.push(`- **Security:** ${categories.security.length}`);
  lines.push(`- **Dependencies:** ${categories.dependencies.length}`);
  if (options.includeBreakingChanges && breakingChanges.length > 0) {
    lines.push(`- **Breaking Changes:** ${breakingChanges.length}`);
  }
  lines.push("");

  // Breaking Changes Section
  if (options.includeBreakingChanges && breakingChanges.length > 0) {
    lines.push("## Breaking Changes");
    lines.push("");
    lines.push("> **Warning:** This release contains breaking changes that may require action.");
    lines.push("");

    for (const breaking of breakingChanges) {
      lines.push(`### ${breaking.description.split("\n")[0]}`);
      lines.push("");
      lines.push(`**Commit:** \`${breaking.commit.substring(0, 7)}\``);
      lines.push("");
      if (breaking.description.includes("\n")) {
        lines.push(breaking.description);
        lines.push("");
      }
      if (breaking.migration) {
        lines.push("**Migration Guide:**");
        lines.push("");
        lines.push(breaking.migration);
        lines.push("");
      }
    }
  }

  // Features Section
  if (categories.features.length > 0) {
    lines.push("## Features");
    lines.push("");
    for (const commit of categories.features) {
      lines.push(formatCommitLine(commit));
    }
    lines.push("");
  }

  // Enhancements Section
  if (categories.enhancements.length > 0) {
    lines.push("## Enhancements");
    lines.push("");
    for (const commit of categories.enhancements) {
      lines.push(formatCommitLine(commit));
    }
    lines.push("");
  }

  // Bug Fixes Section
  if (categories.fixes.length > 0) {
    lines.push("## Bug Fixes");
    lines.push("");
    for (const commit of categories.fixes) {
      lines.push(formatCommitLine(commit));
    }
    lines.push("");
  }

  // Performance Section
  if (categories.performance.length > 0) {
    lines.push("## Performance");
    lines.push("");
    for (const commit of categories.performance) {
      lines.push(formatCommitLine(commit));
    }
    lines.push("");
  }

  // Security Section
  if (categories.security.length > 0) {
    lines.push("## Security");
    lines.push("");
    for (const commit of categories.security) {
      lines.push(formatCommitLine(commit));
    }
    lines.push("");
  }

  // Dependencies Section
  if (categories.dependencies.length > 0) {
    lines.push("## Dependencies");
    lines.push("");
    for (const commit of categories.dependencies) {
      lines.push(formatCommitLine(commit));
    }
    lines.push("");
  }

  // Contributors Section
  if (options.includeAuthors && contributors.length > 0) {
    lines.push("## Contributors");
    lines.push("");
    lines.push(`This release was made possible by ${contributors.length} contributor${contributors.length > 1 ? "s" : ""}:`);
    lines.push("");
    for (const contributor of contributors) {
      lines.push(`- ${contributor}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Format a single commit as a markdown list item
 */
function formatCommitLine(commit: ParsedCommit): string {
  const scope = commit.scope ? `**${commit.scope}:** ` : "";
  const hash = `\`${commit.hash.substring(0, 7)}\``;
  const references = commit.references.length > 0 ? ` (${commit.references.join(", ")})` : "";

  return `- ${scope}${commit.subject} ${hash}${references}`;
}
