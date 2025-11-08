export interface GitStatus {
    branch: string;
    ahead: number;
    behind: number;
    staged: FileChange[];
    unstaged: FileChange[];
    untracked: FileChange[];
    total_changes: number;
    is_clean: boolean;
}
export interface FileChange {
    path: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked';
}
export interface Commit {
    hash: string;
    author: string;
    date: string;
    message: string;
    files_changed: number;
    insertions: number;
    deletions: number;
}
export interface DiffSummary {
    total_files_changed: number;
    insertions: number;
    deletions: number;
    files: FileDiff[];
}
export interface FileDiff {
    path: string;
    insertions: number;
    deletions: number;
    change_summary: string;
}
export interface CommitReadinessResult {
    ready_to_commit: boolean;
    confidence: number;
    recommendation: string;
    reasons: string[];
    warnings: string[];
    suggested_next_steps: string[];
    security_check?: {
        passed: boolean;
        severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
        message: string;
        credentials_found: number;
        phi_found: number;
        scan_time: number;
    };
    standards_check?: {
        compliant: boolean;
        score: number;
        critical_violations: number;
        warnings: number;
    };
}
export interface CommitMessageResult {
    subject: string;
    body: string;
    full_message: string;
    change_type: 'feat' | 'fix' | 'refactor' | 'docs' | 'test' | 'chore' | 'style';
    confidence: number;
    explanation: string;
}
export interface GitGuidance {
    topic: string;
    guidance: {
        summary: string;
        principles: string[];
        good_examples: string[];
        bad_examples: string[];
        resources: string[];
    };
}
export interface CommitHistoryAnalysis {
    analysis_period: string;
    total_commits: number;
    patterns: {
        average_commit_frequency: string;
        average_files_per_commit: number;
        average_lines_per_commit: number;
        most_common_change_types: Array<{
            type: string;
            count: number;
            percentage: number;
        }>;
        commit_message_style: string;
        average_message_length: number;
    };
    insights: string[];
    recommendations: string[];
}
export interface LearnedPattern {
    id: string;
    tool: string;
    condition: string;
    action: string;
    reason: string;
    created_by: string;
    created_date: string;
    times_applied: number;
    last_applied?: string;
}
export interface LearnedPatternsStorage {
    patterns: LearnedPattern[];
    fileDecisions: Array<{
        fileName: string;
        movedTo: string;
        timestamp: string;
    }>;
    metadata: {
        created: string;
        lastUpdated: string;
        version: string;
    };
}
export interface HeuristicScore {
    score: number;
    reason: string;
    weight: number;
}
export interface SecurityScanResult {
    passed: boolean;
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
    credentialsFound: number;
    phiFound: number;
    issues: SecurityIssue[];
    scanTime: number;
    message: string;
}
export interface SecurityIssue {
    type: 'credential' | 'phi';
    file: string;
    line?: number;
    pattern: string;
    confidence: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    matchedText?: string;
    remediation: string;
}
//# sourceMappingURL=types.d.ts.map