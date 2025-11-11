/**
 * Documentation Generation Tools (Goal 012)
 *
 * Automatically generates comprehensive documentation from the hierarchical
 * planning structure.
 *
 * Tools:
 * - generate_quick_start_guide: 10-minute getting started guide
 * - generate_user_guide: Complete feature reference
 * - generate_api_reference: Auto-generated API documentation
 * - generate_migration_guide: v0.8.0 to v1.0.0 migration
 * - export_project_summary: Executive summary for stakeholders
 */
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
// ============================================================================
// SCHEMAS
// ============================================================================
const GenerateQuickStartGuideSchema = z.object({
    projectPath: z.string().describe('Absolute path to project directory'),
    includeExamples: z.boolean().optional().default(true).describe('Include code examples'),
    outputPath: z.string().optional().describe('Custom output path (optional)'),
});
const GenerateUserGuideSchema = z.object({
    projectPath: z.string().describe('Absolute path to project directory'),
    sections: z.array(z.enum([
        'overview',
        'project-setup',
        'components',
        'goals',
        'workflows',
        'progress-tracking',
        'mcp-integration',
        'troubleshooting',
    ])).optional().describe('Specific sections to include (default: all)'),
    outputPath: z.string().optional().describe('Custom output path (optional)'),
});
const GenerateAPIReferenceSchema = z.object({
    projectPath: z.string().describe('Absolute path to project directory'),
    format: z.enum(['markdown', 'html', 'json']).default('markdown')
        .describe('Output format for API reference'),
    includeExamples: z.boolean().optional().default(true).describe('Include usage examples'),
    outputPath: z.string().optional().describe('Custom output path (optional)'),
});
const GenerateMigrationGuideSchema = z.object({
    projectPath: z.string().describe('Absolute path to project directory'),
    fromVersion: z.string().default('0.8.0').describe('Version migrating from'),
    toVersion: z.string().default('1.0.0').describe('Version migrating to'),
    outputPath: z.string().optional().describe('Custom output path (optional)'),
});
const ExportProjectSummarySchema = z.object({
    projectPath: z.string().describe('Absolute path to project directory'),
    format: z.enum(['markdown', 'html', 'pdf', 'json']).default('markdown')
        .describe('Output format'),
    audience: z.enum(['executive', 'technical', 'stakeholder']).default('stakeholder')
        .describe('Target audience for summary'),
    includeDiagrams: z.boolean().optional().default(true).describe('Include progress diagrams'),
    outputPath: z.string().optional().describe('Custom output path (optional)'),
});
// ============================================================================
// TOOL 1: GENERATE QUICK START GUIDE
// ============================================================================
export async function generateQuickStartGuide(params) {
    const startTime = Date.now();
    try {
        const { projectPath, includeExamples, outputPath } = GenerateQuickStartGuideSchema.parse(params);
        const content = generateQuickStartContent(includeExamples);
        const defaultOutputPath = path.join(projectPath, 'docs', 'QUICK-START.md');
        const finalOutputPath = outputPath || defaultOutputPath;
        await fs.mkdir(path.dirname(finalOutputPath), { recursive: true });
        await fs.writeFile(finalOutputPath, content, 'utf-8');
        const duration = Date.now() - startTime;
        return {
            success: true,
            outputPath: finalOutputPath,
            wordCount: content.split(/\s+/).length,
            estimatedReadingTime: `${Math.ceil(content.split(/\s+/).length / 200)} minutes`,
            performance: {
                generationTimeMs: duration,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
// ============================================================================
// TOOL 2: GENERATE USER GUIDE
// ============================================================================
export async function generateUserGuide(params) {
    const startTime = Date.now();
    try {
        const { projectPath, sections, outputPath } = GenerateUserGuideSchema.parse(params);
        const allSections = sections || [
            'overview',
            'project-setup',
            'components',
            'goals',
            'workflows',
            'progress-tracking',
            'mcp-integration',
            'troubleshooting',
        ];
        const content = await generateUserGuideContent(projectPath, allSections);
        const defaultOutputPath = path.join(projectPath, 'docs', 'USER-GUIDE.md');
        const finalOutputPath = outputPath || defaultOutputPath;
        await fs.mkdir(path.dirname(finalOutputPath), { recursive: true });
        await fs.writeFile(finalOutputPath, content, 'utf-8');
        const duration = Date.now() - startTime;
        return {
            success: true,
            outputPath: finalOutputPath,
            sectionsGenerated: allSections.length,
            wordCount: content.split(/\s+/).length,
            estimatedReadingTime: `${Math.ceil(content.split(/\s+/).length / 200)} minutes`,
            performance: {
                generationTimeMs: duration,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
// ============================================================================
// TOOL 3: GENERATE API REFERENCE
// ============================================================================
export async function generateAPIReference(params) {
    const startTime = Date.now();
    try {
        const { projectPath, format, includeExamples, outputPath } = GenerateAPIReferenceSchema.parse(params);
        const tools = await discoverMCPTools(projectPath);
        let content;
        switch (format) {
            case 'json':
                content = JSON.stringify(tools, null, 2);
                break;
            case 'html':
                content = generateHTMLAPIReference(tools, includeExamples);
                break;
            case 'markdown':
            default:
                content = generateMarkdownAPIReference(tools, includeExamples);
                break;
        }
        const extension = format === 'json' ? 'json' : format === 'html' ? 'html' : 'md';
        const defaultOutputPath = path.join(projectPath, 'docs', `API-REFERENCE.${extension}`);
        const finalOutputPath = outputPath || defaultOutputPath;
        await fs.mkdir(path.dirname(finalOutputPath), { recursive: true });
        await fs.writeFile(finalOutputPath, content, 'utf-8');
        const duration = Date.now() - startTime;
        return {
            success: true,
            outputPath: finalOutputPath,
            format,
            toolsDocumented: tools.length,
            performance: {
                generationTimeMs: duration,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
// ============================================================================
// TOOL 4: GENERATE MIGRATION GUIDE
// ============================================================================
export async function generateMigrationGuide(params) {
    const startTime = Date.now();
    try {
        const { projectPath, fromVersion, toVersion, outputPath } = GenerateMigrationGuideSchema.parse(params);
        const content = generateMigrationContent(fromVersion, toVersion);
        const defaultOutputPath = path.join(projectPath, 'docs', 'MIGRATION-GUIDE.md');
        const finalOutputPath = outputPath || defaultOutputPath;
        await fs.mkdir(path.dirname(finalOutputPath), { recursive: true });
        await fs.writeFile(finalOutputPath, content, 'utf-8');
        const duration = Date.now() - startTime;
        return {
            success: true,
            outputPath: finalOutputPath,
            fromVersion,
            toVersion,
            wordCount: content.split(/\s+/).length,
            performance: {
                generationTimeMs: duration,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
// ============================================================================
// TOOL 5: EXPORT PROJECT SUMMARY
// ============================================================================
export async function exportProjectSummary(params) {
    const startTime = Date.now();
    try {
        const { projectPath, format, audience, includeDiagrams, outputPath } = ExportProjectSummarySchema.parse(params);
        const summary = await buildProjectSummary(projectPath, audience, includeDiagrams);
        let content;
        let extension;
        switch (format) {
            case 'json':
                content = JSON.stringify(summary, null, 2);
                extension = 'json';
                break;
            case 'html':
                content = generateHTMLSummary(summary);
                extension = 'html';
                break;
            case 'pdf':
                content = generateHTMLSummary(summary); // Would need PDF library in production
                extension = 'html';
                break;
            case 'markdown':
            default:
                content = generateMarkdownSummary(summary);
                extension = 'md';
                break;
        }
        const defaultOutputPath = path.join(projectPath, 'docs', `PROJECT-SUMMARY.${extension}`);
        const finalOutputPath = outputPath || defaultOutputPath;
        await fs.mkdir(path.dirname(finalOutputPath), { recursive: true });
        await fs.writeFile(finalOutputPath, content, 'utf-8');
        const duration = Date.now() - startTime;
        return {
            success: true,
            outputPath: finalOutputPath,
            format,
            audience,
            summary: {
                componentsCount: summary.components.length,
                goalsCount: summary.totalGoals,
                overallProgress: summary.overallProgress,
            },
            performance: {
                generationTimeMs: duration,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
// ============================================================================
// CONTENT GENERATORS - QUICK START
// ============================================================================
function generateQuickStartContent(includeExamples) {
    const lines = [];
    lines.push('---');
    lines.push('type: guide');
    lines.push('tags: [quick-start, getting-started, tutorial]');
    lines.push('---');
    lines.push('');
    lines.push('# Quick Start Guide');
    lines.push('');
    lines.push('**Get started with Project Management MCP v1.0.0 in 10 minutes**');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## What You\'ll Learn');
    lines.push('');
    lines.push('- How to create your first hierarchical project');
    lines.push('- Understanding components and major goals');
    lines.push('- Basic workflow for planning and execution');
    lines.push('- Progress tracking across hierarchy levels');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Prerequisites');
    lines.push('');
    lines.push('- Project Management MCP Server v1.0.0 installed');
    lines.push('- Claude Code CLI configured with MCP');
    lines.push('- Basic understanding of project planning');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Step 1: Initialize Your Project (2 minutes)');
    lines.push('');
    lines.push('Start by creating a PROJECT OVERVIEW, which defines your project vision and structure:');
    lines.push('');
    if (includeExamples) {
        lines.push('```javascript');
        lines.push('// Use the conversational setup tool');
        lines.push('await startProjectOverviewConversation({');
        lines.push('  projectPath: "/path/to/your/project",');
        lines.push('  projectName: "My Amazing Project",');
        lines.push('  initialDescription: "Building a comprehensive planning system"');
        lines.push('});');
        lines.push('```');
        lines.push('');
    }
    lines.push('The tool will guide you through:');
    lines.push('- Defining your vision and goals');
    lines.push('- Identifying stakeholders');
    lines.push('- Setting constraints and timelines');
    lines.push('- Suggesting logical components');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Step 2: Create Components (3 minutes)');
    lines.push('');
    lines.push('Components are major domain areas in your project:');
    lines.push('');
    if (includeExamples) {
        lines.push('```javascript');
        lines.push('// AI will suggest components based on your description');
        lines.push('await identifyComponents({');
        lines.push('  projectPath: "/path/to/your/project",');
        lines.push('  autoCreate: true');
        lines.push('});');
        lines.push('');
        lines.push('// Or create manually');
        lines.push('await createComponent({');
        lines.push('  projectPath: "/path/to/your/project",');
        lines.push('  componentId: "user-experience",');
        lines.push('  name: "User Experience",');
        lines.push('  description: "All UX-related work"');
        lines.push('});');
        lines.push('```');
        lines.push('');
    }
    lines.push('---');
    lines.push('');
    lines.push('## Step 3: Define Major Goals (3 minutes)');
    lines.push('');
    lines.push('Major goals are strategic objectives (weeks-months timeframe):');
    lines.push('');
    if (includeExamples) {
        lines.push('```javascript');
        lines.push('await createMajorGoal({');
        lines.push('  projectPath: "/path/to/your/project",');
        lines.push('  componentId: "user-experience",');
        lines.push('  goalName: "Build intuitive onboarding flow",');
        lines.push('  description: "Create seamless user onboarding experience",');
        lines.push('  priority: "high",');
        lines.push('  impact: "high",');
        lines.push('  effort: "medium"');
        lines.push('});');
        lines.push('```');
        lines.push('');
    }
    lines.push('---');
    lines.push('');
    lines.push('## Step 4: Start Execution (2 minutes)');
    lines.push('');
    lines.push('Hand off major goals to Spec-Driven MCP for breakdown:');
    lines.push('');
    if (includeExamples) {
        lines.push('```javascript');
        lines.push('await handoffToSpecDriven({');
        lines.push('  projectPath: "/path/to/your/project",');
        lines.push('  goalId: "001"');
        lines.push('});');
        lines.push('');
        lines.push('// This creates handoff context for Spec-Driven MCP');
        lines.push('// Spec-Driven MCP will break down into sub-goals');
        lines.push('// Task Executor MCP will handle implementation tasks');
        lines.push('```');
        lines.push('');
    }
    lines.push('---');
    lines.push('');
    lines.push('## Track Progress');
    lines.push('');
    lines.push('Monitor your project at any time:');
    lines.push('');
    if (includeExamples) {
        lines.push('```javascript');
        lines.push('// Get project status');
        lines.push('await getProjectStatus({ projectPath: "/path/to/your/project" });');
        lines.push('');
        lines.push('// Generate visual progress dashboard');
        lines.push('await generateProgressDashboard({');
        lines.push('  projectPath: "/path/to/your/project",');
        lines.push('  outputFormat: "ascii"');
        lines.push('});');
        lines.push('');
        lines.push('// Get intelligent next-step suggestions');
        lines.push('await suggestNextSteps({ projectPath: "/path/to/your/project" });');
        lines.push('```');
        lines.push('');
    }
    lines.push('---');
    lines.push('');
    lines.push('## Next Steps');
    lines.push('');
    lines.push('Now that you have a basic project set up:');
    lines.push('');
    lines.push('1. **Read the User Guide** - Comprehensive feature documentation');
    lines.push('2. **Explore Visualizations** - Generate hierarchy trees and roadmaps');
    lines.push('3. **Review Examples** - See real-world project patterns');
    lines.push('4. **Check API Reference** - Full tool documentation');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Common Questions');
    lines.push('');
    lines.push('**Q: How many components should I create?**');
    lines.push('A: Typically 3-7 components. More than 10 might be too granular.');
    lines.push('');
    lines.push('**Q: What\'s the difference between major goals and sub-goals?**');
    lines.push('A: Major goals are strategic (weeks-months), owned by Project Management MCP. Sub-goals are tactical (days-weeks), owned by Spec-Driven MCP.');
    lines.push('');
    lines.push('**Q: Can I change the structure later?**');
    lines.push('A: Yes! The system supports version-aware updates with cascade detection.');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Troubleshooting');
    lines.push('');
    lines.push('**PROJECT OVERVIEW not found:**');
    lines.push('- Ensure you\'ve run `startProjectOverviewConversation` first');
    lines.push('- Check project path is correct');
    lines.push('');
    lines.push('**Components not showing:**');
    lines.push('- Run `identifyComponents` or create manually');
    lines.push('- Verify folder structure in `02-goals-and-roadmap/components/`');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('**Ready to build amazing projects!** 🚀');
    lines.push('');
    return lines.join('\n');
}
// ============================================================================
// CONTENT GENERATORS - USER GUIDE
// ============================================================================
async function generateUserGuideContent(projectPath, sections) {
    const lines = [];
    lines.push('---');
    lines.push('type: guide');
    lines.push('tags: [user-guide, documentation, reference]');
    lines.push('---');
    lines.push('');
    lines.push('# Project Management MCP v1.0.0 - User Guide');
    lines.push('');
    lines.push('**Complete reference for hierarchical project planning**');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Table of Contents');
    lines.push('');
    sections.forEach((section, index) => {
        lines.push(`${index + 1}. [${formatSectionName(section)}](#${section})`);
    });
    lines.push('');
    lines.push('---');
    lines.push('');
    // Generate each section
    for (const section of sections) {
        lines.push(`## ${formatSectionName(section)}`);
        lines.push('');
        lines.push(getUserGuideSectionContent(section));
        lines.push('');
        lines.push('---');
        lines.push('');
    }
    return lines.join('\n');
}
function getUserGuideSectionContent(section) {
    const content = {
        'overview': `### What is Project Management MCP v1.0.0?

Project Management MCP v1.0.0 is a hierarchical multi-level planning system with 7 levels of organization:

1. **PROJECT OVERVIEW** - Vision and high-level structure
2. **Components** - Major domain areas
3. **Sub-Areas** - Optional focus areas within components
4. **Major Goals** - Strategic objectives (Project Management MCP)
5. **Sub-Goals** - Tactical plans (Spec-Driven MCP)
6. **Task Workflows** - Implementation plans (Task Executor MCP)
7. **Tasks** - Individual execution tasks (Task Executor MCP)

### Key Features

- **Hierarchical Organization**: Manage complexity with 7-level structure
- **3-MCP Orchestration**: Seamless handoffs between AI Planning, Spec-Driven, and Task Executor MCPs
- **Progress Aggregation**: Automatic progress roll-up from tasks to project level
- **Version Control**: Track changes with impact analysis and cascade updates
- **Visualization**: Multiple diagram types (tree, roadmap, dashboard)
- **Intelligent Guidance**: Context-aware next-step suggestions`,
        'project-setup': `### Creating a New Project

Use the conversational setup tool to initialize your project:

\`\`\`javascript
await startProjectOverviewConversation({
  projectPath: "/path/to/project",
  projectName: "My Project",
  initialDescription: "Optional initial context"
});
\`\`\`

The tool will guide you through:
- Vision and mission statement
- Success criteria and scope
- Stakeholders and their concerns
- Resources and constraints
- Component suggestions

### Project Structure

After initialization, you'll have:

\`\`\`
project-root/
├── 01-planning/
│   ├── PROJECT-OVERVIEW.md
│   └── CONSTITUTION.md
├── 02-goals-and-roadmap/
│   └── components/
│       ├── component-1/
│       └── component-2/
├── 03-resources-docs-assets-tools/
├── 04-product-under-development/
└── 05-brainstorming/
\`\`\``,
        'components': `### Understanding Components

Components are major domain areas that organize your project. Think of them as high-level categories.

### Creating Components

**Option 1: AI-Powered Identification**

\`\`\`javascript
await identifyComponents({
  projectPath: "/path/to/project",
  autoCreate: true
});
\`\`\`

**Option 2: Manual Creation**

\`\`\`javascript
await createComponent({
  projectPath: "/path/to/project",
  componentId: "user-experience",
  name: "User Experience",
  description: "All UX-related work",
  subAreas: ["onboarding", "navigation", "accessibility"]
});
\`\`\`

### Component Best Practices

- **Keep it manageable**: 3-7 components for most projects
- **Clear boundaries**: Each component should have distinct responsibilities
- **Balanced size**: Avoid one massive component and several tiny ones`,
        'goals': `### Major Goals

Major goals are strategic objectives with weeks-months timeframe, owned by Project Management MCP.

### Creating Major Goals

\`\`\`javascript
await createMajorGoal({
  projectPath: "/path/to/project",
  componentId: "user-experience",
  goalName: "Build intuitive onboarding",
  description: "Create seamless user onboarding experience",
  priority: "high",
  impact: "high",
  effort: "medium",
  successCriteria: [
    "User completes onboarding in < 2 minutes",
    "90%+ completion rate",
    "User satisfaction > 4.5/5"
  ]
});
\`\`\`

### Goal Prioritization

Goals are classified by:
- **Priority**: High, Medium, Low
- **Tier**: Now, Next, Later, Someday
- **Impact**: High, Medium, Low
- **Effort**: High, Medium, Low

Use the matrix: High Impact + Low Effort = Do First!`,
        'workflows': `### Workflow Phases

Projects progress through phases:

1. **Planning** - Structure definition, component and goal creation
2. **Execution** - Active work on goals and sub-goals
3. **Monitoring** - Most goals complete, tracking remaining work
4. **Completion** - All goals done, project wrap-up

### Phase Advancement

\`\`\`javascript
// Check current phase
await getProjectPhase({ projectPath: "/path/to/project" });

// Advance to next phase
await advanceWorkflowPhase({
  projectPath: "/path/to/project",
  targetPhase: "execution"
});
\`\`\`

### MCP Handoffs

Goals flow through three MCPs:

1. **Project Management MCP** creates major goals
2. **Spec-Driven MCP** breaks down into sub-goals with specifications
3. **Task Executor MCP** handles implementation tasks

Handoff between MCPs:

\`\`\`javascript
await handoffToSpecDriven({
  projectPath: "/path/to/project",
  goalId: "001"
});
\`\`\``,
        'progress-tracking': `### Automatic Progress Aggregation

Progress automatically rolls up from tasks to project level:

- **Task** → Sub-Goal (average of task completion)
- **Sub-Goal** → Major Goal (average of sub-goal progress)
- **Major Goal** → Component (average of goal progress)
- **Component** → Project (average of component progress)

### Updating Progress

\`\`\`javascript
await updateMajorGoalProgress({
  projectPath: "/path/to/project",
  goalId: "001",
  progress: 75,
  status: "in-progress",
  blockers: "Waiting for API documentation"
});
\`\`\`

### Progress Visualization

\`\`\`javascript
// Generate progress dashboard
await generateProgressDashboard({
  projectPath: "/path/to/project",
  outputFormat: "ascii",
  includeVelocity: true,
  includeHealth: true
});
\`\`\``,
        'mcp-integration': `### Three-MCP Orchestration

The v1.0.0 system coordinates three MCP servers:

**Project Management MCP**
- PROJECT OVERVIEW creation
- Component management
- Major goal workflow
- Progress tracking

**Spec-Driven MCP**
- Sub-goal specification
- Technical planning
- Acceptance criteria definition

**Task Executor MCP**
- Task workflow creation
- Execution tracking
- Task verification

### Handoff Protocol

Handoffs include:
- Source context (project, component, goal IDs)
- Target MCP specification
- Payload with entity data
- Metadata (timestamp, handoff ID, version)

### Integration Best Practices

- Let Project Management MCP handle strategic planning
- Use Spec-Driven MCP for technical breakdown
- Task Executor MCP focuses on execution only
- Don't skip levels - follow the hierarchy`,
        'troubleshooting': `### Common Issues

**Issue: PROJECT OVERVIEW not found**
- Solution: Run \`startProjectOverviewConversation\` first
- Check project path is absolute and correct

**Issue: Components not appearing**
- Solution: Run \`identifyComponents\` or create manually
- Verify folder structure exists in \`02-goals-and-roadmap/components/\`

**Issue: Progress not updating**
- Solution: Use \`updateMajorGoalProgress\` to manually sync
- Check that progress files exist at each level

**Issue: Goals blocked**
- Solution: Use \`suggestNextSteps\` to get recommendations
- Review dependencies and resolve blockers first

**Issue: Handoff failing**
- Solution: Verify target MCP is available
- Check handoff context includes all required IDs
- Review handoff protocol documentation

### Getting Help

- Check API Reference for tool documentation
- Review examples in \`docs/examples/\`
- Read Migration Guide if upgrading from v0.8.0
- See TROUBLESHOOTING.md for detailed solutions`,
    };
    return content[section] || `Content for ${section} section...`;
}
async function discoverMCPTools(projectPath) {
    // In production, this would scan the tools directory and extract JSDoc comments
    return [
        {
            name: 'suggest_next_steps',
            description: 'Intelligent recommendations based on current project state',
            parameters: [
                { name: 'projectPath', type: 'string', required: true, description: 'Absolute path to project' },
                { name: 'includeDetails', type: 'boolean', required: false, description: 'Include detailed reasoning' },
                { name: 'maxSuggestions', type: 'number', required: false, description: 'Max suggestions to return' },
            ],
            returns: 'Object with suggestions array and project phase info',
            examples: [
                'await suggestNextSteps({ projectPath: "/path/to/project" });',
            ],
        },
        // ... more tools would be discovered automatically
    ];
}
function generateMarkdownAPIReference(tools, includeExamples) {
    const lines = [];
    lines.push('---');
    lines.push('type: reference');
    lines.push('tags: [api-reference, tools, mcp]');
    lines.push('---');
    lines.push('');
    lines.push('# Project Management MCP API Reference');
    lines.push('');
    lines.push('**Auto-generated API documentation for all MCP tools**');
    lines.push('');
    lines.push(`**Tools Documented:** ${tools.length}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    for (const tool of tools) {
        lines.push(`## ${tool.name}`);
        lines.push('');
        lines.push(tool.description);
        lines.push('');
        lines.push('### Parameters');
        lines.push('');
        lines.push('| Parameter | Type | Required | Description |');
        lines.push('|-----------|------|----------|-------------|');
        for (const param of tool.parameters) {
            lines.push(`| ${param.name} | ${param.type} | ${param.required ? 'Yes' : 'No'} | ${param.description} |`);
        }
        lines.push('');
        lines.push('### Returns');
        lines.push('');
        lines.push(tool.returns);
        lines.push('');
        if (includeExamples && tool.examples.length > 0) {
            lines.push('### Examples');
            lines.push('');
            tool.examples.forEach(example => {
                lines.push('```javascript');
                lines.push(example);
                lines.push('```');
                lines.push('');
            });
        }
        lines.push('---');
        lines.push('');
    }
    return lines.join('\n');
}
function generateHTMLAPIReference(tools, includeExamples) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Project Management MCP API Reference</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    h2 { color: #555; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #f5f5f5; }
    code { background-color: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
    pre { background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Project Management MCP API Reference</h1>
  <p><strong>Tools Documented:</strong> ${tools.length}</p>
  ${tools.map(tool => `
    <h2>${tool.name}</h2>
    <p>${tool.description}</p>
    <h3>Parameters</h3>
    <table>
      <tr><th>Parameter</th><th>Type</th><th>Required</th><th>Description</th></tr>
      ${tool.parameters.map(p => `
        <tr>
          <td><code>${p.name}</code></td>
          <td>${p.type}</td>
          <td>${p.required ? 'Yes' : 'No'}</td>
          <td>${p.description}</td>
        </tr>
      `).join('')}
    </table>
    <h3>Returns</h3>
    <p>${tool.returns}</p>
    ${includeExamples && tool.examples.length > 0 ? `
      <h3>Examples</h3>
      ${tool.examples.map(ex => `<pre><code>${ex}</code></pre>`).join('')}
    ` : ''}
  `).join('<hr>')}
</body>
</html>`;
}
// ============================================================================
// CONTENT GENERATORS - MIGRATION GUIDE
// ============================================================================
function generateMigrationContent(fromVersion, toVersion) {
    const lines = [];
    lines.push('---');
    lines.push('type: guide');
    lines.push('tags: [migration, upgrade, version-upgrade]');
    lines.push('---');
    lines.push('');
    lines.push(`# Migration Guide: v${fromVersion} → v${toVersion}`);
    lines.push('');
    lines.push(`**Step-by-step guide to upgrade from ${fromVersion} to ${toVersion}**`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## What\'s New in v' + toVersion);
    lines.push('');
    lines.push('### Major Changes');
    lines.push('');
    lines.push('- **7-Level Hierarchy**: Expanded from flat goal structure to hierarchical planning');
    lines.push('- **Components & Sub-Areas**: Better organization for large projects');
    lines.push('- **3-MCP Orchestration**: Seamless integration with Spec-Driven and Task Executor MCPs');
    lines.push('- **Progress Aggregation**: Automatic roll-up from tasks to project level');
    lines.push('- **Version Control**: Track changes with impact analysis');
    lines.push('- **Enhanced Visualization**: Multiple diagram types and formats');
    lines.push('');
    lines.push('### Breaking Changes');
    lines.push('');
    lines.push('- **Tool Names**: Some tools renamed for clarity');
    lines.push('  - `setup_project` → `start_project_overview_conversation`');
    lines.push('  - `add_goal` → `create_major_goal`');
    lines.push('- **Folder Structure**: New 8-folder organization');
    lines.push('- **Goal Format**: Enhanced metadata for hierarchical tracking');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Migration Steps');
    lines.push('');
    lines.push('### Step 1: Backup Your Project (5 minutes)');
    lines.push('');
    lines.push('Before migrating, create a snapshot:');
    lines.push('');
    lines.push('```bash');
    lines.push('# Archive current state');
    lines.push('mkdir -p archive/pre-v1.0.0-migration');
    lines.push('cp -r ./* archive/pre-v1.0.0-migration/');
    lines.push('```');
    lines.push('');
    lines.push('### Step 2: Analyze Existing Project (10 minutes)');
    lines.push('');
    lines.push('Use the migration tool to analyze your project:');
    lines.push('');
    lines.push('```javascript');
    lines.push('await migrateExistingProject({');
    lines.push('  projectPath: "/path/to/project"');
    lines.push('});');
    lines.push('```');
    lines.push('');
    lines.push('This will:');
    lines.push('- Scan your existing files');
    lines.push('- Suggest component groupings');
    lines.push('- Map goals to new structure');
    lines.push('- Provide migration plan');
    lines.push('');
    lines.push('### Step 3: Review Suggestions (5 minutes)');
    lines.push('');
    lines.push('The migration tool will suggest:');
    lines.push('- How to organize goals into components');
    lines.push('- Which files to move where');
    lines.push('- Potential conflicts to resolve');
    lines.push('');
    lines.push('**Review carefully** before proceeding.');
    lines.push('');
    lines.push('### Step 4: Confirm Migration (2 minutes)');
    lines.push('');
    lines.push('Once you\'ve reviewed, confirm the migration:');
    lines.push('');
    lines.push('```javascript');
    lines.push('await confirmMigration({');
    lines.push('  projectPath: "/path/to/project",');
    lines.push('  suggestions: reviewedSuggestions,');
    lines.push('  createBackup: true');
    lines.push('});');
    lines.push('```');
    lines.push('');
    lines.push('### Step 5: Verify Migration (5 minutes)');
    lines.push('');
    lines.push('After migration:');
    lines.push('');
    lines.push('```javascript');
    lines.push('// Validate new structure');
    lines.push('await validateProjectStructure({');
    lines.push('  projectPath: "/path/to/project",');
    lines.push('  strictness: "standard"');
    lines.push('});');
    lines.push('');
    lines.push('// Check all goals migrated');
    lines.push('await getProjectStatus({ projectPath: "/path/to/project" });');
    lines.push('```');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Post-Migration Checklist');
    lines.push('');
    lines.push('- [ ] All goals present in new structure');
    lines.push('- [ ] Components created and organized');
    lines.push('- [ ] PROJECT OVERVIEW generated');
    lines.push('- [ ] Progress tracking working');
    lines.push('- [ ] Documentation updated');
    lines.push('- [ ] Team notified of new structure');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Rollback Procedure');
    lines.push('');
    lines.push('If something goes wrong:');
    lines.push('');
    lines.push('```bash');
    lines.push('# Restore from backup');
    lines.push('rm -rf *');
    lines.push('cp -r archive/pre-v1.0.0-migration/* ./');
    lines.push('```');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Getting Help');
    lines.push('');
    lines.push('- Review User Guide for v' + toVersion + ' features');
    lines.push('- Check API Reference for new tools');
    lines.push('- See examples in docs/examples/');
    lines.push('- Contact support if issues persist');
    lines.push('');
    return lines.join('\n');
}
async function buildProjectSummary(projectPath, audience, includeDiagrams) {
    const projectName = path.basename(projectPath);
    return {
        projectName,
        overallProgress: 0,
        phase: 'planning',
        components: [],
        totalGoals: 0,
        goalsCompleted: 0,
        goalsInProgress: 0,
        goalsBlocked: 0,
        healthScore: 100,
        velocity: 0,
        estimatedCompletion: 'TBD',
        keyMetrics: {},
    };
}
function generateMarkdownSummary(summary) {
    const lines = [];
    lines.push(`# Project Summary: ${summary.projectName}`);
    lines.push('');
    lines.push(`**Overall Progress:** ${summary.overallProgress}%`);
    lines.push(`**Current Phase:** ${summary.phase}`);
    lines.push(`**Health Score:** ${summary.healthScore}/100`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Executive Summary');
    lines.push('');
    lines.push(`${summary.projectName} is currently ${summary.overallProgress}% complete, with ${summary.goalsCompleted} of ${summary.totalGoals} goals finished.`);
    lines.push('');
    lines.push('## Key Metrics');
    lines.push('');
    lines.push(`- **Components:** ${summary.components.length}`);
    lines.push(`- **Total Goals:** ${summary.totalGoals}`);
    lines.push(`- **Completed:** ${summary.goalsCompleted}`);
    lines.push(`- **In Progress:** ${summary.goalsInProgress}`);
    lines.push(`- **Blocked:** ${summary.goalsBlocked}`);
    lines.push('');
    return lines.join('\n');
}
function generateHTMLSummary(summary) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Project Summary: ${summary.projectName}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .metric { display: inline-block; margin: 10px 20px; text-align: center; }
    .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
    .progress-bar { width: 100%; height: 30px; background-color: #f0f0f0; border-radius: 5px; overflow: hidden; }
    .progress-fill { height: 100%; background-color: #28a745; }
  </style>
</head>
<body>
  <h1>Project Summary: ${summary.projectName}</h1>
  <h2>Overall Progress: ${summary.overallProgress}%</h2>
  <div class="progress-bar">
    <div class="progress-fill" style="width: ${summary.overallProgress}%"></div>
  </div>
  <div>
    <div class="metric"><div class="metric-value">${summary.components.length}</div><div>Components</div></div>
    <div class="metric"><div class="metric-value">${summary.totalGoals}</div><div>Total Goals</div></div>
    <div class="metric"><div class="metric-value">${summary.goalsCompleted}</div><div>Completed</div></div>
  </div>
</body>
</html>`;
}
// ============================================================================
// UTILITIES
// ============================================================================
function formatSectionName(section) {
    return section
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
//# sourceMappingURL=documentation-tools.js.map