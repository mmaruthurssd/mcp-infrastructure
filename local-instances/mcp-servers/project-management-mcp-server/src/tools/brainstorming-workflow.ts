/**
 * Brainstorming Workflow Tools
 *
 * MCP Tools for structured brainstorming when direction is uncertain
 * Supports exploration, idea capture, decision tracking, and promotion to major goals
 *
 * Created: 2025-10-28
 * Goal: 009 - Create Brainstorming Workflow Framework
 */

import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface BrainstormingSession {
  id: string;
  title: string;
  problem: string;
  context?: string;
  componentId?: string;
  subAreaId?: string;
  createdAt: string;
  lastUpdated: string;
  status: 'active' | 'decided' | 'archived';
  ideasCount: number;
  decisionsCount: number;
  folderPath: string;
}

export interface BrainstormingIdea {
  id: string;
  sessionId: string;
  title: string;
  description: string;
  approach: string;
  pros: string[];
  cons: string[];
  research?: string;
  estimatedEffort?: string;
  feasibility?: 'high' | 'medium' | 'low';
  createdAt: string;
  status: 'exploring' | 'researched' | 'selected' | 'rejected';
}

export interface BrainstormingDecision {
  id: string;
  sessionId: string;
  selectedIdeas: string[]; // Idea IDs
  rejectedIdeas: string[]; // Idea IDs
  rationale: string;
  tradeoffs: string;
  nextSteps: string[];
  decidedAt: string;
  decidedBy?: string;
}

// ============================================================================
// TOOL: start_brainstorming_session
// ============================================================================

