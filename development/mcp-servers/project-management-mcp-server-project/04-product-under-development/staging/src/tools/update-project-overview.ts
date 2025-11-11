/**
 * Update Project Overview with Version Cascade
 *
 * MCP Tool: Updates PROJECT OVERVIEW.md and cascades changes to downstream documents
 *
 * Created: 2025-10-27
 * Goal: 004 - Build PROJECT OVERVIEW Generation Tool
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import Handlebars from 'handlebars';
import { ProjectOverview } from '../types/hierarchical-entities';

// ============================================================================
// TOOL INPUT/OUTPUT
// ============================================================================

export interface UpdateProjectOverviewInput {
  projectPath: string;
  updates: Partial<ProjectOverviewUpdates>;
  versionChangeType?: 'major' | 'minor' | 'patch'; // Default: 'minor'
  cascadeToComponents?: boolean; // Default: true
  dryRun?: boolean; // Preview changes without writing
}

export interface ProjectOverviewUpdates {
  // Core fields
  name?: string;
  description?: string;
  status?: 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';

  // Vision updates
  vision?: {
    missionStatement?: string;
    successCriteria?: string[];
    scope?: {
      inScope?: string[];
      outOfScope?: string[];
    };
    risks?: Array<{
      description: string;
      severity: 'low' | 'medium' | 'high';
      mitigation?: string;
    }>;
  };

  // Constraint updates
  constraints?: {
    timeline?: {
      estimatedDuration?: string;
      milestones?: Array<{
        name: string;
        targetDate: string;
        status: string;
      }>;
    };
    resources?: {
      team?: Array<{
        name: string;
        role: string;
        availability?: string;
      }>;
      tools?: string[];
      technologies?: string[];
    };
  };

  // Stakeholder updates
  stakeholders?: Array<{
    name: string;
    role: string;
    interest: string;
    influence: string;
    communicationNeeds: string;
  }>;

  // Resource updates
  resources?: {
    existingAssets?: string[];
    neededAssets?: string[];
    externalDependencies?: string[];
  };

  // Component updates
  components?: string[];

  // Notes
  notes?: string;
}

export interface UpdateProjectOverviewOutput {
  success: boolean;
  newVersion: number;
  previousVersion: number;
  changes: VersionChange[];
  cascadedUpdates: CascadedUpdate[];
  warnings: string[];
  error?: string;
}

export interface VersionChange {
  field: string;
  previousValue: any;
  newValue: any;
  changeType: 'added' | 'removed' | 'modified';
}

export interface CascadedUpdate {
  documentType: 'component' | 'major-goal' | 'sub-goal';
  documentPath: string;
  changeDescription: string;
  executed: boolean;
}

// ============================================================================
// TOOL IMPLEMENTATION
// ============================================================================

/**
 * Update PROJECT OVERVIEW with version control and cascade
 */
export async function updateProjectOverview(
  input: UpdateProjectOverviewInput
): Promise<UpdateProjectOverviewOutput> {
  const warnings: string[] = [];
  const cascadedUpdates: CascadedUpdate[] = [];

  try {
    // Load existing PROJECT OVERVIEW
    const overviewPath = join(input.projectPath, 'PROJECT-OVERVIEW.md');
    let existingContent: string;

    try {
      existingContent = await readFile(overviewPath, 'utf-8');
    } catch (error) {
      return {
        success: false,
        newVersion: 0,
        previousVersion: 0,
        changes: [],
        cascadedUpdates: [],
        warnings: [],
        error: 'PROJECT OVERVIEW not found',
      };
    }

    // Parse existing PROJECT OVERVIEW to extract current data
    const currentData = parseProjectOverview(existingContent);
    const previousVersion = currentData.versionInfo.version;

    // Determine new version
    const versionChangeType = input.versionChangeType || determineVersionChangeType(input.updates);
    const newVersion = calculateNewVersion(previousVersion, versionChangeType);

    // Merge updates with existing data
    const updatedData = mergeUpdates(currentData, input.updates);

    // Track changes
    const changes = detectChanges(currentData, updatedData);

    // Update version info
    updatedData.versionInfo.version = newVersion;
    updatedData.versionInfo.updatedAt = new Date().toISOString();

    // Add to version history
    updatedData.versionHistory.push({
      version: newVersion,
      date: new Date().toISOString().split('T')[0],
      changes: changes.map(c => `${c.changeType} ${c.field}`).join(', '),
      author: 'Project Management MCP',
    });

    // Dry run - return preview
    if (input.dryRun) {
      return {
        success: true,
        newVersion,
        previousVersion,
        changes,
        cascadedUpdates: [], // Would be computed but not executed
        warnings: ['Dry run - no changes written'],
      };
    }

    // Render updated template
    const templatePath = join(__dirname, '../../templates/project-overview.hbs');
    const templateContent = await readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);
    const renderedContent = template(updatedData);

    // Write updated PROJECT OVERVIEW
    await writeFile(overviewPath, renderedContent, 'utf-8');

    // Cascade changes to components if requested
    if (input.cascadeToComponents !== false) {
      const cascadeResults = await cascadeChanges(
        input.projectPath,
        changes,
        updatedData
      );
      cascadedUpdates.push(...cascadeResults);
    }

    return {
      success: true,
      newVersion,
      previousVersion,
      changes,
      cascadedUpdates,
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      newVersion: 0,
      previousVersion: 0,
      changes: [],
      cascadedUpdates,
      warnings,
      error: (error as Error).message,
    };
  }
}

