import { generateChangelog } from "../src/tools/generate-changelog.js";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import { simpleGit } from "simple-git";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("generate_changelog", () => {
  const testDir = path.join(__dirname, "fixtures", "git-test");

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });

    // Initialize git repo with test commits
    const git = simpleGit(testDir);
    await git.init();
    await git.addConfig("user.name", "Test User");
    await git.addConfig("user.email", "test@example.com");

    await fs.writeFile(path.join(testDir, "test.txt"), "initial", "utf-8");
    await git.add("test.txt");
    await git.commit("feat: initial commit");

    await fs.writeFile(path.join(testDir, "test.txt"), "updated", "utf-8");
    await git.add("test.txt");
    await git.commit("fix: bug fix");
  });

  afterAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should generate changelog from git commits", async () => {
    const result = await generateChangelog({
      projectPath: testDir,
      format: "simple",
    });

    const response = JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
    expect(response.stats.totalCommits).toBeGreaterThan(0);
  });

  it("should categorize commits by type", async () => {
    const result = await generateChangelog({
      projectPath: testDir,
      format: "keepachangelog",
    });

    const response = JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
    expect(response.stats.features).toBeGreaterThanOrEqual(1);
    expect(response.stats.fixes).toBeGreaterThanOrEqual(1);
  });
});
