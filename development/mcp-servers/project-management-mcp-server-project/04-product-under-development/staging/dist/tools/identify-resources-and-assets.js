/**
 * Identify Resources and Assets Tool
 *
 * Extract resource inventory and asset list from conversation.
 */
import * as fs from 'fs';
import * as path from 'path';
import { ConversationManager } from '../utils/conversation-manager.js';
import { NLPExtractor } from '../utils/nlp-extractor.js';
import { ProjectSetupRenderer } from '../utils/project-setup-renderer.js';
// ============================================================================
// Tool Implementation
// ============================================================================
export class IdentifyResourcesAndAssetsTool {
    static execute(input) {
        // Load conversation
        const state = ConversationManager.loadConversation(input.projectPath, input.conversationId);
        // Get full conversation text
        const conversationText = state.messages
            .filter(m => m.role === 'user')
            .map(m => m.content)
            .join('\n\n');
        // Extract additional resources/assets from full text
        const resources = NLPExtractor.extractResources(conversationText);
        const assets = NLPExtractor.extractAssets(conversationText);
        // Prepare resources data
        const teamMembers = state.extractedInfo.resources.team.map(t => ({
            name: this.extractName(t) || 'Team Member',
            role: this.extractRole(t),
            allocation: this.extractAllocation(t),
            skills: this.extractSkills(t),
        }));
        const toolCategories = this.categorizeTools(state.extractedInfo.resources.tools);
        const techStacks = this.categorizeTechnologies(state.extractedInfo.resources.technologies);
        const budgetInfo = {
            total: state.extractedInfo.resources.budget[0] || null,
            breakdown: this.parseBudgetBreakdown(state.extractedInfo.resources.budget),
        };
        const timelineInfo = {
            duration: this.extractDuration(conversationText),
            milestones: null,
        };
        // Prepare assets data
        const existingAssets = state.extractedInfo.assets.existing.map(a => ({
            name: a,
            type: this.inferAssetType(a),
            description: a,
            location: null,
        }));
        const neededAssets = state.extractedInfo.assets.needed.map(a => ({
            name: a,
            type: this.inferAssetType(a),
            description: a,
            priority: this.inferPriority(a),
        }));
        const externalDependencies = state.extractedInfo.assets.external.map(a => ({
            name: a,
            provider: this.extractProvider(a),
            cost: null,
            setupTime: null,
            notes: null,
        }));
        // Render resources document
        const resourcesData = {
            projectName: state.projectName,
            date: new Date().toISOString().split('T')[0],
            team: teamMembers,
            tools: state.extractedInfo.resources.tools,
            toolCategories: toolCategories.length > 0 ? toolCategories : null,
            technologies: state.extractedInfo.resources.technologies,
            techStacks: techStacks.length > 0 ? techStacks : null,
            budget: budgetInfo,
            timeline: timelineInfo,
        };
        const resourcesTemplatePath = path.join(path.dirname(new URL(import.meta.url).pathname), '../templates/project-setup/RESOURCES.md');
        const resourcesContent = ProjectSetupRenderer.render(resourcesTemplatePath, resourcesData);
        // Render assets document
        const assetsData = {
            projectName: state.projectName,
            date: new Date().toISOString().split('T')[0],
            existingAssets,
            neededAssets,
            externalDependencies,
        };
        const assetsTemplatePath = path.join(path.dirname(new URL(import.meta.url).pathname), '../templates/project-setup/ASSETS.md');
        const assetsContent = ProjectSetupRenderer.render(assetsTemplatePath, assetsData);
        // Consolidate resources and assets into single RESOURCE-INDEX.md
        const consolidatedContent = `---
type: reference
tags: [resources, assets, inventory]
created: ${new Date().toISOString().split('T')[0]}
---

# Resource Index

**Project:** ${state.projectName}
**Last Updated:** ${new Date().toISOString().split('T')[0]}

---

${resourcesContent}

---

${assetsContent}
`;
        // Save to 03-resources-docs-assets-tools/ (template structure)
        const resourcesDir = path.join(input.projectPath, '03-resources-docs-assets-tools');
        if (!fs.existsSync(resourcesDir)) {
            fs.mkdirSync(resourcesDir, { recursive: true });
        }
        const resourcesPath = path.join(resourcesDir, 'RESOURCE-INDEX.md');
        const assetsPath = resourcesPath; // Now same file
        fs.writeFileSync(resourcesPath, consolidatedContent, 'utf-8');
        // Format output
        const formatted = this.formatOutput(state.projectName, resourcesPath, assetsPath, resourcesData, assetsData);
        return {
            success: true,
            resourcesPath,
            assetsPath,
            resources: {
                team: teamMembers.length,
                tools: state.extractedInfo.resources.tools.length,
                technologies: state.extractedInfo.resources.technologies.length,
                budget: state.extractedInfo.resources.budget.length,
            },
            assets: {
                existing: existingAssets.length,
                needed: neededAssets.length,
                external: externalDependencies.length,
            },
            formatted,
        };
    }
    static getToolDefinition() {
        return {
            name: 'identify_resources_and_assets',
            description: 'Extract resource inventory (team, tools, technologies, budget) and asset list (existing, needed, external dependencies) from the project setup conversation.',
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
    static extractName(teamMention) {
        // Try to extract a name (capitalized words)
        const nameMatch = teamMention.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
        return nameMatch ? nameMatch[1] : null;
    }
    static extractRole(teamMention) {
        const lowerMention = teamMention.toLowerCase();
        const roles = ['developer', 'designer', 'manager', 'engineer', 'analyst', 'consultant', 'advisor'];
        for (const role of roles) {
            if (lowerMention.includes(role)) {
                return role.charAt(0).toUpperCase() + role.slice(1);
            }
        }
        return 'Team Member';
    }
    static extractAllocation(teamMention) {
        const percentMatch = teamMention.match(/(\d+)%/);
        if (percentMatch) {
            return percentMatch[1] + '%';
        }
        if (/full.?time|100%/i.test(teamMention)) {
            return '100%';
        }
        if (/part.?time|half.?time/i.test(teamMention)) {
            return '50%';
        }
        return '100%';
    }
    static extractSkills(teamMention) {
        // Try to extract skills if mentioned
        const skillsMatch = teamMention.match(/skills?:?\s*([^,\.]+)/i);
        return skillsMatch ? skillsMatch[1].trim() : '';
    }
    static categorizeTools(tools) {
        if (tools.length === 0)
            return [];
        const categories = {
            'Development': [],
            'Design': [],
            'Infrastructure': [],
            'Communication': [],
            'Project Management': [],
            'Other': [],
        };
        const devTools = ['GitHub', 'GitLab', 'VS Code', 'IntelliJ', 'Docker', 'Kubernetes'];
        const designTools = ['Figma', 'Sketch', 'Adobe'];
        const infraTools = ['AWS', 'Azure', 'GCP', 'CloudFlare'];
        const commTools = ['Slack', 'Teams', 'Zoom'];
        const pmTools = ['Jira', 'Linear', 'Notion', 'Confluence'];
        for (const tool of tools) {
            if (devTools.some(t => tool.includes(t))) {
                categories['Development'].push(tool);
            }
            else if (designTools.some(t => tool.includes(t))) {
                categories['Design'].push(tool);
            }
            else if (infraTools.some(t => tool.includes(t))) {
                categories['Infrastructure'].push(tool);
            }
            else if (commTools.some(t => tool.includes(t))) {
                categories['Communication'].push(tool);
            }
            else if (pmTools.some(t => tool.includes(t))) {
                categories['Project Management'].push(tool);
            }
            else {
                categories['Other'].push(tool);
            }
        }
        return Object.entries(categories)
            .filter(([_, tools]) => tools.length > 0)
            .map(([category, tools]) => ({ category, tools }));
    }
    static categorizeTechnologies(techs) {
        if (techs.length === 0)
            return [];
        const categories = {
            'Frontend': [],
            'Backend': [],
            'Database': [],
            'Other': [],
        };
        const frontendTechs = ['React', 'Vue', 'Angular', 'TypeScript', 'JavaScript'];
        const backendTechs = ['Node.js', 'Python', 'Java', 'Go', 'Rust'];
        const databaseTechs = ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'];
        for (const tech of techs) {
            if (frontendTechs.some(t => tech.includes(t))) {
                categories['Frontend'].push(tech);
            }
            else if (backendTechs.some(t => tech.includes(t))) {
                categories['Backend'].push(tech);
            }
            else if (databaseTechs.some(t => tech.includes(t))) {
                categories['Database'].push(tech);
            }
            else {
                categories['Other'].push(tech);
            }
        }
        return Object.entries(categories)
            .filter(([_, technologies]) => technologies.length > 0)
            .map(([category, technologies]) => ({ category, technologies }));
    }
    static parseBudgetBreakdown(budgetMentions) {
        // Simple parsing - could be enhanced
        return [];
    }
    static extractDuration(text) {
        const durationMatch = text.match(/(\d+\s+(?:weeks?|months?|years?))/i);
        return durationMatch ? durationMatch[1] : null;
    }
    static inferAssetType(assetName) {
        const lower = assetName.toLowerCase();
        if (/database|db|sql|data/i.test(lower))
            return 'data';
        if (/api|integration|interface/i.test(lower))
            return 'integration';
        if (/design|ui|ux|mockup/i.test(lower))
            return 'design';
        if (/doc|documentation|guide/i.test(lower))
            return 'documentation';
        return 'other';
    }
    static inferPriority(assetName) {
        const lower = assetName.toLowerCase();
        if (/critical|required|must|essential/i.test(lower))
            return 'critical';
        if (/important|high|priority/i.test(lower))
            return 'high';
        if (/nice|optional|would be/i.test(lower))
            return 'low';
        return 'medium';
    }
    static extractProvider(externalAsset) {
        // Try to extract provider name (usually capitalized)
        const providerMatch = externalAsset.match(/([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)?)/);
        return providerMatch ? providerMatch[1] : 'Unknown Provider';
    }
    static formatOutput(projectName, resourcesPath, assetsPath, resourcesData, assetsData) {
        let output = '='.repeat(60) + '\n';
        output += '  RESOURCES & ASSETS IDENTIFIED\n';
        output += '='.repeat(60) + '\n\n';
        output += `📋 Project: ${projectName}\n\n`;
        output += '📄 Files Created:\n';
        output += `   • RESOURCES.md: ${resourcesPath}\n`;
        output += `   • ASSETS.md: ${assetsPath}\n\n`;
        output += '─'.repeat(60) + '\n\n';
        output += '👥 RESOURCES:\n\n';
        output += `   Team Members: ${resourcesData.team.length}\n`;
        output += `   Tools: ${resourcesData.tools.length}\n`;
        output += `   Technologies: ${resourcesData.technologies.length}\n`;
        if (resourcesData.budget.total) {
            output += `   Budget: ${resourcesData.budget.total}\n`;
        }
        if (resourcesData.timeline.duration) {
            output += `   Timeline: ${resourcesData.timeline.duration}\n`;
        }
        output += '\n';
        output += '📦 ASSETS:\n\n';
        output += `   Existing Assets: ${assetsData.existingAssets.length}\n`;
        output += `   Needed Assets: ${assetsData.neededAssets.length}\n`;
        output += `   External Dependencies: ${assetsData.externalDependencies.length}\n\n`;
        output += '─'.repeat(60) + '\n\n';
        output += '✅ Resources and assets documented successfully!\n\n';
        return output;
    }
}
//# sourceMappingURL=identify-resources-and-assets.js.map