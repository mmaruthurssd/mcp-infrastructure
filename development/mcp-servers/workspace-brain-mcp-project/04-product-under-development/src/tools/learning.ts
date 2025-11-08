/**
 * Learning Tools
 * Manage learned patterns, solutions, and preventive checks
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

interface Pattern {
  id: string;
  name: string;
  category: string;
  description: string;
  frequency?: number;
  tools_involved?: string[];
  steps?: string[];
  notes?: string;
  created_at: string;
}

interface PreventiveCheck {
  id: string;
  name: string;
  description: string;
  when_to_run: string;
  automated: boolean;
  category?: string;
}

/**
 * Record Pattern
 * Store a discovered pattern in learning database
 */
export async function recordPattern(args: any, brainPath: string) {
  try {
    const patternsFile = join(brainPath, "learning", "issue-patterns.json");

    // Read existing patterns
    let patternsData: { version: string; patterns: Pattern[] } = {
      version: "1.0",
      patterns: []
    };

    if (existsSync(patternsFile)) {
      const content = readFileSync(patternsFile, "utf-8");
      patternsData = JSON.parse(content);
    }

    // Create new pattern
    const pattern: Pattern = {
      id: randomUUID(),
      name: args.pattern.name,
      category: args.pattern.category,
      description: args.pattern.description,
      frequency: args.pattern.frequency,
      tools_involved: args.pattern.tools_involved,
      steps: args.pattern.steps,
      notes: args.pattern.notes,
      created_at: new Date().toISOString()
    };

    // Add to patterns
    patternsData.patterns.push(pattern);

    // Save
    writeFileSync(patternsFile, JSON.stringify(patternsData, null, 2), { mode: 0o600 });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              pattern_id: pattern.id,
              stored_at: patternsFile
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: `Failed to record pattern: ${error.message}`
          }, null, 2)
        }
      ],
      isError: true
    };
  }
}

/**
 * Get Similar Patterns
 * Find patterns matching query using keyword matching
 */
export async function getSimilarPatterns(args: any, brainPath: string) {
  try {
    const patternsFile = join(brainPath, "learning", "issue-patterns.json");

    // Read patterns
    let patternsData: { version: string; patterns: Pattern[] } = {
      version: "1.0",
      patterns: []
    };

    if (existsSync(patternsFile)) {
      const content = readFileSync(patternsFile, "utf-8");
      patternsData = JSON.parse(content);
    }

    let patterns = patternsData.patterns;

    // Filter by category if specified
    if (args.category) {
      patterns = patterns.filter(p => p.category === args.category);
    }

    // Calculate similarity scores (simple keyword matching)
    const query = args.query.toLowerCase();
    const queryWords = query.split(/\s+/);

    const scoredPatterns = patterns.map(pattern => {
      const searchText = `${pattern.name} ${pattern.description} ${pattern.category}`.toLowerCase();
      const searchWords = searchText.split(/\s+/);

      // Count matching words
      let matches = 0;
      queryWords.forEach((qWord: string) => {
        if (searchWords.some((sWord: string) => sWord.includes(qWord) || qWord.includes(sWord))) {
          matches++;
        }
      });

      const similarity = matches / queryWords.length;

      return {
        pattern,
        similarity_score: similarity
      };
    });

    // Filter by threshold and sort
    const threshold = args.similarity_threshold || 0.6;
    const limit = args.limit || 5;

    const results = scoredPatterns
      .filter(p => p.similarity_score >= threshold)
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, limit)
      .map(p => ({
        pattern_id: p.pattern.id,
        name: p.pattern.name,
        category: p.pattern.category,
        description: p.pattern.description,
        similarity_score: Math.round(p.similarity_score * 100) / 100,
        tools_involved: p.pattern.tools_involved || []
      }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              patterns: results
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: `Failed to get similar patterns: ${error.message}`
          }, null, 2)
        }
      ],
      isError: true
    };
  }
}

/**
 * Get Preventive Checks
 * Get recommendations for preventive checks based on context
 */
export async function getPreventiveChecks(args: any, brainPath: string) {
  try {
    const checksFile = join(brainPath, "learning", "preventive-checks.json");

    // Read checks
    let checksData: { version: string; checks: PreventiveCheck[] } = {
      version: "1.0",
      checks: []
    };

    if (existsSync(checksFile)) {
      const content = readFileSync(checksFile, "utf-8");
      checksData = JSON.parse(content);
    }

    let checks = checksData.checks;

    // Filter by context
    if (args.context) {
      checks = checks.filter(c => c.when_to_run === args.context || c.when_to_run === "always");
    }

    // Filter by category
    if (args.category) {
      checks = checks.filter(c => c.category === args.category);
    }

    // If no checks exist yet, provide defaults
    if (checks.length === 0) {
      checks = getDefaultPreventiveChecks(args.context);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              checks
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: `Failed to get preventive checks: ${error.message}`
          }, null, 2)
        }
      ],
      isError: true
    };
  }
}

/**
 * Get Default Preventive Checks
 * Provides sensible defaults based on context
 */
function getDefaultPreventiveChecks(context?: string): PreventiveCheck[] {
  const allChecks: PreventiveCheck[] = [
    {
      id: "pre-commit-creds",
      name: "Scan for credentials",
      description: "Check staged files for exposed API keys, tokens, and passwords",
      when_to_run: "pre-commit",
      automated: true,
      category: "security"
    },
    {
      id: "pre-commit-phi",
      name: "Scan for PHI",
      description: "Check for Protected Health Information in committed files",
      when_to_run: "pre-commit",
      automated: true,
      category: "compliance"
    },
    {
      id: "deployment-tests",
      name: "Run test suite",
      description: "Execute all tests before deployment",
      when_to_run: "deployment",
      automated: true,
      category: "quality"
    },
    {
      id: "deployment-build",
      name: "Verify build",
      description: "Ensure project builds without errors",
      when_to_run: "deployment",
      automated: true,
      category: "quality"
    },
    {
      id: "deployment-env",
      name: "Check environment variables",
      description: "Verify all required environment variables are set",
      when_to_run: "deployment",
      automated: true,
      category: "configuration"
    },
    {
      id: "general-docs",
      name: "Update documentation",
      description: "Keep documentation in sync with code changes",
      when_to_run: "always",
      automated: false,
      category: "documentation"
    }
  ];

  if (context) {
    return allChecks.filter(c => c.when_to_run === context || c.when_to_run === "always");
  }

  return allChecks;
}
