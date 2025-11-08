/**
 * Generate Project Overview
 *
 * MCP Tool: Generates PROJECT OVERVIEW.md from conversation data
 *
 * Created: 2025-10-27
 * Goal: 004 - Build PROJECT OVERVIEW Generation Tool
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import Handlebars from 'handlebars';
import { ExtractedInformation, calculateConfidence } from '../utils/information-extraction';
import { ProjectOverview } from '../types/hierarchical-entities';

// ============================================================================
// TOOL INPUT/OUTPUT
// ============================================================================

export interface GenerateProjectOverviewInput {
  projectPath: string;
  conversationId: string;
  overrideData?: Partial<ExtractedInformation>; // Optional manual overrides
  dryRun?: boolean; // Preview without writing file
}

export interface GenerateProjectOverviewOutput {
  success: boolean;
  projectOverviewPath?: string;
  previewContent?: string; // If dryRun=true
  projectOverview?: ProjectOverview;
  confidence: number; // 0-1 confidence score
  warnings: string[];
  error?: string;
}

// ============================================================================
// TOOL IMPLEMENTATION
// ============================================================================

/**
 * Generate PROJECT OVERVIEW.md from conversation data
 */
export async function generateProjectOverview(
  input: GenerateProjectOverviewInput
): Promise<GenerateProjectOverviewOutput> {
  const warnings: string[] = [];

  try {
    // Load conversation state
    const { readFile: readFilePromise } = await import('fs/promises');
    const conversationPath = join(
      input.projectPath,
      '.mcp-conversations',
      `${input.conversationId}.json`
    );

    let conversationState: any;
    try {
      const content = await readFilePromise(conversationPath, 'utf-8');
      conversationState = JSON.parse(content);
    } catch (error) {
      return {
        success: false,
        confidence: 0,
        warnings: [],
        error: `Conversation ${input.conversationId} not found`,
      };
    }

    // Get extracted data
    let extracted: ExtractedInformation = conversationState.extracted;

    // Apply overrides if provided
    if (input.overrideData) {
      extracted = { ...extracted, ...input.overrideData };
    }

    // Calculate confidence
    const confidence = calculateConfidence(extracted);

    // Generate warnings for missing critical fields
    if (!extracted.projectName) {
      warnings.push('Project name is missing - will default to directory name');
    }
    if (!extracted.description) {
      warnings.push('Project description is missing');
    }
    if (!extracted.vision?.successCriteria || extracted.vision.successCriteria.length === 0) {
      warnings.push('No success criteria defined');
    }
    if (!extracted.components || extracted.components.length === 0) {
      warnings.push('No components defined - project structure will need manual setup');
    }

    // Prepare template data
    const templateData = prepareTemplateData(extracted, input.projectPath);

    // Load and compile template
    const templatePath = join(__dirname, '../../templates/project-overview.hbs');
    const templateContent = await readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);

    // Render template
    const renderedContent = template(templateData);

    // Dry run - return preview
    if (input.dryRun) {
      return {
        success: true,
        previewContent: renderedContent,
        confidence,
        warnings,
      };
    }

    // Write PROJECT OVERVIEW.md
    const overviewPath = join(input.projectPath, 'PROJECT-OVERVIEW.md');
    await writeFile(overviewPath, renderedContent, 'utf-8');

    // Convert to ProjectOverview entity
    const projectOverview: ProjectOverview = convertToProjectOverview(templateData);

    return {
      success: true,
      projectOverviewPath: overviewPath,
      projectOverview,
      confidence,
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      confidence: 0,
      warnings,
      error: (error as Error).message,
    };
  }
}

// ============================================================================
// TEMPLATE DATA PREPARATION
// ============================================================================

function prepareTemplateData(
  extracted: ExtractedInformation,
  projectPath: string
): any {
  const projectName =
    extracted.projectName ||
    projectPath.split('/').pop() ||
    'Unnamed Project';

  const projectId = slugify(projectName);

  return {
    projectId,
    projectName,
    projectType: extracted.projectType || 'software',
    description: extracted.description || 'Project description to be defined',
    problemStatement: extracted.problemStatement,
    currentSituation: extracted.currentSituation,
    desiredOutcome: extracted.desiredOutcome,
    status: 'planning',

    // Version info
    versionInfo: {
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },

    // Vision
    vision: {
      missionStatement: extracted.vision?.missionStatement || '',
      successCriteria: extracted.vision?.successCriteria || [],
      scope: {
        inScope: extracted.vision?.scope?.inScope || [],
        outOfScope: extracted.vision?.scope?.outOfScope || [],
      },
      risks: extracted.vision?.risks || [],
    },

    // Constraints
    constraints: {
      timeline: extracted.constraints?.timeline || {
        estimatedDuration: 'TBD',
        milestones: [],
      },
      resources: {
        team: extracted.constraints?.resources?.team || [],
        tools: extracted.constraints?.resources?.tools || [],
        technologies: extracted.constraints?.resources?.technologies || [],
      },
    },

    // Stakeholders
    stakeholders: extracted.stakeholders || [],

    // Resources
    resources: {
      existingAssets: extracted.resources?.existingAssets || [],
      neededAssets: extracted.resources?.neededAssets || [],
      externalDependencies: extracted.resources?.externalDependencies || [],
    },

    // Components
    components: (extracted.components || []).map(c => ({
      name: c.name,
      purpose: c.purpose,
      suggested: c.suggested || false,
      subAreas: c.subAreas || [],
    })),

    // Version history
    versionHistory: [],

    // Cascade strategy
    cascadeUpdateStrategy: `When this document version changes, all related documents should be reviewed and updated accordingly.

1. **Component Changes** → Update all component OVERVIEW files
2. **Timeline Changes** → Recalculate major goal target dates
3. **Scope Changes** → Review and update major goals
4. **Stakeholder Changes** → Update communication plan
5. **Resource Changes** → Review dependencies and risks`,

    // Metadata
    conversationId: extracted.conversationId,
    notes: '',
  };
}

