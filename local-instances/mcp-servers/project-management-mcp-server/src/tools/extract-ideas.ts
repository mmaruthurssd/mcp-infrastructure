/**
 * Extract Ideas Tool
 *
 * Scans brainstorming discussion markdown files for actionable ideas using
 * AI pattern matching and confidence scoring.
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface ExtractIdeasInput {
  projectPath: string;        // Absolute path to project
  filePath?: string;          // Optional: specific file to scan
                              // Default: brainstorming/future-goals/brainstorming/ongoing-brainstorming-discussion.md
  minConfidence?: number;     // Optional: 0-1 confidence threshold (default: 0.6)
}

export interface ExtractedIdea {
  id: string;              // Generated ID: idea-001, idea-002
  text: string;            // The idea text extracted
  context: string;         // Surrounding context (1-2 sentences)
  confidence: number;      // 0-1 confidence score
  location: {
    lineNumber: number;
    sectionHeading?: string;
  };
  suggestedName: string;   // AI-generated short name for the idea
  reasoning: string;       // Why this was detected as actionable
}

export interface ExtractIdeasOutput {
  success: boolean;
  ideasFound?: number;
  ideas?: ExtractedIdea[];
  formatted?: string;
  message: string;
  error?: string;
}

interface RawIdea {
  text: string;
  lineNumber: number;
  sectionHeading?: string;
  contextBefore: string;
  contextAfter: string;
}

// ============================================================================
// Pattern Matching Heuristics
// ============================================================================

/**
 * Imperative action verbs that suggest actionable ideas
 */
const ACTION_VERBS = [
  'build', 'create', 'implement', 'add', 'develop', 'design',
  'fix', 'improve', 'optimize', 'refactor', 'upgrade',
  'integrate', 'deploy', 'launch', 'migrate', 'update',
  'automate', 'streamline', 'simplify', 'enhance', 'extend'
];

/**
 * Problem statement keywords
 */
const PROBLEM_KEYWORDS = [
  'need to', 'should', 'must', 'have to', 'want to',
  'users want', 'users need', 'missing', 'lacking',
  'frustrated', 'problem', 'issue', 'challenge',
  'pain point', 'bottleneck', 'inefficient'
];

/**
 * Feature mention patterns
 */
const FEATURE_PATTERNS = [
  'app for', 'system to', 'tool that', 'feature to',
  'solution for', 'way to', 'method to', 'approach to',
  'platform for', 'service to', 'interface for'
];

/**
 * Section headings that typically contain ideas
 */
const IDEA_SECTION_HEADINGS = [
  'ideas', 'suggestions', 'proposals', 'options',
  'potential solutions', 'brainstorming', 'thoughts',
  'possibilities', 'approaches', 'concepts'
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Scan markdown content for actionable ideas
 */
function scanMarkdownForIdeas(content: string): RawIdea[] {
  const lines = content.split('\n');
  const rawIdeas: RawIdea[] = [];
  let currentSection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Track section headings
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      currentSection = headingMatch[1].trim();
      continue;
    }

    // Skip empty lines
    if (!line.trim()) {
      continue;
    }

    // Check if line is a potential idea
    if (isPotentialIdea(line)) {
      // Extract context (2 lines before and after)
      const contextBefore = lines
        .slice(Math.max(0, i - 2), i)
        .filter(l => l.trim())
        .join(' ');
      const contextAfter = lines
        .slice(i + 1, Math.min(lines.length, i + 3))
        .filter(l => l.trim())
        .join(' ');

      rawIdeas.push({
        text: cleanIdeaText(line),
        lineNumber,
        sectionHeading: currentSection || undefined,
        contextBefore,
        contextAfter,
      });
    }
  }

  return rawIdeas;
}

/**
 * Check if a line contains a potential idea
 */
