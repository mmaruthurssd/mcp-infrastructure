import { rollbackDeployment } from "../../src/tools/rollbackDeployment.js";

describe("rollbackDeployment", () => {
  it("should require reason parameter", async () => {
    await expect(
      rollbackDeployment({
        projectPath: "/tmp/test",
        environment: "dev",
        reason: "",
      })
    ).rejects.toThrow();
  });
});