// ============================================================================
// VERSION MANAGEMENT
// ============================================================================

function determineVersionChangeType(
  updates: Partial<ProjectOverviewUpdates>
): 'major' | 'minor' | 'patch' {
  // Major: Fundamental changes (mission, scope)
  if (
    updates.vision?.missionStatement ||
    updates.vision?.scope?.inScope ||
    updates.vision?.scope?.outOfScope
  ) {
    return 'major';
  }

  // Minor: Significant but not fundamental (components, timeline)
  if (
    updates.components ||
    updates.constraints?.timeline ||
    updates.vision?.successCriteria
  ) {
    return 'minor';
  }

  // Patch: Small changes (notes, minor updates)
  return 'patch';
}

function calculateNewVersion(
  currentVersion: number,
  changeType: 'major' | 'minor' | 'patch'
): number {
  switch (changeType) {
    case 'major':
      return Math.ceil(currentVersion + 1);
    case 'minor':
      return currentVersion + 0.1;
    case 'patch':
      return currentVersion + 0.01;
    default:
      return currentVersion + 0.01;
  }
}

// ============================================================================
// DATA MERGING
// ============================================================================

function mergeUpdates(
  current: any,
  updates: Partial<ProjectOverviewUpdates>
): any {
  const merged = JSON.parse(JSON.stringify(current)); // Deep clone

  // Merge top-level fields
  if (updates.name) merged.projectName = updates.name;
  if (updates.description) merged.description = updates.description;
  if (updates.status) merged.status = updates.status;
  if (updates.notes) merged.notes = updates.notes;

  // Merge vision
  if (updates.vision) {
    if (!merged.vision) merged.vision = {};
    if (updates.vision.missionStatement) {
      merged.vision.missionStatement = updates.vision.missionStatement;
    }
    if (updates.vision.successCriteria) {
      merged.vision.successCriteria = updates.vision.successCriteria;
    }
    if (updates.vision.scope) {
      if (!merged.vision.scope) merged.vision.scope = {};
      if (updates.vision.scope.inScope) {
        merged.vision.scope.inScope = updates.vision.scope.inScope;
      }
      if (updates.vision.scope.outOfScope) {
        merged.vision.scope.outOfScope = updates.vision.scope.outOfScope;
      }
    }
    if (updates.vision.risks) {
      merged.vision.risks = updates.vision.risks;
    }
  }

  // Merge constraints
  if (updates.constraints) {
    if (!merged.constraints) merged.constraints = {};
    if (updates.constraints.timeline) {
      merged.constraints.timeline = {
        ...merged.constraints.timeline,
        ...updates.constraints.timeline,
      };
    }
    if (updates.constraints.resources) {
      if (!merged.constraints.resources) merged.constraints.resources = {};
      if (updates.constraints.resources.team) {
        merged.constraints.resources.team = updates.constraints.resources.team;
      }
      if (updates.constraints.resources.tools) {
        merged.constraints.resources.tools = updates.constraints.resources.tools;
      }
      if (updates.constraints.resources.technologies) {
        merged.constraints.resources.technologies = updates.constraints.resources.technologies;
      }
    }
  }

  // Merge stakeholders
  if (updates.stakeholders) {
    merged.stakeholders = updates.stakeholders;
  }

  // Merge resources
  if (updates.resources) {
    if (!merged.resources) merged.resources = {};
    if (updates.resources.existingAssets) {
      merged.resources.existingAssets = updates.resources.existingAssets;
    }
    if (updates.resources.neededAssets) {
      merged.resources.neededAssets = updates.resources.neededAssets;
    }
    if (updates.resources.externalDependencies) {
      merged.resources.externalDependencies = updates.resources.externalDependencies;
    }
  }

  // Merge components
  if (updates.components) {
    merged.components = updates.components.map((name: string) => ({
      name,
      purpose: `Component: ${name}`,
      suggested: false,
    }));
  }

  return merged;
}

