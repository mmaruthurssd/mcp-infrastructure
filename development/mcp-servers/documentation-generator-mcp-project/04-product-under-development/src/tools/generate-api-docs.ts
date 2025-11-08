import * as ts from "typescript";
import * as fs from "fs/promises";
import * as path from "path";

interface GenerateApiDocsArgs {
  sourceFile: string;
  outputFile?: string;
  includePrivate?: boolean;
  includeExamples?: boolean;
  format?: "markdown" | "html";
}

export async function generateApiDocs(args: GenerateApiDocsArgs) {
  const {
    sourceFile,
    outputFile,
    includePrivate = false,
  } = args;

  try {
    // Validate source file exists
    await fs.access(sourceFile);

    // Parse TypeScript file
    const sourceCode = await fs.readFile(sourceFile, "utf-8");
    const sourceFileObj = ts.createSourceFile(
      sourceFile,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    // Extract documented symbols
    const documentation = extractDocumentation(sourceFileObj, includePrivate);

    // Generate markdown
    const markdown = generateMarkdown(documentation, sourceFile);

    // Determine output path
    const output = outputFile || sourceFile.replace(/\.ts$/, ".API.md");

    // Write documentation
    await fs.writeFile(output, markdown, "utf-8");

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              outputPath: output,
              stats: {
                functionsDocumented: documentation.functions.length,
                classesDocumented: documentation.classes.length,
                interfacesDocumented: documentation.interfaces.length,
                typesDocumented: documentation.types.length,
                totalSymbols: documentation.functions.length + documentation.classes.length + documentation.interfaces.length + documentation.types.length,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to generate API docs: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function extractDocumentation(sourceFile: ts.SourceFile, includePrivate: boolean) {
  const documentation = {
    functions: [] as any[],
    classes: [] as any[],
    interfaces: [] as any[],
    types: [] as any[],
  };

  function visit(node: ts.Node) {
    // Check if node is exported or if we include private
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    const isExported = modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!includePrivate && !isExported) {
      ts.forEachChild(node, visit);
      return;
    }

    // Extract JSDoc comments
    const jsDoc = (ts as any).getJSDocCommentsAndTags?.(node) || [];
    const description = jsDoc.length > 0 ? getJSDocDescription(jsDoc[0]) : "";

    if (ts.isFunctionDeclaration(node) && node.name) {
      documentation.functions.push({
        name: node.name.text,
        description,
        signature: node.getText(),
      });
    } else if (ts.isClassDeclaration(node) && node.name) {
      documentation.classes.push({
        name: node.name.text,
        description,
      });
    } else if (ts.isInterfaceDeclaration(node)) {
      documentation.interfaces.push({
        name: node.name.text,
        description,
      });
    } else if (ts.isTypeAliasDeclaration(node)) {
      documentation.types.push({
        name: node.name.text,
        description,
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return documentation;
}

function getJSDocDescription(jsDoc: any): string {
  if (jsDoc.comment) {
    return typeof jsDoc.comment === "string" ? jsDoc.comment : jsDoc.comment.map((c: any) => c.text).join("");
  }
  return "";
}

function generateMarkdown(documentation: any, sourceFile: string): string {
  const fileName = path.basename(sourceFile);
  let md = `# API Documentation: ${fileName}\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n\n`;

  if (documentation.functions.length > 0) {
    md += `## Functions\n\n`;
    for (const fn of documentation.functions) {
      md += `### ${fn.name}\n\n`;
      if (fn.description) {
        md += `${fn.description}\n\n`;
      }
      md += `\`\`\`typescript\n${fn.signature}\n\`\`\`\n\n`;
    }
  }

  if (documentation.classes.length > 0) {
    md += `## Classes\n\n`;
    for (const cls of documentation.classes) {
      md += `### ${cls.name}\n\n`;
      if (cls.description) {
        md += `${cls.description}\n\n`;
      }
    }
  }

  if (documentation.interfaces.length > 0) {
    md += `## Interfaces\n\n`;
    for (const iface of documentation.interfaces) {
      md += `### ${iface.name}\n\n`;
      if (iface.description) {
        md += `${iface.description}\n\n`;
      }
    }
  }

  if (documentation.types.length > 0) {
    md += `## Types\n\n`;
    for (const type of documentation.types) {
      md += `### ${type.name}\n\n`;
      if (type.description) {
        md += `${type.description}\n\n`;
      }
    }
  }

  return md;
}
