/**
 * Conversation Manager
 *
 * Manages multi-turn conversation state for project setup workflow.
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

export type ProjectType = 'software' | 'research' | 'business' | 'product';
export type ConstitutionMode = 'quick' | 'deep';
export type ConversationStatus = 'in-progress' | 'ready-to-generate' | 'completed';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ExtractedInfo {
  problems: string[];
  goals: string[];
  stakeholders: string[];
  resources: {
    team: string[];
    tools: string[];
    technologies: string[];
    budget: string[];
  };
  assets: {
    existing: string[];
    needed: string[];
    external: string[];
  };
  constraints: string[];
  successCriteria: string[];
}

export interface CompletenessCheck {
  overall: number;  // 0-100 percentage
  hasProblems: boolean;
  hasStakeholders: boolean;
  hasResources: boolean;
  hasSuccessCriteria: boolean;
}

export interface ConversationState {
  conversationId: string;
  projectPath: string;
  projectName: string;
  projectType: ProjectType;
  constitutionMode: ConstitutionMode;

  startedAt: string;
  lastUpdatedAt: string;
  status: ConversationStatus;

  messages: ConversationMessage[];
  extractedInfo: ExtractedInfo;
  completeness: CompletenessCheck;
}

export interface ProjectMetadata {
  projectName: string;
  projectType: ProjectType;
  constitutionMode: ConstitutionMode;
  initialDescription?: string;
}

// ============================================================================
// Conversation Manager Class
// ============================================================================

export class ConversationManager {
  /**
   * Initialize a new conversation
   */
  static initConversation(
    projectPath: string,
    metadata: ProjectMetadata
  ): ConversationState {
    const conversationId = this.generateConversationId();
    const now = new Date().toISOString();

    const state: ConversationState = {
      conversationId,
      projectPath,
      projectName: metadata.projectName,
      projectType: metadata.projectType,
      constitutionMode: metadata.constitutionMode,

      startedAt: now,
      lastUpdatedAt: now,
      status: 'in-progress',

      messages: [],
      extractedInfo: {
        problems: [],
        goals: [],
        stakeholders: [],
        resources: {
          team: [],
          tools: [],
          technologies: [],
          budget: [],
        },
        assets: {
          existing: [],
          needed: [],
          external: [],
        },
        constraints: [],
        successCriteria: [],
      },
      completeness: {
        overall: 0,
        hasProblems: false,
        hasStakeholders: false,
        hasResources: false,
        hasSuccessCriteria: false,
      },
    };

    // Add initial question
    const firstQuestion = this.getFirstQuestion(metadata.projectType);
    this.appendMessage(state, 'assistant', firstQuestion);

    // If initial description provided, process it
    if (metadata.initialDescription) {
      this.appendMessage(state, 'user', metadata.initialDescription);
    }

    // Save state
    this.saveConversation(state);

    return state;
  }

  /**
   * Load existing conversation from disk
   */
  static loadConversation(projectPath: string, conversationId: string): ConversationState {
    const statePath = this.getStatePath(projectPath, conversationId);

    if (!fs.existsSync(statePath)) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    const content = fs.readFileSync(statePath, 'utf-8');
    return JSON.parse(content) as ConversationState;
  }

  /**
   * Save conversation state to disk
   */
  static saveConversation(state: ConversationState): void {
    const setupDir = this.getSetupDir(state.projectPath);

    // Ensure directory exists
    if (!fs.existsSync(setupDir)) {
      fs.mkdirSync(setupDir, { recursive: true });
    }

    // Save state JSON
    const statePath = this.getStatePath(state.projectPath, state.conversationId);
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');

    // Also save readable conversation log
    const logPath = path.join(setupDir, 'conversation-log.md');
    const logContent = this.generateConversationLog(state);
    fs.writeFileSync(logPath, logContent, 'utf-8');
  }

  /**
   * Append a message to the conversation
   */
  static appendMessage(
    state: ConversationState,
    role: 'user' | 'assistant',
    content: string
  ): void {
    state.messages.push({
      role,
      content,
      timestamp: new Date().toISOString(),
    });
    state.lastUpdatedAt = new Date().toISOString();
  }

  /**
   * Update extracted information
   */
  static updateExtractedInfo(
    state: ConversationState,
    newInfo: Partial<ExtractedInfo>
  ): void {
    // Merge new info with existing, avoiding duplicates
    if (newInfo.problems) {
      state.extractedInfo.problems = [
        ...new Set([...state.extractedInfo.problems, ...newInfo.problems])
      ];
    }
    if (newInfo.goals) {
      state.extractedInfo.goals = [
        ...new Set([...state.extractedInfo.goals, ...newInfo.goals])
      ];
    }
    if (newInfo.stakeholders) {
      state.extractedInfo.stakeholders = [
        ...new Set([...state.extractedInfo.stakeholders, ...newInfo.stakeholders])
      ];
    }
    if (newInfo.resources?.team) {
      state.extractedInfo.resources.team = [
        ...new Set([...state.extractedInfo.resources.team, ...newInfo.resources.team])
      ];
    }
    if (newInfo.resources?.tools) {
      state.extractedInfo.resources.tools = [
        ...new Set([...state.extractedInfo.resources.tools, ...newInfo.resources.tools])
      ];
    }
    if (newInfo.resources?.technologies) {
      state.extractedInfo.resources.technologies = [
        ...new Set([...state.extractedInfo.resources.technologies, ...newInfo.resources.technologies])
      ];
    }
    if (newInfo.resources?.budget) {
      state.extractedInfo.resources.budget = [
        ...new Set([...state.extractedInfo.resources.budget, ...newInfo.resources.budget])
      ];
    }
    if (newInfo.assets?.existing) {
      state.extractedInfo.assets.existing = [
        ...new Set([...state.extractedInfo.assets.existing, ...newInfo.assets.existing])
      ];
    }
    if (newInfo.assets?.needed) {
      state.extractedInfo.assets.needed = [
        ...new Set([...state.extractedInfo.assets.needed, ...newInfo.assets.needed])
      ];
    }
    if (newInfo.assets?.external) {
      state.extractedInfo.assets.external = [
        ...new Set([...state.extractedInfo.assets.external, ...newInfo.assets.external])
      ];
    }
    if (newInfo.constraints) {
      state.extractedInfo.constraints = [
        ...new Set([...state.extractedInfo.constraints, ...newInfo.constraints])
      ];
    }
    if (newInfo.successCriteria) {
      state.extractedInfo.successCriteria = [
        ...new Set([...state.extractedInfo.successCriteria, ...newInfo.successCriteria])
      ];
    }

    // Recalculate completeness
    state.completeness = this.calculateCompleteness(state);
    state.lastUpdatedAt = new Date().toISOString();
  }

  /**
   * Calculate conversation completeness (0-100%)
   */
  static calculateCompleteness(state: ConversationState): CompletenessCheck {
    const info = state.extractedInfo;

    const hasProblems = info.problems.length > 0;
    const hasStakeholders = info.stakeholders.length > 0;
    const hasResources = (
      info.resources.team.length > 0 ||
      info.resources.tools.length > 0 ||
      info.resources.technologies.length > 0 ||
      info.resources.budget.length > 0
    );
    const hasSuccessCriteria = info.successCriteria.length > 0;

    // Calculate overall percentage
    let score = 0;

    // Required items (60% of score)
    if (hasProblems) score += 20;
    if (hasStakeholders) score += 15;
    if (hasResources) score += 15;
    if (hasSuccessCriteria) score += 10;

    // Nice-to-have items (40% of score)
    if (info.goals.length > 0) score += 10;
    if (info.constraints.length > 0) score += 10;
    if (info.assets.existing.length > 0 || info.assets.needed.length > 0) score += 10;
    if (info.resources.team.length > 0) score += 5;
    if (info.resources.budget.length > 0) score += 5;

    return {
      overall: Math.min(score, 100),
      hasProblems,
      hasStakeholders,
      hasResources,
      hasSuccessCriteria,
    };
  }

  /**
   * Determine the next question to ask
   */
  static getNextQuestion(state: ConversationState): string | null {
    const info = state.extractedInfo;
    const mode = state.constitutionMode;

    // Check what's missing and ask accordingly
    if (info.problems.length === 0) {
      return this.getFirstQuestion(state.projectType);
    }

    if (info.stakeholders.length === 0) {
      return "Who will be impacted by this project? Think about users, team members, leadership, and any external parties.";
    }

    if (info.resources.team.length === 0 && info.resources.tools.length === 0) {
      return "What resources do you have available? This could include team members, tools, technologies, or budget.";
    }

    if (info.successCriteria.length === 0) {
      return "How will you measure success for this project? What metrics or outcomes are you aiming for?";
    }

    // For deep mode, ask additional questions
    if (mode === 'deep') {
      if (info.constraints.length === 0) {
        return "What constraints should we be aware of? This could include technical limitations, budget limits, deadlines, or regulatory requirements.";
      }

      if (info.assets.existing.length === 0 && info.assets.needed.length === 0) {
        return "Are there any existing assets we should know about (current systems, data, designs)? Or assets you know you'll need?";
      }
    }

    // Freeform question at the end
    if (state.messages.length < 8) {  // Less than 8 exchanges total
      return "Is there anything else important I should know about this project?";
    }

    // Ready to generate
    return null;
  }

  /**
   * Check if conversation is ready to generate documents
   */
  static isReadyToGenerate(state: ConversationState): boolean {
    const completeness = state.completeness;

    // Minimum requirements for quick mode
    if (state.constitutionMode === 'quick') {
      return (
        completeness.hasProblems &&
        completeness.hasStakeholders &&
        completeness.hasResources &&
        completeness.overall >= 50
      );
    }

    // Higher bar for deep mode
    return (
      completeness.hasProblems &&
      completeness.hasStakeholders &&
      completeness.hasResources &&
      completeness.hasSuccessCriteria &&
      completeness.overall >= 70
    );
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private static generateConversationId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `conv-${timestamp}-${random}`;
  }

  private static getSetupDir(projectPath: string): string {
    return path.join(projectPath, 'project-setup');
  }

  private static getStatePath(projectPath: string, conversationId: string): string {
    return path.join(this.getSetupDir(projectPath), 'conversation-state.json');
  }

  private static getFirstQuestion(projectType: ProjectType): string {
    const questions: Record<ProjectType, string> = {
      software: "Let's start by understanding the problem. What problem are you trying to solve with this software project?",
      research: "Let's begin with your research question. What are you trying to investigate or discover?",
      business: "Let's start with the business opportunity. What problem or market need is this business addressing?",
      product: "Let's understand the product vision. What problem does this product solve for users?",
    };

    return questions[projectType] || questions.software;
  }

  private static generateConversationLog(state: ConversationState): string {
    let log = `# Project Setup Conversation: ${state.projectName}\n\n`;
    log += `**Type:** ${state.projectType}\n`;
    log += `**Mode:** ${state.constitutionMode}\n`;
    log += `**Started:** ${new Date(state.startedAt).toLocaleString()}\n`;
    log += `**Status:** ${state.status}\n`;
    log += `**Completeness:** ${state.completeness.overall}%\n\n`;
    log += `---\n\n`;

    for (const msg of state.messages) {
      const timestamp = new Date(msg.timestamp).toLocaleTimeString();
      const speaker = msg.role === 'user' ? 'You' : 'AI';
      log += `## ${speaker} [${timestamp}]\n\n`;
      log += `${msg.content}\n\n`;
      log += `---\n\n`;
    }

    log += `## Extracted Information\n\n`;
    log += `### Problems (${state.extractedInfo.problems.length})\n`;
    state.extractedInfo.problems.forEach(p => log += `- ${p}\n`);
    log += `\n`;

    log += `### Goals (${state.extractedInfo.goals.length})\n`;
    state.extractedInfo.goals.forEach(g => log += `- ${g}\n`);
    log += `\n`;

    log += `### Stakeholders (${state.extractedInfo.stakeholders.length})\n`;
    state.extractedInfo.stakeholders.forEach(s => log += `- ${s}\n`);
    log += `\n`;

    log += `### Resources\n`;
    log += `- Team: ${state.extractedInfo.resources.team.join(', ')}\n`;
    log += `- Tools: ${state.extractedInfo.resources.tools.join(', ')}\n`;
    log += `- Technologies: ${state.extractedInfo.resources.technologies.join(', ')}\n`;
    log += `- Budget: ${state.extractedInfo.resources.budget.join(', ')}\n`;
    log += `\n`;

    log += `### Success Criteria (${state.extractedInfo.successCriteria.length})\n`;
    state.extractedInfo.successCriteria.forEach(sc => log += `- ${sc}\n`);

    return log;
  }
}
