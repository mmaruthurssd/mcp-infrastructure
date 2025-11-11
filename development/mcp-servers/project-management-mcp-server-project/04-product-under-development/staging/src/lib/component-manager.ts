/**
 * Component Manager
 *
 * Core logic for managing component lifecycle (CRUD operations, change log, parsing)
 * Handles all component operations for the Component-Driven Framework
 */

import * as fs from "fs";
import * as path from "path";
import {
  parseMarkdownFile,
  serializeMarkdown,
  writeMarkdownFile,
  findSection,
  updateSectionContent,
  addSection,
  ParsedMarkdown,
  updateFrontmatter,
} from "./markdown-parser.js";
import {
  Component,
  ComponentStage,
  ComponentChangeLogEntry,
  ComponentAction,
  ProjectOverviewDocument,
  ProjectType,
  WorkflowPhase,
  SubComponent,
  ComponentDependencies,
} from "./component-types.js";

// ============================================================================
// LOAD / SAVE PROJECT OVERVIEW
// ============================================================================

/**
 * Load project-overview-working.md
 */
export function loadProjectOverview(projectPath: string): ProjectOverviewDocument {
  const overviewPath = path.join(projectPath, "01-planning/project-overview-working.md");

  if (!fs.existsSync(overviewPath)) {
    throw new Error(`Project overview not found: ${overviewPath}`);
  }

  const parsed = parseMarkdownFile(overviewPath);
  return parseProjectOverviewFromMarkdown(parsed);
}

/**
 * Save project overview to file
 */
