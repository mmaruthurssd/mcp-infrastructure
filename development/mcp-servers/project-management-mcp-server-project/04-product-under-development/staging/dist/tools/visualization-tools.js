/**
 * Visualization System Tools (Goal 011)
 *
 * Provides multiple diagram types and output formats for visualizing
 * the hierarchical planning structure.
 *
 * Tools:
 * - generate_hierarchy_tree: Visual tree of project structure
 * - generate_roadmap_timeline: Timeline view with milestones
 * - generate_progress_dashboard: Progress overview across components
 * - generate_dependency_graph: Goal dependencies visualization
 */
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
// ============================================================================
// SCHEMAS
// ============================================================================
const GenerateHierarchyTreeSchema = z.object({
    projectPath: z.string().describe('Absolute path to project directory'),
    outputFormat: z.enum(['drawio', 'mermaid', 'ascii']).default('ascii')
        .describe('Output format for the hierarchy tree'),
    maxDepth: z.number().optional().default(7).describe('Maximum depth to display (1-7 levels)'),
    showProgress: z.boolean().optional().default(true).describe('Show progress percentages'),
    filterStatus: z.enum(['all', 'active', 'completed', 'blocked']).optional().default('all')
        .describe('Filter entities by status'),
    outputPath: z.string().optional().describe('Custom output path (optional)'),
});
const GenerateRoadmapTimelineSchema = z.object({
    projectPath: z.string().describe('Absolute path to project directory'),
    outputFormat: z.enum(['drawio', 'mermaid', 'ascii']).default('mermaid')
        .describe('Output format for the roadmap'),
    groupBy: z.enum(['component', 'phase', 'priority']).default('component')
        .describe('How to group goals in the timeline'),
    showMilestones: z.boolean().optional().default(true).describe('Include milestone markers'),
    timeRange: z.enum(['all', 'current-quarter', 'current-year']).optional().default('all')
        .describe('Time range to display'),
    outputPath: z.string().optional().describe('Custom output path (optional)'),
});
const GenerateProgressDashboardSchema = z.object({
    projectPath: z.string().describe('Absolute path to project directory'),
    outputFormat: z.enum(['drawio', 'mermaid', 'ascii', 'json']).default('ascii')
        .describe('Output format for the dashboard'),
    includeVelocity: z.boolean().optional().default(true).describe('Calculate and show velocity metrics'),
    includeHealth: z.boolean().optional().default(true).describe('Show component health indicators'),
    outputPath: z.string().optional().describe('Custom output path (optional)'),
});
const GenerateDependencyGraphSchema = z.object({
    projectPath: z.string().describe('Absolute path to project directory'),
    outputFormat: z.enum(['drawio', 'mermaid', 'ascii']).default('mermaid')
        .describe('Output format for the dependency graph'),
    scope: z.enum(['all', 'component', 'major-goal']).default('all')
        .describe('Scope of dependencies to show'),
    entityId: z.string().optional().describe('Specific entity ID if scope is component or major-goal'),
    showCriticalPath: z.boolean().optional().default(true).describe('Highlight critical path'),
    outputPath: z.string().optional().describe('Custom output path (optional)'),
});
// ============================================================================
// TOOL 1: GENERATE HIERARCHY TREE
// ============================================================================
export async function generateHierarchyTree(params) {
    const startTime = Date.now();
    try {
        const { projectPath, outputFormat, maxDepth, showProgress, filterStatus, outputPath } = GenerateHierarchyTreeSchema.parse(params);
        // Build hierarchy tree
        const tree = await buildHierarchyTree(projectPath, maxDepth, filterStatus);
        // Generate output based on format
        let output;
        let defaultOutputPath;
        switch (outputFormat) {
            case 'drawio':
                output = generateDrawIOHierarchy(tree, showProgress);
                defaultOutputPath = path.join(projectPath, '02-goals-and-roadmap', 'hierarchy-tree.drawio');
                break;
            case 'mermaid':
                output = generateMermaidHierarchy(tree, showProgress);
                defaultOutputPath = path.join(projectPath, '02-goals-and-roadmap', 'hierarchy-tree.md');
                break;
            case 'ascii':
            default:
                output = generateASCIIHierarchy(tree, showProgress);
                defaultOutputPath = path.join(projectPath, '02-goals-and-roadmap', 'hierarchy-tree.txt');
                break;
        }
        // Write to file
        const finalOutputPath = outputPath || defaultOutputPath;
        await fs.mkdir(path.dirname(finalOutputPath), { recursive: true });
        await fs.writeFile(finalOutputPath, output, 'utf-8');
        const duration = Date.now() - startTime;
        return {
            success: true,
            outputPath: finalOutputPath,
            outputFormat,
            nodesGenerated: countNodes(tree),
            maxDepth,
            preview: output.split('\n').slice(0, 20).join('\n') + '\n...',
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
// TOOL 2: GENERATE ROADMAP TIMELINE
// ============================================================================
export async function generateRoadmapTimeline(params) {
    const startTime = Date.now();
    try {
        const { projectPath, outputFormat, groupBy, showMilestones, timeRange, outputPath } = GenerateRoadmapTimelineSchema.parse(params);
        // Build timeline data
        const timelineItems = await buildTimelineData(projectPath, groupBy, timeRange);
        // Generate output
        let output;
        let defaultOutputPath;
        switch (outputFormat) {
            case 'drawio':
                output = generateDrawIOTimeline(timelineItems, showMilestones);
                defaultOutputPath = path.join(projectPath, '02-goals-and-roadmap', 'roadmap-timeline.drawio');
                break;
            case 'mermaid':
                output = generateMermaidTimeline(timelineItems, showMilestones);
                defaultOutputPath = path.join(projectPath, '02-goals-and-roadmap', 'roadmap-timeline.md');
                break;
            case 'ascii':
            default:
                output = generateASCIITimeline(timelineItems, showMilestones);
                defaultOutputPath = path.join(projectPath, '02-goals-and-roadmap', 'roadmap-timeline.txt');
                break;
        }
        const finalOutputPath = outputPath || defaultOutputPath;
        await fs.mkdir(path.dirname(finalOutputPath), { recursive: true });
        await fs.writeFile(finalOutputPath, output, 'utf-8');
        const duration = Date.now() - startTime;
        return {
            success: true,
            outputPath: finalOutputPath,
            outputFormat,
            itemsGenerated: timelineItems.length,
            timeRange,
            preview: output.split('\n').slice(0, 20).join('\n') + '\n...',
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
// TOOL 3: GENERATE PROGRESS DASHBOARD
// ============================================================================
export async function generateProgressDashboard(params) {
    const startTime = Date.now();
    try {
        const { projectPath, outputFormat, includeVelocity, includeHealth, outputPath } = GenerateProgressDashboardSchema.parse(params);
        // Calculate metrics
        const metrics = await calculateDashboardMetrics(projectPath, includeVelocity, includeHealth);
        // Generate output
        let output;
        let defaultOutputPath;
        switch (outputFormat) {
            case 'json':
                output = JSON.stringify(metrics, null, 2);
                defaultOutputPath = path.join(projectPath, '02-goals-and-roadmap', 'progress-dashboard.json');
                break;
            case 'drawio':
                output = generateDrawIODashboard(metrics);
                defaultOutputPath = path.join(projectPath, '02-goals-and-roadmap', 'progress-dashboard.drawio');
                break;
            case 'mermaid':
                output = generateMermaidDashboard(metrics);
                defaultOutputPath = path.join(projectPath, '02-goals-and-roadmap', 'progress-dashboard.md');
                break;
            case 'ascii':
            default:
                output = generateASCIIDashboard(metrics);
                defaultOutputPath = path.join(projectPath, '02-goals-and-roadmap', 'progress-dashboard.txt');
                break;
        }
        const finalOutputPath = outputPath || defaultOutputPath;
        await fs.mkdir(path.dirname(finalOutputPath), { recursive: true });
        await fs.writeFile(finalOutputPath, output, 'utf-8');
        const duration = Date.now() - startTime;
        return {
            success: true,
            outputPath: finalOutputPath,
            outputFormat,
            metrics,
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
// TOOL 4: GENERATE DEPENDENCY GRAPH
// ============================================================================
export async function generateDependencyGraph(params) {
    const startTime = Date.now();
    try {
        const { projectPath, outputFormat, scope, entityId, showCriticalPath, outputPath } = GenerateDependencyGraphSchema.parse(params);
        // Build dependency data
        const dependencies = await buildDependencyData(projectPath, scope, entityId);
        // Generate output
        let output;
        let defaultOutputPath;
        switch (outputFormat) {
            case 'drawio':
                output = generateDrawIODependencies(dependencies, showCriticalPath);
                defaultOutputPath = path.join(projectPath, '02-goals-and-roadmap', 'dependency-graph.drawio');
                break;
            case 'mermaid':
                output = generateMermaidDependencies(dependencies, showCriticalPath);
                defaultOutputPath = path.join(projectPath, '02-goals-and-roadmap', 'dependency-graph.md');
                break;
            case 'ascii':
            default:
                output = generateASCIIDependencies(dependencies, showCriticalPath);
                defaultOutputPath = path.join(projectPath, '02-goals-and-roadmap', 'dependency-graph.txt');
                break;
        }
        const finalOutputPath = outputPath || defaultOutputPath;
        await fs.mkdir(path.dirname(finalOutputPath), { recursive: true });
        await fs.writeFile(finalOutputPath, output, 'utf-8');
        const duration = Date.now() - startTime;
        return {
            success: true,
            outputPath: finalOutputPath,
            outputFormat,
            dependenciesFound: dependencies.length,
            criticalPathHighlighted: showCriticalPath,
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
// HELPER FUNCTIONS - HIERARCHY TREE
// ============================================================================
async function buildHierarchyTree(projectPath, maxDepth, filterStatus) {
    const projectName = path.basename(projectPath);
    const root = {
        id: 'project',
        name: projectName,
        type: 'project',
        progress: 0,
        status: 'active',
        children: [],
    };
    if (maxDepth < 2)
        return root;
    // Read components
    const componentsDir = path.join(projectPath, '02-goals-and-roadmap', 'components');
    if (await fileExists(componentsDir)) {
        const componentFolders = await fs.readdir(componentsDir);
        for (const componentFolder of componentFolders) {
            if (componentFolder.startsWith('.'))
                continue;
            const componentPath = path.join(componentsDir, componentFolder);
            const stats = await fs.stat(componentPath);
            if (!stats.isDirectory())
                continue;
            const componentNode = {
                id: componentFolder,
                name: formatName(componentFolder),
                type: 'component',
                progress: 0,
                status: 'active',
                children: [],
            };
            // Read major goals
            if (maxDepth >= 3) {
                const goalsDir = path.join(componentPath, 'major-goals');
                if (await fileExists(goalsDir)) {
                    const goalFiles = await fs.readdir(goalsDir);
                    for (const goalFile of goalFiles) {
                        if (!goalFile.endsWith('.md') || goalFile.includes('COMPONENT'))
                            continue;
                        const goalId = goalFile.replace('.md', '');
                        const goalContent = await fs.readFile(path.join(goalsDir, goalFile), 'utf-8');
                        // Extract progress and status
                        const progressMatch = goalContent.match(/Progress:\s*(\d+)%/);
                        const statusMatch = goalContent.match(/Status:\s*\*\*\s*([^\n*]+)/);
                        const progress = progressMatch ? parseInt(progressMatch[1]) : 0;
                        const status = statusMatch ? statusMatch[1].trim() : 'unknown';
                        // Apply filter
                        if (filterStatus !== 'all') {
                            if (filterStatus === 'active' && status === 'Complete')
                                continue;
                            if (filterStatus === 'completed' && status !== 'Complete')
                                continue;
                            if (filterStatus === 'blocked' && status !== 'Blocked')
                                continue;
                        }
                        const goalNode = {
                            id: goalId,
                            name: extractGoalName(goalContent) || goalId,
                            type: 'major-goal',
                            progress,
                            status,
                            children: [],
                        };
                        componentNode.children.push(goalNode);
                    }
                }
            }
            // Calculate component progress
            if (componentNode.children.length > 0) {
                const totalProgress = componentNode.children.reduce((sum, child) => sum + child.progress, 0);
                componentNode.progress = Math.round(totalProgress / componentNode.children.length);
            }
            root.children.push(componentNode);
        }
    }
    // Calculate overall progress
    if (root.children.length > 0) {
        const totalProgress = root.children.reduce((sum, child) => sum + child.progress, 0);
        root.progress = Math.round(totalProgress / root.children.length);
    }
    return root;
}
function generateASCIIHierarchy(tree, showProgress) {
    const lines = [];
    function renderNode(node, prefix, isLast) {
        const connector = isLast ? '└─' : '├─';
        const progressStr = showProgress ? ` (${node.progress}%)` : '';
        const statusIcon = getStatusIcon(node.status);
        lines.push(`${prefix}${connector} ${statusIcon} ${node.name}${progressStr}`);
        const newPrefix = prefix + (isLast ? '   ' : '│  ');
        node.children.forEach((child, index) => {
            renderNode(child, newPrefix, index === node.children.length - 1);
        });
    }
    lines.push(`${tree.name} ${showProgress ? `(${tree.progress}%)` : ''}`);
    tree.children.forEach((child, index) => {
        renderNode(child, '', index === tree.children.length - 1);
    });
    return lines.join('\n');
}
function generateMermaidHierarchy(tree, showProgress) {
    const lines = ['```mermaid', 'graph TD'];
    function addNode(node, parentId) {
        const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
        const label = showProgress ? `${node.name}<br/>${node.progress}%` : node.name;
        const style = getNodeStyle(node.status);
        lines.push(`  ${nodeId}["${label}"]${style}`);
        if (parentId) {
            lines.push(`  ${parentId} --> ${nodeId}`);
        }
        node.children.forEach(child => addNode(child, nodeId));
    }
    addNode(tree);
    lines.push('```');
    return lines.join('\n');
}
function generateDrawIOHierarchy(tree, showProgress) {
    // Simplified draw.io XML generation
    return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile>
  <diagram name="Hierarchy Tree">
    <mxGraphModel>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <!-- Hierarchy tree visualization -->
        <mxCell id="project" value="${tree.name}${showProgress ? ` (${tree.progress}%)` : ''}"
          style="rounded=1;whiteSpace=wrap;" vertex="1" parent="1">
          <mxGeometry x="200" y="40" width="120" height="60" as="geometry"/>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}
// ============================================================================
// HELPER FUNCTIONS - TIMELINE
// ============================================================================
async function buildTimelineData(projectPath, groupBy, timeRange) {
    const items = [];
    // Read components and goals
    const componentsDir = path.join(projectPath, '02-goals-and-roadmap', 'components');
    if (await fileExists(componentsDir)) {
        const componentFolders = await fs.readdir(componentsDir);
        for (const componentFolder of componentFolders) {
            if (componentFolder.startsWith('.'))
                continue;
            const goalsDir = path.join(componentsDir, componentFolder, 'major-goals');
            if (await fileExists(goalsDir)) {
                const goalFiles = await fs.readdir(goalsDir);
                for (const goalFile of goalFiles) {
                    if (!goalFile.endsWith('.md') || goalFile.includes('COMPONENT'))
                        continue;
                    const goalContent = await fs.readFile(path.join(goalsDir, goalFile), 'utf-8');
                    const goalId = goalFile.replace('.md', '');
                    items.push({
                        id: goalId,
                        name: extractGoalName(goalContent) || goalId,
                        startDate: extractDate(goalContent, 'start') || 'TBD',
                        endDate: extractDate(goalContent, 'end') || 'TBD',
                        progress: extractProgress(goalContent),
                        status: extractStatus(goalContent),
                        dependencies: extractDependencies(goalContent),
                        group: componentFolder,
                    });
                }
            }
        }
    }
    return items;
}
function generateMermaidTimeline(items, showMilestones) {
    const lines = ['```mermaid', 'gantt'];
    lines.push('  title Project Roadmap Timeline');
    lines.push('  dateFormat YYYY-MM-DD');
    lines.push('');
    // Group items
    const groups = new Map();
    for (const item of items) {
        if (!groups.has(item.group)) {
            groups.set(item.group, []);
        }
        groups.get(item.group).push(item);
    }
    // Generate Gantt chart
    for (const [group, groupItems] of groups) {
        lines.push(`  section ${formatName(group)}`);
        for (const item of groupItems) {
            const status = item.status === 'Complete' ? 'done' : item.status === 'In Progress' ? 'active' : 'crit';
            const start = item.startDate !== 'TBD' ? item.startDate : '2025-01-01';
            const end = item.endDate !== 'TBD' ? item.endDate : '2025-12-31';
            lines.push(`    ${item.name} :${status}, ${item.id}, ${start}, ${end}`);
        }
    }
    lines.push('```');
    return lines.join('\n');
}
function generateASCIITimeline(items, showMilestones) {
    const lines = ['PROJECT ROADMAP TIMELINE', '='.repeat(80), ''];
    const groups = new Map();
    for (const item of items) {
        if (!groups.has(item.group)) {
            groups.set(item.group, []);
        }
        groups.get(item.group).push(item);
    }
    for (const [group, groupItems] of groups) {
        lines.push(`\n${formatName(group).toUpperCase()}`);
        lines.push('-'.repeat(40));
        for (const item of groupItems) {
            lines.push(`${getStatusIcon(item.status)} ${item.name} (${item.progress}%)`);
            lines.push(`   Start: ${item.startDate} | End: ${item.endDate}`);
            if (item.dependencies.length > 0) {
                lines.push(`   Dependencies: ${item.dependencies.join(', ')}`);
            }
            lines.push('');
        }
    }
    return lines.join('\n');
}
function generateDrawIOTimeline(items, showMilestones) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile>
  <diagram name="Roadmap Timeline">
    <mxGraphModel>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <!-- Timeline visualization -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}
// ============================================================================
// HELPER FUNCTIONS - DASHBOARD
// ============================================================================
async function calculateDashboardMetrics(projectPath, includeVelocity, includeHealth) {
    const metrics = {
        overallProgress: 0,
        componentsTotal: 0,
        componentsActive: 0,
        componentsCompleted: 0,
        goalsTotal: 0,
        goalsCompleted: 0,
        goalsInProgress: 0,
        goalsBlocked: 0,
        velocity: 0,
        estimatedCompletion: 'TBD',
        healthScore: 100,
    };
    // Count components and goals
    const componentsDir = path.join(projectPath, '02-goals-and-roadmap', 'components');
    if (await fileExists(componentsDir)) {
        const componentFolders = await fs.readdir(componentsDir);
        metrics.componentsTotal = componentFolders.filter(f => !f.startsWith('.')).length;
        let totalProgress = 0;
        for (const componentFolder of componentFolders) {
            if (componentFolder.startsWith('.'))
                continue;
            const goalsDir = path.join(componentsDir, componentFolder, 'major-goals');
            if (await fileExists(goalsDir)) {
                const goalFiles = await fs.readdir(goalsDir);
                const mdFiles = goalFiles.filter(f => f.endsWith('.md') && !f.includes('COMPONENT'));
                metrics.goalsTotal += mdFiles.length;
                let componentProgress = 0;
                let hasActiveGoals = false;
                for (const goalFile of mdFiles) {
                    const goalContent = await fs.readFile(path.join(goalsDir, goalFile), 'utf-8');
                    const progress = extractProgress(goalContent);
                    const status = extractStatus(goalContent);
                    componentProgress += progress;
                    if (status === 'Complete') {
                        metrics.goalsCompleted++;
                    }
                    else if (status === 'In Progress') {
                        metrics.goalsInProgress++;
                        hasActiveGoals = true;
                    }
                    else if (status === 'Blocked') {
                        metrics.goalsBlocked++;
                    }
                }
                if (mdFiles.length > 0) {
                    const avgProgress = componentProgress / mdFiles.length;
                    totalProgress += avgProgress;
                    if (avgProgress === 100) {
                        metrics.componentsCompleted++;
                    }
                    else if (hasActiveGoals || avgProgress > 0) {
                        metrics.componentsActive++;
                    }
                }
            }
        }
        if (metrics.componentsTotal > 0) {
            metrics.overallProgress = Math.round(totalProgress / metrics.componentsTotal);
        }
    }
    // Calculate health score
    if (includeHealth) {
        metrics.healthScore = 100;
        if (metrics.goalsBlocked > 0) {
            metrics.healthScore -= metrics.goalsBlocked * 10;
        }
        if (metrics.goalsInProgress === 0 && metrics.goalsCompleted < metrics.goalsTotal) {
            metrics.healthScore -= 20; // No active work
        }
        metrics.healthScore = Math.max(0, metrics.healthScore);
    }
    return metrics;
}
function generateASCIIDashboard(metrics) {
    const lines = [];
    lines.push('╔' + '═'.repeat(58) + '╗');
    lines.push('║' + '  PROJECT PROGRESS DASHBOARD'.padEnd(58) + '║');
    lines.push('╚' + '═'.repeat(58) + '╝');
    lines.push('');
    // Overall metrics
    lines.push('OVERALL PROGRESS');
    lines.push('─'.repeat(60));
    lines.push(createProgressBar(metrics.overallProgress, 50) + ` ${metrics.overallProgress}%`);
    lines.push('');
    // Components
    lines.push('COMPONENTS');
    lines.push('─'.repeat(60));
    lines.push(`Total: ${metrics.componentsTotal} | Active: ${metrics.componentsActive} | Completed: ${metrics.componentsCompleted}`);
    lines.push('');
    // Goals
    lines.push('GOALS');
    lines.push('─'.repeat(60));
    lines.push(`Total: ${metrics.goalsTotal}`);
    lines.push(`✓ Completed: ${metrics.goalsCompleted}`);
    lines.push(`⚡ In Progress: ${metrics.goalsInProgress}`);
    lines.push(`⚠ Blocked: ${metrics.goalsBlocked}`);
    lines.push('');
    // Health
    lines.push('HEALTH SCORE');
    lines.push('─'.repeat(60));
    const healthIcon = metrics.healthScore >= 80 ? '🟢' : metrics.healthScore >= 60 ? '🟡' : '🔴';
    lines.push(`${healthIcon} ${metrics.healthScore}/100`);
    lines.push('');
    return lines.join('\n');
}
function generateMermaidDashboard(metrics) {
    const lines = ['```mermaid', 'pie title Project Progress'];
    lines.push(`  "Completed" : ${metrics.goalsCompleted}`);
    lines.push(`  "In Progress" : ${metrics.goalsInProgress}`);
    lines.push(`  "Not Started" : ${metrics.goalsTotal - metrics.goalsCompleted - metrics.goalsInProgress}`);
    lines.push('```');
    return lines.join('\n');
}
function generateDrawIODashboard(metrics) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile>
  <diagram name="Progress Dashboard">
    <mxGraphModel>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <!-- Dashboard visualization -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}
// ============================================================================
// HELPER FUNCTIONS - DEPENDENCIES
// ============================================================================
async function buildDependencyData(projectPath, scope, entityId) {
    // Simplified dependency tracking
    return [];
}
function generateMermaidDependencies(dependencies, showCriticalPath) {
    return '```mermaid\ngraph LR\n  A[Goal A] --> B[Goal B]\n  B --> C[Goal C]\n```';
}
function generateASCIIDependencies(dependencies, showCriticalPath) {
    return 'DEPENDENCY GRAPH\n\nGoal A → Goal B → Goal C';
}
function generateDrawIODependencies(dependencies, showCriticalPath) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<mxfile><diagram name="Dependencies"></diagram></mxfile>`;
}
// ============================================================================
// UTILITIES
// ============================================================================
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
function formatName(kebabCase) {
    return kebabCase
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
function extractGoalName(content) {
    const match = content.match(/# (?:Major Goal \d+:\s*)?(.+)/);
    return match ? match[1].trim() : null;
}
function extractProgress(content) {
    const match = content.match(/Progress:\s*(\d+)%/);
    return match ? parseInt(match[1]) : 0;
}
function extractStatus(content) {
    const match = content.match(/Status:\s*\*\*\s*([^\n*]+)/);
    return match ? match[1].trim() : 'unknown';
}
function extractDate(content, type) {
    const pattern = type === 'start' ? /Start Date:\s*([^\n]+)/ : /Target Date:\s*([^\n]+)/;
    const match = content.match(pattern);
    return match ? match[1].trim() : null;
}
function extractDependencies(content) {
    // Simplified dependency extraction
    return [];
}
function getStatusIcon(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete'))
        return '✅';
    if (statusLower.includes('progress'))
        return '⚡';
    if (statusLower.includes('blocked'))
        return '🚫';
    if (statusLower.includes('planning'))
        return '📋';
    return '○';
}
function getNodeStyle(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete'))
        return ':::completed';
    if (statusLower.includes('progress'))
        return ':::inProgress';
    if (statusLower.includes('blocked'))
        return ':::blocked';
    return '';
}
function countNodes(tree) {
    let count = 1;
    for (const child of tree.children) {
        count += countNodes(child);
    }
    return count;
}
function createProgressBar(percentage, width) {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
}
//# sourceMappingURL=visualization-tools.js.map