// ============================================================================
// CHANGE DETECTION
// ============================================================================

function detectChanges(current: any, updated: any): VersionChange[] {
  const changes: VersionChange[] = [];

  // Compare key fields
  const fields = [
    'projectName',
    'description',
    'status',
    'vision.missionStatement',
    'vision.successCriteria',
    'vision.scope.inScope',
    'vision.scope.outOfScope',
    'constraints.timeline',
    'constraints.resources.technologies',
    'components',
  ];

  for (const field of fields) {
    const currentValue = getNestedValue(current, field);
    const updatedValue = getNestedValue(updated, field);

    if (JSON.stringify(currentValue) !== JSON.stringify(updatedValue)) {
      let changeType: 'added' | 'removed' | 'modified' = 'modified';

      if (!currentValue && updatedValue) {
        changeType = 'added';
      } else if (currentValue && !updatedValue) {
        changeType = 'removed';
      }

      changes.push({
        field,
        previousValue: currentValue,
        newValue: updatedValue,
        changeType,
      });
    }
  }

  return changes;
}

function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key];
    } else {
      return undefined;
    }
  }

  return value;
}

// ============================================================================
// CASCADE UPDATES
// ============================================================================

async function cascadeChanges(
  projectPath: string,
  changes: VersionChange[],
  updatedData: any
): Promise<CascadedUpdate[]> {
  const cascaded: CascadedUpdate[] = [];

  // Check if components changed
  const componentChanges = changes.filter(c => c.field === 'components');
  if (componentChanges.length > 0) {
    cascaded.push({
      documentType: 'component',
      documentPath: join(projectPath, 'components'),
      changeDescription: 'Component list updated - review component OVERVIEW files',
      executed: false, // Would trigger actual updates in full implementation
    });
  }

  // Check if timeline changed
  const timelineChanges = changes.filter(c => c.field.includes('timeline'));
  if (timelineChanges.length > 0) {
    cascaded.push({
      documentType: 'major-goal',
      documentPath: join(projectPath, 'components/*/major-goals'),
      changeDescription: 'Timeline updated - recalculate goal target dates',
      executed: false,
    });
  }

  // Check if scope changed
  const scopeChanges = changes.filter(c => c.field.includes('scope'));
  if (scopeChanges.length > 0) {
    cascaded.push({
      documentType: 'major-goal',
      documentPath: join(projectPath, 'components/*/major-goals'),
      changeDescription: 'Scope updated - review goals against new scope',
      executed: false,
    });
  }

  return cascaded;
}

// ============================================================================
// PARSING UTILITIES
// ============================================================================

function parseProjectOverview(content: string): any {
  // Simplified parser - production would use gray-matter + markdown parsing
  const lines = content.split('\n');

  // Extract version from frontmatter
  const versionMatch = content.match(/version:\s*(\d+(?:\.\d+)?)/);
  const version = versionMatch ? parseFloat(versionMatch[1]) : 1;

  // Extract project name
  const nameMatch = content.match(/^#\s+(.+)$/m);
  const projectName = nameMatch ? nameMatch[1] : 'Unnamed Project';

  // Return minimal parsed structure
  return {
    projectId: projectName.toLowerCase().replace(/\s+/g, '-'),
    projectName,
    description: 'Existing project',
    versionInfo: {
      version,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    versionHistory: [],
    vision: {},
    constraints: {},
    stakeholders: [],
    resources: {},
    components: [],
    status: 'active',
    notes: '',
  };
}
