import type { CoordinateReleaseParams, CoordinateReleaseResult } from "../types.js";
import { ReleaseCoordinator } from "../coordination/releaseCoordinator.js";

export async function coordinateRelease(params: CoordinateReleaseParams): Promise<CoordinateReleaseResult> {
  const { projectPath } = params;

  // Initialize release coordinator
  const coordinator = new ReleaseCoordinator(projectPath);
  await coordinator.initialize();

  // Execute coordinated release
  return await coordinator.coordinateRelease(params);
}
