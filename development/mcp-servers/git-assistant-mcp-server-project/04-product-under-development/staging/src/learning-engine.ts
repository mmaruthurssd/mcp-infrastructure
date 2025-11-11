// Pattern learning and adaptation engine

import fs from 'fs/promises';
import path from 'path';
import { LearnedPattern, LearnedPatternsStorage, Commit } from './types.js';

export class LearningEngine {
  private preferencesFile: string;
  private patterns: LearnedPattern[] = [];
  private metadata: LearnedPatternsStorage['metadata'];

  constructor(repoPath: string) {
    this.preferencesFile = path.join(repoPath, '.git-assistant-preferences.json');
    this.metadata = {
      created: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      version: '1.0.0',
    };
  }

  async loadPatterns(): Promise<void> {
    try {
      const data = await fs.readFile(this.preferencesFile, 'utf-8');
      const storage: LearnedPatternsStorage = JSON.parse(data);
      this.patterns = storage.patterns || [];
      this.metadata = storage.metadata || this.metadata;
    } catch (error) {
      // File doesn't exist yet, start with empty patterns
      this.patterns = [];
    }
  }

  async savePatterns(): Promise<void> {
    const storage: LearnedPatternsStorage = {
      patterns: this.patterns,
      fileDecisions: [],
      metadata: {
        ...this.metadata,
        lastUpdated: new Date().toISOString().split('T')[0],
      },
    };

    await fs.writeFile(this.preferencesFile, JSON.stringify(storage, null, 2), 'utf-8');
  }

  async addPattern(
    tool: string,
    condition: string,
    action: string,
    reason: string,
    createdBy: string = 'user'
  ): Promise<LearnedPattern> {
    await this.loadPatterns();

    const pattern: LearnedPattern = {
      id: this.generateId(),
      tool,
      condition,
      action,
      reason,
      created_by: createdBy,
      created_date: new Date().toISOString().split('T')[0],
      times_applied: 0,
    };

    this.patterns.push(pattern);
    await this.savePatterns();

    return pattern;
  }

  async listPatterns(tool?: string): Promise<LearnedPattern[]> {
    await this.loadPatterns();

    if (tool) {
      return this.patterns.filter(p => p.tool === tool);
    }

    return this.patterns;
  }

  async removePattern(patternId: string): Promise<boolean> {
    await this.loadPatterns();

    const index = this.patterns.findIndex(p => p.id === patternId);
    if (index === -1) {
      return false;
    }

    this.patterns.splice(index, 1);
    await this.savePatterns();

    return true;
  }

  async checkPatterns(tool: string, params: any): Promise<LearnedPattern | null> {
    await this.loadPatterns();

    // Find matching patterns for this tool
    const matchingPatterns = this.patterns.filter(p => p.tool === tool);

    // For now, we'll use simple condition matching
    // In a more advanced version, you'd evaluate the condition as an expression
    for (const pattern of matchingPatterns) {
      if (this.evaluateCondition(pattern.condition, params)) {
        // Update usage statistics
        pattern.times_applied++;
        pattern.last_applied = new Date().toISOString().split('T')[0];
        await this.savePatterns();

        return pattern;
      }
    }

    return null;
  }

  async suggestPattern(tool: string, params: any, result: any): Promise<string | null> {
    // Analyze the tool execution and suggest a pattern that could be learned
    // This is a simplified version - in production, you'd have more sophisticated logic

    if (tool === 'check_commit_readiness' && result.ready_to_commit) {
      // Suggest learning commit timing preferences
      return `Would you like me to remember your commit timing preferences? I could learn when YOU typically commit based on this pattern.`;
    }

    if (tool === 'suggest_commit_message') {
      return `Would you like me to remember your commit message style preferences for future suggestions?`;
    }

    // Security-related pattern suggestions
    if (tool === 'security_scan' && result.issues && result.issues.length > 0) {
      return `Would you like me to remember to always run security scans before commits?`;
    }

    return null;
  }

  /**
   * Record security-related pattern
   */
  async addSecurityPattern(
    pattern: string,
    severity: string,
    file: string,
    remediation: string
  ): Promise<LearnedPattern> {
    return this.addPattern(
      'security_scan',
      `Pattern detected: ${pattern} in ${file}`,
      `Block commit and warn user`,
      `${remediation} (Severity: ${severity})`,
      'security-system'
    );
  }

  /**
   * Check if a security issue has been seen before
   */
  async hasSeenSecurityIssue(pattern: string, file: string): Promise<boolean> {
    await this.loadPatterns();

    return this.patterns.some(
      p => p.tool === 'security_scan' &&
      p.condition.includes(pattern) &&
      p.condition.includes(file)
    );
  }

  /**
   * Get security-related patterns
   */
  async getSecurityPatterns(): Promise<LearnedPattern[]> {
    await this.loadPatterns();
    return this.patterns.filter(p => p.tool === 'security_scan');
  }

  async analyzeCommitHistory(commits: Commit[]): Promise<{
    typical_file_count: number;
    typical_line_count: number;
    typical_commit_frequency: number;
  }> {
    if (commits.length === 0) {
      return {
        typical_file_count: 3.5,
        typical_line_count: 100,
        typical_commit_frequency: 60,
      };
    }

    // Calculate averages
    const avgFiles = commits.reduce((sum, c) => sum + c.files_changed, 0) / commits.length;
    const avgLines = commits.reduce((sum, c) => sum + c.insertions + c.deletions, 0) / commits.length;

    // Calculate average commit frequency (simplified - would need timestamps)
    const avgFrequency = 60; // Default to 60 minutes

    return {
      typical_file_count: avgFiles,
      typical_line_count: avgLines,
      typical_commit_frequency: avgFrequency,
    };
  }

  private evaluateCondition(condition: string, params: any): boolean {
    // Simplified condition evaluation
    // In production, you'd use a proper expression evaluator

    // For now, just return true to demonstrate the learning system works
    // A real implementation would parse and evaluate conditions like:
    // "file_count < 5 AND lines_changed < 200"

    return false; // Disabled for MVP - patterns won't auto-apply yet
  }

  private generateId(): string {
    return `PATTERN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  getPatternUsageStats(patternId?: string): any {
    if (patternId) {
      const pattern = this.patterns.find(p => p.id === patternId);
      if (!pattern) {
        return null;
      }

      return {
        pattern_id: pattern.id,
        times_applied: pattern.times_applied,
        last_applied: pattern.last_applied || 'Never',
        created_date: pattern.created_date,
      };
    }

    // Return stats for all patterns
    return {
      total_patterns: this.patterns.length,
      total_applications: this.patterns.reduce((sum, p) => sum + p.times_applied, 0),
      most_used: this.patterns.sort((a, b) => b.times_applied - a.times_applied)[0],
    };
  }
}
