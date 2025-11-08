/**
 * Propagation Manager
 *
 * Handles automatic propagation of component changes to related documents
 * (README.md, EVENT_LOG.md, ROADMAP.md)
 */
import * as fs from "fs";
import * as path from "path";
import { parseMarkdownFile, writeMarkdownFile, findSection, updateSectionContent, addSection, } from "./markdown-parser.js";
import { loadProjectOverview, } from "./component-manager.js";
// ============================================================================
// PROPAGATION ORCHESTRATION
// ============================================================================
/**
 * Propagate a component change to related documents
 */
export function propagateComponentChange(projectPath, componentName, action, fromStage, toStage) {
    const filesUpdated = [];
    // Update README if component is finalized or archived
    if (toStage === "FINALIZED") {
        updateReadme(projectPath);
        filesUpdated.push("README.md");
    }
    if (toStage === "ARCHIVED" && fromStage === "FINALIZED") {
        updateReadme(projectPath);
        filesUpdated.push("README.md");
    }
    // Log to EVENT_LOG for significant changes
    if (shouldLogToEventLog(action, toStage)) {
        updateEventLog(projectPath, componentName, action, fromStage, toStage);
        filesUpdated.push("EVENT_LOG.md");
    }
    return { filesUpdated };
}
/**
 * Propagate batch changes
 */
export function propagateBatchChanges(projectPath, changes) {
    const allFilesUpdated = new Set();
    for (const change of changes) {
        const { filesUpdated } = propagateComponentChange(projectPath, change.componentName, change.action, change.fromStage, change.toStage);
        filesUpdated.forEach((file) => allFilesUpdated.add(file));
    }
    return { filesUpdated: Array.from(allFilesUpdated) };
}
// ============================================================================
// README UPDATE
// ============================================================================
/**
 * Update README with finalized components
 */
export function updateReadme(projectPath) {
    const readmePath = path.join(projectPath, "README.md");
    const overview = loadProjectOverview(projectPath);
    if (!fs.existsSync(readmePath)) {
        console.warn("README.md not found, skipping update");
        return;
    }
    const parsed = parseMarkdownFile(readmePath);
    // Find or create "Project Components" section
    const componentsSection = findSection(parsed.sections, /Project Components/i);
    const content = generateProjectComponentsContent(overview.components.finalized);
    if (componentsSection) {
        // Update existing section
        updateSectionContent(parsed, /Project Components/i, content);
    }
    else {
        // Add new section
        addSection(parsed, "Project Components", 2, content);
    }
    // Write back to file
    writeMarkdownFile(readmePath, parsed);
}
/**
 * Generate project components content for README
 */
export function generateProjectComponentsContent(components) {
    if (components.length === 0) {
        return "_No components finalized yet._";
    }
    const parts = [];
    for (const component of components) {
        parts.push(`### ${component.name}`);
        parts.push("");
        parts.push(component.description);
        if (component.subComponents && component.subComponents.length > 0) {
            parts.push("");
            parts.push("**Sub-components:**");
            for (const sub of component.subComponents) {
                parts.push(`- ${sub.name}${sub.description ? ": " + sub.description : ""}`);
            }
        }
        parts.push("");
    }
    return parts.join("\n");
}
// ============================================================================
// EVENT_LOG UPDATE
// ============================================================================
/**
 * Determine if action should be logged to EVENT_LOG
 */
export function shouldLogToEventLog(action, toStage) {
    // Log major decisions and state changes
    const significantActions = [
        "created",
        "moved",
        "split",
        "merged",
        "converted_to_goal",
        "archived",
    ];
    if (significantActions.includes(action)) {
        return true;
    }
    // Log when moving to finalized
    if (action === "moved" && toStage === "FINALIZED") {
        return true;
    }
    return false;
}
/**
 * Update EVENT_LOG with component change
 */
