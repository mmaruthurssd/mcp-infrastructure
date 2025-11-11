import type { BreakingChange } from "../types.js";

export interface ParsedCommit {
  hash: string;
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  footer?: string;
  author: string;
  date: string;
  breakingChanges: BreakingChange[];
  references: string[];
}

export interface CommitCategory {
  features: ParsedCommit[];
  fixes: ParsedCommit[];
  enhancements: ParsedCommit[];
  performance: ParsedCommit[];
  security: ParsedCommit[];
  dependencies: ParsedCommit[];
  docs: ParsedCommit[];
  other: ParsedCommit[];
}

/**
 * Manually parse a conventional commit message
 */
function manualParse(commitMessage: string): {
  type: string | null;
  scope: string | null;
  subject: string | null;
  body: string | null;
  footer: string | null;
  notes: Array<{ title: string; text: string }>;
  references: Array<{ issue: string }>;
} {
  const lines = commitMessage.split('\n');
  const firstLine = lines[0] || '';

  // Parse conventional commit format: type(scope): subject
  const conventionalMatch = firstLine.match(/^(\w+)(?:\(([^)]+)\))?: (.+)$/);

  let type: string | null = null;
  let scope: string | null = null;
  let subject: string | null = null;

  if (conventionalMatch) {
    type = conventionalMatch[1];
    scope = conventionalMatch[2] || null;
    subject = conventionalMatch[3];
  } else {
    subject = firstLine;
  }

  // Parse body and footer
  const bodyLines: string[] = [];
  const footerLines: string[] = [];
  let inFooter = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^[A-Z][A-Za-z-]+:/)) {
      inFooter = true;
    }

    if (inFooter) {
      footerLines.push(line);
    } else if (line.trim()) {
      bodyLines.push(line);
    }
  }

  const body = bodyLines.length > 0 ? bodyLines.join('\n').trim() : null;
  const footer = footerLines.length > 0 ? footerLines.join('\n').trim() : null;

  // Parse notes (BREAKING CHANGE, etc.)
  const notes: Array<{ title: string; text: string }> = [];
  const fullText = commitMessage;
  const breakingMatch = fullText.match(/BREAKING[- ]CHANGE:\s*(.+)/s);
  if (breakingMatch) {
    notes.push({
      title: 'BREAKING CHANGE',
      text: breakingMatch[1].trim()
    });
  }

  // Parse references (#123, closes #456, etc.)
  const references: Array<{ issue: string }> = [];
  const refMatches = commitMessage.matchAll(/#(\d+)/g);
  for (const match of refMatches) {
    references.push({ issue: match[1] });
  }

  return { type, scope, subject, body, footer, notes, references };
}

/**
 * Parse a git commit message using conventional commits format
 */
export function parseCommit(commitMessage: string, hash: string, author: string, date: string): ParsedCommit {
  const parsed = manualParse(commitMessage);

  const breakingChanges: BreakingChange[] = [];

  // Check for breaking changes in notes
  if (parsed.notes) {
    for (const note of parsed.notes) {
      if (note.title === "BREAKING CHANGE" || note.title === "BREAKING-CHANGE") {
        breakingChanges.push({
          commit: hash,
          description: note.text,
          migration: extractMigrationGuide(note.text),
        });
      }
    }
  }

  // Check for breaking change indicators in body or footer
  const fullMessage = [parsed.body, parsed.footer].filter(Boolean).join("\n");
  if (fullMessage.includes("BREAKING CHANGE:") || fullMessage.includes("BREAKING-CHANGE:")) {
    const breakingMatch = fullMessage.match(/BREAKING[- ]CHANGE:\s*(.+?)(?:\n\n|\n$|$)/s);
    if (breakingMatch && breakingChanges.length === 0) {
      breakingChanges.push({
        commit: hash,
        description: breakingMatch[1].trim(),
        migration: extractMigrationGuide(breakingMatch[1]),
      });
    }
  }

  // Extract references (issue numbers, PR numbers)
  const references: string[] = [];
  if (parsed.references) {
    references.push(...parsed.references.map((ref: any) => `#${ref.issue}`));
  }

  return {
    hash,
    type: parsed.type || "other",
    scope: parsed.scope || undefined,
    subject: parsed.subject || commitMessage.split("\n")[0],
    body: parsed.body || undefined,
    footer: parsed.footer || undefined,
    author,
    date,
    breakingChanges,
    references,
  };
}

/**
 * Extract migration guide from breaking change description
 */
function extractMigrationGuide(description: string): string {
  const migrationMatch = description.match(/migration(?:\s+guide)?:?\s*(.+)/is);
  if (migrationMatch) {
    return migrationMatch[1].trim();
  }
  return "";
}

/**
 * Categorize parsed commits into sections
 */
export function categorizeCommits(commits: ParsedCommit[]): CommitCategory {
  const categories: CommitCategory = {
    features: [],
    fixes: [],
    enhancements: [],
    performance: [],
    security: [],
    dependencies: [],
    docs: [],
    other: [],
  };

  for (const commit of commits) {
    switch (commit.type.toLowerCase()) {
      case "feat":
      case "feature":
        categories.features.push(commit);
        break;
      case "fix":
        categories.fixes.push(commit);
        break;
      case "perf":
      case "performance":
        categories.performance.push(commit);
        break;
      case "security":
      case "sec":
        categories.security.push(commit);
        break;
      case "deps":
      case "dep":
      case "dependency":
      case "dependencies":
      case "build":
        categories.dependencies.push(commit);
        break;
      case "refactor":
      case "style":
      case "improve":
      case "enhancement":
        categories.enhancements.push(commit);
        break;
      case "docs":
      case "doc":
        categories.docs.push(commit);
        break;
      default:
        categories.other.push(commit);
    }
  }

  return categories;
}

/**
 * Extract unique contributors from commits
 */
export function extractContributors(commits: ParsedCommit[]): string[] {
  const uniqueAuthors = new Set<string>();

  for (const commit of commits) {
    // Clean up author name (remove email if present)
    const authorName = commit.author.replace(/<.*?>/, "").trim();
    if (authorName) {
      uniqueAuthors.add(authorName);
    }
  }

  return Array.from(uniqueAuthors).sort();
}

/**
 * Collect all breaking changes from commits
 */
export function collectBreakingChanges(commits: ParsedCommit[]): BreakingChange[] {
  const breakingChanges: BreakingChange[] = [];

  for (const commit of commits) {
    breakingChanges.push(...commit.breakingChanges);
  }

  return breakingChanges;
}
