/**
 * Propagation Manager
 *
 * Handles automatic propagation of component changes to related documents
 * (README.md, EVENT_LOG.md, ROADMAP.md)
 */
import { Component, ComponentStage, ComponentAction } from "./component-types.js";
/**
 * Propagate a component change to related documents
 */
export declare function propagateComponentChange(projectPath: string, componentName: string, action: ComponentAction, fromStage?: ComponentStage, toStage?: ComponentStage): {
    filesUpdated: string[];
};
/**
 * Propagate batch changes
 */
export declare function propagateBatchChanges(projectPath: string, changes: Array<{
    componentName: string;
    action: ComponentAction;
    fromStage?: ComponentStage;
    toStage?: ComponentStage;
}>): {
    filesUpdated: string[];
};
/**
 * Update README with finalized components
 */
export declare function updateReadme(projectPath: string): void;
/**
 * Generate project components content for README
 */
export declare function generateProjectComponentsContent(components: Component[]): string;
/**
 * Determine if action should be logged to EVENT_LOG
 */
export declare function shouldLogToEventLog(action: ComponentAction, toStage?: ComponentStage): boolean;
/**
 * Update EVENT_LOG with component change
 */
export declare function updateEventLog(projectPath: string, componentName: string, action: ComponentAction, fromStage?: ComponentStage, toStage?: ComponentStage): void;
/**
 * Generate event log entry
 */
export declare function generateEventLogEntry(componentName: string, action: ComponentAction, fromStage?: ComponentStage, toStage?: ComponentStage): string;
/**
 * Update ROADMAP when component is converted to goal
 */
export declare function updateRoadmap(projectPath: string, componentName: string, goalPath: string): void;
/**
 * Validate README is in sync with finalized components
 */
export declare function validateReadmeSync(projectPath: string): {
    inSync: boolean;
    missingComponents: string[];
    extraComponents: string[];
};
//# sourceMappingURL=propagation-manager.d.ts.map