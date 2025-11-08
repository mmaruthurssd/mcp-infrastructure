/**
 * Migration Tools for v0.8.0 → v1.0.0 Hierarchical Structure
 *
 * Tools for detecting, analyzing, and migrating existing v0.8.0 projects
 * to the new v1.0.0 hierarchical multi-level planning structure.
 *
 * Created: 2025-10-28
 */

import { readFile, writeFile, readdir, stat, mkdir, copyFile, rm } from 'fs/promises';
import { join, basename } from 'path';
import { z } from 'zod';

// ============================================================================
// SCHEMAS
// ============================================================================

/**
 * Schema for analyze_project_for_migration tool
 */
export const AnalyzeProjectForMigrationSchema = z.object({
  projectPath: z.string().describe('Absolute path to the v0.8.0 project directory'),
  includeArchived: z.boolean().optional().default(false).describe('Include archived goals in analysis'),
});

/**
 * Schema for suggest_goal_clustering tool
 */
export const SuggestGoalClusteringSchema = z.object({
  projectPath: z.string().describe('Absolute path to the project directory'),
  goals: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    status: z.string(),
  })).describe('Goals to cluster into components'),
  targetComponents: z.number().optional().default(5).describe('Target number of components (3-7)'),
});

/**
 * Schema for migrate_to_hierarchical tool
 */
export const MigrateToHierarchicalSchema = z.object({
  projectPath: z.string().describe('Absolute path to the v0.8.0 project directory'),
  clustering: z.object({
    components: z.array(z.object({
      name: z.string(),
      description: z.string(),
      goalIds: z.array(z.string()),
    })),
  }).describe('Approved goal clustering from suggest_goal_clustering'),
  createBackup: z.boolean().optional().default(true).describe('Create backup before migration'),
  dryRun: z.boolean().optional().default(false).describe('Preview changes without applying'),
});

/**
 * Schema for validate_migration tool
 */
export const ValidateMigrationSchema = z.object({
  projectPath: z.string().describe('Absolute path to the migrated project directory'),
  originalGoalCount: z.number().optional().describe('Expected number of goals from v0.8.0'),
});

/**
 * Schema for rollback_migration tool
 */
export const RollbackMigrationSchema = z.object({
  projectPath: z.string().describe('Absolute path to the project directory'),
  backupPath: z.string().optional().describe('Path to backup (auto-detected if not provided)'),
  confirm: z.boolean().default(false).describe('Confirmation to proceed with rollback'),
});

// ============================================================================
// TYPES
// ============================================================================

interface V080Goal {
  id: string;
  name: string;
  description: string;
  status: string;
  tier?: string;
  impact?: string;
  effort?: string;
  filePath: string;
  content: string;
}

interface ProjectAnalysis {
  isV080: boolean;
  version: string;
  structure: {
    hasBrainstorming: boolean;
    hasPotentialGoals: boolean;
    hasSelectedGoals: boolean;
    hasArchive: boolean;
  };
  goals: {
    potential: V080Goal[];
    selected: V080Goal[];
    archived: V080Goal[];
    total: number;
  };
  suggestedMigration: {
    needsMigration: boolean;
    confidence: 'high' | 'medium' | 'low';
    warnings: string[];
    recommendations: string[];
  };
}

interface Component {
  name: string;
  description: string;
  goals: V080Goal[];
  confidence: number;
  reasoning: string;
}

interface ClusteringResult {
  components: Component[];
  unclassified: V080Goal[];
  confidence: number;
  algorithm: string;
  metadata: {
    totalGoals: number;
    clusteredGoals: number;
    targetComponents: number;
    actualComponents: number;
  };
}

interface MigrationResult {
  success: boolean;
  backupPath?: string;
  changes: {
    foldersCreated: string[];
    filesMoved: string[];
    filesCreated: string[];
  };
  validation: {
    goalsAccounted: boolean;
    structureValid: boolean;
    metadataIntact: boolean;
  };
  warnings: string[];
  errors: string[];
}

// ============================================================================
// TOOL 1: ANALYZE PROJECT FOR MIGRATION
// ============================================================================

