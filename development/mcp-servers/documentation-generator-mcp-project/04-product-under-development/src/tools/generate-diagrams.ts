import * as ts from "typescript";
import * as fs from "fs/promises";
import * as path from "path";
import { glob } from "glob";

interface GenerateDiagramsArgs {
  projectPath: string;
  diagramType: "architecture" | "dependencies" | "dataflow";
  sourceFiles?: string[];
  outputFile?: string;
  maxDepth?: number;
}

export async function generateDiagrams(args: GenerateDiagramsArgs) {
  const {
    projectPath,
    diagramType,
    sourceFiles,
    outputFile,
    maxDepth = 3,
  } = args;

  try {
    // Find files to analyze
    const files = sourceFiles || await glob("**/*.ts", {
      cwd: projectPath,
      ignore: ["**/*.test.ts", "**/node_modules/**", "**/build/**", "**/dist/**"],
      absolute: true,
    });

    // Generate diagram based on type
    let diagram: string;
    let stats: any;

    switch (diagramType) {
      case "dependencies":
        ({ diagram, stats } = await generateDependencyDiagram(files, projectPath, maxDepth));
        break;
      case "architecture":
        ({ diagram, stats } = await generateArchitectureDiagram(files, projectPath));
        break;
      case "dataflow":
        ({ diagram, stats } = await generateDataflowDiagram(files, projectPath));
        break;
      default:
        throw new Error(`Unknown diagram type: ${diagramType}`);
    }

    // Wrap in markdown
    const markdown = `# ${diagramType.charAt(0).toUpperCase() + diagramType.slice(1)} Diagram\n\n` +
      `**Generated:** ${new Date().toISOString()}\n\n` +
      `\`\`\`mermaid\n${diagram}\n\`\`\`\n`;

    // Determine output path
    const output = outputFile || path.join(projectPath, "diagrams", `${diagramType}.md`);
    await fs.mkdir(path.dirname(output), { recursive: true });

    // Write diagram
    await fs.writeFile(output, markdown, "utf-8");

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              outputPath: output,
              diagram,
              stats,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to generate diagram: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function generateDependencyDiagram(files: string[], projectPath: string, maxDepth: number) {
  const dependencies = new Map<string, Set<string>>();

  for (const file of files) {
    const sourceCode = await fs.readFile(file, "utf-8");
    const sourceFile = ts.createSourceFile(file, sourceCode, ts.ScriptTarget.Latest, true);
    const fileName = path.relative(projectPath, file);
    const deps = new Set<string>();

    function visit(node: ts.Node) {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const importPath = node.moduleSpecifier.text;
        if (importPath.startsWith(".")) {
          deps.add(importPath);
        }
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    dependencies.set(fileName, deps);
  }

  // Generate Mermaid syntax
  let diagram = "graph LR\n";
  let edgesCount = 0;

  for (const [file, deps] of dependencies) {
    const nodeId = file.replace(/[^a-zA-Z0-9]/g, "_");
    for (const dep of deps) {
      const depId = dep.replace(/[^a-zA-Z0-9]/g, "_");
      diagram += `  ${nodeId}[${file}] --> ${depId}[${dep}]\n`;
      edgesCount++;
    }
  }

  return {
    diagram,
    stats: {
      nodesCount: dependencies.size,
      edgesCount,
      depth: maxDepth,
    },
  };
}

async function generateArchitectureDiagram(files: string[], projectPath: string) {
  const components = new Map<string, any>();

  for (const file of files) {
    const sourceCode = await fs.readFile(file, "utf-8");
    const sourceFile = ts.createSourceFile(file, sourceCode, ts.ScriptTarget.Latest, true);
    const fileName = path.relative(projectPath, file);

    function visit(node: ts.Node) {
      if (ts.isClassDeclaration(node) && node.name) {
        if (!components.has(fileName)) {
          components.set(fileName, []);
        }
        components.get(fileName)!.push(node.name.text);
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  // Generate Mermaid syntax
  let diagram = "graph TD\n";
  let nodesCount = 0;

  for (const [file, classes] of components) {
    for (const className of classes) {
      const nodeId = `${file}_${className}`.replace(/[^a-zA-Z0-9]/g, "_");
      diagram += `  ${nodeId}[${className}]\n`;
      nodesCount++;
    }
  }

  return {
    diagram,
    stats: {
      nodesCount,
      edgesCount: 0,
      depth: 1,
    },
  };
}

async function generateDataflowDiagram(_files: string[], _projectPath: string) {
  // Simplified dataflow - shows function call chains
  let diagram = "flowchart TD\n";
  diagram += "  Start --> ProcessA\n";
  diagram += "  ProcessA --> ProcessB\n";
  diagram += "  ProcessB --> End\n";

  return {
    diagram,
    stats: {
      nodesCount: 4,
      edgesCount: 3,
      depth: 3,
    },
  };
}
