/**
 * Identify Components Tool
 *
 * MCP Tool: Analyzes PROJECT OVERVIEW and suggests logical components
 *
 * Created: 2025-10-27
 * Goal: 005 - Build Component Management Tools
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { suggestComponents, extractProjectType } from '../utils/information-extraction';

// ============================================================================
// TOOL INPUT/OUTPUT
// ============================================================================

export interface IdentifyComponentsInput {
  projectPath: string;
  maxComponents?: number; // Default: 5
  analysisDepth?: 'quick' | 'thorough'; // Default: 'quick'
}

export interface IdentifyComponentsOutput {
  success: boolean;
  components: ComponentSuggestion[];
  analysisMethod: string;
  confidence: number; // 0-1
  warnings: string[];
  error?: string;
}

export interface ComponentSuggestion {
  name: string;
  purpose: string;
  suggestedSubAreas: string[];
  reasoning: string;
  confidence: number; // 0-1
  priority: 'high' | 'medium' | 'low';
}

// ============================================================================
// TOOL IMPLEMENTATION
// ============================================================================

/**
 * Identify components from PROJECT OVERVIEW
 */
export async function identifyComponents(
  input: IdentifyComponentsInput
): Promise<IdentifyComponentsOutput> {
  const warnings: string[] = [];

  try {
    // Load PROJECT OVERVIEW
    const overviewPath = join(input.projectPath, 'PROJECT-OVERVIEW.md');
    let overviewContent: string;

    try {
      overviewContent = await readFile(overviewPath, 'utf-8');
    } catch (error) {
      return {
        success: false,
        components: [],
        analysisMethod: 'none',
        confidence: 0,
        warnings: [],
        error: 'PROJECT OVERVIEW not found',
      };
    }

    // Extract project type
    const projectType = extractProjectType(overviewContent);

    // Extract key information for analysis
    const analysis = analyzeProjectOverview(overviewContent);

    // Check if components are already defined
    if (analysis.hasExistingComponents) {
      const existing = extractExistingComponents(overviewContent);

      return {
        success: true,
        components: existing,
        analysisMethod: 'existing',
        confidence: 1.0,
        warnings: ['Components already defined in PROJECT OVERVIEW'],
      };
    }

    // Suggest components based on project type and content
    const maxComponents = input.maxComponents || 5;
    const depth = input.analysisDepth || 'quick';

    let suggestions: ComponentSuggestion[];

    if (depth === 'quick') {
      // Use pattern-based suggestions
      suggestions = suggestComponentsQuick(projectType, analysis, maxComponents);
    } else {
      // Use thorough analysis
      suggestions = suggestComponentsThorough(projectType, analysis, maxComponents);
    }

    // Calculate overall confidence
    const avgConfidence =
      suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length;

    return {
      success: true,
      components: suggestions,
      analysisMethod: depth,
      confidence: avgConfidence,
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      components: [],
      analysisMethod: 'none',
      confidence: 0,
      warnings,
      error: (error as Error).message,
    };
  }
}

// ============================================================================
// PROJECT OVERVIEW ANALYSIS
// ============================================================================

interface ProjectAnalysis {
  hasExistingComponents: boolean;
  inScopeItems: string[];
  outScopeItems: string[];
  technologies: string[];
  features: string[];
  workAreas: string[];
  stakeholders: string[];
  hasBackend: boolean;
  hasFrontend: boolean;
  hasData: boolean;
  hasInfrastructure: boolean;
  hasDesign: boolean;
  hasTesting: boolean;
}

function analyzeProjectOverview(content: string): ProjectAnalysis {
  const lowerContent = content.toLowerCase();

  return {
    hasExistingComponents: /^#+\s*\d+\.\s+/m.test(content) || content.includes('## Components'),
    inScopeItems: extractListItems(content, 'in scope'),
    outScopeItems: extractListItems(content, 'out of scope'),
    technologies: extractTechnologies(content),
    features: extractFeatures(content),
    workAreas: extractWorkAreas(content),
    stakeholders: extractStakeholders(content),
    hasBackend:
      lowerContent.includes('api') ||
      lowerContent.includes('backend') ||
      lowerContent.includes('server'),
    hasFrontend:
      lowerContent.includes('ui') ||
      lowerContent.includes('frontend') ||
      lowerContent.includes('web') ||
      lowerContent.includes('mobile'),
    hasData:
      lowerContent.includes('database') ||
      lowerContent.includes('data') ||
      lowerContent.includes('analytics'),
    hasInfrastructure:
      lowerContent.includes('deployment') ||
      lowerContent.includes('infrastructure') ||
      lowerContent.includes('devops') ||
      lowerContent.includes('cloud'),
    hasDesign:
      lowerContent.includes('design') ||
      lowerContent.includes('ux') ||
      lowerContent.includes('ui/ux'),
    hasTesting:
      lowerContent.includes('test') ||
      lowerContent.includes('qa') ||
      lowerContent.includes('quality'),
  };
}

