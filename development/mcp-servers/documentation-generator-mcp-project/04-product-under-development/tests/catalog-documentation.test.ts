import { catalogDocumentation } from "../src/tools/catalog-documentation.js";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("catalog_documentation", () => {
  const testDir = path.join(__dirname, "fixtures", "catalog-test");
  const doc1 = path.join(testDir, "doc1.md");
  const doc2 = path.join(testDir, "doc2.md");
  const outputFile = path.join(testDir, "DOCS-INDEX.md");

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });

    await fs.writeFile(
      doc1,
      `---
type: guide
tags: [test, example]
---

# Document 1

This is a test document.
`,
      "utf-8"
    );

    await fs.writeFile(
      doc2,
      `# Document 2

Another test document.
`,
      "utf-8"
    );
  });

  afterAll(async () => {
    try {
      await fs.unlink(doc1);
      await fs.unlink(doc2);
      await fs.unlink(outputFile);
      await fs.rmdir(testDir);
      await fs.rmdir(path.join(__dirname, "fixtures"));
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should catalog all markdown files", async () => {
    const result = await catalogDocumentation({
      projectPath: testDir,
      outputFile,
    });

    const response = JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
    expect(response.stats.totalDocs).toBe(2);
    expect(response.catalog.length).toBe(2);
  });

  it("should extract YAML frontmatter", async () => {
    const result = await catalogDocumentation({
      projectPath: testDir,
      extractMetadata: true,
    });

    const response = JSON.parse(result.content[0].text);
    const doc1Entry = response.catalog.find((c: any) => c.filePath.includes("doc1.md"));
    expect(doc1Entry.type).toBe("guide");
    expect(doc1Entry.tags).toEqual(["test", "example"]);
  });

  it("should generate navigation tree", async () => {
    const result = await catalogDocumentation({
      projectPath: testDir,
    });

    const response = JSON.parse(result.content[0].text);
    expect(response.navigation).toContain("Document 1");
    expect(response.navigation).toContain("Document 2");
  });
});
