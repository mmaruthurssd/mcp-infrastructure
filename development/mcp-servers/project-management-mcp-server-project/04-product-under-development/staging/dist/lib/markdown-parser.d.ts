/**
 * Markdown Parser Utilities
 *
 * Utilities for parsing and updating markdown files with section-based operations
 * Supports frontmatter, sections, lists, and content manipulation
 */
/**
 * Markdown section structure
 */
export interface MarkdownSection {
    heading: string;
    level: number;
    content: string[];
    startLine: number;
    endLine: number;
}
/**
 * Parsed markdown document
 */
export interface ParsedMarkdown {
    frontmatter: Record<string, any> | null;
    sections: MarkdownSection[];
    rawContent: string;
}
/**
 * Checkbox item
 */
export interface CheckboxItem {
    checked: boolean;
    text: string;
    line: number;
}
/**
 * Parse markdown file into structured format
 */
export declare function parseMarkdownFile(filePath: string): ParsedMarkdown;
/**
 * Parse markdown content string
 */
export declare function parseMarkdownContent(content: string): ParsedMarkdown;
/**
 * Parse YAML frontmatter
 */
export declare function parseFrontmatter(content: string): Record<string, any> | null;
/**
 * Parse content into sections by headings
 */
export declare function parseSections(lines: string[], offset?: number): MarkdownSection[];
/**
 * Find section by heading pattern (regex or exact match)
 */
export declare function findSection(sections: MarkdownSection[], pattern: string | RegExp): MarkdownSection | undefined;
/**
 * Find all sections matching pattern
 */
export declare function findSections(sections: MarkdownSection[], pattern: string | RegExp): MarkdownSection[];
/**
 * Get section content without heading
 */
export declare function getSectionContent(section: MarkdownSection): string;
/**
 * Update section content
 */
export declare function updateSectionContent(parsed: ParsedMarkdown, pattern: string | RegExp, newContent: string): ParsedMarkdown;
/**
 * Insert content after a section
 */
export declare function insertAfterSection(parsed: ParsedMarkdown, pattern: string | RegExp, content: string): ParsedMarkdown;
/**
 * Add new section
 */
export declare function addSection(parsed: ParsedMarkdown, heading: string, level: number, content: string): ParsedMarkdown;
/**
 * Remove section
 */
export declare function removeSection(parsed: ParsedMarkdown, pattern: string | RegExp): ParsedMarkdown;
/**
 * Convert parsed markdown back to string
 */
export declare function serializeMarkdown(parsed: ParsedMarkdown): string;
/**
 * Write parsed markdown to file
 */
export declare function writeMarkdownFile(filePath: string, parsed: ParsedMarkdown): void;
/**
 * Extract list items from content
 */
export declare function extractListItems(content: string): string[];
/**
 * Extract checkboxes with status
 */
export declare function extractCheckboxes(content: string): CheckboxItem[];
/**
 * Replace placeholders in content
 */
export declare function replacePlaceholders(content: string, replacements: Record<string, string>): string;
/**
 * Parse component data from section content
 */
export declare function parseComponentFromSection(content: string): {
    name: string;
    description: string;
    subComponents: string[];
    notes?: string;
} | null;
/**
 * Update or create frontmatter field
 */
export declare function updateFrontmatter(parsed: ParsedMarkdown, key: string, value: any): ParsedMarkdown;
/**
 * Get frontmatter field
 */
export declare function getFrontmatterField(parsed: ParsedMarkdown, key: string): any;
//# sourceMappingURL=markdown-parser.d.ts.map