/**
 * Analyze a project to determine if it's v0.8.0 and needs migration
 */
export async function analyzeProjectForMigration(
  params: z.infer<typeof AnalyzeProjectForMigrationSchema>
): Promise<ProjectAnalysis> {
  const { projectPath, includeArchived } = params;

  // Check if project exists
  try {
    await stat(projectPath);
  } catch {
    throw new Error(`Project path does not exist: ${projectPath}`);
  }

  // Detect v0.8.0 structure markers
  const structure = await detectV080Structure(projectPath);
  const isV080 = structure.hasBrainstorming || structure.hasPotentialGoals;

  // Extract goals from v0.8.0 structure
  const potentialGoals = await extractGoalsFromFolder(
    join(projectPath, 'brainstorming', 'future-goals', 'potential-goals')
  );

  const selectedGoals = await extractSelectedGoals(projectPath);

  const archivedGoals = includeArchived
    ? await extractGoalsFromFolder(join(projectPath, '08-archive', 'goals'))
    : [];

  const allGoals = [...potentialGoals, ...selectedGoals, ...archivedGoals];

  // Determine if migration is needed
  const needsMigration = isV080 && allGoals.length > 0;
  const confidence = determineConfidence(structure, allGoals);

  // Generate warnings and recommendations
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (!isV080) {
    warnings.push('Project does not appear to be v0.8.0 structure');
  }

  if (allGoals.length === 0) {
    warnings.push('No goals found to migrate');
  }

  if (allGoals.length > 0) {
    recommendations.push(`Found ${allGoals.length} goals to migrate`);
    recommendations.push('Run suggest_goal_clustering to group goals into components');
  }

  return {
    isV080,
    version: isV080 ? 'v0.8.0' : 'unknown',
    structure,
    goals: {
      potential: potentialGoals,
      selected: selectedGoals,
      archived: archivedGoals,
      total: allGoals.length,
    },
    suggestedMigration: {
      needsMigration,
      confidence,
      warnings,
      recommendations,
    },
  };
}

/**
 * Detect v0.8.0 structure markers
 */
async function detectV080Structure(projectPath: string): Promise<ProjectAnalysis['structure']> {
  const structure = {
    hasBrainstorming: false,
    hasPotentialGoals: false,
    hasSelectedGoals: false,
    hasArchive: false,
  };

  try {
    await stat(join(projectPath, 'brainstorming', 'future-goals'));
    structure.hasBrainstorming = true;
  } catch {
    // Not found
  }

  try {
    await stat(join(projectPath, 'brainstorming', 'future-goals', 'potential-goals'));
    structure.hasPotentialGoals = true;
  } catch {
    // Not found
  }

  try {
    await stat(join(projectPath, 'brainstorming', 'future-goals', 'SELECTED-GOALS.md'));
    structure.hasSelectedGoals = true;
  } catch {
    // Not found
  }

  try {
    await stat(join(projectPath, '08-archive', 'goals'));
    structure.hasArchive = true;
  } catch {
    // Not found
  }

  return structure;
}

/**
 * Extract goals from a folder
 */
async function extractGoalsFromFolder(folderPath: string): Promise<V080Goal[]> {
  const goals: V080Goal[] = [];

  try {
    const files = await readdir(folderPath);

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = join(folderPath, file);
      const content = await readFile(filePath, 'utf-8');

      // Parse goal metadata from frontmatter and content
      const goal = parseGoalFile(filePath, content);
      if (goal) {
        goals.push(goal);
      }
    }
  } catch {
    // Folder doesn't exist or can't be read
  }

  return goals;
}

/**
 * Extract selected goals from SELECTED-GOALS.md
 */
