#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { LearningEngine } from './learning-engine.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Global state
const projectRoot = process.env.ARCH_DECISION_PROJECT_ROOT || process.cwd();
const learningEngine = new LearningEngine({ projectRoot });
let decisionTree;
// Load decision tree
async function loadDecisionTree() {
    const treePath = join(__dirname, 'decision-tree.json');
    const data = await readFile(treePath, 'utf-8');
    decisionTree = JSON.parse(data);
}
// Create server
const server = new Server({
    name: 'arch-decision-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        resources: {},
        tools: {},
    },
});
// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: 'architecture://decision-tree',
                name: 'Decision Tree Framework',
                description: 'The complete decision tree for MCP vs subagent choices',
                mimeType: 'application/json',
            },
            {
                uri: 'architecture://learned-patterns',
                name: 'Learned Patterns',
                description: 'Patterns learned from past architectural decisions',
                mimeType: 'application/json',
            },
            {
                uri: 'architecture://best-practices',
                name: 'Architecture Best Practices',
                description: 'Guidelines and best practices for choosing architecture',
                mimeType: 'text/markdown',
            },
            {
                uri: 'architecture://examples',
                name: 'Real-World Examples',
                description: 'Examples from existing tools (file-organizer, git-assistant, etc.)',
                mimeType: 'application/json',
            },
        ],
    };
});
// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    if (uri === 'architecture://decision-tree') {
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(decisionTree, null, 2),
                },
            ],
        };
    }
    if (uri === 'architecture://learned-patterns') {
        const patterns = await learningEngine.listAllPatterns();
        const stats = await learningEngine.getStatistics();
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify({ patterns, stats }, null, 2),
                },
            ],
        };
    }
    if (uri === 'architecture://best-practices') {
        const practices = `# Architecture Decision Best Practices

## When to Choose Skill

✅ **Choose Skill when you need:**
- Workflow instructions or step-by-step processes
- Code patterns, formatting guidelines, or templates
- Brand guidelines or style guides
- Simple automation with scripts
- **Ultra-lightweight** approach (dozens of tokens vs thousands)
- **No AI behavior customization needed**
- Portable across Claude apps, Code, and API

**Key Principle:** Skills are for "how to do X" instructions, not specialized AI thinking.

## When to Choose MCP Server

✅ **Choose MCP Server when you need:**
- Access to external systems (APIs, databases, file system, git)
- State persistence across Claude sessions
- Continuous learning from user interactions
- Reusable tools across different AI clients
- Complex data transformations or processing

**Key Principle:** MCP servers provide *capabilities* Claude doesn't have natively.

## When to Choose Subagent

✅ **Choose Subagent when you need:**
- Specialized AI thinking or domain expertise
- Custom behavior/persona
- Separate context for focused work
- Complex multi-step reasoning
- Educational/teaching persona
- No external system dependencies

**Key Principle:** Subagents provide *specialized AI behavior* and thinking patterns.

## When to Choose Hybrids

✅ **Skill + Subagent:**
- Workflow instructions (Skill) + specialized AI behavior (Subagent)
- Example: Code review with company standards
- Token-efficient: Skill only loads when relevant

✅ **Skill + MCP Server:**
- External capabilities (MCP) + procedural guidance (Skill)
- Example: Git MCP + git workflow best practices Skill
- MCP provides tools, Skill provides usage patterns

✅ **MCP + Subagent (traditional hybrid):**
- External capabilities (MCP) + specialized AI guidance (Subagent)
- Example: File organizer, Git assistant
- Best when teaching/guidance is core to UX

✅ **Skill + MCP + Subagent (full hybrid):**
- External access + workflow patterns + AI intelligence
- Most complex but most powerful
- Example: Advanced deployment tool with procedures and strategic guidance
- Only worth it for sophisticated tools

## Decision Framework

1. **Start with workflow vs thinking:**
   - Primarily instructions/patterns? → Skill (ultra-lightweight!)
   - Specialized AI behavior? → Continue to step 2
   - Need external systems? → Continue to step 3

2. **Consider AI behavior needs:**
   - Just instructions to follow? → Skill
   - Custom AI thinking/behavior? → Subagent (or Subagent + Skill)

3. **Evaluate external system needs:**
   - Need APIs/databases/file access? → MCP Server
   - Consider adding Skill for workflows
   - Consider adding Subagent for guidance

4. **Think about token efficiency:**
   - Skills: ~50 tokens (scan) + ~500 tokens (when loaded)
   - Subagents: ~1000-3000 tokens (full prompt)
   - MCP: ~2000-5000 tokens per invocation

## Upgrade Paths

**Start simple, upgrade as needed:**
- Begin with Skill → Add Subagent if AI behavior needed → Add MCP if external access needed
- Begin with Subagent → Add Skill for token efficiency → Add MCP if external access needed
- Begin with MCP → Add Skill for workflows → Add Subagent for teaching/guidance

## Real-World Examples

**Brand Guidelines:** Skill Only
- Just instructions (colors, fonts, tone, formatting)
- Ultra-lightweight (dozens of tokens)
- Auto-loads when creating branded content

**Git Workflow:** Skill + MCP + Subagent
- MCP: Git commands, commit analysis
- Skill: Git best practices, conventional commit patterns
- Subagent: Teaching, guidance, orchestration

**Code Reviewer:** Subagent Only (or Subagent + Skill)
- Subagent: Specialized code review thinking
- Optional Skill: Company code standards (token-efficient)

**File Organizer:** MCP + Subagent
- MCP: File operations, pattern learning
- Subagent: Guidance, education, proactive suggestions
- Could add Skill for file organization patterns

## Key Insights from 2025

**Skills are a game-changer for token efficiency:**
- Many tools that previously needed Subagents can now use Skills
- Skills load only when relevant (auto-discovery)
- Perfect for guidelines, patterns, and workflows
- Can include executable scripts for automation

**When in doubt:**
1. Is it primarily instructions? → Skill
2. Is it primarily AI behavior? → Subagent
3. Does it need external systems? → MCP Server
4. Need multiple? → Hybrid approach
`;
        return {
            contents: [
                {
                    uri,
                    mimeType: 'text/markdown',
                    text: practices,
                },
            ],
        };
    }
    if (uri === 'architecture://examples') {
        const examples = {
            'brand-guidelines': {
                decision: 'skill-only',
                reasoning: 'Just workflow instructions for consistent branding - no AI behavior or external systems needed',
                skill: {
                    type: 'SKILL.md',
                    contains: 'Brand colors, fonts, tone, formatting rules, example templates',
                    tokenCost: '~50 tokens (scan) + ~300 tokens (loaded)',
                },
                whyNotSubagent: 'No specialized AI behavior needed - just instructions to follow',
                whyNotMCP: 'No external systems to access',
                tokenSavings: 'Saves ~2500 tokens vs subagent approach',
            },
            'code-style-enforcer': {
                decision: 'skill-with-subagent',
                reasoning: 'Needs company code standards (Skill) + code review intelligence (Subagent)',
                skill: {
                    type: 'SKILL.md',
                    contains: 'Code patterns, naming conventions, file structure, style rules',
                    tokenCost: '~400 tokens (when loaded)',
                },
                subagent: {
                    persona: 'Code quality reviewer',
                    uses: 'Skill for standards, adds intelligent analysis',
                    teaches: 'Why standards matter, not just what they are',
                },
                architecture: 'Skill provides patterns, Subagent provides thinking',
            },
            'git-workflow': {
                decision: 'skill-with-mcp-with-subagent',
                reasoning: 'Needs git commands (MCP) + workflow patterns (Skill) + teaching (Subagent)',
                mcpServer: {
                    tools: ['check_commit_readiness', 'suggest_commit_message', 'analyze_history'],
                    resources: ['git://status', 'git://commits'],
                    learningEngine: true,
                },
                skill: {
                    type: 'SKILL.md',
                    contains: 'Git best practices, conventional commit patterns, branching workflows',
                    tokenCost: '~500 tokens (when loaded)',
                },
                subagent: {
                    persona: 'Git workflow coach',
                    orchestrates: 'Uses MCP tools + follows Skill patterns',
                    teaches: 'Git philosophy and team collaboration',
                },
                architecture: 'Full hybrid - demonstrates all three working together',
            },
            'file-organizer': {
                decision: 'mcp-with-subagent',
                reasoning: 'Needs file operations (MCP) + guidance/education (subagent)',
                mcpServer: {
                    tools: ['list_files', 'move_file', 'suggest_location', 'add_pattern'],
                    resources: ['unorganized-files', 'custom-rules'],
                    learningEngine: true,
                },
                subagent: {
                    persona: 'Proactive file organization expert',
                    teaches: 'Organization principles and best practices',
                    orchestrates: 'Uses MCP tools intelligently',
                },
                potentialEnhancement: 'Could add Skill for file organization patterns (token efficiency)',
            },
            'git-assistant': {
                decision: 'mcp-with-subagent',
                reasoning: 'Needs git operations (MCP) + best practices teaching (subagent)',
                mcpServer: {
                    tools: ['check_commit_readiness', 'suggest_commit_message', 'analyze_history'],
                    resources: ['git://status', 'git://commits', 'git://diff'],
                    learningEngine: true,
                },
                subagent: {
                    persona: 'Git workflow coach',
                    teaches: 'Git best practices and conventional commits',
                    orchestrates: 'Guides commit timing and message quality',
                },
                modernEnhancement: 'Could add Skill for git patterns to reduce token cost',
            },
            'code-reviewer': {
                decision: 'subagent-only',
                reasoning: 'No external systems, just specialized code review thinking',
                subagent: {
                    persona: 'Senior code reviewer',
                    tools: ['Read', 'Grep', 'Glob'],
                    teaches: 'Code quality principles',
                },
                whyNotMCP: "Uses Claude's built-in Read tool, no external access needed",
                modernAlternative: 'Could use Skill + Subagent if code standards are formalized',
            },
            'database-query': {
                decision: 'mcp-server',
                reasoning: 'Needs database access, could add subagent for SQL guidance later',
                mcpServer: {
                    tools: ['execute_query', 'get_schema', 'explain_plan'],
                    resources: ['database://schema', 'database://recent-queries'],
                    learningEngine: true,
                },
                potentialEnhancement: 'Add Skill for SQL patterns + Subagent for query optimization teaching',
            },
            'document-formatter': {
                decision: 'executable-skill',
                reasoning: 'Needs to generate PDFs/Word docs with specific formatting - executable skill with scripts',
                skill: {
                    type: 'SKILL.md + scripts',
                    contains: 'Document templates, formatting instructions, generation scripts',
                    executable: true,
                    tokenCost: '~600 tokens (when loaded)',
                },
                whyNotMCP: 'Can be done with Claude execution environment, no external API needed',
                whyNotSubagent: 'No specialized AI behavior - just follow templates and run scripts',
            },
        };
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(examples, null, 2),
                },
            ],
        };
    }
    throw new Error(`Unknown resource: ${uri}`);
});
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'analyze_requirements',
                description: 'Analyze tool requirements and get architectural recommendation',
                inputSchema: {
                    type: 'object',
                    properties: {
                        description: {
                            type: 'string',
                            description: 'Description of the tool you want to build',
                        },
                        externalSystems: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'External systems this tool will interact with (optional)',
                        },
                        complexity: {
                            type: 'string',
                            enum: ['simple', 'moderate', 'complex'],
                            description: 'Estimated complexity of reasoning required (optional)',
                        },
                        stateNeeded: {
                            type: 'boolean',
                            description: 'Whether state persistence is needed (optional)',
                        },
                    },
                    required: ['description'],
                },
            },
            {
                name: 'suggest_architecture',
                description: 'Get architecture suggestion based on answered questions',
                inputSchema: {
                    type: 'object',
                    properties: {
                        hasExternalSystems: {
                            type: 'boolean',
                            description: 'Does tool interact with external systems?',
                        },
                        isComplex: {
                            type: 'boolean',
                            description: 'Does tool require complex reasoning?',
                        },
                        needsState: {
                            type: 'boolean',
                            description: 'Does tool need persistent state?',
                        },
                        needsTeaching: {
                            type: 'boolean',
                            description: 'Should tool teach/guide users?',
                        },
                    },
                    required: ['hasExternalSystems', 'isComplex', 'needsState'],
                },
            },
            {
                name: 'compare_approaches',
                description: 'Compare MCP server, subagent, and hybrid approaches for a use case',
                inputSchema: {
                    type: 'object',
                    properties: {
                        description: {
                            type: 'string',
                            description: 'Tool description',
                        },
                    },
                    required: ['description'],
                },
            },
            {
                name: 'find_similar_decisions',
                description: 'Find similar past architectural decisions from learning history',
                inputSchema: {
                    type: 'object',
                    properties: {
                        description: {
                            type: 'string',
                            description: 'Tool description to find similar decisions',
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of similar patterns to return',
                            default: 5,
                        },
                    },
                    required: ['description'],
                },
            },
            {
                name: 'record_decision',
                description: 'Record an architectural decision for future learning',
                inputSchema: {
                    type: 'object',
                    properties: {
                        toolDescription: {
                            type: 'string',
                            description: 'Description of the tool',
                        },
                        decision: {
                            type: 'string',
                            enum: ['skill', 'mcp-server', 'subagent', 'skill-mcp', 'skill-subagent', 'mcp-subagent', 'skill-mcp-subagent'],
                            description: 'Architecture choice made',
                        },
                        reasoning: {
                            type: 'string',
                            description: 'Why this choice was made',
                        },
                        externalSystems: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'External systems involved',
                        },
                        complexity: {
                            type: 'string',
                            enum: ['simple', 'moderate', 'complex'],
                            description: 'Complexity level',
                        },
                        stateManagement: {
                            type: 'boolean',
                            description: 'Whether state management was needed',
                        },
                    },
                    required: ['toolDescription', 'decision', 'reasoning', 'complexity', 'stateManagement'],
                },
            },
            {
                name: 'update_decision_outcome',
                description: 'Update the outcome of a past decision (successful, needed-refactoring, abandoned)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        patternId: {
                            type: 'string',
                            description: 'ID of the pattern to update',
                        },
                        outcome: {
                            type: 'string',
                            enum: ['successful', 'needed-refactoring', 'abandoned'],
                            description: 'Outcome of the decision',
                        },
                    },
                    required: ['patternId', 'outcome'],
                },
            },
            {
                name: 'get_statistics',
                description: 'Get statistics about learned architectural decisions',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
        ],
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === 'analyze_requirements') {
        const { description, externalSystems, complexity, stateNeeded } = args;
        // Check for similar past decisions
        const similarPatterns = await learningEngine.findSimilarPatterns(description, 3);
        // Auto-detect characteristics if not provided
        const hasExternalSystems = externalSystems && externalSystems.length > 0;
        const detectedComplexity = complexity || 'moderate';
        const needsState = stateNeeded !== undefined ? stateNeeded : false;
        // Detect if description suggests workflow patterns that would benefit from a Skill
        const workflowPatternKeywords = [
            'decision', 'framework', 'matrix', 'comparison', 'compare',
            'guidelines', 'best practices', 'patterns', 'procedures',
            'checklist', 'template', 'workflow', 'process', 'steps',
            'standards', 'conventions', 'rules', 'format', 'structure'
        ];
        const descLower = description.toLowerCase();
        const hasWorkflowPatterns = workflowPatternKeywords.some(keyword => descLower.includes(keyword));
        // Navigate decision tree
        let currentOutcome;
        if (hasExternalSystems) {
            // Has external systems - check if needs teaching/orchestration or workflows
            const complexOrTeaching = detectedComplexity === 'complex';
            if (complexOrTeaching || needsState) {
                // Check if workflow patterns suggest adding a Skill
                if (hasWorkflowPatterns) {
                    currentOutcome = 'skill_mcp_subagent'; // Full hybrid
                }
                else {
                    currentOutcome = 'hybrid_mcp_subagent';
                }
            }
            else if (needsState) {
                currentOutcome = 'mcp_server_with_learning';
            }
            else if (hasWorkflowPatterns) {
                currentOutcome = 'skill_with_mcp'; // MCP + Skill for workflows
            }
            else {
                currentOutcome = 'simple_mcp_server';
            }
        }
        else {
            // No external systems
            if (detectedComplexity === 'simple') {
                // Simple complexity - check if it's primarily workflow instructions
                if (hasWorkflowPatterns) {
                    currentOutcome = 'simple_skill'; // Just workflow instructions
                }
                else {
                    currentOutcome = 'simple_subagent';
                }
            }
            else if (needsState) {
                currentOutcome = 'complex_subagent_with_state';
            }
            else {
                // Moderate/complex AI thinking without state
                // Check if workflow patterns suggest Skill + Subagent hybrid
                if (hasWorkflowPatterns) {
                    currentOutcome = 'skill_with_subagent'; // Hybrid for patterns + thinking
                }
                else {
                    currentOutcome = 'simple_subagent';
                }
            }
        }
        const outcome = decisionTree.outcomes[currentOutcome];
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        recommendation: outcome.recommendation,
                        confidence: outcome.confidence,
                        rationale: outcome.rationale,
                        benefits: outcome.benefits,
                        considerations: outcome.considerations,
                        template: outcome.template,
                        examples: outcome.examples,
                        architecture: outcome.architecture,
                        enhancement: outcome.enhancement,
                        similarPastDecisions: similarPatterns.map((p) => ({
                            description: p.toolDescription,
                            decision: p.decision,
                            reasoning: p.reasoning,
                            outcome: p.outcome,
                        })),
                    }, null, 2),
                },
            ],
        };
    }
    if (name === 'suggest_architecture') {
        const { hasExternalSystems, isComplex, needsState, needsTeaching } = args;
        let currentOutcome;
        if (hasExternalSystems) {
            if (needsTeaching || isComplex) {
                currentOutcome = 'hybrid_mcp_subagent';
            }
            else if (needsState) {
                currentOutcome = 'mcp_server_with_learning';
            }
            else {
                currentOutcome = 'simple_mcp_server';
            }
        }
        else {
            if (!isComplex) {
                currentOutcome = 'simple_subagent';
            }
            else if (needsState) {
                currentOutcome = 'complex_subagent_with_state';
            }
            else {
                currentOutcome = 'simple_subagent';
            }
        }
        const outcome = decisionTree.outcomes[currentOutcome];
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(outcome, null, 2),
                },
            ],
        };
    }
    if (name === 'compare_approaches') {
        const { description } = args;
        const comparison = {
            'skill-only': {
                pros: [
                    'Ultra-lightweight (dozens of tokens vs thousands)',
                    'Simplest setup (just SKILL.md file)',
                    'Auto-discovery (loads only when relevant)',
                    'Portable (works across Claude apps, Code, API)',
                    'Can include executable scripts'
                ],
                cons: [
                    'Best for instructions/workflows, not AI behavior',
                    'No external system access',
                    'No state persistence',
                    'Limited to what Claude can do with instructions'
                ],
                bestFor: 'Workflow instructions, patterns, guidelines, or simple automation without AI customization',
                tokenCost: '~50 tokens (scan) + ~500 tokens (when loaded)',
            },
            'mcp-server-only': {
                pros: ['Access external systems', 'Reusable across AI clients', 'State persistence', 'Continuous learning'],
                cons: ['More setup than skill/subagent', 'Requires server maintenance', 'No specialized guidance'],
                bestFor: 'Tools that need external capabilities without complex AI orchestration',
                tokenCost: '~2000-5000 tokens per invocation',
            },
            'subagent-only': {
                pros: ['Specialized AI thinking', 'Custom behavior/persona', 'Separate context', 'Easy to iterate'],
                cons: ['No external system access', 'Limited state persistence', 'Higher token cost than skills'],
                bestFor: 'Specialized AI thinking/behavior without external dependencies',
                tokenCost: '~1000-3000 tokens (full prompt)',
            },
            'skill-with-subagent': {
                pros: [
                    'Token-efficient hybrid',
                    'Skill provides patterns, Subagent provides intelligence',
                    'Simpler than MCP-based hybrids',
                    'Easy to maintain both components'
                ],
                cons: [
                    'Two components to manage',
                    'No external system access',
                    'Requires coordination between components'
                ],
                bestFor: 'Tools needing both workflow instructions AND specialized AI behavior',
                tokenCost: '~1500-4000 tokens (subagent + skill when loaded)',
            },
            'skill-with-mcp': {
                pros: [
                    'MCP for capabilities, Skill for workflows',
                    'Token-efficient (skill only loads when needed)',
                    'Separation of concerns',
                    'Scalable architecture'
                ],
                cons: [
                    'Two components to maintain',
                    'MCP requires more setup',
                    'No specialized AI guidance (consider adding subagent)'
                ],
                bestFor: 'External system access with standardized workflows/best practices',
                tokenCost: '~2500-6000 tokens (MCP + skill when loaded)',
            },
            'full-hybrid': {
                pros: [
                    'Most powerful',
                    'MCP: External capabilities',
                    'Skill: Workflow patterns (token-efficient)',
                    'Subagent: AI intelligence and teaching',
                ],
                cons: ['Most complex setup', 'Three components to maintain', 'Highest learning curve'],
                bestFor: 'Sophisticated tools needing external access, workflows, AND specialized AI guidance',
                tokenCost: '~3500-8000 tokens (all components)',
            },
        };
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        description,
                        comparison,
                        recommendation: 'Start with the simplest approach that meets your needs. Skills are often the most efficient choice for workflow instructions.'
                    }, null, 2),
                },
            ],
        };
    }
    if (name === 'find_similar_decisions') {
        const { description, limit } = args;
        const similar = await learningEngine.findSimilarPatterns(description, limit || 5);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        query: description,
                        foundPatterns: similar.length,
                        patterns: similar,
                    }, null, 2),
                },
            ],
        };
    }
    if (name === 'record_decision') {
        const { toolDescription, decision, reasoning, externalSystems, complexity, stateManagement } = args;
        const id = await learningEngine.addPattern({
            toolDescription,
            decision,
            reasoning,
            externalSystems,
            complexity,
            stateManagement,
        });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        patternId: id,
                        message: 'Decision recorded successfully. This will improve future recommendations.',
                    }, null, 2),
                },
            ],
        };
    }
    if (name === 'update_decision_outcome') {
        const { patternId, outcome } = args;
        const success = await learningEngine.updateOutcome(patternId, outcome);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success,
                        message: success
                            ? 'Outcome updated successfully'
                            : 'Pattern not found',
                    }, null, 2),
                },
            ],
        };
    }
    if (name === 'get_statistics') {
        const stats = await learningEngine.getStatistics();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(stats, null, 2),
                },
            ],
        };
    }
    throw new Error(`Unknown tool: ${name}`);
});
// Start server
async function main() {
    await loadDecisionTree();
    await learningEngine.initialize();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Architecture Decision MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map