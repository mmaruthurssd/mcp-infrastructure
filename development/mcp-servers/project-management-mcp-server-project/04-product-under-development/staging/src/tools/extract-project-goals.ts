/**
 * Extract Project Goals Tool
 *
 * Extract structured goals from planning conversation.
 */

import { ConversationManager } from '../utils/conversation-manager.js';
import { NLPExtractor } from '../utils/nlp-extractor.js';
import { ImpactEstimator } from '../evaluators/impact-estimator.js';
import { EffortEstimator } from '../evaluators/effort-estimator.js';
import { TierSuggester } from '../evaluators/tier-suggester.js';

// ============================================================================
// Types
// ============================================================================

export interface ExtractProjectGoalsInput {
  projectPath: string;
  conversationId: string;
}

export interface ExtractedGoal {
  id: string;
  name: string;
  description: string;
  suggestedImpact: 'High' | 'Medium' | 'Low';
  suggestedEffort: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
  suggestedTier: 'Now' | 'Next' | 'Later' | 'Someday';
  tier: 'Now' | 'Next' | 'Later' | 'Someday';  // Alias for suggestedTier
  extractedFrom: string;
  confidence: number;
}

export interface ExtractProjectGoalsOutput {
  success: boolean;
  goalsExtracted: number;
  mainGoals: ExtractedGoal[];
  formatted: string;
}

// ============================================================================
// Tool Implementation
// ============================================================================

export class ExtractProjectGoalsTool {
  static execute(input: ExtractProjectGoalsInput): ExtractProjectGoalsOutput {
    // Load conversation
    const state = ConversationManager.loadConversation(input.projectPath, input.conversationId);

    // Get full conversation text
    const conversationText = state.messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n');

    // Extract goals using NLP
    const goalMentions = NLPExtractor.extractGoals(conversationText);

    // Also include goals from extractedInfo
    const explicitGoals = state.extractedInfo.goals.map(g => ({
      text: g,
      confidence: 0.9,
      context: 'Explicit goal mention',
    }));

    // Combine and deduplicate
    const allGoalMentions = [...goalMentions, ...explicitGoals];
    const uniqueGoals = this.deduplicateGoals(allGoalMentions);

    // Convert to structured goals with AI estimates
    const mainGoals: ExtractedGoal[] = [];
    for (let i = 0; i < uniqueGoals.length; i++) {
      const mention = uniqueGoals[i];

      // Use evaluators to estimate impact, effort, tier
      const impact = ImpactEstimator.estimate(mention.text);
      const effort = EffortEstimator.estimate(mention.text);
      const tierSuggestion = TierSuggester.suggest(impact, effort);

      mainGoals.push({
        id: `setup-goal-${String(i + 1).padStart(3, '0')}`,
        name: this.generateGoalName(mention.text),
        description: mention.text,
        suggestedImpact: impact.level as 'High' | 'Medium' | 'Low',
        suggestedEffort: effort.level as 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low',
        suggestedTier: tierSuggestion.tier as 'Now' | 'Next' | 'Later' | 'Someday',
        tier: tierSuggestion.tier as 'Now' | 'Next' | 'Later' | 'Someday',  // Alias for compatibility
        extractedFrom: mention.context,
        confidence: mention.confidence,
      });
    }

    // Sort by confidence (highest first)
    mainGoals.sort((a, b) => b.confidence - a.confidence);

    // Format output
    const formatted = this.formatOutput(mainGoals);

    return {
      success: true,
      goalsExtracted: mainGoals.length,
      mainGoals,
      formatted,
    };
  }

  static getToolDefinition() {
    return {
      name: 'extract_project_goals',
      description: 'Extract structured goals from the project setup conversation. Uses NLP to identify goal statements and AI estimators to suggest impact, effort, and tier for each goal.',
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

  private static deduplicateGoals(goals: any[]): any[] {
    const seen = new Set<string>();
    return goals.filter(g => {
      const normalized = g.text.toLowerCase().trim();
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  }

  private static generateGoalName(text: string): string {
    // Truncate and clean up goal text to create a concise name
    let name = text.trim();

    // Remove common prefixes
    name = name.replace(/^(build|create|develop|implement|add|fix|improve|design)\s+/i, '');

    // Capitalize first letter
    name = name.charAt(0).toUpperCase() + name.slice(1);

    // Limit length
    if (name.length > 60) {
      name = name.substring(0, 57) + '...';
    }

    return name;
  }

  private static formatOutput(goals: ExtractedGoal[]): string {
    let output = '='.repeat(60) + '\n';
    output += '  EXTRACTED PROJECT GOALS\n';
    output += '='.repeat(60) + '\n\n';

    output += `📊 Total Goals Extracted: ${goals.length}\n\n`;

    if (goals.length === 0) {
      output += '⚠️  No goals found in conversation.\n';
      output += 'Try providing more specific information about what you want to build.\n\n';
      return output;
    }

    output += '─'.repeat(60) + '\n\n';

    for (const goal of goals) {
      const confidenceBar = '█'.repeat(Math.round(goal.confidence * 10));
      const tierEmoji: Record<string, string> = {
        'Now': '🔴',
        'Next': '🟡',
        'Later': '🟢',
        'Someday': '🔵',
      };
      const emoji = tierEmoji[goal.tier] || '⚪';

      output += `${goal.id}: ${goal.name}\n`;
      output += `   Impact: ${goal.suggestedImpact} | Effort: ${goal.suggestedEffort} | Tier: ${emoji} ${goal.suggestedTier}\n`;
      output += `   Confidence: ${confidenceBar} ${Math.round(goal.confidence * 100)}%\n`;
      output += `   Description: ${goal.description}\n`;
      output += `   Extracted from: "${goal.extractedFrom.substring(0, 80)}..."\n`;
      output += '\n';
    }

    output += '─'.repeat(60) + '\n\n';
    output += '💡 Next Steps:\n';
    output += '   1. Review the extracted goals above\n';
    output += '   2. These goals will be used in generate_initial_roadmap\n';
    output += '   3. Call finalize_project_setup to create potential goal files\n\n';

    return output;
  }
}