export function updateEventLog(projectPath, componentName, action, fromStage, toStage) {
    const eventLogPath = path.join(projectPath, "EVENT_LOG.md");
    if (!fs.existsSync(eventLogPath)) {
        console.warn("EVENT_LOG.md not found, skipping update");
        return;
    }
    const parsed = parseMarkdownFile(eventLogPath);
    // Generate event entry
    const entry = generateEventLogEntry(componentName, action, fromStage, toStage);
    // Find "Recent Events" or first section
    const recentSection = findSection(parsed.sections, /Recent Events|Events/i);
    if (recentSection) {
        // Prepend to existing section (newest first)
        recentSection.content.unshift(entry, "");
    }
    else {
        // Create new section
        addSection(parsed, "Recent Events", 2, entry);
    }
    // Write back to file
    writeMarkdownFile(eventLogPath, parsed);
}
/**
 * Generate event log entry
 */
export function generateEventLogEntry(componentName, action, fromStage, toStage) {
    const timestamp = new Date().toISOString().split("T")[0];
    let description = "";
    switch (action) {
        case "created":
            description = `Component "${componentName}" created in ${toStage || "EXPLORING"} stage`;
            break;
        case "moved":
            description = `Component "${componentName}" moved from ${fromStage} to ${toStage}`;
            break;
        case "split":
            description = `Component "${componentName}" split into multiple components`;
            break;
        case "merged":
            description = `Component "${componentName}" merged from multiple components`;
            break;
        case "converted_to_goal":
            description = `Component "${componentName}" converted to goal`;
            break;
        case "archived":
            description = `Component "${componentName}" archived`;
            break;
        case "updated":
            description = `Component "${componentName}" updated`;
            break;
        default:
            description = `Component "${componentName}" ${action}`;
    }
    return `- **[${timestamp}]** ${description}`;
}
// ============================================================================
// ROADMAP UPDATE
// ============================================================================
/**
 * Update ROADMAP when component is converted to goal
 */
export function updateRoadmap(projectPath, componentName, goalPath) {
    const roadmapPath = path.join(projectPath, "02-goals-and-roadmap/ROADMAP.md");
    if (!fs.existsSync(roadmapPath)) {
        console.warn("ROADMAP.md not found, skipping update");
        return;
    }
    const parsed = parseMarkdownFile(roadmapPath);
    // Find "Active Goals" or similar section
    const activeGoalsSection = findSection(parsed.sections, /Active Goals|Current Goals/i);
    const entry = `- **${componentName}** - [View Goal](${path.relative(path.dirname(roadmapPath), goalPath)})`;
    if (activeGoalsSection) {
        activeGoalsSection.content.push(entry);
    }
    else {
        addSection(parsed, "Active Goals", 2, entry);
    }
    // Write back to file
    writeMarkdownFile(roadmapPath, parsed);
}
// ============================================================================
// VALIDATION
// ============================================================================
/**
 * Validate README is in sync with finalized components
 */
export function validateReadmeSync(projectPath) {
    const readmePath = path.join(projectPath, "README.md");
    const overview = loadProjectOverview(projectPath);
    if (!fs.existsSync(readmePath)) {
        return {
            inSync: false,
            missingComponents: overview.components.finalized.map((c) => c.name),
            extraComponents: [],
        };
    }
    const parsed = parseMarkdownFile(readmePath);
    const componentsSection = findSection(parsed.sections, /Project Components/i);
    if (!componentsSection) {
        return {
            inSync: false,
            missingComponents: overview.components.finalized.map((c) => c.name),
            extraComponents: [],
        };
    }
    // Parse component names from README
    const readmeComponentNames = [];
    const content = componentsSection.content.join("\n");
    const matches = content.matchAll(/^###\s+(.+)$/gm);
    for (const match of matches) {
        readmeComponentNames.push(match[1].trim());
    }
    // Compare
    const finalizedNames = new Set(overview.components.finalized.map((c) => c.name));
    const readmeNames = new Set(readmeComponentNames);
    const missingComponents = overview.components.finalized
        .filter((c) => !readmeNames.has(c.name))
        .map((c) => c.name);
    const extraComponents = readmeComponentNames.filter((name) => !finalizedNames.has(name));
    return {
        inSync: missingComponents.length === 0 && extraComponents.length === 0,
        missingComponents,
        extraComponents,
    };
}
//# sourceMappingURL=propagation-manager.js.map