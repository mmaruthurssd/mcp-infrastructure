import simpleGit from "simple-git";
import * as path from "path";
import type { GenerateReleaseNotesParams, GenerateReleaseNotesResult } from "../types.js";
import {
  parseCommit,
  categorizeCommits,
  extractContributors,
  collectBreakingChanges,
  type ParsedCommit,
} from "../release-notes/commitParser.js";
import { generateChangelog, buildSectionsSummary } from "../release-notes/changelogGenerator.js";

/**
 * Generate release notes from git commits between versions
 */
export async function generateReleaseNotes(
  params: GenerateReleaseNotesParams
): Promise<GenerateReleaseNotesResult> {
  const {
    projectPath,
    fromVersion,
    toVersion = "HEAD",
    format = "markdown",
    includeBreakingChanges = true,
    includeAuthors = true,
    outputPath,
    sections,
  } = params;

  // Initialize git
  const git = simpleGit(projectPath);

  // Determine version range
  let startRef = fromVersion;
  if (!startRef) {
    // Get the last tag if fromVersion not provided
    try {
      const tags = await git.tags();
      if (tags.all.length > 0) {
        startRef = tags.latest || tags.all[tags.all.length - 1];
      } else {
        // No tags found, use initial commit
        const log = await git.log();
        startRef = log.all.length > 0 ? log.all[0].hash : "HEAD";
      }
    } catch (error) {
      throw new Error(`Failed to determine start version: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Get commit log between versions
  let commits: ParsedCommit[];
  try {
    const log = await git.log({
      from: startRef,
      to: toVersion,
    });

    // Parse commits
    commits = log.all.map((commit) => {
      return parseCommit(
        commit.message,
        commit.hash,
        commit.author_name,
        commit.date
      );
    });
  } catch (error) {
    throw new Error(`Failed to retrieve git commits: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Categorize commits
  const categories = categorizeCommits(commits);

  // Collect breaking changes
  const breakingChanges = includeBreakingChanges ? collectBreakingChanges(commits) : [];

  // Extract contributors
  const contributors = includeAuthors ? extractContributors(commits) : [];

  // Determine version string
  const versionString = toVersion === "HEAD" ? await getCurrentVersion(git) : toVersion;

  // Determine output path
  const fileExtension = format === "markdown" ? "md" : format;
  const finalOutputPath =
    outputPath || path.join(projectPath, `RELEASE_NOTES.${fileExtension}`);

  // Get release date
  const releaseDate = new Date().toISOString().split("T")[0];

  // Generate changelog
  const releaseNotesPath = await generateChangelog(categories, breakingChanges, contributors, {
    version: versionString,
    releaseDate,
    format,
    outputPath: finalOutputPath,
    includeBreakingChanges,
    includeAuthors,
    sections,
  });

  // Build sections summary
  const sectionsSummary = buildSectionsSummary(categories);

  // Build result
  const result: GenerateReleaseNotesResult = {
    success: true,
    releaseNotesPath,
    version: versionString,
    releaseDate,
    summary: {
      commits: commits.length,
      features: categories.features.length,
      fixes: categories.fixes.length,
      breakingChanges: breakingChanges.length,
      contributors: contributors.length,
    },
    sections: sectionsSummary,
    breakingChanges,
    contributors,
  };

  return result;
}

/**
 * Get current version from git tags or package.json
 */
async function getCurrentVersion(git: ReturnType<typeof simpleGit>): Promise<string> {
  try {
    // Try to get latest tag
    const tags = await git.tags();
    if (tags.latest) {
      return tags.latest;
    }
    if (tags.all.length > 0) {
      return tags.all[tags.all.length - 1];
    }
  } catch (error) {
    // Ignore errors, fall through to default
  }

  // Default to unreleased
  return "unreleased";
}