export async function startBrainstormingSession(args: {
  projectPath: string;
  title: string;
  problem: string;
  context?: string;
  componentId?: string;
  subAreaId?: string;
}): Promise<{
  success: boolean;
  session?: BrainstormingSession;
  sessionPath?: string;
  error?: string;
}> {
  const { projectPath, title, problem, context, componentId, subAreaId } = args;

  try {
    // Create brainstorming sessions directory
    const brainstormingPath = path.join(projectPath, 'brainstorming', 'sessions');
    fs.mkdirSync(brainstormingPath, { recursive: true });

    // Generate session ID (slugified title + timestamp)
    const timestamp = Date.now();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const sessionId = `${slug}-${timestamp}`;

    // Create session folder
    const sessionPath = path.join(brainstormingPath, sessionId);
    fs.mkdirSync(sessionPath);
    fs.mkdirSync(path.join(sessionPath, 'ideas'));
    fs.mkdirSync(path.join(sessionPath, 'decisions'));

    // Create SESSION-OVERVIEW.md
    const overviewContent = generateSessionOverview({
      sessionId,
      title,
      problem,
      context,
      componentId,
      subAreaId,
      timestamp: new Date().toISOString(),
    });

    const overviewPath = path.join(sessionPath, 'SESSION-OVERVIEW.md');
    fs.writeFileSync(overviewPath, overviewContent, 'utf-8');

    // Create empty DECISION-LOG.md
    const decisionLogContent = `---
type: decision-log
tags: [brainstorming, decisions, ${sessionId}]
---

# Decision Log: ${title}

**Session ID:** ${sessionId}
**Created:** ${new Date().toISOString().split('T')[0]}

---

## Decisions

*No decisions recorded yet*

Use \`record_brainstorming_decision\` to document decisions about which approaches to pursue.

---

**Session:** ${sessionId}
`;

    const decisionLogPath = path.join(sessionPath, 'DECISION-LOG.md');
    fs.writeFileSync(decisionLogPath, decisionLogContent, 'utf-8');

    const session: BrainstormingSession = {
      id: sessionId,
      title,
      problem,
      context,
      componentId,
      subAreaId,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'active',
      ideasCount: 0,
      decisionsCount: 0,
      folderPath: sessionPath,
    };

    return {
      success: true,
      session,
      sessionPath,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate SESSION-OVERVIEW.md content
 */
function generateSessionOverview(data: {
  sessionId: string;
  title: string;
  problem: string;
  context?: string;
  componentId?: string;
  subAreaId?: string;
  timestamp: string;
}): string {
  const date = data.timestamp.split('T')[0];

  return `---
type: brainstorming-session
tags: [brainstorming, session, planning, ${data.sessionId}]
---

# Brainstorming Session: ${data.title}

**Session ID:** ${data.sessionId}
**Status:** Active
**Created:** ${date}
**Last Updated:** ${date}
${data.componentId ? `**Component:** ${data.componentId}` : ''}
${data.subAreaId ? `**Sub-Area:** ${data.subAreaId}` : ''}

---

## Problem / Opportunity

${data.problem}

---

## Context

${data.context || '*No additional context provided*'}

---

## Brainstorming Process

**Phase 1: Idea Generation**
- Generate multiple possible approaches
- Don't evaluate yet - just capture ideas
- Use \`add_brainstorming_idea\` tool

**Phase 2: Research & Exploration**
- Research each approach
- Document pros/cons
- Estimate effort and feasibility

**Phase 3: Decision**
- Evaluate all approaches
- Select which to pursue
- Document rationale
- Use \`record_brainstorming_decision\` tool

**Phase 4: Promotion**
- Promote selected approaches to major goals
- Use \`promote_to_major_goal\` tool with sourceType: 'brainstorming'

---

## Ideas

*No ideas captured yet*

Use \`add_brainstorming_idea\` to capture approaches to explore.

---

## Decisions

*No decisions recorded yet*

Use \`record_brainstorming_decision\` to document which approaches to pursue.

---

## Next Actions

1. Generate multiple approach ideas
2. Research and explore each
3. Evaluate pros/cons
4. Make decision about which to pursue
5. Promote selected approaches to major goals

---

**Generated:** ${data.timestamp}
**Tool:** Project Management MCP v1.0.0 - Brainstorming Workflow
`;
}

// ============================================================================
// TOOL: add_brainstorming_idea
// ============================================================================

export async function addBrainstormingIdea(args: {
  projectPath: string;
  sessionId: string;
  title: string;
  description: string;
  approach: string;
  pros?: string[];
  cons?: string[];
  research?: string;
  estimatedEffort?: string;
  feasibility?: 'high' | 'medium' | 'low';
}): Promise<{
  success: boolean;
  idea?: BrainstormingIdea;
  ideaPath?: string;
  error?: string;
}> {
  const {
    projectPath,
    sessionId,
    title,
    description,
    approach,
    pros = [],
    cons = [],
    research,
    estimatedEffort,
    feasibility,
  } = args;

  try {
    // Find session folder
    const sessionPath = path.join(projectPath, 'brainstorming', 'sessions', sessionId);

    if (!fs.existsSync(sessionPath)) {
      return {
        success: false,
        error: `Brainstorming session "${sessionId}" not found`,
      };
    }

    // Generate idea ID
    const ideasPath = path.join(sessionPath, 'ideas');
    const existingIdeas = fs.readdirSync(ideasPath).filter(f => f.endsWith('.md'));
    const ideaNumber = existingIdeas.length + 1;
    const ideaId = `idea-${ideaNumber}`;
    const ideaSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const ideaFileName = `${ideaId}-${ideaSlug}.md`;
    const ideaPath = path.join(ideasPath, ideaFileName);

    // Create idea file
    const ideaContent = generateIdeaMarkdown({
      ideaId,
      sessionId,
      title,
      description,
      approach,
      pros,
      cons,
      research,
      estimatedEffort,
      feasibility,
      timestamp: new Date().toISOString(),
    });

    fs.writeFileSync(ideaPath, ideaContent, 'utf-8');

    // Update SESSION-OVERVIEW.md
    await updateSessionOverviewWithIdea(sessionPath, ideaId, title);

    const idea: BrainstormingIdea = {
      id: ideaId,
      sessionId,
      title,
      description,
      approach,
      pros,
      cons,
      research,
      estimatedEffort,
      feasibility,
      createdAt: new Date().toISOString(),
      status: research ? 'researched' : 'exploring',
    };

    return {
      success: true,
      idea,
      ideaPath,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate idea markdown content
 */
function generateIdeaMarkdown(data: {
  ideaId: string;
  sessionId: string;
  title: string;
  description: string;
  approach: string;
  pros: string[];
  cons: string[];
  research?: string;
  estimatedEffort?: string;
  feasibility?: 'high' | 'medium' | 'low';
  timestamp: string;
}): string {
  const date = data.timestamp.split('T')[0];

  return `---
type: brainstorming-idea
tags: [brainstorming, idea, ${data.sessionId}, ${data.ideaId}]
---

# Idea: ${data.title}

**Idea ID:** ${data.ideaId}
**Session:** ${data.sessionId}
**Status:** ${data.research ? 'Researched' : 'Exploring'}
**Created:** ${date}
**Feasibility:** ${data.feasibility || 'TBD'}
**Estimated Effort:** ${data.estimatedEffort || 'TBD'}

---

## Description

${data.description}

---

## Approach

${data.approach}

---

## Pros

${data.pros.length > 0 ? data.pros.map(p => `- ${p}`).join('\n') : '*To be identified during research*'}

---

## Cons

${data.cons.length > 0 ? data.cons.map(c => `- ${c}`).join('\n') : '*To be identified during research*'}

---

## Research & Notes

${data.research || '*Research notes will be added here as we explore this approach*'}

---

## Evaluation

**Feasibility:** ${data.feasibility || 'TBD'}
**Estimated Effort:** ${data.estimatedEffort || 'TBD'}

---

## Next Steps

1. Research this approach further
2. Document pros and cons
3. Estimate effort and feasibility
4. Include in decision process

---

**Created:** ${data.timestamp}
**Tool:** Project Management MCP v1.0.0 - Brainstorming Workflow
`;
}

/**
 * Update SESSION-OVERVIEW.md with new idea
 */
async function updateSessionOverviewWithIdea(
  sessionPath: string,
  ideaId: string,
  title: string
): Promise<void> {
  const overviewPath = path.join(sessionPath, 'SESSION-OVERVIEW.md');
  let content = fs.readFileSync(overviewPath, 'utf-8');

  // Update "Ideas" section
  if (content.includes('*No ideas captured yet*')) {
    content = content.replace(
      '*No ideas captured yet*',
      `- **${ideaId}:** ${title}`
    );
  } else {
    content = content.replace(
      /## Ideas\n\n([\s\S]*?)\n\n---/,
      `## Ideas\n\n$1\n- **${ideaId}:** ${title}\n\n---`
    );
  }

  // Update last updated date
  const today = new Date().toISOString().split('T')[0];
  content = content.replace(/\*\*Last Updated:\*\* .+/, `**Last Updated:** ${today}`);

  fs.writeFileSync(overviewPath, content, 'utf-8');
}

// ============================================================================
// TOOL: record_brainstorming_decision
// ============================================================================

export async function recordBrainstormingDecision(args: {
  projectPath: string;
  sessionId: string;
  selectedIdeas: string[]; // Idea IDs
  rejectedIdeas?: string[]; // Idea IDs
  rationale: string;
  tradeoffs?: string;
  nextSteps?: string[];
  decidedBy?: string;
}): Promise<{
  success: boolean;
  decision?: BrainstormingDecision;
  decisionPath?: string;
  error?: string;
}> {
  const {
    projectPath,
    sessionId,
    selectedIdeas,
    rejectedIdeas = [],
    rationale,
    tradeoffs,
    nextSteps = [],
    decidedBy,
  } = args;

  try {
    // Find session folder
    const sessionPath = path.join(projectPath, 'brainstorming', 'sessions', sessionId);

    if (!fs.existsSync(sessionPath)) {
      return {
        success: false,
        error: `Brainstorming session "${sessionId}" not found`,
      };
    }

    // Validate idea IDs exist
    const ideasPath = path.join(sessionPath, 'ideas');
    const allIdeaIds = [...selectedIdeas, ...rejectedIdeas];

    for (const ideaId of allIdeaIds) {
      const ideaFiles = fs.readdirSync(ideasPath).filter(f => f.startsWith(ideaId));
      if (ideaFiles.length === 0) {
        return {
          success: false,
          error: `Idea "${ideaId}" not found in session "${sessionId}"`,
        };
      }
    }

    // Generate decision ID
    const decisionsPath = path.join(sessionPath, 'decisions');
    const existingDecisions = fs.readdirSync(decisionsPath).filter(f => f.endsWith('.md'));
    const decisionNumber = existingDecisions.length + 1;
    const decisionId = `decision-${decisionNumber}`;
    const decisionFileName = `${decisionId}.md`;
    const decisionPath = path.join(decisionsPath, decisionFileName);

    // Create decision file
    const timestamp = new Date().toISOString();
    const decisionContent = generateDecisionMarkdown({
      decisionId,
      sessionId,
      selectedIdeas,
      rejectedIdeas,
      rationale,
      tradeoffs,
      nextSteps,
      decidedBy,
      timestamp,
    });

    fs.writeFileSync(decisionPath, decisionContent, 'utf-8');

    // Update DECISION-LOG.md
    await updateDecisionLog(sessionPath, decisionId, selectedIdeas, timestamp);

    // Update SESSION-OVERVIEW.md status
    await updateSessionStatus(sessionPath, 'decided');

    const decision: BrainstormingDecision = {
      id: decisionId,
      sessionId,
      selectedIdeas,
      rejectedIdeas,
      rationale,
      tradeoffs: tradeoffs || '',
      nextSteps,
      decidedAt: timestamp,
      decidedBy,
    };

    return {
      success: true,
      decision,
      decisionPath,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate decision markdown content
 */
function generateDecisionMarkdown(data: {
  decisionId: string;
  sessionId: string;
  selectedIdeas: string[];
  rejectedIdeas: string[];
  rationale: string;
  tradeoffs?: string;
  nextSteps: string[];
  decidedBy?: string;
  timestamp: string;
}): string {
  const date = data.timestamp.split('T')[0];

  return `---
type: brainstorming-decision
tags: [brainstorming, decision, ${data.sessionId}, ${data.decisionId}]
---

# Decision: ${data.decisionId}

**Decision ID:** ${data.decisionId}
**Session:** ${data.sessionId}
**Decided:** ${date}
**Decided By:** ${data.decidedBy || 'Team'}

---

## Selected Approaches

${data.selectedIdeas.map(id => `- **${id}** (Will be pursued)`).join('\n')}

---

## Rejected Approaches

${data.rejectedIdeas.length > 0 ? data.rejectedIdeas.map(id => `- **${id}** (Not pursuing)`).join('\n') : '*No approaches explicitly rejected*'}

---

## Rationale

${data.rationale}

---

## Tradeoffs Considered

${data.tradeoffs || '*No specific tradeoffs documented*'}

---

## Next Steps

${data.nextSteps.length > 0 ? data.nextSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n') : '*Next steps to be determined*'}

**Recommended:**
1. Promote selected approaches to major goals using \`promote_to_major_goal\` tool
2. Set priority and target dates
3. Hand off to Spec-Driven MCP for decomposition

---

## Promotion to Major Goals

Selected ideas should be promoted to major goals:

\`\`\`bash
# For each selected idea, promote to major goal:
promote_to_major_goal(
  projectPath: "/path/to/project",
  componentId: "appropriate-component",
  sourceType: "brainstorming",
  goalName: "Name from selected idea",
  description: "Description from idea",
  purpose: "Approach and rationale from decision",
  priority: "High/Medium/Low"
)
\`\`\`

---

**Created:** ${data.timestamp}
**Tool:** Project Management MCP v1.0.0 - Brainstorming Workflow
`;
}

/**
 * Update DECISION-LOG.md with new decision
 */
async function updateDecisionLog(
  sessionPath: string,
  decisionId: string,
  selectedIdeas: string[],
  timestamp: string
): Promise<void> {
  const logPath = path.join(sessionPath, 'DECISION-LOG.md');
  let content = fs.readFileSync(logPath, 'utf-8');

  const date = timestamp.split('T')[0];
  const decisionEntry = `
### ${decisionId}

**Date:** ${date}
**Selected:** ${selectedIdeas.join(', ')}

See \`decisions/${decisionId}.md\` for full details.

---
`;

  // Update decisions section
  if (content.includes('*No decisions recorded yet*')) {
    content = content.replace('*No decisions recorded yet*', decisionEntry);
  } else {
    content = content.replace(
      /## Decisions\n\n([\s\S]*?)\n\n---\n\n\*\*Session:/,
      `## Decisions\n\n$1\n${decisionEntry}\n---\n\n**Session:`
    );
  }

  fs.writeFileSync(logPath, content, 'utf-8');
}

/**
 * Update session status in SESSION-OVERVIEW.md
 */
async function updateSessionStatus(
  sessionPath: string,
  status: 'active' | 'decided' | 'archived'
): Promise<void> {
  const overviewPath = path.join(sessionPath, 'SESSION-OVERVIEW.md');
  let content = fs.readFileSync(overviewPath, 'utf-8');

  // Update status
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
  content = content.replace(/\*\*Status:\*\* .+/, `**Status:** ${statusLabel}`);

  // Update last updated date
  const today = new Date().toISOString().split('T')[0];
  content = content.replace(/\*\*Last Updated:\*\* .+/, `**Last Updated:** ${today}`);

  fs.writeFileSync(overviewPath, content, 'utf-8');
}

// ============================================================================
// TOOL: get_brainstorming_session
// ============================================================================

export async function getBrainstormingSession(args: {
  projectPath: string;
  sessionId: string;
}): Promise<{
  success: boolean;
  session?: {
    id: string;
    title: string;
    problem: string;
    status: string;
    ideasCount: number;
    decisionsCount: number;
    ideas: Array<{ id: string; title: string; status: string }>;
    decisions: Array<{ id: string; selectedIdeas: string[]; date: string }>;
  };
  error?: string;
}> {
  const { projectPath, sessionId } = args;

  try {
    // Find session folder
    const sessionPath = path.join(projectPath, 'brainstorming', 'sessions', sessionId);

    if (!fs.existsSync(sessionPath)) {
      return {
        success: false,
        error: `Brainstorming session "${sessionId}" not found`,
      };
    }

    // Read SESSION-OVERVIEW.md
    const overviewPath = path.join(sessionPath, 'SESSION-OVERVIEW.md');
    const overviewContent = fs.readFileSync(overviewPath, 'utf-8');

    // Parse session data (simplified)
    const titleMatch = overviewContent.match(/# Brainstorming Session: (.+)/);
    const statusMatch = overviewContent.match(/\*\*Status:\*\* (.+)/);
    const problemMatch = overviewContent.match(/## Problem \/ Opportunity\n\n([\s\S]*?)\n\n---/);

    // Count ideas
    const ideasPath = path.join(sessionPath, 'ideas');
    const ideaFiles = fs.existsSync(ideasPath)
      ? fs.readdirSync(ideasPath).filter(f => f.endsWith('.md'))
      : [];

    // Count decisions
    const decisionsPath = path.join(sessionPath, 'decisions');
    const decisionFiles = fs.existsSync(decisionsPath)
      ? fs.readdirSync(decisionsPath).filter(f => f.endsWith('.md'))
      : [];

    // Read idea details
    const ideas = ideaFiles.map(file => {
      const content = fs.readFileSync(path.join(ideasPath, file), 'utf-8');
      const ideaTitle = content.match(/# Idea: (.+)/)?.[1] || 'Unknown';
      const ideaId = content.match(/\*\*Idea ID:\*\* (.+)/)?.[1] || 'unknown';
      const ideaStatus = content.match(/\*\*Status:\*\* (.+)/)?.[1] || 'exploring';

      return {
        id: ideaId,
        title: ideaTitle,
        status: ideaStatus.toLowerCase(),
      };
    });

    // Read decision details
    const decisions = decisionFiles.map(file => {
      const content = fs.readFileSync(path.join(decisionsPath, file), 'utf-8');
      const decisionId = content.match(/\*\*Decision ID:\*\* (.+)/)?.[1] || 'unknown';
      const date = content.match(/\*\*Decided:\*\* (.+)/)?.[1] || 'unknown';

      const selectedSection = content.match(/## Selected Approaches\n\n([\s\S]*?)\n\n---/);
      const selectedIdeas: string[] = [];

      if (selectedSection) {
        const matches = selectedSection[1].matchAll(/- \*\*(.+?)\*\*/g);
        for (const match of matches) {
          selectedIdeas.push(match[1]);
        }
      }

      return {
        id: decisionId,
        selectedIdeas,
        date,
      };
    });

    return {
      success: true,
      session: {
        id: sessionId,
        title: titleMatch ? titleMatch[1] : 'Unknown',
        problem: problemMatch ? problemMatch[1].trim() : '',
        status: statusMatch ? statusMatch[1] : 'Active',
        ideasCount: ideaFiles.length,
        decisionsCount: decisionFiles.length,
        ideas,
        decisions,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// MCP TOOL DEFINITIONS
// ============================================================================

export const startBrainstormingSessionTool = {
  name: 'start_brainstorming_session',
  description:
    'Start a new brainstorming session for exploring uncertain directions or multiple approaches',
  inputSchema: z.object({
    projectPath: z.string().describe('Absolute path to the project directory'),
    title: z.string().min(5).describe('Session title (e.g., "Marketing Strategy Exploration")'),
    problem: z.string().min(10).describe('Problem or opportunity to explore'),
    context: z.string().optional().describe('Additional context or constraints'),
    componentId: z.string().optional().describe('Associated component (if known)'),
    subAreaId: z.string().optional().describe('Associated sub-area (if known)'),
  }),
};

export const addBrainstormingIdeaTool = {
  name: 'add_brainstorming_idea',
  description:
    'Add an idea or approach to a brainstorming session for exploration',
  inputSchema: z.object({
    projectPath: z.string().describe('Absolute path to the project directory'),
    sessionId: z.string().describe('Session ID from start_brainstorming_session'),
    title: z.string().min(5).describe('Idea title'),
    description: z.string().min(10).describe('Detailed description of the idea'),
    approach: z.string().min(10).describe('How this approach would work'),
    pros: z.array(z.string()).optional().describe('Advantages of this approach'),
    cons: z.array(z.string()).optional().describe('Disadvantages or risks'),
    research: z.string().optional().describe('Research notes and findings'),
    estimatedEffort: z.string().optional().describe('Estimated effort (e.g., "2-3 weeks")'),
    feasibility: z.enum(['high', 'medium', 'low']).optional().describe('Feasibility assessment'),
  }),
};

export const recordBrainstormingDecisionTool = {
  name: 'record_brainstorming_decision',
  description:
    'Record a decision about which brainstorming approaches to pursue',
  inputSchema: z.object({
    projectPath: z.string().describe('Absolute path to the project directory'),
    sessionId: z.string().describe('Session ID'),
    selectedIdeas: z.array(z.string()).min(1).describe('Idea IDs to pursue'),
    rejectedIdeas: z.array(z.string()).optional().describe('Idea IDs not to pursue'),
    rationale: z.string().min(20).describe('Why these approaches were selected'),
    tradeoffs: z.string().optional().describe('Tradeoffs considered in the decision'),
    nextSteps: z.array(z.string()).optional().describe('Next actions to take'),
    decidedBy: z.string().optional().describe('Person or team making decision'),
  }),
};

export const getBrainstormingSessionTool = {
  name: 'get_brainstorming_session',
  description:
    'Get detailed status of a brainstorming session including all ideas and decisions',
  inputSchema: z.object({
    projectPath: z.string().describe('Absolute path to the project directory'),
    sessionId: z.string().describe('Session ID'),
  }),
};
