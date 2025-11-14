/**
 * Markdown Checklist Parser
 * Handles parsing, validation, and updating of markdown checklist files
 */

import * as fs from 'fs';
import matter from 'gray-matter';
import type {
  ChecklistFrontmatter,
  ChecklistItem,
  ChecklistStatus,
} from '../types/index.js';

export class ChecklistParser {
  /**
   * Parse markdown checklist file
   */
  parse(filePath: string): {
    frontmatter: ChecklistFrontmatter;
    items: ChecklistItem[];
    content: string;
  } {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Checklist file not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    // Validate frontmatter
    this.validateFrontmatter(data);

    // Extract checkbox items
    const items = this.extractCheckboxes(content);

    return {
      frontmatter: data as ChecklistFrontmatter,
      items,
      content,
    };
  }

  /**
   * Extract checkbox items from markdown content
   */
  private extractCheckboxes(content: string): ChecklistItem[] {
    const lines = content.split('\n');
    const items: ChecklistItem[] = [];

    lines.forEach((line, index) => {
      // Match: - [ ] or - [x] or - [X]
      const match = line.match(/^[\s]*-\s\[([ xX])\]\s(.+)$/);
      if (match) {
        const completed = match[1].toLowerCase() === 'x';
        const text = match[2].trim();
        items.push({
          text,
          completed,
          line: index + 1,
        });
      }
    });

    return items;
  }

  /**
   * Update checkbox status in markdown file
   */
  updateCheckbox(
    filePath: string,
    itemText: string,
    completed: boolean
  ): {
    updated: boolean;
    matchedText: string;
    newStats: { total: number; completed: number; percentage: number };
  } {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    // Find matching checkbox using fuzzy match
    const lines = content.split('\n');
    let updated = false;
    let matchedText = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^([\s]*-\s\[)[ xX](\]\s)(.+)$/);

      if (match && this.fuzzyMatch(match[3], itemText)) {
        const checkbox = completed ? 'x' : ' ';
        lines[i] = `${match[1]}${checkbox}${match[2]}${match[3]}`;
        matchedText = match[3].trim();
        updated = true;
        break;
      }
    }

    if (!updated) {
      throw new Error(`Checklist item not found: "${itemText}"`);
    }

    // Update frontmatter
    const items = this.extractCheckboxes(lines.join('\n'));
    const completedCount = items.filter((item) => item.completed).length;

    data['items-completed'] = completedCount;
    data['items-total'] = items.length;
    data['last-updated'] = new Date().toISOString();
    data['status'] = this.calculateStatus(items.length, completedCount);

    // Write back to file
    const newContent = matter.stringify(lines.join('\n'), data);
    fs.writeFileSync(filePath, newContent, 'utf-8');

    return {
      updated: true,
      matchedText,
      newStats: {
        total: items.length,
        completed: completedCount,
        percentage: Math.round((completedCount / items.length) * 100),
      },
    };
  }

  /**
   * Fuzzy match for checklist item text
   * Supports case-insensitive partial matching
   */
  private fuzzyMatch(text1: string, text2: string): boolean {
    const normalize = (s: string) => s.toLowerCase().trim();
    const n1 = normalize(text1);
    const n2 = normalize(text2);

    // Exact match
    if (n1 === n2) return true;

    // Partial match (one contains the other)
    if (n1.includes(n2) || n2.includes(n1)) return true;

    return false;
  }

  /**
   * Calculate checklist status based on completion
   */
  private calculateStatus(
    total: number,
    completed: number
  ): ChecklistStatus {
    if (completed === 0) return 'not-started';
    if (completed === total) return 'completed';
    return 'in-progress';
  }

  /**
   * Validate frontmatter has required fields
   */
  private validateFrontmatter(data: unknown): void {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid frontmatter: must be an object');
    }

    const required = ['type', 'checklist-type', 'status'];
    const dataObj = data as Record<string, unknown>;
    const missing = required.filter((field) => !dataObj[field]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required frontmatter fields: ${missing.join(', ')}`
      );
    }

    if (dataObj.type !== 'checklist') {
      throw new Error(
        `Invalid type: expected 'checklist', got '${dataObj.type}'`
      );
    }
  }

  /**
   * Get pending (incomplete) checklist items
   */
  getPendingItems(items: ChecklistItem[]): string[] {
    return items.filter((item) => !item.completed).map((item) => item.text);
  }
}
