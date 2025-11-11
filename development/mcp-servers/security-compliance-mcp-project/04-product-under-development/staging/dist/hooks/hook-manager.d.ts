/**
 * Git hook manager
 *
 * Install, uninstall, and manage git pre-commit hooks
 */
export interface HookInstallResult {
    success: boolean;
    message: string;
    hookPath?: string;
    backupPath?: string;
}
/**
 * Install pre-commit hook
 */
export declare function installPreCommitHook(gitDir?: string): Promise<HookInstallResult>;
/**
 * Uninstall pre-commit hook
 */
export declare function uninstallPreCommitHook(gitDir?: string): Promise<HookInstallResult>;
/**
 * Check hook installation status
 */
export declare function checkHookStatus(gitDir?: string): Promise<{
    installed: boolean;
    hookPath?: string;
    hasBackup: boolean;
    message: string;
}>;
//# sourceMappingURL=hook-manager.d.ts.map