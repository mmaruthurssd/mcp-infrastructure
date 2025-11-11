/**
 * Diagram Generator Utility
 *
 * Generate workflow diagrams from goal data in multiple layout styles.
 */
export type DiagramType = 'roadmap' | 'kanban' | 'timeline';
export interface DiagramOptions {
    includePotential?: boolean;
    includeArchived?: boolean;
    tier?: 'Now' | 'Next' | 'Later' | 'Someday';
    priority?: 'High' | 'Medium' | 'Low';
}
export interface GoalForDiagram {
    id?: string;
    name: string;
    tier: string;
    priority?: string;
    status?: string;
    impactScore: string;
    effortScore: string;
    owner?: string;
    progress?: number;
    dependencies?: string[];
}
/**
 * Generate a goals diagram
 */
export declare function generateGoalsDiagram(projectPath: string, diagramType: DiagramType, options?: DiagramOptions): string;
/**
 * Save diagram to file
 */
export declare function saveDiagram(xml: string, outputPath: string): void;
//# sourceMappingURL=diagram-generator%202.d.ts.map