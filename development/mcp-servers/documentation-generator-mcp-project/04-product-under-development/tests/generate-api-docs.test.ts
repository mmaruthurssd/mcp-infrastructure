import { generateApiDocs } from "../src/tools/generate-api-docs.js";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("generate_api_docs", () => {
  const testFile = path.join(__dirname, "fixtures", "sample.ts");
  const outputFile = path.join(__dirname, "fixtures", "sample.API.md");

  beforeAll(async () => {
    await fs.mkdir(path.join(__dirname, "fixtures"), { recursive: true });
    await fs.writeFile(
      testFile,
      `/**
 * Sample function
 */
export function sampleFunction(a: number): number {
  return a * 2;
}

/**
 * Sample class
 */
export class SampleClass {
  constructor() {}
}

export interface SampleInterface {
  prop: string;
}

export type SampleType = string | number;
`,
      "utf-8"
    );
  });

  afterAll(async () => {
    try {
      await fs.unlink(testFile);
      await fs.unlink(outputFile);
      await fs.rmdir(path.join(__dirname, "fixtures"));
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should generate API documentation from TypeScript file", async () => {
    const result = await generateApiDocs({
      sourceFile: testFile,
      outputFile,
    });

    const response = JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
    expect(response.stats.functionsDocumented).toBe(1);
    expect(response.stats.classesDocumented).toBe(1);
    expect(response.stats.interfacesDocumented).toBe(1);
    expect(response.stats.typesDocumented).toBe(1);

    const doc = await fs.readFile(outputFile, "utf-8");
    expect(doc).toContain("sampleFunction");
    expect(doc).toContain("SampleClass");
  });

  it("should handle missing source file", async () => {
    await expect(
      generateApiDocs({
        sourceFile: "/nonexistent/file.ts",
      })
    ).rejects.toThrow();
  });
});
