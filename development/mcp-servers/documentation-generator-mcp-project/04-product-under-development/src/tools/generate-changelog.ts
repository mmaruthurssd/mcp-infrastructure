import { simpleGit } from "simple-git";
import * as fs from "fs/promises";
import * as path from "path";

interface GenerateChangelogArgs {
  projectPath: string;
  fromVersion?: string;
  toVersion?: string;
  outputFile?: string;
  format?: "keepachangelog" | "simple";
  groupBy?: "type" | "scope";
}

export async function generateChangelog(args: GenerateChangelogArgs) {
  const {
    projectPath,
    fromVersion,
    toVersion = "HEAD",
    outputFile,
    format = "keepachangelog",
    groupBy = "type",
  } = args;

  try {
    const git = simpleGit(projectPath);

    // Get commit history
    const from = fromVersion || await getLastTag(git);
    const logOptions = from ? { from, to: toVersion } : { to: toVersion };
    const log = await git.log(logOptions as any);

    // Parse and categorize commits
    const commits = log.all.map(parseCommit);
    const categorized = categorizeCommits(commits, groupBy);

    // Generate changelog
    const changelog = format === "keepachangelog"
      ? generateKeepAChangelog(categorized, toVersion)
      : generateSimpleChangelog(categorized, toVersion);

    // Determine output path
    const output = outputFile || path.join(projectPath, "CHANGELOG.md");

    // Write changelog
    await fs.writeFile(output, changelog, "utf-8");

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              outputPath: output,
              stats: {
                totalCommits: commits.length,
                features: commits.filter(c => c.type === "feat").length,
                fixes: commits.filter(c => c.type === "fix").length,
                breakingChanges: commits.filter(c => c.breaking).length,
                chores: commits.filter(c => c.type === "chore").length,
                others: commits.filter(c => !["feat", "fix", "chore"].includes(c.type)).length,
              },
              changelog,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to generate changelog: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function getLastTag(git: any): Promise<string | null> {
  try {
    const tags = await git.tags();
    return tags.latest || null;
  } catch {
    return null;
  }
}

function parseCommit(commit: any) {
  const message = commit.message;
  const conventionalMatch = message.match(/^(\w+)(\(([^)]+)\))?(!)?:\s*(.+)/);

  if (conventionalMatch) {
    return {
      hash: commit.hash.substring(0, 7),
      type: conventionalMatch[1],
      scope: conventionalMatch[3] || null,
      breaking: !!conventionalMatch[4],
      subject: conventionalMatch[5],
      author: commit.author_name,
      date: commit.date,
    };
  }

  return {
    hash: commit.hash.substring(0, 7),
    type: "other",
    scope: null,
    breaking: message.includes("BREAKING"),
    subject: message.split("\n")[0],
    author: commit.author_name,
    date: commit.date,
  };
}

function categorizeCommits(commits: any[], groupBy: string) {
  const categories: any = {};

  for (const commit of commits) {
    const key = groupBy === "type" ? commit.type : (commit.scope || "uncategorized");
    if (!categories[key]) {
      categories[key] = [];
    }
    categories[key].push(commit);
  }

  return categories;
}

function generateKeepAChangelog(categorized: any, version: string): string {
  const date = new Date().toISOString().split("T")[0];
  let md = `# Changelog\n\n`;
  md += `## [${version}] - ${date}\n\n`;

  const typeLabels: any = {
    feat: "Added",
    fix: "Fixed",
    chore: "Changed",
    docs: "Documentation",
    style: "Style",
    refactor: "Refactored",
    test: "Tests",
  };

  for (const [type, commits] of Object.entries(categorized)) {
    const label = typeLabels[type] || "Other";
    md += `### ${label}\n`;
    for (const commit of commits as any[]) {
      md += `- ${commit.subject} (${commit.hash})\n`;
    }
    md += `\n`;
  }

  return md;
}

function generateSimpleChangelog(categorized: any, version: string): string {
  const date = new Date().toISOString().split("T")[0];
  let md = `# ${version} (${date})\n\n`;

  for (const [type, commits] of Object.entries(categorized)) {
    for (const commit of commits as any[]) {
      md += `- ${type}: ${commit.subject} (${commit.hash})\n`;
    }
  }

  return md;
}
