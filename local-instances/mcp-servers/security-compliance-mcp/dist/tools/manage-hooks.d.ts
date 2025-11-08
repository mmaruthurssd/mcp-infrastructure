/**
 * Tool: manage_hooks
 *
 * Install, uninstall, and check status of git pre-commit hooks
 */
export interface ManageHooksArgs {
    action: 'install' | 'uninstall' | 'status';
    gitDir?: string;
}
export interface ManageHooksResult {
    success: boolean;
    action: string;
    message: string;
    details?: {
        installed?: boolean;
        hookPath?: string;
        hasBackup?: boolean;
    };
}
/**
 * Manage git hooks
 */
export declare function manageHooks(args: ManageHooksArgs): Promise<ManageHooksResult>;
/**
 * Format hook management results for display
 */
export declare function formatHookManagementResult(result: ManageHooksResult): string;
//# sourceMappingURL=manage-hooks.d.ts.map