function isPotentialIdea(line: string): boolean {
  const lowerLine = line.toLowerCase();

  // Check for bullet points or numbered lists
  const isList = /^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line);

  // Check for action verbs
  const hasActionVerb = ACTION_VERBS.some(verb =>
    new RegExp(`\\b${verb}\\b`, 'i').test(line)
  );

  // Check for problem keywords
  const hasProblemKeyword = PROBLEM_KEYWORDS.some(keyword =>
    lowerLine.includes(keyword)
  );

  // Check for feature patterns
  const hasFeaturePattern = FEATURE_PATTERNS.some(pattern =>
    lowerLine.includes(pattern)
  );

  // Idea is likely if:
  // - It's in a list AND has action verb or feature pattern
  // - It has action verb AND (problem keyword OR feature pattern)
  // - It's long enough to be meaningful (>20 chars)
  const isLongEnough = line.trim().length > 20;

  return isLongEnough && (
    (isList && (hasActionVerb || hasFeaturePattern)) ||
    (hasActionVerb && (hasProblemKeyword || hasFeaturePattern))
  );
}

/**
 * Clean idea text by removing bullet points, numbers, etc.
 */
function cleanIdeaText(line: string): string {
  return line
    .replace(/^\s*[-*+]\s+/, '')  // Remove bullet points
    .replace(/^\s*\d+\.\s+/, '')  // Remove numbered list markers
    .trim();
}

/**
 * Score idea confidence (0-1)
 */
function scoreIdeaConfidence(idea: RawIdea): number {
  let score = 0.5; // Base score
  const lowerText = idea.text.toLowerCase();

  // Boost for action verbs (up to +0.2)
  const actionVerbCount = ACTION_VERBS.filter(verb =>
    new RegExp(`\\b${verb}\\b`, 'i').test(idea.text)
  ).length;
  score += Math.min(actionVerbCount * 0.1, 0.2);

  // Boost for specific scope indicators (up to +0.15)
  if (/\d+\s*(week|month|day|hour)s?/i.test(idea.text)) {
    score += 0.1; // Has time estimate
  }
  if (/React|Vue|Angular|Python|Node|mobile|web|app|API/i.test(idea.text)) {
    score += 0.05; // Has technical detail
  }

  // Boost for being in an "ideas" section (+0.1)
  if (idea.sectionHeading) {
    const isIdeaSection = IDEA_SECTION_HEADINGS.some(heading =>
      idea.sectionHeading!.toLowerCase().includes(heading)
    );
    if (isIdeaSection) {
      score += 0.1;
    }
  }

  // Reduce for vagueness (down to -0.2)
  if (/maybe|perhaps|might|could|possibly/i.test(idea.text)) {
    score -= 0.1; // Uncertainty language
  }
  if (/\?/.test(idea.text)) {
    score -= 0.1; // Questions are less actionable
  }

  // Boost for clear problem-solution structure (+0.1)
  if (PROBLEM_KEYWORDS.some(k => lowerText.includes(k)) &&
      ACTION_VERBS.some(v => new RegExp(`\\b${v}\\b`, 'i').test(idea.text))) {
    score += 0.1;
  }

  // Clamp to 0-1
  return Math.max(0, Math.min(1, score));
}

/**
 * Generate a short, descriptive name for the idea
 */
function generateIdeaName(ideaText: string): string {
  // Strategy:
  // 1. Extract key technical terms and action verbs
  // 2. Limit to 3-5 words
  // 3. Title Case

  const words = ideaText.split(/\s+/);

  // Find action verb
  const actionVerb = ACTION_VERBS.find(verb =>
    new RegExp(`\\b${verb}\\b`, 'i').test(ideaText)
  );

  // Find key nouns (technical terms, capitalized words)
  const keyTerms: string[] = [];
  const techPattern = /\b(React|Vue|Angular|Python|Node|API|app|mobile|web|system|tool|feature|dashboard|automation)\b/gi;
  const techMatches = ideaText.match(techPattern);
  if (techMatches) {
    keyTerms.push(...techMatches.slice(0, 3));
  }

  // Build name
  let name = '';
  if (actionVerb) {
    name = actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1);
  }

  if (keyTerms.length > 0) {
    name += (name ? ' ' : '') + keyTerms
      .map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
      .join(' ');
  } else {
    // Fallback: take first 3-4 significant words
    const significant = words
      .filter(w => w.length > 3 && !['the', 'and', 'for', 'with', 'that'].includes(w.toLowerCase()))
      .slice(0, 4)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    name = significant;
  }

  // If name is still empty or too long, truncate idea text
  if (!name || name.length > 40) {
    name = ideaText.slice(0, 40).trim();
    if (ideaText.length > 40) name += '...';
  }

  return name;
}