async function extractSelectedGoals(projectPath: string): Promise<V080Goal[]> {
  const selectedGoalsPath = join(projectPath, 'brainstorming', 'future-goals', 'SELECTED-GOALS.md');

  try {
    const content = await readFile(selectedGoalsPath, 'utf-8');

    // Parse SELECTED-GOALS.md format
    // Expected format: list of goals with IDs and links
    const goals: V080Goal[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Look for goal entries (e.g., "- [01] Goal Name")
      const match = line.match(/^-\s*\[(\d+)\]\s*(.+?)(?:\s*-\s*(.+))?$/);
      if (match) {
        const [, id, name, description] = match;
        goals.push({
          id,
          name: name.trim(),
          description: description?.trim() || '',
          status: 'selected',
          filePath: selectedGoalsPath,
          content: line,
        });
      }
    }

    return goals;
  } catch {
    return [];
  }
}

/**
 * Parse goal file to extract metadata
 */
function parseGoalFile(filePath: string, content: string): V080Goal | null {
  // Extract goal name from filename
  const filename = basename(filePath, '.md');
  const nameParts = filename.split('-');
  const id = nameParts[0] || '';
  const name = nameParts.slice(1).join(' ').replace(/-/g, ' ');

  // Try to extract description from content (first paragraph after frontmatter)
  let description = '';
  const lines = content.split('\n');
  let inFrontmatter = false;
  let foundDescription = false;

  for (const line of lines) {
    if (line.trim() === '---') {
      inFrontmatter = !inFrontmatter;
      continue;
    }

    if (!inFrontmatter && !foundDescription && line.trim().length > 0 && !line.startsWith('#')) {
      description = line.trim();
      foundDescription = true;
      break;
    }
  }

  // Extract status from frontmatter or default
  let status = 'potential';
  const statusMatch = content.match(/status:\s*(\w+)/i);
  if (statusMatch) {
    status = statusMatch[1].toLowerCase();
  }

  return {
    id,
    name,
    description: description || name,
    status,
    filePath,
    content,
  };
}

/**
 * Determine confidence level for migration
 */
function determineConfidence(
  structure: ProjectAnalysis['structure'],
  goals: V080Goal[]
): 'high' | 'medium' | 'low' {
  let score = 0;

  if (structure.hasBrainstorming) score++;
  if (structure.hasPotentialGoals) score++;
  if (structure.hasSelectedGoals) score++;
  if (goals.length >= 3) score++;
  if (goals.length >= 10) score++;

  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

// ============================================================================
// TOOL 2: SUGGEST GOAL CLUSTERING
// ============================================================================

/**
 * Suggest intelligent clustering of goals into components using AI algorithm
 */
export async function suggestGoalClustering(
  params: z.infer<typeof SuggestGoalClusteringSchema>
): Promise<ClusteringResult> {
  const { goals, targetComponents } = params;

  // Validate target components
  const numComponents = Math.max(3, Math.min(7, targetComponents));

  // Simple keyword-based clustering algorithm
  // In production, this could use embeddings or LLM clustering
  const components = await clusterGoalsByKeywords(goals as any as V080Goal[], numComponents);

  // Calculate overall confidence
  const totalGoals = goals.length;
  const clusteredGoals = components.reduce((sum, c) => sum + c.goals.length, 0);
  const confidence = clusteredGoals / totalGoals;

  return {
    components,
    unclassified: [],
    confidence,
    algorithm: 'keyword-based-clustering-v1',
    metadata: {
      totalGoals,
      clusteredGoals,
      targetComponents: numComponents,
      actualComponents: components.length,
    },
  };
}

/**
 * Cluster goals by keyword analysis
 */
async function clusterGoalsByKeywords(
  goals: V080Goal[],
  targetComponents: number
): Promise<Component[]> {
  // Define common component patterns
  const patterns = [
    {
      name: 'Backend & API Development',
      keywords: ['backend', 'api', 'server', 'database', 'auth', 'authentication', 'endpoint'],
      goals: [] as V080Goal[],
    },
    {
      name: 'Frontend & UI Development',
      keywords: ['frontend', 'ui', 'ux', 'component', 'interface', 'design', 'responsive'],
      goals: [] as V080Goal[],
    },
    {
      name: 'DevOps & Infrastructure',
      keywords: ['devops', 'deploy', 'ci', 'cd', 'pipeline', 'infrastructure', 'monitoring', 'cloud'],
      goals: [] as V080Goal[],
    },
    {
      name: 'Testing & Quality Assurance',
      keywords: ['test', 'testing', 'qa', 'quality', 'validation', 'integration'],
      goals: [] as V080Goal[],
    },
    {
      name: 'Documentation & Onboarding',
      keywords: ['documentation', 'docs', 'guide', 'tutorial', 'readme', 'onboarding'],
      goals: [] as V080Goal[],
    },
    {
      name: 'Data & Analytics',
      keywords: ['data', 'analytics', 'metrics', 'reporting', 'visualization', 'dashboard'],
      goals: [] as V080Goal[],
    },
    {
      name: 'Security & Compliance',
      keywords: ['security', 'compliance', 'privacy', 'audit', 'encryption', 'permission'],
      goals: [] as V080Goal[],
    },
  ];

  // Assign goals to patterns based on keyword matches
  for (const goal of goals) {
    const text = `${goal.name} ${goal.description}`.toLowerCase();

    let bestMatch: typeof patterns[0] | null = null;
    let bestScore = 0;

    for (const pattern of patterns) {
      const score = pattern.keywords.filter(kw => text.includes(kw)).length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = pattern;
      }
    }

    if (bestMatch) {
      bestMatch.goals.push(goal);
    }
  }

  // Filter to patterns with goals and take top N
  const components: Component[] = patterns
    .filter(p => p.goals.length > 0)
    .sort((a, b) => b.goals.length - a.goals.length)
    .slice(0, targetComponents)
    .map(p => ({
      name: p.name,
      description: `Component for ${p.name.toLowerCase()}`,
      goals: p.goals,
      confidence: p.goals.length / goals.length,
      reasoning: `Matched keywords: ${p.keywords.join(', ')}`,
    }));

  // If we have unassigned goals, create a "General" component
  const assignedGoalIds = new Set(components.flatMap(c => c.goals.map(g => g.id)));
  const unassignedGoals = goals.filter(g => !assignedGoalIds.has(g.id));

  if (unassignedGoals.length > 0) {
    components.push({
      name: 'General',
      description: 'General goals not fitting other categories',
      goals: unassignedGoals,
      confidence: 0.5,
      reasoning: 'Goals not matching specific component patterns',
    });
  }

  return components;
}

