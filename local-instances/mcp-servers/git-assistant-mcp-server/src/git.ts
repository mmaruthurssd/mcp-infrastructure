// Git command wrappers using simple-git

import simpleGit, { SimpleGit, StatusResult, DefaultLogFields, LogResult } from 'simple-git';
import { GitStatus, FileChange, Commit, DiffSummary, FileDiff } from './types.js';

export class GitWrapper {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath?: string) {
    this.repoPath = repoPath || process.cwd();
    this.git = simpleGit(this.repoPath);
  }

  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.revparse(['--git-dir']);
      return true;
    } catch {
      return false;
    }
  }

  async getStatus(): Promise<GitStatus> {
    const status: StatusResult = await this.git.status();

    const staged: FileChange[] = [
      ...status.staged.map(file => ({ path: file, status: 'modified' as const })),
      ...status.created.map(file => ({ path: file, status: 'added' as const })),
      ...status.deleted.map(file => ({ path: file, status: 'deleted' as const })),
      ...status.renamed.map(file => ({ path: file.to, status: 'renamed' as const })),
    ];

    const unstaged: FileChange[] = [
      ...status.modified.map(file => ({ path: file, status: 'modified' as const })),
      ...status.not_added.map(file => ({ path: file, status: 'untracked' as const })),
    ];

    const untracked: FileChange[] = status.files
      .filter(file => file.working_dir === '?' && file.index === '?')
      .map(file => ({ path: file.path, status: 'untracked' as const }));

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

  async getRecentCommits(count: number = 10): Promise<Commit[]> {
    const log: LogResult<DefaultLogFields> = await this.git.log({ maxCount: count });

    return Promise.all(
      log.all.map(async (commit) => {
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
      })
    );
  }

  private async getCommitStats(hash: string): Promise<{ files_changed: number; insertions: number; deletions: number }> {
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
    } catch {
      return { files_changed: 0, insertions: 0, deletions: 0 };
    }
  }

  async getDiffSummary(): Promise<DiffSummary> {
    const diff = await this.git.diffSummary();

    const files: FileDiff[] = diff.files.map(file => {
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

  private generateChangeSummary(filePath: string, insertions: number, deletions: number): string {
    const fileName = filePath.split('/').pop() || filePath;

    if (insertions === 0 && deletions > 0) {
      return `Removed ${deletions} lines from ${fileName}`;
    } else if (deletions === 0 && insertions > 0) {
      return `Added ${insertions} lines to ${fileName}`;
    } else {
      return `Modified ${fileName} (+${insertions}/-${deletions})`;
    }
  }

  async getTimeSinceLastCommit(): Promise<number> {
    try {
      const log = await this.git.log({ maxCount: 1 });
      if (log.latest) {
        const lastCommitDate = new Date(log.latest.date);
        const now = new Date();
        const diffMs = now.getTime() - lastCommitDate.getTime();
        return Math.floor(diffMs / 1000 / 60); // Return minutes
      }
      return 0;
    } catch {
      return 0;
    }
  }

  async getDiff(): Promise<string> {
    return await this.git.diff();
  }

  async getFullDiffStat(): Promise<string> {
    return await this.git.diff(['--stat']);
  }
}