/**
 * Determine reasoning for why this was detected as actionable
 */
function determineReasoning(idea: RawIdea, confidence: number): string {
  const reasons: string[] = [];
  const lowerText = idea.text.toLowerCase();

  // Check what triggered detection
  const hasActionVerb = ACTION_VERBS.some(verb =>
    new RegExp(`\\b${verb}\\b`, 'i').test(idea.text)
  );
  const hasProblem = PROBLEM_KEYWORDS.some(k => lowerText.includes(k));
  const hasFeature = FEATURE_PATTERNS.some(p => lowerText.includes(p));
  const hasTechDetail = /React|Vue|Angular|Python|Node|mobile|web|app|API/i.test(idea.text);
  const hasTimeEstimate = /\d+\s*(week|month|day|hour)s?/i.test(idea.text);

  if (hasActionVerb) {
    reasons.push('contains action verb');
  }
  if (hasProblem) {
    reasons.push('describes a problem or need');
  }
  if (hasFeature) {
    reasons.push('mentions specific feature or solution');
  }
  if (hasTechDetail) {
    reasons.push('includes technical details');
  }
  if (hasTimeEstimate) {
    reasons.push('has time estimate');
  }

  if (idea.sectionHeading) {
    const isIdeaSection = IDEA_SECTION_HEADINGS.some(heading =>
      idea.sectionHeading!.toLowerCase().includes(heading)
    );
    if (isIdeaSection) {
      reasons.push('found in ideas/brainstorming section');
    }
  }

  const confidenceLevel = confidence >= 0.8 ? 'High' : confidence >= 0.6 ? 'Medium' : 'Low';
  const reasonText = reasons.length > 0
    ? reasons.join(', ')
    : 'matches general idea pattern';

  return `${confidenceLevel} confidence: ${reasonText}`;
}

/**
 * Format output for display
 */
function formatOutput(ideas: ExtractedIdea[], filePath: string): string {
  let output = '═══════════════════════════════════════════════════════\n';
  output += `  EXTRACTED IDEAS (${ideas.length} found)\n`;
  output += '═══════════════════════════════════════════════════════\n\n';
  output += `Source: ${path.basename(filePath)}\n\n`;

  if (ideas.length === 0) {
    output += 'No actionable ideas found in the brainstorming file.\n';
    output += 'Try:\n';
    output += '  - Adding bullet points with action verbs (build, create, implement)\n';
    output += '  - Describing specific features or solutions\n';
    output += '  - Mentioning technical details or time estimates\n';
    return output;
  }

  ideas.forEach((idea, index) => {
    const confidenceBar = '█'.repeat(Math.round(idea.confidence * 10));
    const confidencePercent = Math.round(idea.confidence * 100);

    output += `${idea.id}. ${idea.suggestedName}\n`;
    output += `   Confidence: ${confidenceBar} ${confidencePercent}%\n`;
    output += `   Location: Line ${idea.location.lineNumber}`;
    if (idea.location.sectionHeading) {
      output += ` (${idea.location.sectionHeading})`;
    }
    output += '\n';
    output += `   Text: "${idea.text}"\n`;
    output += `   Reasoning: ${idea.reasoning}\n`;

    if (index < ideas.length - 1) {
      output += '\n';
    }
  });

  output += '\n───────────────────────────────────────────────────────\n';
  output += 'Next Steps:\n';
  output += '  1. Review extracted ideas for accuracy\n';
  output += '  2. Use evaluate_goal for promising ideas\n';
  output += '  3. Use create_potential_goal to formalize top ideas\n';

  return output;
}

// ============================================================================
// Main Tool Logic
// ============================================================================