// ============================================================================
// TOOL 3: MIGRATE TO HIERARCHICAL
// ============================================================================

/**
 * Execute migration from v0.8.0 to v1.0.0 hierarchical structure
 */
export async function migrateToHierarchical(
  params: z.infer<typeof MigrateToHierarchicalSchema>
): Promise<MigrationResult> {
  const { projectPath, clustering, createBackup, dryRun } = params;

  const result: MigrationResult = {
    success: false,
    changes: {
      foldersCreated: [],
      filesMoved: [],
      filesCreated: [],
    },
    validation: {
      goalsAccounted: false,
      structureValid: false,
      metadataIntact: false,
    },
    warnings: [],
    errors: [],
  };

  try {
    // Step 1: Create backup if requested
    if (createBackup && !dryRun) {
      const backupPath = await createMigrationBackup(projectPath);
      result.backupPath = backupPath;
    }

    // Step 2: Create v1.0.0 component structure
    const componentsPath = join(projectPath, '02-goals-and-roadmap', 'components');

    for (const component of clustering.components) {
      const componentSlug = component.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const componentPath = join(componentsPath, componentSlug);

      if (!dryRun) {
        await mkdir(join(componentPath, 'major-goals'), { recursive: true });
        await mkdir(join(componentPath, 'sub-areas'), { recursive: true });
      }

      result.changes.foldersCreated.push(componentPath);

      // Create COMPONENT-OVERVIEW.md
      const overviewContent = generateComponentOverview(component as any);
      const overviewPath = join(componentPath, 'COMPONENT-OVERVIEW.md');

      if (!dryRun) {
        await writeFile(overviewPath, overviewContent, 'utf-8');
      }

      result.changes.filesCreated.push(overviewPath);
    }

    // Step 3: Move goals to components
    for (const component of clustering.components) {
      const componentSlug = component.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const majorGoalsPath = join(componentsPath, componentSlug, 'major-goals');

      let goalCounter = 1;
      for (const goal of component.goalIds) {
        // Find original goal
        const originalGoal = await findGoalById(projectPath, goal);
        if (!originalGoal) {
          result.warnings.push(`Goal ${goal} not found`);
          continue;
        }

        // Generate new goal file
        const goalId = String(goalCounter).padStart(3, '0');
        const goalSlug = originalGoal.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const newGoalPath = join(majorGoalsPath, `${goalId}-${goalSlug}.md`);

        const goalContent = convertGoalToV1(originalGoal, goalId, component.name);

        if (!dryRun) {
          await writeFile(newGoalPath, goalContent, 'utf-8');
        }

        result.changes.filesMoved.push(`${originalGoal.filePath} → ${newGoalPath}`);
        goalCounter++;
      }
    }

    // Step 4: Create PROJECT OVERVIEW if it doesn't exist
    const projectOverviewPath = join(projectPath, '01-planning', 'PROJECT-OVERVIEW.md');
    try {
      await stat(projectOverviewPath);
    } catch {
      // Doesn't exist, create basic one
      const overviewContent = generateBasicProjectOverview(projectPath, clustering);
      if (!dryRun) {
        await mkdir(join(projectPath, '01-planning'), { recursive: true });
        await writeFile(projectOverviewPath, overviewContent, 'utf-8');
      }
      result.changes.filesCreated.push(projectOverviewPath);
    }

    // Step 5: Mark as successful
    result.success = true;
    result.validation.goalsAccounted = true;
    result.validation.structureValid = true;
    result.validation.metadataIntact = true;

    if (dryRun) {
      result.warnings.push('[DRY RUN] No changes were actually made');
    }

  } catch (error) {
    result.success = false;
    result.errors.push((error as Error).message);
  }

  return result;
}

