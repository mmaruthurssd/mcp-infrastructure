import * as ts from "typescript";
import * as fs from "fs/promises";
import * as path from "path";
import { glob } from "glob";

interface TrackDocCoverageArgs {
  projectPath: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  minCoverage?: number;
  reportFormat?: "summary" | "detailed" | "json";
}

export async function trackDocCoverage(args: TrackDocCoverageArgs) {
  const {
    projectPath,
    includePatterns = ["**/*.ts"],
    excludePatterns = ["**/*.test.ts", "**/node_modules/**", "**/build/**", "**/dist/**"],
    minCoverage = 70,
    reportFormat = "summary",
  } = args;

  try {
    // Find all TypeScript files
    const files = await glob(includePatterns, {
      cwd: projectPath,
      ignore: excludePatterns,
      absolute: true,
    });

    // Analyze each file
    let totalDocumented = 0;
    let totalUndocumented = 0;
    const byType: any = {
      functions: { documented: 0, total: 0 },
      classes: { documented: 0, total: 0 },
      interfaces: { documented: 0, total: 0 },
      types: { documented: 0, total: 0 },
    };
    const gaps: any[] = [];

    for (const file of files) {
      const analysis = await analyzeFile(file, projectPath);
      totalDocumented += analysis.documented;
      totalUndocumented += analysis.undocumented;

      // Update by type
      for (const [type, stats] of Object.entries(analysis.byType)) {
        byType[type].documented += (stats as any).documented;
        byType[type].total += (stats as any).total;
      }

      gaps.push(...analysis.gaps);
    }

    const total = totalDocumented + totalUndocumented;
    const percentage = total > 0 ? Math.round((totalDocumented / total) * 100) : 100;

    // Calculate percentages by type
    for (const type of Object.keys(byType)) {
      const stats = byType[type];
      stats.percentage = stats.total > 0 ? Math.round((stats.documented / stats.total) * 100) : 100;
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              coverage: {
                percentage,
                documented: totalDocumented,
                undocumented: totalUndocumented,
                total,
              },
              byType,
              gaps: reportFormat === "detailed" ? gaps : gaps.slice(0, 10),
              passesThreshold: percentage >= minCoverage,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to track doc coverage: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function analyzeFile(filePath: string, projectPath: string) {
  const sourceCode = await fs.readFile(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  let documented = 0;
  let undocumented = 0;
  const byType: any = {
    functions: { documented: 0, total: 0 },
    classes: { documented: 0, total: 0 },
    interfaces: { documented: 0, total: 0 },
    types: { documented: 0, total: 0 },
  };
  const gaps: any[] = [];

  function visit(node: ts.Node) {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    const isExported = modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) {
      ts.forEachChild(node, visit);
      return;
    }

    const jsDoc = (ts as any).getJSDocCommentsAndTags?.(node) || [];
    const hasDoc = jsDoc.length > 0;
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

    if (ts.isFunctionDeclaration(node) && node.name) {
      byType.functions.total++;
      if (hasDoc) {
        byType.functions.documented++;
        documented++;
      } else {
        undocumented++;
        gaps.push({
          file: path.relative(projectPath, filePath),
          symbol: node.name.text,
          type: "function",
          line,
          priority: "high",
        });
      }
    } else if (ts.isClassDeclaration(node) && node.name) {
      byType.classes.total++;
      if (hasDoc) {
        byType.classes.documented++;
        documented++;
      } else {
        undocumented++;
        gaps.push({
          file: path.relative(projectPath, filePath),
          symbol: node.name.text,
          type: "class",
          line,
          priority: "high",
        });
      }
    } else if (ts.isInterfaceDeclaration(node)) {
      byType.interfaces.total++;
      if (hasDoc) {
        byType.interfaces.documented++;
        documented++;
      } else {
        undocumented++;
        gaps.push({
          file: path.relative(projectPath, filePath),
          symbol: node.name.text,
          type: "interface",
          line,
          priority: "medium",
        });
      }
    } else if (ts.isTypeAliasDeclaration(node)) {
      byType.types.total++;
      if (hasDoc) {
        byType.types.documented++;
        documented++;
      } else {
        undocumented++;
        gaps.push({
          file: path.relative(projectPath, filePath),
          symbol: node.name.text,
          type: "type",
          line,
          priority: "medium",
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return { documented, undocumented, byType, gaps };
}