function extractListItems(content: string, section: string): string[] {
  const items: string[] = [];
  const sectionRegex = new RegExp(`${section}[:\\s]*([\\s\\S]*?)(?=\\n##|$)`, 'i');
  const match = content.match(sectionRegex);

  if (match) {
    const listRegex = /^[\s-•*]+(.+)$/gm;
    const listMatches = match[1].matchAll(listRegex);
    for (const m of listMatches) {
      items.push(m[1].trim());
    }
  }

  return items;
}

function extractTechnologies(content: string): string[] {
  const techs: string[] = [];
  const techPattern = /\b(React|Vue|Angular|Node\.?js|Python|Java|Go|Rust|PostgreSQL|MongoDB|Docker|Kubernetes|AWS|Azure|GCP)\b/gi;
  const matches = content.matchAll(techPattern);

  for (const match of matches) {
    const tech = match[0];
    if (!techs.includes(tech)) {
      techs.push(tech);
    }
  }

  return techs;
}

function extractFeatures(content: string): string[] {
  // Extract from in-scope items
  const features = extractListItems(content, 'in scope');
  return features;
}

function extractWorkAreas(content: string): string[] {
  const areas: string[] = [];
  const patterns = [
    /\b(authentication|authorization|user\s+management|payment|billing|reporting|analytics|dashboard|admin\s+panel|api|integration)\b/gi,
  ];

  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const area = match[0].toLowerCase();
      if (!areas.includes(area)) {
        areas.push(area);
      }
    }
  }

  return areas;
}

function extractStakeholders(content: string): string[] {
  return extractListItems(content, 'stakeholders');
}

// ============================================================================
// COMPONENT SUGGESTION - QUICK
// ============================================================================

function suggestComponentsQuick(
  projectType: any,
  analysis: ProjectAnalysis,
  maxComponents: number
): ComponentSuggestion[] {
  const suggestions: ComponentSuggestion[] = [];

  // Use suggestComponents from information-extraction as base
  const baseSuggestions = suggestComponents(projectType, '');

  // Filter based on analysis
  for (const base of baseSuggestions) {
    if (suggestions.length >= maxComponents) break;

    // Check if component is relevant based on analysis
    const isRelevant = isComponentRelevant(base.name, analysis);

    if (isRelevant) {
      suggestions.push({
        name: base.name,
        purpose: base.purpose,
        suggestedSubAreas: base.subAreas || [],
        reasoning: generateReasoning(base.name, analysis),
        confidence: 0.8,
        priority: determinePriority(base.name, analysis),
      });
    }
  }

  // If we don't have enough, add generic ones
  if (suggestions.length === 0) {
    suggestions.push({
      name: 'Core Features',
      purpose: 'Core functionality and business logic',
      suggestedSubAreas: ['Feature A', 'Feature B', 'Feature C'],
      reasoning: 'Generic component for main features',
      confidence: 0.6,
      priority: 'high',
    });
  }

  return suggestions;
}

// ============================================================================
// COMPONENT SUGGESTION - THOROUGH
// ============================================================================

function suggestComponentsThorough(
  projectType: any,
  analysis: ProjectAnalysis,
  maxComponents: number
): ComponentSuggestion[] {
  const suggestions: ComponentSuggestion[] = [];

  // Analyze in-scope items and cluster into components
  const clusters = clusterFeatures(analysis.inScopeItems, maxComponents);

  for (const cluster of clusters) {
    suggestions.push({
      name: cluster.name,
      purpose: cluster.purpose,
      suggestedSubAreas: cluster.features,
      reasoning: cluster.reasoning,
      confidence: cluster.confidence,
      priority: cluster.priority,
    });
  }

  // If thorough analysis didn't yield enough, fall back to quick
  if (suggestions.length < 3) {
    const quickSuggestions = suggestComponentsQuick(projectType, analysis, maxComponents);
    return [...suggestions, ...quickSuggestions.slice(0, maxComponents - suggestions.length)];
  }

  return suggestions.slice(0, maxComponents);
}

// ============================================================================
// FEATURE CLUSTERING
// ============================================================================

interface FeatureCluster {
  name: string;
  purpose: string;
  features: string[];
  reasoning: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
}

