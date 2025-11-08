import { trackDocCoverage } from "../src/tools/track-doc-coverage.js";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("track_doc_coverage", () => {
  const testDir = path.join(__dirname, "fixtures", "coverage-test");
  const documentedFile = path.join(testDir, "documented.ts");
  const undocumentedFile = path.join(testDir, "undocumented.ts");

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });

    await fs.writeFile(
      documentedFile,
      `/**
 * Documented function
 */
export function documented(): void {}
`,
      "utf-8"
    );

    await fs.writeFile(
      undocumentedFile,
      `export function undocumented(): void {}
`,
      "utf-8"
    );
  });

  afterAll(async () => {
    try {
      await fs.unlink(documentedFile);
      await fs.unlink(undocumentedFile);
      await fs.rmdir(testDir);
      await fs.rmdir(path.join(__dirname, "fixtures"));
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should calculate documentation coverage", async () => {
    const result = await trackDocCoverage({
      projectPath: testDir,
      minCoverage: 50,
    });

    const response = JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
    expect(response.coverage.total).toBe(2);
    expect(response.coverage.documented).toBe(1);
    expect(response.coverage.undocumented).toBe(1);
    expect(response.coverage.percentage).toBe(50);
  });

  it("should report gaps for undocumented code", async () => {
    const result = await trackDocCoverage({
      projectPath: testDir,
      reportFormat: "detailed",
    });

    const response = JSON.parse(result.content[0].text);
    expect(response.gaps.length).toBeGreaterThan(0);
    expect(response.gaps[0].symbol).toBe("undocumented");
  });
});
