/**
 * Issue Tracker
 * Tracks issues in markdown knowledge base files
 */

import { promises as fs } from 'fs';
import { TrackedIssue, IssueContext, KnowledgeBase } from './types.js';

export class IssueTracker {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Track a new issue or update existing one
   */
  async trackIssue(
    knowledgeBaseFile: string,
    issue: {
      title: string;
      symptom: string;
      rootCause?: string;
      solution: string;
      prevention?: string;
      context: IssueContext;
    }
  ): Promise<TrackedIssue> {
    const filePath = `${this.projectRoot}/${knowledgeBaseFile}`;

    // Parse existing knowledge base
    const kb = await this.parseKnowledgeBase(filePath);

    // Check if issue already exists (by symptom similarity)
    const existingIssue = this.findSimilarIssue(kb.issues, issue.symptom);

    if (existingIssue) {
      // Update existing issue
      existingIssue.frequency++;
      const today = new Date().toISOString().split('T')[0];
      existingIssue.lastSeen = today;

      // Update temporal distribution
      if (!existingIssue.temporalDistribution) {
        existingIssue.temporalDistribution = {
          dates: [existingIssue.firstEncountered],
          spanDays: 0,
        };
      }
      existingIssue.temporalDistribution.dates.push(today);

      // Calculate span in days
      const firstDate = new Date(existingIssue.firstEncountered);
      const lastDate = new Date(today);
      existingIssue.temporalDistribution.spanDays = Math.floor(
        (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Optionally update solution if provided
      if (issue.solution && issue.solution !== existingIssue.solution) {
        existingIssue.solution += `\n\nAlternative solution (${existingIssue.lastSeen}):\n${issue.solution}`;
      }

      await this.saveKnowledgeBase(filePath, kb);
      return existingIssue;
    } else {
      // Create new issue
      const today = new Date().toISOString().split('T')[0];
      const newIssue: TrackedIssue = {
        issueNumber: this.getNextIssueNumber(kb.issues),
        title: issue.title,
        symptom: issue.symptom,
        rootCause: issue.rootCause,
        solution: issue.solution,
        prevention: issue.prevention,
        context: issue.context,
        frequency: 1,
        firstEncountered: today,
        lastSeen: today,
        temporalDistribution: {
          dates: [today],
          spanDays: 0,
        },
      };

      kb.issues.push(newIssue);
      kb.autoLearnedIssues++;
      kb.lastUpdated = new Date().toISOString().split('T')[0];

      await this.saveKnowledgeBase(filePath, kb);
      return newIssue;
    }
  }

  /**
   * Find similar issue by symptom
   */
  private findSimilarIssue(issues: TrackedIssue[], symptom: string): TrackedIssue | undefined {
    const normalizedSymptom = symptom.toLowerCase().replace(/\s+/g, ' ').trim();

    return issues.find(issue => {
      const normalizedIssueSymptom = issue.symptom.toLowerCase().replace(/\s+/g, ' ').trim();

      // Exact match
      if (normalizedIssueSymptom === normalizedSymptom) return true;

      // Contains match (for error messages)
      if (normalizedSymptom.length > 30 && normalizedIssueSymptom.includes(normalizedSymptom)) return true;
      if (normalizedSymptom.length > 30 && normalizedSymptom.includes(normalizedIssueSymptom)) return true;

      return false;
    });
  }

  /**
   * Get next available issue number
   */
  private getNextIssueNumber(issues: TrackedIssue[]): number {
    if (issues.length === 0) return 1;

    const maxNumber = Math.max(...issues.map(i => i.issueNumber));
    return maxNumber + 1;
  }

  /**
   * Parse knowledge base from markdown file
   */
  async parseKnowledgeBase(filePath: string): Promise<KnowledgeBase> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Extract metadata from header
      const metadataMatch = content.match(/\*\*Auto-Learned Issues:\*\* (\d+)/);
      const promotedMatch = content.match(/\*\*Promoted to Pre-Flight:\*\* (\d+)/);
      const lastUpdatedMatch = content.match(/\*\*Last Updated:\*\* ([\d-]+)/);

      const autoLearnedIssues = metadataMatch ? parseInt(metadataMatch[1]) : 0;
      const promotedToPreFlight = promotedMatch ? parseInt(promotedMatch[1]) : 0;
      const lastUpdated = lastUpdatedMatch ? lastUpdatedMatch[1] : new Date().toISOString().split('T')[0];

      // Parse individual issues
      const issues = this.parseIssuesFromMarkdown(content);

      return {
        domain: 'unknown', // Will be set by caller
        lastUpdated,
        totalIssuesDocumented: issues.length,
        autoLearnedIssues,
        promotedToPreFlight,
        issues,
      };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create new knowledge base
        return {
          domain: 'unknown',
          lastUpdated: new Date().toISOString().split('T')[0],
          totalIssuesDocumented: 0,
          autoLearnedIssues: 0,
          promotedToPreFlight: 0,
          issues: [],
        };
      }
      throw error;
    }
  }

  /**
   * Parse issues from markdown content
   */
  private parseIssuesFromMarkdown(content: string): TrackedIssue[] {
    const issues: TrackedIssue[] = [];

    // Match auto-learned issue sections
    const issuePattern = /#### Auto-Learned Issue #(\d+): (.+?)\n([\s\S]*?)(?=\n####|---\n\n_This section|$)/g;

    let match;
    while ((match = issuePattern.exec(content)) !== null) {
      const issueNumber = parseInt(match[1]);
      const title = match[2].trim();
      const body = match[3];

      // Extract fields
      const frequencyMatch = body.match(/\*\*Frequency:\*\* (\d+) occurrence/);
      const firstMatch = body.match(/\*\*First Encountered:\*\* ([\d-]+)/);
      const lastMatch = body.match(/\*\*Last Seen:\*\* ([\d-]+)/);
      const symptomMatch = body.match(/\*\*Symptom:\*\*\n```?\n?([\s\S]*?)\n```?/);
      const rootCauseMatch = body.match(/\*\*Root Cause:\*\*\n([\s\S]*?)\n\n\*\*Solution/);
      const solutionMatch = body.match(/\*\*Solution:\*\*\n```?\n?([\s\S]*?)\n```?/);
      const preventionMatch = body.match(/\*\*Prevention:\*\*\n([\s\S]*?)(?:\n\n\*\*|---)/);
      const categoryMatch = body.match(/\*\*Category:\*\* (.+)/);
      const promotedMatch = body.match(/\(PROMOTED\)/);
      const mergedIntoMatch = body.match(/\[MERGED INTO #(\d+)\]/);

      const issue: TrackedIssue = {
        issueNumber,
        title,
        symptom: symptomMatch ? symptomMatch[1].trim() : '',
        rootCause: rootCauseMatch ? rootCauseMatch[1].trim() : undefined,
        solution: solutionMatch ? solutionMatch[1].trim() : '',
        prevention: preventionMatch ? preventionMatch[1].trim() : undefined,
        context: { domain: 'unknown' },
        frequency: frequencyMatch ? parseInt(frequencyMatch[1]) : 1,
        firstEncountered: firstMatch ? firstMatch[1] : '',
        lastSeen: lastMatch ? lastMatch[1] : '',
        category: categoryMatch ? categoryMatch[1] : undefined,
        promoted: !!promotedMatch,
        mergedInto: mergedIntoMatch ? parseInt(mergedIntoMatch[1]) : undefined,
      };

      issues.push(issue);
    }

    return issues;
  }

  /**
   * Save knowledge base to markdown file
   */
  async saveKnowledgeBase(filePath: string, kb: KnowledgeBase): Promise<void> {
    let content = '';

    // Write header
    content += `# ${kb.domain} Troubleshooting Guide\n\n`;
    content += `**Last Updated:** ${kb.lastUpdated}\n`;
    content += `**Total Issues Documented:** ${kb.totalIssuesDocumented}\n`;
    content += `**Auto-Learned Issues:** ${kb.autoLearnedIssues}\n`;
    content += `**Promoted to Pre-Flight:** ${kb.promotedToPreFlight}\n\n`;
    content += `---\n\n`;
    content += `## Auto-Learned Issues\n\n`;

    // Write each issue
    for (const issue of kb.issues) {
      content += this.formatIssue(issue);
      content += '\n---\n\n';
    }

    content += `_This section updates automatically when new issues are encountered_\n`;

    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Format issue as markdown
   */
  private formatIssue(issue: TrackedIssue): string {
    let md = `#### Auto-Learned Issue #${issue.issueNumber}: ${issue.title}`;

    if (issue.promoted) md += ' (PROMOTED)';
    if (issue.mergedInto) md += ` [MERGED INTO #${issue.mergedInto}]`;

    md += `\n\n`;
    md += `**First Encountered:** ${issue.firstEncountered}\n`;
    md += `**Frequency:** ${issue.frequency} occurrence${issue.frequency > 1 ? 's' : ''}\n`;
    md += `**Last Seen:** ${issue.lastSeen}\n`;

    if (issue.category) {
      md += `**Category:** ${issue.category}\n`;
    }

    md += `\n**Symptom:**\n\`\`\`\n${issue.symptom}\n\`\`\`\n\n`;

    if (issue.rootCause) {
      md += `**Root Cause:**\n${issue.rootCause}\n\n`;
    }

    md += `**Solution:**\n\`\`\`bash\n${issue.solution}\n\`\`\`\n\n`;

    if (issue.prevention) {
      md += `**Prevention:**\n${issue.prevention}\n\n`;
    }

    return md;
  }

  /**
   * Get all issues from knowledge base
   */
  async getIssues(knowledgeBaseFile: string): Promise<TrackedIssue[]> {
    const filePath = `${this.projectRoot}/${knowledgeBaseFile}`;
    const kb = await this.parseKnowledgeBase(filePath);
    return kb.issues;
  }
}
