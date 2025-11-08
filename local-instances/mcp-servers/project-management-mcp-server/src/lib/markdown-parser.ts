/**
 * Markdown Parser Utilities
 *
 * Utilities for parsing and updating markdown files with section-based operations
 * Supports frontmatter, sections, lists, and content manipulation
 */

import * as fs from "fs";
import * as path from "path";

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Parse markdown file into structured format
 */
export function parseMarkdownFile(filePath: string): ParsedMarkdown {
  const content = fs.readFileSync(filePath, "utf-8");
  return parseMarkdownContent(content);
}

/**
 * Parse markdown content string
 */
export function parseMarkdownContent(content: string): ParsedMarkdown {
  const lines = content.split("\n");
  const frontmatter = parseFrontmatter(content);

  // Skip frontmatter lines if present
  let startIndex = 0;
  if (content.trim().startsWith("---")) {
    const secondDelimiter = lines.findIndex((line, idx) => idx > 0 && line.trim() === "---");
    if (secondDelimiter > 0) {
      startIndex = secondDelimiter + 1;
    }
  }

  const sections = parseSections(lines.slice(startIndex), startIndex);

  return {
    frontmatter,
    sections,
    rawContent: content,
  };
}

/**
 * Parse YAML frontmatter
 */
export function parseFrontmatter(content: string): Record<string, any> | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith("---")) {
    return null;
  }

  const lines = content.split("\n");
  const secondDelimiter = lines.findIndex((line, idx) => idx > 0 && line.trim() === "---");

  if (secondDelimiter < 0) {
    return null;
  }

  const frontmatterLines = lines.slice(1, secondDelimiter);
  const frontmatter: Record<string, any> = {};

  for (const line of frontmatterLines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      // Try to parse as JSON, otherwise keep as string
      try {
        frontmatter[key] = JSON.parse(value);
      } catch {
        frontmatter[key] = value.replace(/^['"]|['"]$/g, "");
      }
    }
  }

  return frontmatter;
}

/**
 * Parse content into sections by headings
 */
export function parseSections(lines: string[], offset = 0): MarkdownSection[] {
  const sections: MarkdownSection[] = [];
  let currentSection: MarkdownSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      // Save previous section
      if (currentSection) {
        currentSection.endLine = offset + i - 1;
        sections.push(currentSection);
      }

      // Start new section
      const [, hashes, heading] = headingMatch;
      currentSection = {
        heading: heading.trim(),
        level: hashes.length,
        content: [],
        startLine: offset + i,
        endLine: offset + i,
      };
    } else if (currentSection) {
      // Add to current section
      currentSection.content.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.endLine = offset + lines.length - 1;
    sections.push(currentSection);
  }

  return sections;
}

// ============================================================================
// SECTION MANIPULATION
// ============================================================================

/**
 * Find section by heading pattern (regex or exact match)
 */
export function findSection(
  sections: MarkdownSection[],
  pattern: string | RegExp
): MarkdownSection | undefined {
  const regex = typeof pattern === "string" ? new RegExp(pattern, "i") : pattern;
  return sections.find((section) => regex.test(section.heading));
}

/**
 * Find all sections matching pattern
 */
export function findSections(
  sections: MarkdownSection[],
  pattern: string | RegExp
): MarkdownSection[] {
  const regex = typeof pattern === "string" ? new RegExp(pattern, "i") : pattern;
  return sections.filter((section) => regex.test(section.heading));
}

/**
 * Get section content without heading
 */
export function getSectionContent(section: MarkdownSection): string {
  return section.content.join("\n");
}

/**
 * Update section content
 */
export function updateSectionContent(
  parsed: ParsedMarkdown,
  pattern: string | RegExp,
  newContent: string
): ParsedMarkdown {
  const section = findSection(parsed.sections, pattern);
  if (!section) {
    throw new Error(`Section not found: ${pattern}`);
  }

  section.content = newContent.split("\n");
  return parsed;
}

/**
 * Insert content after a section
 */
export function insertAfterSection(
  parsed: ParsedMarkdown,
  pattern: string | RegExp,
  content: string
): ParsedMarkdown {
  const sectionIndex = parsed.sections.findIndex((s) =>
    typeof pattern === "string" ? new RegExp(pattern, "i").test(s.heading) : pattern.test(s.heading)
  );

  if (sectionIndex < 0) {
    throw new Error(`Section not found: ${pattern}`);
  }

  // Add content to the end of the section
  const section = parsed.sections[sectionIndex];
  section.content.push(...content.split("\n"));

  return parsed;
}

/**
 * Add new section
 */