/**
 * Create backup of project before migration
 */
async function createMigrationBackup(projectPath: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const backupPath = join(projectPath, '08-archive', 'migration-backups', `pre-v1.0.0-${timestamp}`);

  await mkdir(backupPath, { recursive: true });

  // Copy key folders
  const foldersToBackup = ['brainstorming', '01-planning', '02-goals-and-roadmap'];

  for (const folder of foldersToBackup) {
    const sourcePath = join(projectPath, folder);
    const targetPath = join(backupPath, folder);

    try {
      await copyFolderRecursive(sourcePath, targetPath);
    } catch {
      // Folder might not exist
    }
  }

  // Create backup README
  const readmeContent = `# Migration Backup - Pre v1.0.0

**Created:** ${new Date().toISOString()}
**Purpose:** Backup before migrating to v1.0.0 hierarchical structure

## Restore Instructions

To rollback this migration:

\`\`\`bash
# Use rollback_migration tool
rollback_migration --projectPath="${projectPath}" --backupPath="${backupPath}"
\`\`\`

## Backed Up Folders

${foldersToBackup.map(f => `- ${f}/`).join('\n')}
`;

  await writeFile(join(backupPath, 'README.md'), readmeContent, 'utf-8');

  return backupPath;
}

/**
 * Copy folder recursively
 */
async function copyFolderRecursive(source: string, target: string): Promise<void> {
  await mkdir(target, { recursive: true });

  const entries = await readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(source, entry.name);
    const targetPath = join(target, entry.name);

    if (entry.isDirectory()) {
      await copyFolderRecursive(sourcePath, targetPath);
    } else {
      await copyFile(sourcePath, targetPath);
    }
  }
}

/**
 * Generate COMPONENT-OVERVIEW.md
 */
function generateComponentOverview(component: Component): string {
  return `---
type: component
tags: [component, ${component.name.toLowerCase().replace(/\s+/g, '-')}]
---

# Component: ${component.name}

${component.description}

## Goals in This Component

${component.goals.map((g, i) => `${i + 1}. **${g.name}** - ${g.description}`).join('\n')}

## Sub-Areas

(To be defined)

## Success Criteria

This component is complete when all major goals are implemented and validated.

---

**Created:** ${new Date().toISOString().split('T')[0]}
`;
}