export class ExtractIdeasTool {
  /**
   * Execute the extract_ideas tool
   */
  static execute(input: ExtractIdeasInput): ExtractIdeasOutput {
    try {
      // Step 1: Validate input
      if (!fs.existsSync(input.projectPath)) {
        return {
          success: false,
          message: 'Error',
          error: `Project path does not exist: ${input.projectPath}`,
        };
      }

      // Step 2: Determine file to scan
      const defaultFile = 'brainstorming/future-goals/brainstorming/ongoing-brainstorming-discussion.md';
      const relativeFilePath = input.filePath || defaultFile;
      const absoluteFilePath = path.join(input.projectPath, relativeFilePath);

      if (!fs.existsSync(absoluteFilePath)) {
        return {
          success: false,
          message: 'Error',
          error: `Brainstorming file not found: ${relativeFilePath}\n` +
                 `Expected at: ${absoluteFilePath}\n` +
                 `Create this file or specify a different filePath.`,
        };
      }

      // Step 3: Read file content
      const content = fs.readFileSync(absoluteFilePath, 'utf-8');

      if (!content.trim()) {
        return {
          success: true,
          ideasFound: 0,
          ideas: [],
          message: 'File is empty',
          formatted: 'The brainstorming file is empty. Add some ideas to get started!',
        };
      }

      // Step 4: Scan for ideas
      const rawIdeas = scanMarkdownForIdeas(content);

      // Step 5: Score and filter by confidence
      const minConfidence = input.minConfidence ?? 0.6;
      const extractedIdeas: ExtractedIdea[] = [];

      rawIdeas.forEach((raw, index) => {
        const confidence = scoreIdeaConfidence(raw);

        if (confidence >= minConfidence) {
          const id = `idea-${(index + 1).toString().padStart(3, '0')}`;
          const suggestedName = generateIdeaName(raw.text);
          const reasoning = determineReasoning(raw, confidence);
          const context = [raw.contextBefore, raw.contextAfter]
            .filter(c => c)
            .join(' ')
            .slice(0, 200); // Limit context length

          extractedIdeas.push({
            id,
            text: raw.text,
            context: context || 'No surrounding context',
            confidence,
            location: {
              lineNumber: raw.lineNumber,
              sectionHeading: raw.sectionHeading,
            },
            suggestedName,
            reasoning,
          });
        }
      });

      // Step 6: Sort by confidence (highest first)
      extractedIdeas.sort((a, b) => b.confidence - a.confidence);

      // Re-assign IDs after sorting
      extractedIdeas.forEach((idea, index) => {
        idea.id = `idea-${(index + 1).toString().padStart(3, '0')}`;
      });

      // Step 7: Return results
      return {
        success: true,
        ideasFound: extractedIdeas.length,
        ideas: extractedIdeas,
        message: `Successfully extracted ${extractedIdeas.length} idea(s)`,
        formatted: formatOutput(extractedIdeas, absoluteFilePath),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error',
        error: String(error),
      };
    }
  }

  /**
   * Format the result for display
   */
  static formatResult(result: ExtractIdeasOutput): string {
    if (!result.success) {
      return `❌ Error: ${result.error}`;
    }

    return result.formatted || result.message;
  }

  /**
   * Get MCP tool definition
   */
  static getToolDefinition() {
    return {
      name: 'extract_ideas',
      description: 'Scan brainstorming discussion markdown file for actionable ideas using AI pattern matching. Detects ideas based on action verbs, problem statements, and feature mentions with confidence scoring.',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Absolute path to the project directory',
          },
          filePath: {
            type: 'string',
            description: 'Optional: Relative path from projectPath to brainstorming file. Default: brainstorming/future-goals/brainstorming/ongoing-brainstorming-discussion.md',
          },
          minConfidence: {
            type: 'number',
            description: 'Optional: Minimum confidence threshold (0-1). Default: 0.6. Higher values return fewer, more confident ideas.',
            minimum: 0,
            maximum: 1,
          },
        },
        required: ['projectPath'],
      },
    };
  }
}
