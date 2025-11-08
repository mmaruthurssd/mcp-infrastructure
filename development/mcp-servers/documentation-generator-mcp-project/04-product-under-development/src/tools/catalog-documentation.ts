import * as fs from "fs/promises";
import * as path from "path";
import { glob } from "glob";
import matter from "gray-matter";

interface CatalogDocumentationArgs {
  projectPath: string;
  outputFile?: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  extractMetadata?: boolean;
}

export async function catalogDocumentation(args: CatalogDocumentationArgs) {
  const {
    projectPath,
    outputFile,
    includePatterns = ["**/*.md"],
    excludePatterns = ["**/node_modules/**", "**/build/**", "**/dist/**"],
    extractMetadata = true,
  } = args;

  try {
    // Find all markdown files
    const files = await glob(includePatterns, {
      cwd: projectPath,
      ignore: excludePatterns,
      absolute: true,
    });

    const catalog: any[] = [];
    const byType: any = {};
    let totalWordCount = 0;
    const brokenLinks: any[] = [];

    for (const file of files) {
      const content = await fs.readFile(file, "utf-8");
      const relativePath = path.relative(projectPath, file);

      let metadata: any = {};
      let bodyContent = content;

      if (extractMetadata) {
        const parsed = matter(content);
        metadata = parsed.data;
        bodyContent = parsed.content;
      }

      // Extract title (first h1 or filename)
      const titleMatch = bodyContent.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : path.basename(file, ".md");

      // Count words
      const wordCount = bodyContent.split(/\s+/).length;
      totalWordCount += wordCount;

      // Extract links
      const linkMatches = bodyContent.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
      const links = Array.from(linkMatches).map(m => m[2]);

      // Get file stats
      const stats = await fs.stat(file);

      const entry = {
        filePath: relativePath,
        title,
        type: metadata.type || "unknown",
        tags: metadata.tags || [],
        lastModified: stats.mtime.toISOString(),
        wordCount,
        links,
      };

      catalog.push(entry);

      // Track by type
      const type = entry.type;
      byType[type] = (byType[type] || 0) + 1;
    }

    // Generate navigation tree
    const navigation = generateNavigation(catalog);

    // Generate catalog markdown
    const catalogMarkdown = generateCatalogMarkdown(catalog, byType, navigation);

    // Determine output path
    const output = outputFile || path.join(projectPath, "DOCS-INDEX.md");

    // Write catalog
    await fs.writeFile(output, catalogMarkdown, "utf-8");

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              outputPath: output,
              catalog,
              stats: {
                totalDocs: catalog.length,
                byType,
                avgWordCount: Math.round(totalWordCount / catalog.length),
                brokenLinks,
              },
              navigation,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to catalog documentation: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function generateNavigation(catalog: any[]): string {
  const byDir = new Map<string, any[]>();

  for (const doc of catalog) {
    const dir = path.dirname(doc.filePath);
    if (!byDir.has(dir)) {
      byDir.set(dir, []);
    }
    byDir.get(dir)!.push(doc);
  }

  let nav = "";
  for (const [dir, docs] of byDir) {
    nav += `\n## ${dir === "." ? "Root" : dir}\n\n`;
    for (const doc of docs) {
      nav += `- [${doc.title}](${doc.filePath})\n`;
    }
  }

  return nav;
}

function generateCatalogMarkdown(catalog: any[], byType: any, navigation: string): string {
  let md = `# Documentation Catalog\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n`;
  md += `**Total Documents:** ${catalog.length}\n\n`;

  md += `## By Type\n\n`;
  for (const [type, count] of Object.entries(byType)) {
    md += `- **${type}**: ${count}\n`;
  }

  md += `\n## Navigation\n`;
  md += navigation;

  md += `\n## All Documents\n\n`;
  for (const doc of catalog) {
    md += `### [${doc.title}](${doc.filePath})\n`;
    md += `- **Type:** ${doc.type}\n`;
    if (doc.tags.length > 0) {
      md += `- **Tags:** ${doc.tags.join(", ")}\n`;
    }
    md += `- **Words:** ${doc.wordCount}\n`;
    md += `- **Last Modified:** ${doc.lastModified}\n\n`;
  }

  return md;
}
