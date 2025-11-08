// Git command wrappers using simple-git
import simpleGit from 'simple-git';
export class GitWrapper {
    git;
    repoPath;
    constructor(repoPath) {
        this.repoPath = repoPath || process.cwd();
        this.git = simpleGit(this.repoPath);
    }
    async isGitRepository() {
        try {
            await this.git.revparse(['--git-dir']);
            return true;
        }
        catch {
            return false;
        }
    }
    async getStatus() {
        const status = await this.git.status();
        const staged = [
            ...status.staged.map(file => ({ path: file, status: 'modified' })),
            ...status.created.map(file => ({ path: file, status: 'added' })),
            ...status.deleted.map(file => ({ path: file, status: 'deleted' })),
            ...status.renamed.map(file => ({ path: file.to, status: 'renamed' })),
        ];
        const unstaged = [
            ...status.modified.map(file => ({ path: file, status: 'modified' })),
            ...status.not_added.map(file => ({ path: file, status: 'untracked' })),
        ];
        const untracked = status.files
            .filter(file => file.working_dir === '?' && file.index === '?')
            .map(file => ({ path: file.path, status: 'untracked' }));
        return {
            branch: status.current || 'unknown',
            ahead: status.ahead,
            behind: status.behind,
            staged,
            unstaged,
            untracked,
            total_changes: staged.length + unstaged.length + untracked.length,
            is_clean: status.isClean(),
        };
    }
    async getRecentCommits(count = 10) {
        const log = await this.git.log({ maxCount: count });
        return Promise.all(log.all.map(async (commit) => {
            const stats = await this.getCommitStats(commit.hash);
            return {
                hash: commit.hash.substring(0, 7),
                author: commit.author_name,
                date: commit.date,
                message: commit.message,
                files_changed: stats.files_changed,
                insertions: stats.insertions,
                deletions: stats.deletions,
            };
        }));
    }
    async getCommitStats(hash) {
        try {
            const diffStat = await this.git.show([hash, '--stat', '--format=']);
            const lines = diffStat.split('\n').filter(line => line.trim());
            // Parse the summary line (e.g., "3 files changed, 127 insertions(+), 34 deletions(-)")
            const summaryLine = lines[lines.length - 1];
            const filesMatch = summaryLine.match(/(\d+) files? changed/);
            const insertionsMatch = summaryLine.match(/(\d+) insertions?\(\+\)/);
            const deletionsMatch = summaryLine.match(/(\d+) deletions?\(-\)/);
            return {
                files_changed: filesMatch ? parseInt(filesMatch[1]) : 0,
                insertions: insertionsMatch ? parseInt(insertionsMatch[1]) : 0,
                deletions: deletionsMatch ? parseInt(deletionsMatch[1]) : 0,
            };
        }
        catch {
            return { files_changed: 0, insertions: 0, deletions: 0 };
        }
    }
    async getDiffSummary() {
        const diff = await this.git.diffSummary();
        const files = diff.files.map(file => {
            // Handle binary files which don't have insertions/deletions
            const insertions = 'insertions' in file ? file.insertions : 0;
            const deletions = 'deletions' in file ? file.deletions : 0;
            return {
                path: file.file,
                insertions,
                deletions,
                change_summary: this.generateChangeSummary(file.file, insertions, deletions),
            };
        });
        return {
            total_files_changed: diff.files.length,
            insertions: diff.insertions,
            deletions: diff.deletions,
            files,
        };
    }
    generateChangeSummary(filePath, insertions, deletions) {
        const fileName = filePath.split('/').pop() || filePath;
        if (insertions === 0 && deletions > 0) {
            return `Removed ${deletions} lines from ${fileName}`;
        }
        else if (deletions === 0 && insertions > 0) {
            return `Added ${insertions} lines to ${fileName}`;
        }
        else {
            return `Modified ${fileName} (+${insertions}/-${deletions})`;
        }
    }
    async getTimeSinceLastCommit() {
        try {
            const log = await this.git.log({ maxCount: 1 });
            if (log.latest) {
                const lastCommitDate = new Date(log.latest.date);
                const now = new Date();
                const diffMs = now.getTime() - lastCommitDate.getTime();
                return Math.floor(diffMs / 1000 / 60); // Return minutes
            }
            return 0;
        }
        catch {
            return 0;
        }
    }
    async getDiff() {
        return await this.git.diff();
    }
    async getFullDiffStat() {
        return await this.git.diff(['--stat']);
    }
}
//# sourceMappingURL=git.js.map