/**
 * Component Manager
 *
 * Core logic for managing component lifecycle (CRUD operations, change log, parsing)
 * Handles all component operations for the Component-Driven Framework
 */
import { ParsedMarkdown } from "./markdown-parser.js";
import { Component, ComponentStage, ComponentChangeLogEntry, ProjectOverviewDocument } from "./component-types.js";
/**
 * Load project-overview-working.md
 */
export declare function loadProjectOverview(projectPath: string): ProjectOverviewDocument;
/**
 * Save project overview to file
 */
export declare function saveProjectOverview(projectPath: string, overview: ProjectOverviewDocument): void;
/**
 * Create a new component
 */
export declare function createComponent(projectPath: string, component: Omit<Component, "createdAt" | "updatedAt">): Component;
/**
 * Get a component by name
 */
export declare function getComponent(projectPath: string, componentName: string): Component | null;
/**
 * Update a component
 */
export declare function updateComponent(projectPath: string, componentName: string, updates: Partial<Omit<Component, "name" | "stage" | "createdAt" | "updatedAt">>): Component;
/**
 * Move component between stages
 */
export declare function moveComponent(projectPath: string, componentName: string, toStage: ComponentStage): {
    component: Component;
    fromStage: ComponentStage;
};
/**
 * Delete a component
 */
export declare function deleteComponent(projectPath: string, componentName: string): Component;
/**
 * Log a component change
 */
export declare function logComponentChange(projectPath: string, entry: Omit<ComponentChangeLogEntry, "timestamp">): ComponentChangeLogEntry;
/**
 * Get component history
 */
export declare function getComponentHistory(projectPath: string, componentName?: string, limit?: number): ComponentChangeLogEntry[];
/**
 * Parse project overview from markdown
 */
export declare function parseProjectOverviewFromMarkdown(parsed: ParsedMarkdown): ProjectOverviewDocument;
/**
 * Parse components by finding level-4 sections between two stage sections
 */
export declare function parseComponentsBetweenSections(sections: any[], startSection: any, endSection: any | undefined, stage: ComponentStage): Component[];
/**
 * Parse a single component from a level-4 section
 */
export declare function parseComponentFromSection(section: any, stage: ComponentStage): Component | null;
/**
 * Parse components from section content
 */
export declare function parseComponentsFromSection(content: string, stage: ComponentStage): Component[];
/**
 * Parse change log from section content
 */
export declare function parseChangeLogFromSection(content: string): ComponentChangeLogEntry[];
/**
 * Convert project overview to markdown
 */
export declare function convertProjectOverviewToMarkdown(overview: ProjectOverviewDocument): string;
/**
 * Serialize components to markdown
 */
export declare function serializeComponents(components: Component[]): string;
/**
 * Serialize change log to markdown
 */
export declare function serializeChangeLog(entries: ComponentChangeLogEntry[]): string;
//# sourceMappingURL=component-manager.d.ts.map