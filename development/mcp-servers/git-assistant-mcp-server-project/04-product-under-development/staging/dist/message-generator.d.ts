import { CommitMessageResult, Commit } from './types.js';
export declare class MessageGenerator {
    generateCommitMessage(diff: string, diffStat: string, recentCommits: Commit[], style?: 'conventional' | 'simple' | 'detailed'): Promise<CommitMessageResult>;
    private detectChangeType;
    private extractKeyChanges;
    private learnCommitStyle;
    private generateSubject;
    private getActionVerb;
    private summarizeChanges;
    private generateBody;
    private truncateSubject;
    private calculateConfidence;
    private generateExplanation;
    private getTypeDescription;
}
//# sourceMappingURL=message-generator.d.ts.map