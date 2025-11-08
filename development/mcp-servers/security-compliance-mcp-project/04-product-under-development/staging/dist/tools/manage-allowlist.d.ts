/**
 * Tool: manage_allowlist
 *
 * Add or remove entries from the security allow-list to filter false positives
 */
import type { AllowListEntry } from '../types/index.js';
export interface ManageAllowListArgs {
    action: 'add' | 'remove' | 'list';
    entry?: {
        filePath?: string;
        lineNumber?: number;
        patternName?: string;
        matchedText?: string;
        reason: string;
        addedBy?: string;
    };
    index?: number;
}
export interface AllowListResult {
    success: boolean;
    action: string;
    allowList: AllowListEntry[];
    message: string;
}
/**
 * Manage security allow-list
 */
export declare function manageAllowList(args: ManageAllowListArgs, configPath?: string): Promise<AllowListResult>;
/**
 * Format allow-list for display
 */
export declare function formatAllowList(result: AllowListResult): string;
//# sourceMappingURL=manage-allowlist.d.ts.map