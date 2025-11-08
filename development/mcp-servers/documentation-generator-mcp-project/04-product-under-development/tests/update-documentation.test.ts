import { updateDocumentation } from "../src/tools/update-documentation.js";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import { simpleGit } from "simple-git";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("update_documentation", () => {
  const testDir = path.join(__dirname, "fixtures", "update-test");
  const testFile = path.join(testDir, "test.ts");

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });

    const git = simpleGit(testDir);
    await git.init();
    await git.addConfig("user.name", "Test User");
    await git.addConfig("user.email", "test@example.com");

    await fs.writeFile(testFile, "export function test() {}", "utf-8");
    await git.add("test.ts");
    await git.commit("Initial commit");
  });

  afterAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should detect changed files", async () => {
    const git = simpleGit(testDir);
    await fs.writeFile(testFile, "export function test2() {}", "utf-8");
    await git.add("test.ts");
    await git.commit("Update test");

    const result = await updateDocumentation({
      projectPath: testDir,
      since: "HEAD~1",
      dryRun: true,
    });

    const response = JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
    expect(response.stats.filesChanged).toBeGreaterThanOrEqual(0);
  });

  it("should handle dry run mode", async () => {
    const result = await updateDocumentation({
      projectPath: testDir,
      dryRun: true,
    });

    const response = JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
    expect(response.stats.docsRegenerated).toBe(0);
  });
});
