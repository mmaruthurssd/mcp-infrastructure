/**
 * Diagram Generator Utility
 *
 * Generate workflow diagrams from goal data in multiple layout styles.
 */
import * as fs from 'fs';
import * as path from 'path';
import { DrawioXmlBuilder } from './drawio-xml-builder.js';
import { scanAllGoals } from './goal-scanner.js';
// ============================================================================
// Layout Algorithms
// ============================================================================
/**
 * Generate Roadmap Layout (Horizontal Flow by Tier)
 */
function generateRoadmapLayout(goals, builder) {
    const COLUMN_WIDTH = 320;
    const COLUMN_GAP = 20;
    const GOAL_HEIGHT = 120;
    const GOAL_GAP = 20;
    const HEADER_HEIGHT = 40;
    const START_Y = 100;
    // Group goals by tier
    const tiers = ['Now', 'Next', 'Later', 'Someday'];
    const goalsByTier = {
        Now: [],
        Next: [],
        Later: [],
        Someday: [],
    };
    for (const goal of goals) {
        const tier = goal.tier || 'Someday';
        if (goalsByTier[tier]) {
            goalsByTier[tier].push(goal);
        }
    }
    // Create tier columns
    for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i];
        const x = 100 + i * (COLUMN_WIDTH + COLUMN_GAP);
        const tierGoals = goalsByTier[tier];
        // Skip empty tiers
        if (tierGoals.length === 0)
            continue;
        // Create tier header
        builder.createTierHeader({
            tier: tier,
            x,
            y: 50,
            width: 300,
            height: HEADER_HEIGHT,
        });
        // Create goal boxes
        for (let j = 0; j < tierGoals.length; j++) {
            const goal = tierGoals[j];
            const y = START_Y + j * (GOAL_HEIGHT + GOAL_GAP);
            builder.createGoalBox({
                id: goal.id || `goal-${j}`,
                name: goal.name,
                impact: goal.impactScore,
                effort: goal.effortScore,
                owner: goal.owner,
                progress: goal.progress,
                priority: (goal.priority || 'Medium'),
                status: goal.status || 'Not Started',
                x: x + 20,
                y,
                width: 260,
                height: 100,
            });
        }
    }
}
/**
 * Generate Kanban Layout (Columns by Status)
 */
function generateKanbanLayout(potentialGoals, selectedGoals, archivedGoals, builder, options) {
    const COLUMN_WIDTH = 220;
    const COLUMN_GAP = 10;
    const GOAL_HEIGHT = 80;
    const GOAL_GAP = 10;
    const HEADER_HEIGHT = 40;
    const START_Y = 100;
    // Define columns
    const columns = [];
    if (options.includePotential) {
        columns.push({ name: 'Potential', goals: potentialGoals.slice(0, 10) });
    }
    // Group selected goals by tier
    const tiers = ['Now', 'Next', 'Later', 'Someday'];
    for (const tier of tiers) {
        const tierGoals = selectedGoals.filter(g => g.tier === tier);
        if (tierGoals.length > 0) {
            columns.push({ name: tier, goals: tierGoals });
        }
    }
    if (options.includeArchived) {
        columns.push({ name: 'Archived', goals: archivedGoals.slice(0, 5) });
    }
    // Create columns
    for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        const x = 50 + i * (COLUMN_WIDTH + COLUMN_GAP);
        // Create column header
        builder.addCell({
            id: `column-${column.name.toLowerCase()}`,
            value: column.name.toUpperCase(),
            style: {
                rounded: false,
                fillColor: '#F5F5F5',
                strokeColor: '#666666',
                fontSize: 14,
                fontStyle: 1,
                align: 'center',
                verticalAlign: 'middle',
            },
            geometry: { x, y: 50, width: COLUMN_WIDTH, height: HEADER_HEIGHT },
        });
        // Create goal boxes in column
        for (let j = 0; j < Math.min(column.goals.length, 8); j++) {
            const goal = column.goals[j];
            const y = START_Y + j * (GOAL_HEIGHT + GOAL_GAP);
            builder.createGoalBox({
                id: goal.id || `potential-${j}`,
                name: (goal.name.substring(0, 40) + (goal.name.length > 40 ? '...' : '')),
                impact: goal.impactScore || 'Medium',
                effort: goal.effortScore || 'Medium',
                priority: (goal.priority || 'Medium'),
                status: goal.status || 'Potential',
                x: x + 10,
                y,
                width: COLUMN_WIDTH - 20,
                height: GOAL_HEIGHT,
                owner: goal.owner,
                progress: goal.progress,
            });
        }
    }
}
/**
 * Generate Timeline Layout (Gantt-style)
 */
