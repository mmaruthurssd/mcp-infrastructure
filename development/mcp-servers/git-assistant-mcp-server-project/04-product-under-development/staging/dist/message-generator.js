// Commit message generator
export class MessageGenerator {
    async generateCommitMessage(diff, diffStat, recentCommits, style = 'conventional') {
        // Detect change type from diff
        const changeType = this.detectChangeType(diff, diffStat);
        // Extract key changes from diff
        const keyChanges = this.extractKeyChanges(diff, diffStat);
        // Learn from recent commits
        const commitStyle = this.learnCommitStyle(recentCommits);
        // Generate subject line
        const subject = this.generateSubject(changeType, keyChanges, style);
        // Generate body
        const body = this.generateBody(keyChanges, style);
        // Combine into full message
        const full_message = body ? `${subject}\n\n${body}` : subject;
        // Calculate confidence
        const confidence = this.calculateConfidence(keyChanges, recentCommits);
        // Generate explanation
        const explanation = this.generateExplanation(changeType, keyChanges, commitStyle);
        return {
            subject,
            body,
            full_message,
            change_type: changeType,
            confidence,
            explanation,
        };
    }
    detectChangeType(diff, diffStat) {
        const lowerDiff = diff.toLowerCase();
        const lowerStat = diffStat.toLowerCase();
        // Check for documentation changes
        if (diffStat.includes('README') || diffStat.includes('.md') || lowerStat.includes('docs/')) {
            return 'docs';
        }
        // Check for test changes
        if (lowerStat.includes('test') || lowerStat.includes('.test.') || lowerStat.includes('.spec.')) {
            return 'test';
        }
        // Check for style changes (formatting, whitespace)
        if (lowerDiff.includes('prettier') || lowerDiff.includes('eslint') || lowerDiff.includes('formatting')) {
            return 'style';
        }
        // Check for bug fixes
        if (lowerDiff.includes('fix') || lowerDiff.includes('bug') || lowerDiff.includes('error') ||
            lowerDiff.includes('issue') || lowerDiff.includes('patch')) {
            return 'fix';
        }
        // Check for refactoring
        if (lowerDiff.includes('refactor') || lowerDiff.includes('rename') ||
            lowerDiff.includes('extract') || lowerDiff.includes('reorganize')) {
            return 'refactor';
        }
        // Check for chore (config, dependencies)
        if (lowerDiff.includes('package.json') || lowerDiff.includes('tsconfig') ||
            lowerDiff.includes('config') || lowerDiff.includes('dependency')) {
            return 'chore';
        }
        // Default to feature
        return 'feat';
    }
    extractKeyChanges(diff, diffStat) {
        const changes = [];
        // Parse diffStat to get file changes
        const lines = diffStat.split('\n').filter(line => line.trim() && !line.includes('file changed'));
        for (const line of lines) {
            const match = line.match(/^\s*(.+?)\s*\|\s*\d+/);
            if (match) {
                const filePath = match[1].trim();
                const fileName = filePath.split('/').pop() || filePath;
                // Detect what was changed in this file
                if (line.includes('+++') || diff.includes(`+++ b/${filePath}`)) {
                    changes.push(`Added/modified ${fileName}`);
                }
            }
        }
        // If we couldn't extract detailed changes, provide generic summary
        if (changes.length === 0) {
            const fileCount = lines.length;
            if (fileCount > 0) {
                changes.push(`Modified ${fileCount} file${fileCount > 1 ? 's' : ''}`);
            }
        }
        return changes.slice(0, 5); // Limit to 5 key changes
    }
    learnCommitStyle(recentCommits) {
        if (recentCommits.length === 0) {
            return 'conventional';
        }
        // Check if user uses conventional commits
        const conventionalCount = recentCommits.filter(commit => /^(feat|fix|refactor|docs|test|chore|style|perf):/.test(commit.message)).length;
        if (conventionalCount / recentCommits.length > 0.5) {
            return 'conventional';
        }
        // Check if user writes detailed messages (multi-line)
        const detailedCount = recentCommits.filter(commit => commit.message.split('\n').length > 2).length;
        if (detailedCount / recentCommits.length > 0.5) {
            return 'detailed';
        }
        return 'simple';
    }
    generateSubject(changeType, keyChanges, style) {
        const action = this.getActionVerb(changeType);
        const target = this.summarizeChanges(keyChanges);
        if (style === 'conventional') {
            const subject = `${changeType}: ${action} ${target}`;
            return this.truncateSubject(subject);
        }
        else {
            const subject = `${action} ${target}`;
            return this.truncateSubject(subject);
        }
    }
    getActionVerb(changeType) {
        const verbs = {
            feat: 'add',
            fix: 'fix',
            refactor: 'refactor',
            docs: 'update',
            test: 'add',
            chore: 'update',
            style: 'format',
        };
        return verbs[changeType];
    }
    summarizeChanges(keyChanges) {
        if (keyChanges.length === 0) {
            return 'code changes';
        }
        if (keyChanges.length === 1) {
            return keyChanges[0].toLowerCase();
        }
        // Find common patterns
        const hasMultipleFiles = keyChanges.length > 2;
        if (hasMultipleFiles) {
            // Try to find common module/feature
            const firstFile = keyChanges[0].split('/')[0];
            return `${firstFile} module`;
        }
        return keyChanges[0].toLowerCase();
    }
    generateBody(keyChanges, style) {
        if (style === 'simple') {
            return ''; // Simple style doesn't include body
        }
        if (keyChanges.length <= 1) {
            return ''; // No need for body if only one change
        }
        // Generate detailed body
        const body = keyChanges.map(change => `- ${change}`).join('\n');
        return body;
    }
    truncateSubject(subject, maxLength = 50) {
        if (subject.length <= maxLength) {
            return subject;
        }
        return subject.substring(0, maxLength - 3) + '...';
    }
    calculateConfidence(keyChanges, recentCommits) {
        let confidence = 0.7; // Base confidence
        // Higher confidence if we extracted meaningful changes
        if (keyChanges.length > 0 && !keyChanges[0].includes('Modified')) {
            confidence += 0.1;
        }
        // Higher confidence if we can learn from commit history
        if (recentCommits.length >= 5) {
            confidence += 0.1;
        }
        return Math.min(confidence, 0.95);
    }
    generateExplanation(changeType, keyChanges, commitStyle) {
        const typeDescription = this.getTypeDescription(changeType);
        const explanation = `Detected ${typeDescription}. Message follows ${commitStyle} commit format`;
        if (keyChanges.length > 0) {
            return `${explanation} and summarizes: ${keyChanges.slice(0, 2).join(', ')}`;
        }
        return explanation;
    }
    getTypeDescription(changeType) {
        const descriptions = {
            feat: 'new functionality',
            fix: 'bug fix',
            refactor: 'code refactoring',
            docs: 'documentation changes',
            test: 'test additions/changes',
            chore: 'configuration/maintenance changes',
            style: 'formatting changes',
        };
        return descriptions[changeType];
    }
}
//# sourceMappingURL=message-generator.js.map