// ============================================================================
// ENTITY CONVERSION
// ============================================================================

function convertToProjectOverview(templateData: any): ProjectOverview {
  return {
    id: templateData.projectId,
    name: templateData.projectName,
    description: templateData.description,

    versionInfo: {
      version: templateData.versionInfo.version,
      createdAt: templateData.versionInfo.createdAt,
      updatedAt: templateData.versionInfo.updatedAt,
    },

    versionHistory: [],

    vision: {
      missionStatement: templateData.vision.missionStatement,
      successCriteria: templateData.vision.successCriteria,
      scope: {
        inScope: templateData.vision.scope.inScope,
        outOfScope: templateData.vision.scope.outOfScope,
      },
      risks: templateData.vision.risks.map((r: any) => ({
        description: r.description,
        severity: r.severity,
        mitigation: r.mitigation || 'To be determined',
        probability: 'medium',
        impact: r.severity,
      })),
    },

    constraints: {
      timeline: {
        milestones: templateData.constraints.timeline.milestones || [],
      },
      resources: {
        team: templateData.constraints.resources.team,
        tools: templateData.constraints.resources.tools,
        technologies: templateData.constraints.resources.technologies,
      },
    },

    stakeholders: templateData.stakeholders,

    resources: {
      existingAssets: templateData.resources.existingAssets,
      neededAssets: templateData.resources.neededAssets,
      externalDependencies: templateData.resources.externalDependencies,
    },

    components: templateData.components.map((c: any) => c.name),

    createdAt: templateData.versionInfo.createdAt,
    lastUpdated: templateData.versionInfo.updatedAt,
    status: 'planning',

    filePath: '', // Will be set by caller
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ============================================================================
// APPROVAL HANDLING
// ============================================================================

export interface ApproveProjectOverviewInput {
  projectPath: string;
  conversationId: string;
  action: 'approve' | 'refine' | 'manual';
  refinementNotes?: string; // If action='refine'
}

export interface ApproveProjectOverviewOutput {
  success: boolean;
  action: string;
  projectOverviewPath?: string;
  nextStep?: string;
  error?: string;
}

/**
 * Handle user approval/refinement of PROJECT OVERVIEW
 */
export async function approveProjectOverview(
  input: ApproveProjectOverviewInput
): Promise<ApproveProjectOverviewOutput> {
  try {
    switch (input.action) {
      case 'approve':
        // Generate final PROJECT OVERVIEW
        const result = await generateProjectOverview({
          projectPath: input.projectPath,
          conversationId: input.conversationId,
          dryRun: false,
        });

        if (!result.success) {
          return {
            success: false,
            action: 'approve',
            error: result.error,
          };
        }

        return {
          success: true,
          action: 'approve',
          projectOverviewPath: result.projectOverviewPath,
          nextStep: 'PROJECT OVERVIEW created! Next: Create component structure',
        };

      case 'refine':
        return {
          success: true,
          action: 'refine',
          nextStep: `Refinement requested: ${input.refinementNotes}. I'll ask follow-up questions to gather more detail.`,
        };

      case 'manual':
        // Generate draft and tell user to edit manually
        const draftResult = await generateProjectOverview({
          projectPath: input.projectPath,
          conversationId: input.conversationId,
          dryRun: false,
        });

        if (!draftResult.success) {
          return {
            success: false,
            action: 'manual',
            error: draftResult.error,
          };
        }

        return {
          success: true,
          action: 'manual',
          projectOverviewPath: draftResult.projectOverviewPath,
          nextStep: `Draft PROJECT OVERVIEW created at ${draftResult.projectOverviewPath}. Please edit it manually.`,
        };

      default:
        return {
          success: false,
          action: input.action,
          error: `Unknown action: ${input.action}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      action: input.action,
      error: (error as Error).message,
    };
  }
}