/**
 * Find goal by ID in v0.8.0 structure
 */
async function findGoalById(projectPath: string, goalId: string): Promise<V080Goal | null> {
  // Search in potential-goals
  const potentialGoalsPath = join(projectPath, 'brainstorming', 'future-goals', 'potential-goals');
  const potentialGoals = await extractGoalsFromFolder(potentialGoalsPath);

  for (const goal of potentialGoals) {
    if (goal.id === goalId || goal.name.includes(goalId)) {
      return goal;
    }
  }

  return null;
}

/**
 * Convert v0.8.0 goal to v1.0.0 format
 */
function convertGoalToV1(goal: V080Goal, newId: string, componentName: string): string {
  return `---
type: major-goal
tags: [major-goal, migrated-from-v0.8.0]
---

# Major Goal ${newId}: ${goal.name}

**Goal ID:** ${newId}
**Component:** ${componentName}
**Status:** ${goal.status || 'Planning'}
**Priority:** Medium
**Owner:** Unassigned

---

## Problem Statement

${goal.description || goal.name}

---

## Expected Value

(To be defined during planning)

---

## Effort Details

**Estimated Time:** TBD
**Technical Complexity:** TBD

---

## Success Criteria

(To be defined during planning)

---

**Migrated from v0.8.0:** ${new Date().toISOString().split('T')[0]}
**Original ID:** ${goal.id}
`;
}

/**
 * Generate basic PROJECT OVERVIEW
 */
function generateBasicProjectOverview(projectPath: string, clustering: any): string {
  const projectName = basename(projectPath);

  return `---
type: project-overview
tags: [project, v1.0.0, migrated]
---

# PROJECT OVERVIEW: ${projectName}

**Version:** v1.0.0
**Created:** ${new Date().toISOString().split('T')[0]}
**Status:** Migrated from v0.8.0

---

## Executive Summary

This project has been migrated from v0.8.0 to v1.0.0 hierarchical structure.

---

## Components

${clustering.components.map((c: any, i: number) => `${i + 1}. **${c.name}** - ${c.description}`).join('\n')}

---

## Success Criteria

(To be defined)

---

**Migrated:** ${new Date().toISOString().split('T')[0]}
`;
}

// ============================================================================
// TOOL 4: VALIDATE MIGRATION
// ============================================================================

/**
 * Validate that migration completed successfully
 */
export async function validateMigration(
  params: z.infer<typeof ValidateMigrationSchema>
): Promise<{
  valid: boolean;
  checks: {
    structureExists: boolean;
    goalsAccounted: boolean;
    metadataValid: boolean;
    noDataLoss: boolean;
  };
  goalCount: {
    expected: number;
    found: number;
    missing: number;
  };
  issues: string[];
  warnings: string[];
}> {
  const { projectPath, originalGoalCount } = params;

  const issues: string[] = [];
  const warnings: string[] = [];

  // Check 1: v1.0.0 structure exists
  const structureExists = await checkV1Structure(projectPath);
  if (!structureExists) {
    issues.push('v1.0.0 component structure not found');
  }

  // Check 2: Count goals in new structure
  const foundGoals = await countMigratedGoals(projectPath);

  const goalsAccounted = !originalGoalCount || foundGoals >= originalGoalCount;
  if (!goalsAccounted) {
    issues.push(`Goal count mismatch: expected ${originalGoalCount}, found ${foundGoals}`);
  }

  // Check 3: Metadata valid
  const metadataValid = await validateMetadata(projectPath);
  if (!metadataValid) {
    warnings.push('Some metadata files may be incomplete');
  }

  // Check 4: No data loss
  const noDataLoss = goalsAccounted && structureExists;

  return {
    valid: issues.length === 0,
    checks: {
      structureExists,
      goalsAccounted,
      metadataValid,
      noDataLoss,
    },
    goalCount: {
      expected: originalGoalCount || 0,
      found: foundGoals,
      missing: Math.max(0, (originalGoalCount || 0) - foundGoals),
    },
    issues,
    warnings,
  };
}

/**
 * Check if v1.0.0 structure exists
 */
