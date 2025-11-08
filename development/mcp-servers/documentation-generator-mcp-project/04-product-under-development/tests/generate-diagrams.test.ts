import { generateDiagrams } from "../src/tools/generate-diagrams.js";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("generate_diagrams", () => {
  const testDir = path.join(__dirname, "fixtures", "diagram-test");
  const testFile = path.join(testDir, "test.ts");

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(
      testFile,
      `import { helper } from "./helper.js";

export class MyClass {
  constructor() {}
}
`,
      "utf-8"
    );
  });

  afterAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should generate dependency diagram", async () => {
    const result = await generateDiagrams({
      projectPath: testDir,
      diagramType: "dependencies",
    });

    const response = JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
    expect(response.diagram).toContain("graph");
  });

  it("should generate architecture diagram", async () => {
    const result = await generateDiagrams({
      projectPath: testDir,
      diagramType: "architecture",
    });

    const response = JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
    expect(response.stats.nodesCount).toBeGreaterThanOrEqual(0);
  });

  it("should generate dataflow diagram", async () => {
    const result = await generateDiagrams({
      projectPath: testDir,
      diagramType: "dataflow",
    });

    const response = JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
    expect(response.diagram).toContain("flowchart");
  });
});