function clusterFeatures(features: string[], maxClusters: number): FeatureCluster[] {
  if (features.length === 0) {
    return [];
  }

  // Simple keyword-based clustering
  const clusters: FeatureCluster[] = [];

  // User-facing features
  const userFeatures = features.filter(f =>
    /user|account|profile|login|signup|registration/i.test(f)
  );
  if (userFeatures.length > 0) {
    clusters.push({
      name: 'User Management',
      purpose: 'User accounts, authentication, and profiles',
      features: userFeatures,
      reasoning: `Contains ${userFeatures.length} user-related features`,
      confidence: 0.85,
      priority: 'high',
    });
  }

  // Data/content features
  const dataFeatures = features.filter(f =>
    /data|content|record|document|file|report/i.test(f)
  );
  if (dataFeatures.length > 0 && clusters.length < maxClusters) {
    clusters.push({
      name: 'Data Management',
      purpose: 'Data storage, retrieval, and management',
      features: dataFeatures,
      reasoning: `Contains ${dataFeatures.length} data-related features`,
      confidence: 0.8,
      priority: 'high',
    });
  }

  // Business logic
  const businessFeatures = features.filter(
    f =>
      /workflow|process|logic|rule|calculation|payment|billing/i.test(f) &&
      !userFeatures.includes(f) &&
      !dataFeatures.includes(f)
  );
  if (businessFeatures.length > 0 && clusters.length < maxClusters) {
    clusters.push({
      name: 'Business Logic',
      purpose: 'Core business processes and workflows',
      features: businessFeatures,
      reasoning: `Contains ${businessFeatures.length} business-related features`,
      confidence: 0.75,
      priority: 'high',
    });
  }

  // Integration features
  const integrationFeatures = features.filter(f =>
    /integration|api|webhook|sync|import|export/i.test(f)
  );
  if (integrationFeatures.length > 0 && clusters.length < maxClusters) {
    clusters.push({
      name: 'Integrations',
      purpose: 'Third-party integrations and APIs',
      features: integrationFeatures,
      reasoning: `Contains ${integrationFeatures.length} integration features`,
      confidence: 0.8,
      priority: 'medium',
    });
  }

  // Remaining features
  const remainingFeatures = features.filter(
    f =>
      !userFeatures.includes(f) &&
      !dataFeatures.includes(f) &&
      !businessFeatures.includes(f) &&
      !integrationFeatures.includes(f)
  );

  if (remainingFeatures.length > 0 && clusters.length < maxClusters) {
    clusters.push({
      name: 'Additional Features',
      purpose: 'Other functionality',
      features: remainingFeatures,
      reasoning: 'Miscellaneous features not categorized elsewhere',
      confidence: 0.6,
      priority: 'medium',
    });
  }

  return clusters;
}

// ============================================================================
// UTILITIES
// ============================================================================

function isComponentRelevant(componentName: string, analysis: ProjectAnalysis): boolean {
  const name = componentName.toLowerCase();

  if (name.includes('frontend') || name.includes('ui')) {
    return analysis.hasFrontend;
  }
  if (name.includes('backend') || name.includes('api')) {
    return analysis.hasBackend;
  }
  if (name.includes('data') || name.includes('database')) {
    return analysis.hasData;
  }
  if (name.includes('infrastructure') || name.includes('devops')) {
    return analysis.hasInfrastructure;
  }
  if (name.includes('design') || name.includes('ux')) {
    return analysis.hasDesign;
  }

  // Generic components are always relevant
  return true;
}

function generateReasoning(componentName: string, analysis: ProjectAnalysis): string {
  const name = componentName.toLowerCase();

  if (name.includes('frontend') && analysis.technologies.some(t => /react|vue|angular/i.test(t))) {
    return `Frontend component suggested based on ${analysis.technologies.join(', ')} usage`;
  }
  if (name.includes('backend') && analysis.technologies.some(t => /node|python|java|go/i.test(t))) {
    return `Backend component suggested based on ${analysis.technologies.join(', ')} usage`;
  }
  if (name.includes('data') && analysis.hasData) {
    return 'Data component suggested based on database/analytics mentions';
  }

  return `${componentName} is a standard component for ${analysis} projects`;
}

function determinePriority(
  componentName: string,
  analysis: ProjectAnalysis
): 'high' | 'medium' | 'low' {
  const name = componentName.toLowerCase();

  // Core technical components are high priority
  if (
    name.includes('backend') ||
    name.includes('frontend') ||
    name.includes('data') ||
    name.includes('core')
  ) {
    return 'high';
  }

  // Infrastructure and operations are medium priority
  if (name.includes('infrastructure') || name.includes('operations') || name.includes('testing')) {
    return 'medium';
  }

  // Everything else is low priority
  return 'low';
}

function extractExistingComponents(content: string): ComponentSuggestion[] {
  const components: ComponentSuggestion[] = [];

  // Look for component sections
  const componentPattern = /^#+\s*\d+\.\s+(.+?)$/gm;
  const matches = content.matchAll(componentPattern);

  for (const match of matches) {
    const name = match[1].trim();

    components.push({
      name,
      purpose: 'Existing component from PROJECT OVERVIEW',
      suggestedSubAreas: [],
      reasoning: 'Already defined in PROJECT OVERVIEW',
      confidence: 1.0,
      priority: 'high',
    });
  }

  return components;
}
