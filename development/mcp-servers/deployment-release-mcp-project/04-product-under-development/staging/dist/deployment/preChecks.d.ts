import type { PreCheckResult } from "../types.js";
export interface PreCheckOptions {
    codeQuality?: boolean;
    tests?: boolean;
    security?: boolean;
}
export declare class PreChecksManager {
    private projectPath;
    constructor(projectPath: string);
    runAllChecks(options?: PreCheckOptions): Promise<PreCheckResult[]>;
    private runCodeQualityCheck;
    private runTestsCheck;
    private runSecurityCheck;
}
//# sourceMappingURL=preChecks.d.ts.map