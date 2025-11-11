import { validateDeployment } from "../../src/tools/validateDeployment.js";

describe("validateDeployment", () => {
  it("should validate required parameters", async () => {
    await expect(
      validateDeployment({
        projectPath: "",
        environment: "dev",
      })
    ).rejects.toThrow();
  });
});
