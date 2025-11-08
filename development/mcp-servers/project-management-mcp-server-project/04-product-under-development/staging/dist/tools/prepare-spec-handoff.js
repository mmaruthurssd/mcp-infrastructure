/**
 * Prepare Spec Handoff Tool
 *
 * Prepares goal context for Spec-Driven MCP with ready-to-execute tool call
 */
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from 'workflow-orchestrator-mcp-server/dist/core/state-manager.js';
export class PrepareSpecHandoffTool {
    static execute(input) {
        const { projectPath, goalId } = input;
        // Read state
        const state = StateManager.read(projectPath);
        if (!state) {
            return {
                success: false,
                goalName: '',
                goalContext: {
                    name: '',
                    description: '',
                    impactScore: '',
                    effortScore: '',
                    tier: '',
                },
                suggestedToolCall: {
                    tool: '',
                    params: {},
                },
                message: 'No orchestration state found',
            };
        }
        // Try multiple paths for SELECTED-GOALS.md
        const possiblePaths = [
            path.join(projectPath, 'brainstorming/future-goals/selected-goals/SELECTED-GOALS.md'),
            path.join(projectPath, '02-goals-and-roadmap/selected-goals/SELECTED-GOALS.md'),
            path.join(projectPath, 'brainstorming/future-goals/SELECTED-GOALS.md'),
        ];
        let selectedGoalsFile;
        for (const filePath of possiblePaths) {
            if (fs.existsSync(filePath)) {
                selectedGoalsFile = filePath;
                break;
            }
        }
        if (!selectedGoalsFile) {
            return {
                success: false,
                goalName: '',
                goalContext: {
                    name: '',
                    description: '',
                    impactScore: '',
                    effortScore: '',
                    tier: '',
                },
                suggestedToolCall: {
                    tool: '',
                    params: {},
                },
                message: 'No SELECTED-GOALS.md file found',
            };
        }
        // Parse the SELECTED-GOALS.md file
        const goalContext = this.parseGoalFromMarkdown(selectedGoalsFile, goalId);
        if (!goalContext) {
            return {
                success: false,
                goalName: '',
                goalContext: {
                    name: '',
                    description: '',
                    impactScore: '',
                    effortScore: '',
                    tier: '',
                },
                suggestedToolCall: {
                    tool: '',
                    params: {},
                },
                message: `No goal found matching ID: ${goalId}`,
            };
        }
        const goalFolder = `goal-${goalId}`;
        // Build suggested tool call
        const suggestedToolCall = {
            tool: 'mcp__spec-driven__sdd_guide',
            params: {
                action: 'start',
                project_path: projectPath,
                description: goalContext.description || goalContext.name,
                // Optional: pass goal context for better spec generation
                goal_context: {
                    impact: goalContext.impactScore,
                    effort: goalContext.effortScore,
                    tier: goalContext.tier,
                },
            },
        };
        // Update integration tracking
        if (!state.integrations.specDriven.goalsWithSpecs.includes(goalFolder)) {
            state.integrations.specDriven.used = true;
            state.integrations.specDriven.lastHandoff = new Date().toISOString();
            state.integrations.specDriven.goalsWithSpecs.push(goalFolder);
            StateManager.write(projectPath, state);
        }
        // Suggest agent for specification work
        const taskDescription = `Create specification for: ${goalContext.description || goalContext.name}. This involves designing architecture, defining requirements, and creating technical specifications.`;
        const suggestedAgent = {
            agent: 'spec-architect',
            reasoning: 'Specification and architecture design work requires the spec-architect agent who specializes in creating detailed technical specifications, defining system architecture, and documenting requirements.',
            taskDescription,
        };
        return {
            success: true,
            goalName: goalFolder,
            goalContext,
            suggestedToolCall,
            suggestedAgent,
            message: `Spec handoff prepared for goal: ${goalFolder}`,
        };
    }
    /**
     * Parse goal from SELECTED-GOALS.md markdown file
     */
    static parseGoalFromMarkdown(filePath, goalId) {
        const content = fs.readFileSync(filePath, 'utf8');
        // Match goal sections with "Goal XX:" pattern
        const goalPattern = new RegExp(`### Goal ${goalId}:?\\s*([^\\n]+)[\\s\\S]*?` + // Goal title
            `\\*\\*Priority:\\*\\*\\s*(\\w+)[\\s\\S]*?` + // Priority
            `\\*\\*Status:\\*\\*\\s*([^\\n]+)[\\s\\S]*?` + // Status
            `\\*\\*Impact:\\*\\*\\s*(\\w+)[\\s\\S]*?` + // Impact
            `\\*\\*Effort:\\*\\*\\s*(\\w+)[\\s\\S]*?` + // Effort
            `(?:\\*\\*Description:\\*\\*\\s*([^\\n]+(?:\\n(?!\\*\\*)[^\\n]+)*))?`, // Description (optional multiline)
        'i');
        const match = content.match(goalPattern);
        if (!match) {
            return null;
        }
        const [, name, priority, status, impact, effort, description] = match;
        // Determine tier from priority/status or look for explicit tier field
        const tierMatch = content.match(new RegExp(`### Goal ${goalId}:[\\s\\S]*?\\*\\*Tier:\\*\\*\\s*(\\w+)`, 'i'));
        let tier = 'Now'; // default
        if (tierMatch) {
            tier = tierMatch[1];
        }
        else if (priority) {
            // Infer tier from priority if not explicit
            if (priority.toLowerCase() === 'high')
                tier = 'Now';
            else if (priority.toLowerCase() === 'medium')
                tier = 'Next';
            else if (priority.toLowerCase() === 'low')
                tier = 'Later';
        }
        return {
            name: name ? name.trim() : `Goal ${goalId}`,
            description: description ? description.trim() : name ? name.trim() : `Goal ${goalId}`,
            impactScore: impact ? impact.trim() : 'Medium',
            effortScore: effort ? effort.trim() : 'Medium',
            tier: tier.trim(),
        };
    }
    static formatResult(result) {
        let output = '='.repeat(70) + '\n';
        output += '  SPEC-DRIVEN MCP HANDOFF\n';
        output += '='.repeat(70) + '\n\n';
        if (!result.success) {
            output += `❌ ${result.message}\n`;
            return output;
        }
        output += `✅ ${result.message}\n\n`;
        output += `🎯 Goal: ${result.goalName}\n`;
        output += `📝 Description: ${result.goalContext.description}\n`;
        output += `📊 Impact: ${result.goalContext.impactScore} | Effort: ${result.goalContext.effortScore} | Tier: ${result.goalContext.tier}\n`;
        output += '\n' + '─'.repeat(70) + '\n\n';
        // Add agent suggestion if available
        if (result.suggestedAgent) {
            output += '🤖 RECOMMENDED AGENT\n\n';
            output += `Agent: ${result.suggestedAgent.agent}\n`;
            output += `Reasoning: ${result.suggestedAgent.reasoning}\n`;
            output += `Task: ${result.suggestedAgent.taskDescription}\n`;
            output += '\n' + '─'.repeat(70) + '\n\n';
        }
        output += '🔧 SUGGESTED TOOL CALL\n\n';
        output += `Tool: ${result.suggestedToolCall.tool}\n\n`;
        output += 'Parameters:\n';
        output += JSON.stringify(result.suggestedToolCall.params, null, 2);
        output += '\n\n';
        output += '─'.repeat(70) + '\n\n';
        output += '💡 NEXT STEPS\n\n';
        if (result.suggestedAgent) {
            output += `   1. Optional: Verify agent suggestion by calling mcp__agent-coordinator__suggest_agent_for_task\n`;
            output += `   2. Copy the suggested tool call above\n`;
            output += `   3. Execute it to start Spec-Driven workflow\n`;
            output += `   4. Follow the interactive prompts\n`;
            output += `   5. Spec will be created in goal folder\n`;
        }
        else {
            output += '   1. Copy the suggested tool call above\n';
            output += '   2. Execute it to start Spec-Driven workflow\n';
            output += '   3. Follow the interactive prompts\n';
            output += '   4. Spec will be created in goal folder\n';
        }
        output += '\n';
        output += '='.repeat(70) + '\n';
        return output;
    }
    static getToolDefinition() {
        return {
            name: 'prepare_spec_handoff',
            description: 'Prepare goal context for Spec-Driven MCP integration. Extracts goal details and provides ready-to-execute tool call for sdd_guide. Tracks integration in state.',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to the project directory',
                    },
                    goalId: {
                        type: 'string',
                        description: 'Goal ID (e.g., "01", "02") or partial name match',
                    },
                },
                required: ['projectPath', 'goalId'],
            },
        };
    }
}
//# sourceMappingURL=prepare-spec-handoff.js.map