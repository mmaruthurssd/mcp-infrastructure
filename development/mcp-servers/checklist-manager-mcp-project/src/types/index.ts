/**
 * Core type definitions for Checklist Manager MCP
 */

// Checklist Types
export interface Checklist {
  id: string;
  path: string;
  type: ChecklistType;
  status: ChecklistStatus;
  metadata: ChecklistMetadata;
  items: ChecklistItems;
  created: string;
  lastUpdated: string;
  autoUpdateEnabled: boolean;
}

export type ChecklistType =
  | 'deployment'
  | 'setup'
  | 'cleanup'
  | 'review'
  | 'onboarding'
  | 'custom';

export type ChecklistStatus = 'not-started' | 'in-progress' | 'completed';

export type EnforcementLevel = 'mandatory' | 'optional' | 'informational';

export interface ChecklistMetadata {
  name: string;
  owner: string;
  enforcement: EnforcementLevel;
}

export interface ChecklistItems {
  total: number;
  completed: number;
  percentage: number;
}

// Registry Types
export interface Registry {
  version: string;
  lastUpdated: string;
  checklists: Checklist[];
}

// Tool Parameter Types
export interface RegisterChecklistParams {
  checklist_path: string;
  checklist_type: ChecklistType;
  owner?: string;
  enforcement?: EnforcementLevel;
  auto_update?: boolean;
}

export interface GetChecklistStatusParams {
  checklist_id?: string;
  checklist_path?: string;
  checklist_type?: ChecklistType;
  status_filter?: ChecklistStatus;
}

export interface ValidateChecklistComplianceParams {
  operation_type: ChecklistType;
  skip_enforcement?: boolean;
}

export interface CreateFromTemplateParams {
  template_path: string;
  output_path: string;
  variables?: Record<string, string>;
  owner?: string;
  enforcement?: EnforcementLevel;
}

export interface UpdateChecklistItemParams {
  checklist_id?: string;
  checklist_path?: string;
  item_text: string;
  completed: boolean;
  triggered_by?: string;
  notes?: string;
}

// Checklist File Format
export interface ChecklistFrontmatter {
  type: 'checklist';
  'checklist-type': ChecklistType;
  status: ChecklistStatus;
  'items-total': number;
  'items-completed': number;
  enforcement: EnforcementLevel;
  'auto-update': boolean;
  created: string;
  'last-updated': string;
  owner: string;
}

export interface ChecklistItem {
  text: string;
  completed: boolean;
  line: number; // Line number in markdown file
}

// Tool Response Types
export interface ToolResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface RegisterChecklistResponse {
  success: boolean;
  checklist_id: string;
  message: string;
  registry_entry: Checklist;
}

export interface GetChecklistStatusResponse {
  success: boolean;
  checklists: Array<{
    id: string;
    path: string;
    type: string;
    status: string;
    metadata: ChecklistMetadata;
    items: {
      total: number;
      completed: number;
      percentage: number;
      pending: string[];
    };
    created: string;
    lastUpdated: string;
  }>;
}

export interface UpdateChecklistItemResponse {
  success: boolean;
  message: string;
  updated: boolean;
  matched_text?: string;
  fuzzy_match_attempted?: boolean;
  new_completion?: {
    total: number;
    completed: number;
    percentage: number;
  };
  checklist_status?: ChecklistStatus;
}

export interface ValidateChecklistComplianceResponse {
  success: boolean;
  compliant: boolean;
  message: string;
  violations: Array<{
    checklist_id: string;
    checklist_path: string;
    issue: string;
    pending_items: string[];
  }>;
  blocking: boolean;
  total_mandatory?: number;
  completed_mandatory?: number;
}

export interface CreateFromTemplateResponse {
  success: boolean;
  message: string;
  output_path: string;
  variables_applied: number;
}
