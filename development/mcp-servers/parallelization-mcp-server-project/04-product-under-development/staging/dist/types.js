/**
 * Core type definitions for Parallelization MCP Server
 * Based on TOOL-ARCHITECTURE.md specifications
 */
// ============================================================================
// Conflict Types
// ============================================================================
export var ConflictType;
(function (ConflictType) {
    ConflictType["FILE_LEVEL"] = "file-level";
    ConflictType["SEMANTIC"] = "semantic";
    ConflictType["DEPENDENCY"] = "dependency";
    ConflictType["RESOURCE"] = "resource";
    ConflictType["ORDERING"] = "ordering";
})(ConflictType || (ConflictType = {}));
//# sourceMappingURL=types.js.map