export function saveProjectOverview(
  projectPath: string,
  overview: ProjectOverviewDocument
): void {
  const overviewPath = path.join(projectPath, "01-planning/project-overview-working.md");

  // Update timestamp
  if (!overview.metadata) {
    overview.metadata = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } else {
    overview.metadata.updatedAt = new Date().toISOString();
  }

  const markdown = convertProjectOverviewToMarkdown(overview);
  fs.writeFileSync(overviewPath, markdown, "utf-8");
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a new component
 */
export function createComponent(
  projectPath: string,
  component: Omit<Component, "createdAt" | "updatedAt">
): Component {
  const overview = loadProjectOverview(projectPath);

  // Check if component already exists
  const allComponents = [
    ...overview.components.exploring,
    ...overview.components.framework,
    ...overview.components.finalized,
    ...overview.components.archived,
  ];

  if (allComponents.some((c) => c.name === component.name)) {
    throw new Error(`Component already exists: ${component.name}`);
  }

  // Add timestamps
  const now = new Date().toISOString();
  const newComponent: Component = {
    ...component,
    createdAt: now,
    updatedAt: now,
  };

  // Add to appropriate stage
  const stageKey = component.stage.toLowerCase() as keyof typeof overview.components;
  overview.components[stageKey].push(newComponent);

  // Save
  saveProjectOverview(projectPath, overview);

  return newComponent;
}

/**
 * Get a component by name
 */
export function getComponent(projectPath: string, componentName: string): Component | null {
  const overview = loadProjectOverview(projectPath);

  const allComponents = [
    ...overview.components.exploring,
    ...overview.components.framework,
    ...overview.components.finalized,
    ...overview.components.archived,
  ];

  return allComponents.find((c) => c.name === componentName) || null;
}

/**
 * Update a component
 */
export function updateComponent(
  projectPath: string,
  componentName: string,
  updates: Partial<Omit<Component, "name" | "stage" | "createdAt" | "updatedAt">>
): Component {
  const overview = loadProjectOverview(projectPath);

  // Find component
  let targetComponent: Component | null = null;
  let targetStage: keyof typeof overview.components | null = null;

  for (const [stage, components] of Object.entries(overview.components)) {
    const component = components.find((c: Component) => c.name === componentName);
    if (component) {
      targetComponent = component;
      targetStage = stage as keyof typeof overview.components;
      break;
    }
  }

  if (!targetComponent || !targetStage) {
    throw new Error(`Component not found: ${componentName}`);
  }

  // Apply updates
  Object.assign(targetComponent, updates, {
    updatedAt: new Date().toISOString(),
  });

  // Save
  saveProjectOverview(projectPath, overview);

  return targetComponent;
}

/**
 * Move component between stages
 */
export function moveComponent(
  projectPath: string,
  componentName: string,
  toStage: ComponentStage
): { component: Component; fromStage: ComponentStage } {
  const overview = loadProjectOverview(projectPath);

  // Find component
  let targetComponent: Component | null = null;
  let fromStage: ComponentStage | null = null;

  for (const [stage, components] of Object.entries(overview.components)) {
    const index = components.findIndex((c: Component) => c.name === componentName);
    if (index >= 0) {
      [targetComponent] = components.splice(index, 1);
      fromStage = stage.toUpperCase() as ComponentStage;
      break;
    }
  }

  if (!targetComponent || !fromStage) {
    throw new Error(`Component not found: ${componentName}`);
  }

  // Update component
  targetComponent.stage = toStage;
  targetComponent.updatedAt = new Date().toISOString();

  // Add to new stage
  const toStageKey = toStage.toLowerCase() as keyof typeof overview.components;
  overview.components[toStageKey].push(targetComponent);

  // Save
  saveProjectOverview(projectPath, overview);

  return { component: targetComponent, fromStage };
}

/**
 * Delete a component
 */
export function deleteComponent(projectPath: string, componentName: string): Component {
  const overview = loadProjectOverview(projectPath);

  // Find and remove component
  let deletedComponent: Component | null = null;

  for (const [stage, components] of Object.entries(overview.components)) {
    const index = components.findIndex((c: Component) => c.name === componentName);
    if (index >= 0) {
      [deletedComponent] = components.splice(index, 1);
      break;
    }
  }

  if (!deletedComponent) {
    throw new Error(`Component not found: ${componentName}`);
  }

  // Save
  saveProjectOverview(projectPath, overview);

  return deletedComponent;
}

// ============================================================================
// CHANGE LOG
// ============================================================================

/**
 * Log a component change
 */
export function logComponentChange(
  projectPath: string,
  entry: Omit<ComponentChangeLogEntry, "timestamp">
): ComponentChangeLogEntry {
  const overview = loadProjectOverview(projectPath);

  const logEntry: ComponentChangeLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  overview.changeLog.push(logEntry);

  // Save
  saveProjectOverview(projectPath, overview);

  return logEntry;
}

/**
 * Get component history
 */
export function getComponentHistory(
  projectPath: string,
  componentName?: string,
  limit?: number
): ComponentChangeLogEntry[] {
  const overview = loadProjectOverview(projectPath);

  let entries = overview.changeLog;

  // Filter by component name
  if (componentName) {
    entries = entries.filter((e) => e.componentName === componentName);
  }

  // Sort by timestamp (most recent first)
  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Limit results
  if (limit && limit > 0) {
    entries = entries.slice(0, limit);
  }

  return entries;
}

// ============================================================================
// PARSING & SERIALIZATION
// ============================================================================

/**
 * Parse project overview from markdown
 */
export function parseProjectOverviewFromMarkdown(
  parsed: ParsedMarkdown
): ProjectOverviewDocument {
  const frontmatter = parsed.frontmatter || {};

  // Find stage sections (level 3)
  const exploringSection = findSection(parsed.sections, /Exploring/i);
  const frameworkSection = findSection(parsed.sections, /Framework/i);
  const finalizedSection = findSection(parsed.sections, /Finalized/i);
  const archivedSection = findSection(parsed.sections, /Archived/i);
  const changeLogSection = findSection(parsed.sections, /Change Log/i);

  // Parse components by finding level-4 sections between stage sections
  const exploringComponents = exploringSection
    ? parseComponentsBetweenSections(parsed.sections, exploringSection, frameworkSection, "EXPLORING")
    : [];
  const frameworkComponents = frameworkSection
    ? parseComponentsBetweenSections(parsed.sections, frameworkSection, finalizedSection, "FRAMEWORK")
    : [];
  const finalizedComponents = finalizedSection
    ? parseComponentsBetweenSections(parsed.sections, finalizedSection, archivedSection, "FINALIZED")
    : [];
  const archivedComponents = archivedSection
    ? parseComponentsBetweenSections(parsed.sections, archivedSection, changeLogSection, "ARCHIVED")
    : [];

  return {
    projectName: (frontmatter.project_name as string) || "Unknown Project",
    projectType: (frontmatter.project_type as ProjectType) || "software",
    description: (frontmatter.description as string) || "",
    currentPhase: (frontmatter.current_phase as WorkflowPhase) || "initialization",
    components: {
      exploring: exploringComponents,
      framework: frameworkComponents,
      finalized: finalizedComponents,
      archived: archivedComponents,
    },
    changeLog: changeLogSection
      ? parseChangeLogFromSection(changeLogSection.content.join("\n"))
      : [],
    metadata: {
      createdAt: (frontmatter.created_at as string) || new Date().toISOString(),
      updatedAt: (frontmatter.updated_at as string) || new Date().toISOString(),
      version: (frontmatter.version as string) || "1.0",
    },
  };
}

/**
 * Parse components by finding level-4 sections between two stage sections
 */
export function parseComponentsBetweenSections(
  sections: any[],
  startSection: any,
  endSection: any | undefined,
  stage: ComponentStage
): Component[] {
  const components: Component[] = [];

  // Find component sections (level 4) between start and end
  const startLine = startSection.startLine;
  const endLine = endSection ? endSection.startLine : Infinity;

  for (const section of sections) {
    // Only process level-4 sections within the range
    if (section.level === 4 && section.startLine > startLine && section.startLine < endLine) {
      // Parse this section as a component
      const component = parseComponentFromSection(section, stage);
      if (component) {
        components.push(component);
      }
    }
  }

  return components;
}

/**
 * Parse a single component from a level-4 section
 */
export function parseComponentFromSection(section: any, stage: ComponentStage): Component | null {
  const name = section.heading.trim();
  const content = section.content.join("\n");

  // Parse component details from content
  let description = "";
  const subComponents: SubComponent[] = [];
  let priority: "high" | "medium" | "low" | undefined;
  let notes: string | undefined;

  const lines = content.split("\n");
  let inSubComponents = false;
  let descriptionLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) continue;

    // Sub-components section
    if (trimmed.match(/^Sub-components:/i)) {
      inSubComponents = true;
      continue;
    }

    // Priority
    const priorityMatch = trimmed.match(/^Priority:\s*(.+)$/i);
    if (priorityMatch) {
      priority = priorityMatch[1].trim().toLowerCase() as "high" | "medium" | "low";
      inSubComponents = false;
      continue;
    }

    // Notes
    const notesMatch = trimmed.match(/^Notes:\s*(.+)$/i);
    if (notesMatch) {
      notes = notesMatch[1].trim();
      inSubComponents = false;
      continue;
    }

    // Sub-component item
    if (inSubComponents && trimmed.startsWith("-")) {
      const subMatch = trimmed.match(/^-\s*([^:]+)(?::\s*(.+))?$/);
      if (subMatch) {
        subComponents.push({
          name: subMatch[1].trim(),
          description: subMatch[2]?.trim(),
          status: "pending",
        });
      }
      continue;
    }

    // Description line
    if (!inSubComponents && !priorityMatch && !notesMatch) {
      descriptionLines.push(trimmed);
    }
  }

  description = descriptionLines.join(" ").trim();

  if (!description) {
    // If no description found, it might be malformed - skip it
    return null;
  }

  return {
    name,
    stage,
    description,
    subComponents: subComponents.length > 0 ? subComponents : undefined,
    priority,
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Parse components from section content
 */
export function parseComponentsFromSection(content: string, stage: ComponentStage): Component[] {
  const components: Component[] = [];
  const lines = content.split("\n");

  let currentComponent: Partial<Component> | null = null;
  let currentSubComponents: SubComponent[] = [];
  let inSubComponents = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Component heading (#### Component Name)
    const componentMatch = trimmed.match(/^####\s+(.+)$/);
    if (componentMatch) {
      // Save previous component
      if (currentComponent && currentComponent.name) {
        components.push({
          ...currentComponent,
          stage,
          subComponents: currentSubComponents.length > 0 ? currentSubComponents : undefined,
        } as Component);
      }

      // Start new component
      currentComponent = {
        name: componentMatch[1].trim(),
        description: "",
      };
      currentSubComponents = [];
      inSubComponents = false;
      continue;
    }

    if (!currentComponent) continue;

    // Description (first non-empty line after component name)
    if (!currentComponent.description && trimmed && !trimmed.startsWith("-")) {
      currentComponent.description = trimmed;
      continue;
    }

    // Sub-components section
    if (trimmed.match(/Sub-components?:/i)) {
      inSubComponents = true;
      continue;
    }

    // Sub-component item
    if (inSubComponents && trimmed.startsWith("-")) {
      const subComponentText = trimmed.replace(/^-\s*/, "");
      currentSubComponents.push({
        name: subComponentText,
        description: "",
      });
    }

    // Notes
    if (trimmed.match(/Notes?:/i)) {
      const notesMatch = trimmed.match(/Notes?:\s*(.+)/i);
      if (notesMatch) {
        currentComponent.notes = notesMatch[1];
      }
    }

    // Priority
    if (trimmed.match(/Priority:/i)) {
      const priorityMatch = trimmed.match(/Priority:\s*(high|medium|low)/i);
      if (priorityMatch) {
        currentComponent.priority = priorityMatch[1].toLowerCase() as "high" | "medium" | "low";
      }
    }
  }

  // Save last component
  if (currentComponent && currentComponent.name) {
    components.push({
      ...currentComponent,
      stage,
      subComponents: currentSubComponents.length > 0 ? currentSubComponents : undefined,
    } as Component);
  }

  return components;
}

/**
 * Parse change log from section content
 */
export function parseChangeLogFromSection(content: string): ComponentChangeLogEntry[] {
  const entries: ComponentChangeLogEntry[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Match: - [timestamp] ComponentName: action (description)
    const match = trimmed.match(
      /^-\s*\[([^\]]+)\]\s+(.+?):\s+(\w+)(?:\s+(.+))?$/
    );

    if (match) {
      const [, timestamp, componentName, action, description] = match;

      entries.push({
        timestamp,
        componentName,
        action: action as ComponentAction,
        description: description || "",
      });
    }
  }

  return entries;
}

/**
 * Convert project overview to markdown
 */
export function convertProjectOverviewToMarkdown(overview: ProjectOverviewDocument): string {
  const parts: string[] = [];

  // Frontmatter
  parts.push("---");
  parts.push(`project_name: ${overview.projectName}`);
  parts.push(`project_type: ${overview.projectType}`);
  parts.push(`description: ${overview.description}`);
  parts.push(`current_phase: ${overview.currentPhase}`);
  parts.push(`created_at: ${overview.metadata?.createdAt || new Date().toISOString()}`);
  parts.push(`updated_at: ${overview.metadata?.updatedAt || new Date().toISOString()}`);
  parts.push(`version: ${overview.metadata?.version || "1.0"}`);
  parts.push("---");
  parts.push("");

  // Title
  parts.push(`# ${overview.projectName} - Project Overview`);
  parts.push("");
  parts.push(overview.description);
  parts.push("");

  // Components by stage
  parts.push("## Components");
  parts.push("");

  parts.push("### Exploring");
  parts.push("");
  parts.push(serializeComponents(overview.components.exploring));

  parts.push("### Framework");
  parts.push("");
  parts.push(serializeComponents(overview.components.framework));

  parts.push("### Finalized");
  parts.push("");
  parts.push(serializeComponents(overview.components.finalized));

  parts.push("### Archived");
  parts.push("");
  parts.push(serializeComponents(overview.components.archived));

  // Change log
  parts.push("## Change Log");
  parts.push("");
  parts.push(serializeChangeLog(overview.changeLog));

  return parts.join("\n");
}

/**
 * Serialize components to markdown
 */
export function serializeComponents(components: Component[]): string {
  if (components.length === 0) {
    return "_No components_";
  }

  const parts: string[] = [];

  for (const component of components) {
    parts.push(`#### ${component.name}`);
    parts.push("");
    parts.push(component.description);
    parts.push("");

    if (component.subComponents && component.subComponents.length > 0) {
      parts.push("Sub-components:");
      for (const sub of component.subComponents) {
        parts.push(`- ${sub.name}${sub.description ? ": " + sub.description : ""}`);
      }
      parts.push("");
    }

    if (component.priority) {
      parts.push(`Priority: ${component.priority}`);
    }

    if (component.notes) {
      parts.push(`Notes: ${component.notes}`);
    }

    parts.push("");
  }

  return parts.join("\n");
}

/**
 * Serialize change log to markdown
 */
export function serializeChangeLog(entries: ComponentChangeLogEntry[]): string {
  if (entries.length === 0) {
    return "_No changes logged_";
  }

  const parts: string[] = [];

  // Sort by timestamp (most recent first)
  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  for (const entry of sorted) {
    const timestamp = entry.timestamp.split("T")[0]; // Just the date
    parts.push(`- [${timestamp}] ${entry.componentName}: ${entry.action} ${entry.description}`);
  }

  return parts.join("\n");
}