function generateTimelineLayout(goals, builder) {
    const ROW_HEIGHT = 60;
    const ROW_GAP = 10;
    const START_X = 300;
    const START_Y = 100;
    const MAX_WIDTH = 600;
    // Create timeline header
    builder.addCell({
        id: 'timeline-header',
        value: 'GOAL TIMELINE',
        style: {
            rounded: false,
            fillColor: '#333333',
            fontColor: '#FFFFFF',
            fontSize: 18,
            fontStyle: 1,
            align: 'center',
            verticalAlign: 'middle',
        },
        geometry: { x: 100, y: 50, width: 900, height: 40 },
    });
    // Create goal rows
    for (let i = 0; i < goals.length; i++) {
        const goal = goals[i];
        const y = START_Y + i * (ROW_HEIGHT + ROW_GAP);
        // Goal label (left side)
        builder.addCell({
            id: `label-${goal.id}`,
            value: `${goal.id}. ${goal.name}`,
            style: {
                rounded: false,
                fillColor: '#F5F5F5',
                strokeColor: '#CCCCCC',
                fontSize: 12,
                align: 'left',
                verticalAlign: 'middle',
            },
            geometry: { x: 100, y, width: 180, height: ROW_HEIGHT },
        });
        // Progress bar (timeline)
        const progress = goal.progress || 0;
        const barWidth = MAX_WIDTH * (progress / 100);
        // Background bar
        builder.addCell({
            id: `timeline-bg-${goal.id}`,
            value: '',
            style: {
                rounded: true,
                fillColor: '#E8E8E8',
                strokeColor: '#CCCCCC',
            },
            geometry: { x: START_X, y: y + 10, width: MAX_WIDTH, height: 40 },
        });
        // Progress bar
        if (progress > 0) {
            builder.addCell({
                id: `timeline-progress-${goal.id}`,
                value: `${progress}%`,
                style: {
                    rounded: true,
                    fillColor: goal.priority === 'High' ? '#82B366' : goal.priority === 'Medium' ? '#D6B656' : '#B3B3B3',
                    strokeColor: 'none',
                    fontColor: '#FFFFFF',
                    fontSize: 12,
                    fontStyle: 1,
                    align: 'right',
                    verticalAlign: 'middle',
                },
                geometry: { x: START_X, y: y + 10, width: Math.max(barWidth, 60), height: 40 },
            });
        }
    }
}
// ============================================================================
// Main Diagram Generation
// ============================================================================
/**
 * Generate a goals diagram
 */
export function generateGoalsDiagram(projectPath, diagramType, options = {}) {
    // Scan goals from project
    const scanResult = scanAllGoals(projectPath);
    // Filter goals based on options
    let selectedGoals = scanResult.selectedGoals;
    if (options.tier) {
        selectedGoals = selectedGoals.filter((g) => g.tier === options.tier);
    }
    if (options.priority) {
        selectedGoals = selectedGoals.filter((g) => g.priority === options.priority);
    }
    // Create diagram builder
    const builder = new DrawioXmlBuilder();
    // Generate layout based on type
    switch (diagramType) {
        case 'roadmap':
            generateRoadmapLayout(selectedGoals, builder);
            break;
        case 'kanban':
            generateKanbanLayout(options.includePotential ? scanResult.potentialGoals : [], selectedGoals, options.includeArchived ? [] : [], // TODO: Scan archived goals
            builder, options);
            break;
        case 'timeline':
            generateTimelineLayout(selectedGoals, builder);
            break;
        default:
            throw new Error(`Unknown diagram type: ${diagramType}`);
    }
    // Build XML
    const xml = builder.build({
        id: `goals-${diagramType}`,
        name: `Goals ${diagramType.charAt(0).toUpperCase() + diagramType.slice(1)}`,
        width: diagramType === 'roadmap' ? 1600 : diagramType === 'kanban' ? 1800 : 1200,
        height: 900,
    });
    return xml;
}
/**
 * Save diagram to file
 */
export function saveDiagram(xml, outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, xml, 'utf-8');
}
//# sourceMappingURL=diagram-generator.js.map