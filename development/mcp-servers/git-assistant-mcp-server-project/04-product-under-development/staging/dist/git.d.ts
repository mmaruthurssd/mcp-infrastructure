import { GitStatus, Commit, DiffSummary } from './types.js';
export declare class GitWrapper {
    private git;
    private repoPath;
    constructor(repoPath?: string);
    isGitRepository(): Promise<boolean>;
    getStatus(): Promise<GitStatus>;
    getRecentCommits(count?: number): Promise<Commit[]>;
    private getCommitStats;
    getDiffSummary(): Promise<DiffSummary>;
    private generateChangeSummary;
    getTimeSinceLastCommit(): Promise<number>;
    getDiff(): Promise<string>;
    getFullDiffStat(): Promise<string>;
}
//# sourceMappingURL=git.d.ts.map