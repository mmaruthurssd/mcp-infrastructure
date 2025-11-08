import { ReleaseCoordinator } from "../coordination/releaseCoordinator.js";
export async function coordinateRelease(params) {
    const { projectPath } = params;
    // Initialize release coordinator
    const coordinator = new ReleaseCoordinator(projectPath);
    await coordinator.initialize();
    // Execute coordinated release
    return await coordinator.coordinateRelease(params);
}
//# sourceMappingURL=coordinateRelease.js.map