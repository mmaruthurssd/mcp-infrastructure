/**
 * Identify Stakeholders Tool
 *
 * Extract and categorize stakeholders from conversation.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ConversationManager } from '../utils/conversation-manager.js';
import { NLPExtractor } from '../utils/nlp-extractor.js';
import { ProjectSetupRenderer } from '../utils/project-setup-renderer.js';

// ============================================================================
// Types
// ============================================================================

export interface IdentifyStakeholdersInput {
  projectPath: string;
  conversationId: string;
}

export interface Stakeholder {
  name: string;
  role?: string;
  type: 'primary' | 'secondary' | 'external';
  influence: 'high' | 'medium' | 'low';
  interest: 'high' | 'medium' | 'low';
  concerns?: string[];
  communicationNeeds?: string;
}

export interface IdentifyStakeholdersOutput {
  success: boolean;
  stakeholdersPath: string;
  stakeholders: Stakeholder[];
  matrix: {
    manageClosely: number;
    keepSatisfied: number;
    keepInformed: number;
    monitor: number;
  };
  formatted: string;
}

// ============================================================================
// Tool Implementation
// ============================================================================

export class IdentifyStakeholdersTool {
  static execute(input: IdentifyStakeholdersInput): IdentifyStakeholdersOutput {
    // Load conversation
    const state = ConversationManager.loadConversation(input.projectPath, input.conversationId);

    // Get full conversation text
    const conversationText = state.messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n');

    // Extract stakeholders using NLP
    const stakeholderMentions = NLPExtractor.extractStakeholders(conversationText);

    // Also include from extractedInfo
    const explicitStakeholders = state.extractedInfo.stakeholders.map(s => ({
      name: s,
      type: this.inferStakeholderType(s) as 'individual' | 'group',
    }));

    // Combine and deduplicate
    const allMentions = [...stakeholderMentions, ...explicitStakeholders];
    const uniqueStakeholders = this.deduplicateStakeholders(allMentions);

    // Categorize and analyze each stakeholder
    const stakeholders: Stakeholder[] = uniqueStakeholders.map(mention => {
      const type = this.categorizeStakeholder(mention.name, state.projectType);
      const influence = this.assessInfluence(mention.name, mention.role);
      const interest = this.assessInterest(mention.name, mention.role);
      const concerns = this.identifyConcerns(mention.name, conversationText);
      const communicationNeeds = this.determineCommunication(influence, interest);

      return {
        name: mention.name,
        role: mention.role,
        type,
        influence,
        interest,
        concerns: concerns.length > 0 ? concerns : undefined,
        communicationNeeds,
      };
    });

    // Group by type
    const primaryStakeholders = stakeholders.filter(s => s.type === 'primary');
    const secondaryStakeholders = stakeholders.filter(s => s.type === 'secondary');
    const externalStakeholders = stakeholders.filter(s => s.type === 'external');

    // Create stakeholder matrix
    const allStakeholdersWithStrategy = stakeholders.map(s => ({
      ...s,
      strategy: this.getStrategy(s.influence, s.interest),
    }));

    const matrix = {
      manageClosely: allStakeholdersWithStrategy.filter(s => s.strategy === 'Manage Closely').length,
      keepSatisfied: allStakeholdersWithStrategy.filter(s => s.strategy === 'Keep Satisfied').length,
      keepInformed: allStakeholdersWithStrategy.filter(s => s.strategy === 'Keep Informed').length,
      monitor: allStakeholdersWithStrategy.filter(s => s.strategy === 'Monitor').length,
    };

    // Render stakeholders document
    const templateData = {
      projectName: state.projectName,
      date: new Date().toISOString().split('T')[0],
      primaryStakeholders,
      secondaryStakeholders,
      externalStakeholders,
      allStakeholders: allStakeholdersWithStrategy,
    };

    const templatePath = path.join(
      path.dirname(new URL(import.meta.url).pathname),
      '../templates/project-setup/STAKEHOLDERS.md'
    );
    const stakeholdersContent = ProjectSetupRenderer.render(templatePath, templateData);

    // Save to 03-resources-docs-assets-tools/ (template structure)
    const resourcesDir = path.join(input.projectPath, '03-resources-docs-assets-tools');
    if (!fs.existsSync(resourcesDir)) {
      fs.mkdirSync(resourcesDir, { recursive: true });
    }

    const stakeholdersPath = path.join(resourcesDir, 'STAKEHOLDERS.md');
    fs.writeFileSync(stakeholdersPath, stakeholdersContent, 'utf-8');

    // Format output
    const formatted = this.formatOutput(state.projectName, stakeholders, matrix, stakeholdersPath);

    return {
      success: true,
      stakeholdersPath,
      stakeholders,
      matrix,
      formatted,
    };
  }

  static getToolDefinition() {
    return {
      name: 'identify_stakeholders',
      description: 'Extract and categorize stakeholders from the project setup conversation. Analyzes influence, interest, concerns, and communication needs for each stakeholder.',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Absolute path to project directory',
          },
          conversationId: {
            type: 'string',
            description: 'Conversation ID from start_project_setup',
          },
        },
        required: ['projectPath', 'conversationId'],
      },
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private static deduplicateStakeholders(mentions: any[]): any[] {
    const seen = new Set<string>();
    return mentions.filter(m => {
      const key = m.name.toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private static categorizeStakeholder(name: string, projectType: string): 'primary' | 'secondary' | 'external' {
    const lower = name.toLowerCase();

    // Primary: Direct users and key decision makers
    if (/user|customer|patient|client|ceo|cto|cmo|executive|sponsor|owner/i.test(lower)) {
      return 'primary';
    }

    // External: Third parties
    if (/partner|vendor|regulator|insurance|third.?party|external|board/i.test(lower)) {
      return 'external';
    }

    // Secondary: Support roles
    return 'secondary';
  }

  private static assessInfluence(name: string, role?: string): 'high' | 'medium' | 'low' {
    const text = `${name} ${role || ''}`.toLowerCase();

    // High influence: executives, regulators, key decision makers
    if (/ceo|cto|cmo|cfo|vp|director|executive|regulator|sponsor|board/i.test(text)) {
      return 'high';
    }

    // Low influence: individual users (unless large group)
    if (/user|customer|patient/i.test(text) && !/\d+/.test(text)) {
      return 'low';
    }

    // Medium influence: managers, teams, groups
    return 'medium';
  }

  private static assessInterest(name: string, role?: string): 'high' | 'medium' | 'low' {
    const text = `${name} ${role || ''}`.toLowerCase();

    // High interest: daily users, directly impacted parties
    if (/user|customer|patient|physician|doctor|staff|employee/i.test(text)) {
      return 'high';
    }

    // Low interest: regulatory, compliance (care about outcomes, not process)
    if (/regulator|compliance|audit|legal|board/i.test(text)) {
      return 'low';
    }

    // Medium interest: everyone else
    return 'medium';
  }

  private static identifyConcerns(name: string, conversationText: string): string[] {
    const concerns: string[] = [];
    const sentences = conversationText.split(/[.!?]+/);

    // Look for sentences mentioning this stakeholder with concern keywords
    const concernKeywords = ['concern', 'worry', 'risk', 'afraid', 'fear', 'problem', 'issue'];

    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(name.toLowerCase())) {
        for (const keyword of concernKeywords) {
          if (sentence.toLowerCase().includes(keyword)) {
            concerns.push(sentence.trim());
            break;
          }
        }
      }
    }

    return concerns.slice(0, 3); // Limit to 3 concerns
  }

  private static determineCommunication(influence: string, interest: string): string {
    if (influence === 'high' && interest === 'high') {
      return 'Weekly updates, active engagement, rapid feedback loops';
    }
    if (influence === 'high' && interest !== 'high') {
      return 'Monthly executive briefings, major milestone updates';
    }
    if (influence !== 'high' && interest === 'high') {
      return 'Regular status updates, feedback channels, user testing invitations';
    }
    return 'Quarterly updates, as-needed communication';
  }

  private static getStrategy(influence: string, interest: string): string {
    if (influence === 'high' && interest === 'high') return 'Manage Closely';
    if (influence === 'high') return 'Keep Satisfied';
    if (interest === 'high') return 'Keep Informed';
    return 'Monitor';
  }

  private static inferStakeholderType(name: string): string {
    return name.match(/\d+\s+/) ? 'group' : 'individual';
  }

  private static formatOutput(
    projectName: string,
    stakeholders: Stakeholder[],
    matrix: any,
    filePath: string
  ): string {
    let output = '='.repeat(60) + '\n';
    output += '  STAKEHOLDERS IDENTIFIED\n';
    output += '='.repeat(60) + '\n\n';

    output += `📋 Project: ${projectName}\n`;
    output += `📄 File: ${filePath}\n\n`;

    output += '─'.repeat(60) + '\n\n';

    output += `👥 STAKEHOLDER SUMMARY:\n\n`;
    output += `   Total Stakeholders: ${stakeholders.length}\n\n`;

    const primary = stakeholders.filter(s => s.type === 'primary');
    const secondary = stakeholders.filter(s => s.type === 'secondary');
    const external = stakeholders.filter(s => s.type === 'external');

    output += `   By Type:\n`;
    output += `      • Primary (direct impact): ${primary.length}\n`;
    output += `      • Secondary (indirect): ${secondary.length}\n`;
    output += `      • External (third-party): ${external.length}\n\n`;

    output += `   Stakeholder Matrix:\n`;
    output += `      • Manage Closely: ${matrix.manageClosely}\n`;
    output += `      • Keep Satisfied: ${matrix.keepSatisfied}\n`;
    output += `      • Keep Informed: ${matrix.keepInformed}\n`;
    output += `      • Monitor: ${matrix.monitor}\n\n`;

    output += '─'.repeat(60) + '\n\n';

    output += 'KEY STAKEHOLDERS:\n\n';

    for (const stakeholder of stakeholders.slice(0, 5)) {
      output += `• ${stakeholder.name}`;
      if (stakeholder.role) output += ` (${stakeholder.role})`;
      output += `\n`;
      output += `  Influence: ${stakeholder.influence} | Interest: ${stakeholder.interest}\n`;
      output += `  Type: ${stakeholder.type}\n`;
      if (stakeholder.communicationNeeds) {
        output += `  Communication: ${stakeholder.communicationNeeds}\n`;
      }
      output += `\n`;
    }

    if (stakeholders.length > 5) {
      output += `... and ${stakeholders.length - 5} more stakeholders\n\n`;
    }

    output += '─'.repeat(60) + '\n\n';
    output += '✅ Stakeholders analyzed successfully!\n\n';

    return output;
  }
}