export function addSection(
  parsed: ParsedMarkdown,
  heading: string,
  level: number,
  content: string
): ParsedMarkdown {
  const newSection: MarkdownSection = {
    heading,
    level,
    content: content.split("\n"),
    startLine: parsed.sections.length > 0 ? parsed.sections[parsed.sections.length - 1].endLine + 1 : 0,
    endLine: 0,
  };

  newSection.endLine = newSection.startLine + newSection.content.length;
  parsed.sections.push(newSection);

  return parsed;
}

/**
 * Remove section
 */
export function removeSection(parsed: ParsedMarkdown, pattern: string | RegExp): ParsedMarkdown {
  const regex = typeof pattern === "string" ? new RegExp(pattern, "i") : pattern;
  parsed.sections = parsed.sections.filter((section) => !regex.test(section.heading));
  return parsed;
}

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * Convert parsed markdown back to string
 */
export function serializeMarkdown(parsed: ParsedMarkdown): string {
  const parts: string[] = [];

  // Add frontmatter if present
  if (parsed.frontmatter) {
    parts.push("---");
    for (const [key, value] of Object.entries(parsed.frontmatter)) {
      if (typeof value === "string") {
        parts.push(`${key}: ${value}`);
      } else if (Array.isArray(value)) {
        parts.push(`${key}: [${value.map((v) => `"${v}"`).join(", ")}]`);
      } else {
        parts.push(`${key}: ${JSON.stringify(value)}`);
      }
    }
    parts.push("---");
    parts.push("");
  }

  // Add sections
  for (const section of parsed.sections) {
    const hashes = "#".repeat(section.level);
    parts.push(`${hashes} ${section.heading}`);
    parts.push("");
    parts.push(...section.content);
    parts.push("");
  }

  return parts.join("\n");
}

/**
 * Write parsed markdown to file
 */
export function writeMarkdownFile(filePath: string, parsed: ParsedMarkdown): void {
  const content = serializeMarkdown(parsed);
  fs.writeFileSync(filePath, content, "utf-8");
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract list items from content
 */
export function extractListItems(content: string): string[] {
  const lines = content.split("\n");
  const items: string[] = [];

  for (const line of lines) {
    const match = line.match(/^[\s-]*[-*+]\s+(.+)$/);
    if (match) {
      items.push(match[1].trim());
    }
  }

  return items;
}

/**
 * Extract checkboxes with status
 */
export function extractCheckboxes(content: string): CheckboxItem[] {
  const lines = content.split("\n");
  const checkboxes: CheckboxItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^[\s-]*[-*+]\s+\[([ xX])\]\s+(.+)$/);
    if (match) {
      checkboxes.push({
        checked: match[1].toLowerCase() === "x",
        text: match[2].trim(),
        line: i,
      });
    }
  }

  return checkboxes;
}

/**
 * Replace placeholders in content
 */
export function replacePlaceholders(
  content: string,
  replacements: Record<string, string>
): string {
  let result = content;

  for (const [key, value] of Object.entries(replacements)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, "g"), value);
  }

  return result;
}

/**
 * Parse component data from section content
 */
export function parseComponentFromSection(content: string): {
  name: string;
  description: string;
  subComponents: string[];
  notes?: string;
} | null {
  const lines = content.split("\n");

  // Look for component name (usually bold or heading)
  const nameMatch = content.match(/\*\*(.+?)\*\*/);
  if (!nameMatch) {
    return null;
  }

  const name = nameMatch[1];

  // Extract description (first non-list paragraph)
  let description = "";
  for (const line of lines) {
    if (line.trim() && !line.match(/^[\s-]*[-*+]/) && !line.match(/\*\*.+?\*\*/)) {
      description = line.trim();
      break;
    }
  }

  // Extract sub-components (list items)
  const subComponents = extractListItems(content);

  // Extract notes (content after "Notes:" or similar)
  const notesMatch = content.match(/Notes?:\s*(.+)/i);
  const notes = notesMatch ? notesMatch[1].trim() : undefined;

  return {
    name,
    description,
    subComponents,
    notes,
  };
}

/**
 * Update or create frontmatter field
 */
export function updateFrontmatter(
  parsed: ParsedMarkdown,
  key: string,
  value: any
): ParsedMarkdown {
  if (!parsed.frontmatter) {
    parsed.frontmatter = {};
  }
  parsed.frontmatter[key] = value;
  return parsed;
}

/**
 * Get frontmatter field
 */
export function getFrontmatterField(parsed: ParsedMarkdown, key: string): any {
  return parsed.frontmatter?.[key];
}
