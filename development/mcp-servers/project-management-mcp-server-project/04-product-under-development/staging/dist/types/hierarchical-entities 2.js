/**
 * Hierarchical Planning Entities for Project Management MCP Server v1.0.0
 *
 * Defines the 7-level hierarchy:
 * 1. Initial Inputs (conversation data)
 * 2. PROJECT OVERVIEW (vision, components, constraints)
 * 3. Components (domain areas)
 * 4. Sub-Areas (focus areas within components)
 * 5. Major Goals (strategic objectives - Project Management MCP)
 * 6. Sub-Goals (tactical plans - Spec-Driven MCP)
 * 7. Tasks (execution - Task Executor MCP)
 */
// ============================================================================
// UTILITY TYPES
// ============================================================================
/**
 * Type guard to check if an entity has progress tracking
 */
export function hasProgress(entity) {
    return entity && typeof entity === 'object' && 'progress' in entity;
}
//# sourceMappingURL=hierarchical-entities%202.js.map