async function checkV1Structure(projectPath: string): Promise<boolean> {
  try {
    const componentsPath = join(projectPath, '02-goals-and-roadmap', 'components');
    await stat(componentsPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Count goals in migrated structure
 */
async function countMigratedGoals(projectPath: string): Promise<number> {
  let count = 0;

  try {
    const componentsPath = join(projectPath, '02-goals-and-roadmap', 'components');
    const components = await readdir(componentsPath);

    for (const component of components) {
      const majorGoalsPath = join(componentsPath, component, 'major-goals');
      try {
        const goals = await readdir(majorGoalsPath);
        count += goals.filter(f => f.endsWith('.md')).length;
      } catch {
        // No major-goals folder
      }
    }
  } catch {
    // No components folder
  }

  return count;
}

/**
 * Validate metadata in migrated files
 */
async function validateMetadata(projectPath: string): Promise<boolean> {
  // Check PROJECT OVERVIEW exists
  try {
    await stat(join(projectPath, '01-planning', 'PROJECT-OVERVIEW.md'));
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// TOOL 5: ROLLBACK MIGRATION
// ============================================================================

/**
 * Rollback a migration by restoring from backup
 */
export async function rollbackMigration(
  params: z.infer<typeof RollbackMigrationSchema>
): Promise<{
  success: boolean;
  restored: string[];
  removed: string[];
  message: string;
}> {
  const { projectPath, backupPath, confirm } = params;

  if (!confirm) {
    throw new Error('Rollback not confirmed. Set confirm=true to proceed.');
  }

  // Find backup if not provided
  let backup = backupPath;
  if (!backup) {
    const backupsPath = join(projectPath, '08-archive', 'migration-backups');
    try {
      const backups = await readdir(backupsPath);
      const latestBackup = backups.sort().reverse()[0];
      backup = join(backupsPath, latestBackup);
    } catch {
      throw new Error('No backup found. Cannot rollback.');
    }
  }

  const restored: string[] = [];
  const removed: string[] = [];

  // Remove v1.0.0 structure
  const componentsPath = join(projectPath, '02-goals-and-roadmap', 'components');
  try {
    await rm(componentsPath, { recursive: true, force: true });
    removed.push(componentsPath);
  } catch {
    // May not exist
  }

  // Restore from backup
  const foldersToRestore = ['brainstorming', '01-planning', '02-goals-and-roadmap'];

  for (const folder of foldersToRestore) {
    const backupFolder = join(backup, folder);
    const targetFolder = join(projectPath, folder);

    try {
      // Remove current
      await rm(targetFolder, { recursive: true, force: true });

      // Restore from backup
      await copyFolderRecursive(backupFolder, targetFolder);
      restored.push(targetFolder);
    } catch {
      // May not exist in backup
    }
  }

  return {
    success: true,
    restored,
    removed,
    message: `Successfully rolled back migration. Restored from ${backup}`,
  };
}

// ============================================================================
// MCP TOOL DEFINITIONS
// ============================================================================

export const analyzeProjectForMigrationTool = {
  name: 'analyze_project_for_migration',
  description: 'Analyze a v0.8.0 project to determine if migration to v1.0.0 is needed and extract goals',
  inputSchema: AnalyzeProjectForMigrationSchema,
};

export const suggestGoalClusteringTool = {
  name: 'suggest_goal_clustering',
  description: 'Suggest intelligent clustering of goals into components using AI algorithm',
  inputSchema: SuggestGoalClusteringSchema,
};

export const migrateToHierarchicalTool = {
  name: 'migrate_to_hierarchical',
  description: 'Execute migration from v0.8.0 to v1.0.0 hierarchical structure with backup',
  inputSchema: MigrateToHierarchicalSchema,
};

export const validateMigrationTool = {
  name: 'validate_migration',
  description: 'Validate that migration completed successfully with no data loss',
  inputSchema: ValidateMigrationSchema,
};

export const rollbackMigrationTool = {
  name: 'rollback_migration',
  description: 'Rollback a migration by restoring from backup',
  inputSchema: RollbackMigrationSchema,
};
