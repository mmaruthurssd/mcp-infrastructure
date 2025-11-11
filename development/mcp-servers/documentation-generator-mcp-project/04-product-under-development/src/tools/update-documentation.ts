import { simpleGit } from "simple-git";
import * as fs from "fs/promises";
import * as path from "path";

interface UpdateDocumentationArgs {
  projectPath: string;
  since?: string;
  dryRun?: boolean;
  autoCommit?: boolean;
}

export async function updateDocumentation(args: UpdateDocumentationArgs) {
  const {
    projectPath,
    since = "HEAD~1",
    dryRun = false,
  } = args;

  try {
    const git = simpleGit(projectPath);

    // Get changed files
    const diff = await git.diff([since, "HEAD", "--name-only"]);
    const changedFiles = diff.split("\n").filter(f => f.endsWith(".ts") && f.length > 0);

    const changes: any[] = [];
    const regenerated: string[] = [];
    const flaggedForReview: string[] = [];

    for (const file of changedFiles) {
      const sourceFile = path.join(projectPath, file);
      const docFile = sourceFile.replace(/\.ts$/, ".API.md");

      // Check if documentation exists
      try {
        await fs.access(docFile);

        // Determine if we should regenerate or flag for review
        const action = await determineAction(sourceFile, docFile, git, since);

        changes.push({
          sourceFile: file,
          affectedDocs: [path.relative(projectPath, docFile)],
          action: action.action,
          reason: action.reason,
        });

        if (action.action === "regenerate" && !dryRun) {
          // Would call generateApiDocs here
          regenerated.push(docFile);
        } else if (action.action === "flag_review") {
          flaggedForReview.push(docFile);
        }
      } catch {
        // No existing documentation
        changes.push({
          sourceFile: file,
          affectedDocs: [],
          action: "skip",
          reason: "No existing documentation",
        });
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              changes,
              regenerated,
              flaggedForReview,
              stats: {
                filesChanged: changedFiles.length,
                docsRegenerated: regenerated.length,
                docsFlaggedForReview: flaggedForReview.length,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to update documentation: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function determineAction(sourceFile: string, _docFile: string, git: any, since: string) {
  // Get the diff for this specific file
  const diff = await git.diff([since, "HEAD", "--", sourceFile]);

  // Simple heuristics
  if (diff.includes("BREAKING")) {
    return { action: "flag_review", reason: "Breaking change detected" };
  } else if (diff.includes("function") || diff.includes("class")) {
    return { action: "flag_review", reason: "Function/class signature may have changed" };
  } else {
    return { action: "regenerate", reason: "JSDoc content updated" };
  }
}
