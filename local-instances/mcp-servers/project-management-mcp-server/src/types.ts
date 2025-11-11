/**
 * Core type definitions for the Project Management MCP Server
 */

// Goal workflow types will be defined by individual tools
// This file exists for future shared types across project planning and goal workflow tools

export interface ToolResponse {
  success: boolean;
  data?: any;
  error?: string;
}
