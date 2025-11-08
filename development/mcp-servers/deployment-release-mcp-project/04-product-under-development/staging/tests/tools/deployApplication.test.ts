import { deployApplication } from "../../src/tools/deployApplication.js";

describe("deployApplication", () => {
  it("should validate required parameters", async () => {
    await expect(
      deployApplication({
        projectPath: "",
        environment: "dev",
      })
    ).rejects.toThrow();
  });

  it("should support dry-run mode", async () => {
    const result = await deployApplication({
      projectPath: "/tmp/test-project",
      environment: "dev",
      dryRun: true,
      preChecks: false,
    });

    expect(result.success).toBe(true);
    expect(result.preChecks.warnings).toContain(
      "DRY-RUN MODE: No actual deployment was performed"
    );
  });
});
