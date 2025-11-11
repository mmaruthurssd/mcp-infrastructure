/**
 * Information Extraction & Synthesis Utilities
 *
 * Extracts structured information from natural language user responses.
 * Uses pattern matching and AI-assisted extraction for PROJECT OVERVIEW generation.
 *
 * Created: 2025-10-27
 * Goal: 004 - Build PROJECT OVERVIEW Generation Tool
 */

import { ProjectOverview } from '../types/hierarchical-entities';

// ============================================================================
// EXTRACTION TYPES
// ============================================================================

/**
 * Extracted information from user responses
 */
export interface ExtractedInformation {
  // Core project info
  projectName?: string;
  description?: string;
  problemStatement?: string;
  currentSituation?: string;
  desiredOutcome?: string;
  projectType?: ProjectType;

  // Vision
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

  // Constraints
  constraints?: {
    timeline?: {
      estimatedDuration?: string;
      startDate?: string;
      endDate?: string;
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

  // Stakeholders
  stakeholders?: Array<{
    name: string;
    role: string;
    interest: string;
    influence: string;
    communicationNeeds: string;
  }>;

  // Resources
  resources?: {
    existingAssets?: string[];
    neededAssets?: string[];
    externalDependencies?: string[];
  };

  // Components
  components?: Array<{
    name: string;
    purpose: string;
    suggested?: boolean;
    subAreas?: string[];
  }>;

  // Metadata
  conversationId?: string;
  confidence?: number; // 0-1 confidence in extraction
}

export type ProjectType =
  | 'software'
  | 'research'
  | 'product'
  | 'business'
  | 'infrastructure'
  | 'data'
  | 'other';

// ============================================================================
// EXTRACTION PATTERNS
// ============================================================================

/**
 * Regex patterns for extracting information
 */
const EXTRACTION_PATTERNS = {
  // Problem statement indicators
  problemIndicators: [
    /(?:solves?|addressing|fixes?|tackles?)\s+(?:the\s+)?(.+?)(?:\.|$)/gi,
    /(?:problem|issue|challenge|pain\s+point)(?:\s+is)?:\s*(.+?)(?:\.|$)/gi,
    /(?:current|existing)\s+(?:situation|state|problem):\s*(.+?)(?:\.|$)/gi,
  ],

  // Success criteria
  successIndicators: [
    /success\s+(?:means|is|looks\s+like):\s*(.+?)(?:\.|$)/gi,
    /(?:measure|metric|kpi)s?:\s*(.+?)(?:\.|$)/gi,
    /(?:know|tell)\s+it'?s\s+working\s+when:\s*(.+?)(?:\.|$)/gi,
    /goal\s+is\s+to:\s*(.+?)(?:\.|$)/gi,
  ],

  // Scope - In
  inScopeIndicators: [
    /in\s+scope:\s*(.+?)(?:\.|$)/gi,
    /(?:includes?|covers?|handles?|provides?):\s*(.+?)(?:\.|$)/gi,
    /must\s+have:\s*(.+?)(?:\.|$)/gi,
  ],

  // Scope - Out
  outScopeIndicators: [
    /out\s+of\s+scope:\s*(.+?)(?:\.|$)/gi,
    /(?:not|won't|will not)\s+(?:include|do|handle|cover):\s*(.+?)(?:\.|$)/gi,
    /future\s+phase:\s*(.+?)(?:\.|$)/gi,
    /explicitly\s+(?:excluding|not\s+doing):\s*(.+?)(?:\.|$)/gi,
  ],

  // Timeline
  timelineIndicators: [
    /(?:timeline|schedule|duration):\s*(.+?)(?:\.|$)/gi,
    /(?:launch|complete|finish|deliver)\s+(?:by|in|within):\s*(.+?)(?:\.|$)/gi,
    /(\d+)\s*(?:weeks?|months?|days?|years?)/gi,
    /(?:by|before|after)\s+([A-Z][a-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})/gi,
  ],

  // Risks
  riskIndicators: [
    /(?:risk|concern|worry|challenge)s?:\s*(.+?)(?:\.|$)/gi,
    /(?:main|key|biggest)\s+risk:\s*(.+?)(?:\.|$)/gi,
    /concerned\s+about:\s*(.+?)(?:\.|$)/gi,
  ],

  // Team/Stakeholders
  teamIndicators: [
    /team:\s*(.+?)(?:\.|$)/gi,
    /(?:working\s+with|collaborating\s+with):\s*(.+?)(?:\.|$)/gi,
    /(?:just|only)\s+me/gi,
    /solo\s+(?:developer|founder|creator)/gi,
  ],

  // Technologies
  techIndicators: [
    /(?:using|built\s+with|tech\s+stack|technologies?):\s*(.+?)(?:\.|$)/gi,
    /(?:React|Vue|Angular|Node|Python|Java|Go|Rust|TypeScript)/gi,
  ],

  // Dependencies
  dependencyIndicators: [
    /(?:depends\s+on|integrates?\s+with|requires?):\s*(.+?)(?:\.|$)/gi,
    /(?:external|third-party)\s+(?:dependency|dependencies|service|API)s?:\s*(.+?)(?:\.|$)/gi,
  ],

  // Existing assets
  existingAssetIndicators: [
    /(?:already\s+have|existing|current):\s*(.+?)(?:\.|$)/gi,
    /(?:we\s+have|have\s+some):\s*(.+?)(?:\.|$)/gi,
  ],

  // Needed assets
  neededAssetIndicators: [
    /(?:need|require|will\s+need):\s*(.+?)(?:\.|$)/gi,
    /(?:planning\s+to|going\s+to)\s+(?:hire|get|create):\s*(.+?)(?:\.|$)/gi,
  ],
};

// ============================================================================
// EXTRACTION UTILITIES
// ============================================================================

/**
 * Extract project name from text
 */
export function extractProjectName(text: string): string | undefined {
  // Look for explicit declarations
  const patterns = [
    /project\s+name:\s*([^\n.]+)/i,
    /called\s+([^\n.,"]+)/i,
    /building\s+(?:a|an)\s+([^\n.,"]+)/i,
    /^([A-Z][A-Za-z\s&-]+?)(?:\s+is|\s+helps|\s+-)/m,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Extract project type from description
 */
export function extractProjectType(text: string): ProjectType {
  const lowerText = text.toLowerCase();

  if (
    lowerText.includes('software') ||
    lowerText.includes('app') ||
    lowerText.includes('web') ||
    lowerText.includes('mobile') ||
    lowerText.includes('api') ||
    lowerText.includes('system')
  ) {
    return 'software';
  }

  if (
    lowerText.includes('research') ||
    lowerText.includes('study') ||
    lowerText.includes('analysis') ||
    lowerText.includes('investigation')
  ) {
    return 'research';
  }

  if (
    lowerText.includes('product') ||
    lowerText.includes('hardware') ||
    lowerText.includes('device')
  ) {
    return 'product';
  }

  if (
    lowerText.includes('business') ||
    lowerText.includes('company') ||
    lowerText.includes('startup')
  ) {
    return 'business';
  }

  if (
    lowerText.includes('infrastructure') ||
    lowerText.includes('devops') ||
    lowerText.includes('platform')
  ) {
    return 'infrastructure';
  }

  if (
    lowerText.includes('data') ||
    lowerText.includes('analytics') ||
    lowerText.includes('ml') ||
    lowerText.includes('ai') ||
    lowerText.includes('machine learning')
  ) {
    return 'data';
  }

  return 'other';
}

/**
 * Extract success criteria from text
 */
export function extractSuccessCriteria(text: string): string[] {
  const criteria: string[] = [];

  // Look for explicit success indicators
  for (const pattern of EXTRACTION_PATTERNS.successIndicators) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const criterion = match[1].trim();
      if (criterion && !criteria.includes(criterion)) {
        criteria.push(criterion);
      }
    }
  }

  // Look for bulleted/numbered lists after success-related keywords
  const listPattern = /(?:success|measure|know\s+it'?s\s+working).{0,50}(?:\n|:)\s*[-•*]\s*(.+?)(?=\n[-•*]|\n\n|$)/gis;
  const listMatches = text.matchAll(listPattern);
  for (const match of listMatches) {
    const criterion = match[1].trim();
    if (criterion && !criteria.includes(criterion)) {
      criteria.push(criterion);
    }
  }

  // Extract numeric metrics (e.g., "50% reduction", "10x faster")
  const metricPattern = /(\d+%?|10x|100x)\s+(?:reduction|increase|faster|improvement|growth)\s+in\s+([^\n.]+)/gi;
  const metricMatches = text.matchAll(metricPattern);
  for (const match of metricMatches) {
    const criterion = `${match[1]} ${match[0].includes('reduction') ? 'reduction' : match[0].includes('increase') ? 'increase' : 'improvement'} in ${match[2]}`.trim();
    if (!criteria.some(c => c.includes(criterion))) {
      criteria.push(criterion);
    }
  }

  return criteria;
}

/**
 * Extract scope (in/out) from text
 */
export function extractScope(text: string): {
  inScope: string[];
  outOfScope: string[];
} {
  const inScope: string[] = [];
  const outOfScope: string[] = [];

  // Extract in-scope items
  for (const pattern of EXTRACTION_PATTERNS.inScopeIndicators) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const items = match[1].split(/[,;]/);
      items.forEach(item => {
        const cleaned = item.trim();
        if (cleaned && !inScope.includes(cleaned)) {
          inScope.push(cleaned);
        }
      });
    }
  }

  // Extract out-of-scope items
  for (const pattern of EXTRACTION_PATTERNS.outScopeIndicators) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const items = match[1].split(/[,;]/);
      items.forEach(item => {
        const cleaned = item.trim();
        if (cleaned && !outOfScope.includes(cleaned)) {
          outOfScope.push(cleaned);
        }
      });
    }
  }

  return { inScope, outOfScope };
}

/**
 * Extract timeline information
 */
export function extractTimeline(text: string): {
  estimatedDuration?: string;
  startDate?: string;
  endDate?: string;
  milestones?: Array<{ name: string; targetDate: string; status: string }>;
} {
  const timeline: any = {};

  // Extract duration
  const durationPattern = /(\d+)\s*(weeks?|months?|days?|years?)/i;
  const durationMatch = text.match(durationPattern);
  if (durationMatch) {
    timeline.estimatedDuration = `${durationMatch[1]} ${durationMatch[2]}`;
  }

  // Extract specific dates
  const datePattern = /(?:by|before|after)\s+([A-Z][a-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})/g;
  const dateMatches = text.matchAll(datePattern);
  const dates = Array.from(dateMatches).map(m => m[1]);
  if (dates.length > 0) {
    timeline.endDate = dates[0];
  }

  // Extract milestones
  const milestonePattern = /(?:MVP|launch|beta|alpha|release|milestone|phase\s+\d+)(?:\s+(?:in|by|within))?\s*[:-]?\s*(.+?)(?=\.|,|$)/gi;
  const milestones: Array<{ name: string; targetDate: string; status: string }> = [];
  const milestoneMatches = text.matchAll(milestonePattern);
  for (const match of milestoneMatches) {
    milestones.push({
      name: match[0].split(/[:-]/)[0].trim(),
      targetDate: match[1].trim() || 'TBD',
      status: 'planned',
    });
  }

  if (milestones.length > 0) {
    timeline.milestones = milestones;
  }

  return timeline;
}

/**
 * Extract technologies and tools
 */
export function extractTechnologies(text: string): {
  tools: string[];
  technologies: string[];
} {
  const tools: string[] = [];
  const technologies: string[] = [];

  // Common technology names
  const techNames = [
    'React', 'Vue', 'Angular', 'Svelte',
    'Node.js', 'Express', 'NestJS',
    'Python', 'Django', 'Flask', 'FastAPI',
    'Java', 'Spring', 'Kotlin',
    'Go', 'Rust', 'TypeScript', 'JavaScript',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
    'GraphQL', 'REST', 'gRPC',
  ];

  for (const tech of techNames) {
    if (text.includes(tech)) {
      technologies.push(tech);
    }
  }

  // Extract tools from patterns
  for (const pattern of EXTRACTION_PATTERNS.techIndicators) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const items = match[1]?.split(/[,;]/) || match[0].split(/[,;]/);
      items.forEach(item => {
        const cleaned = item.trim();
        if (cleaned && !tools.includes(cleaned) && !technologies.includes(cleaned)) {
          if (techNames.some(t => cleaned.includes(t))) {
            technologies.push(cleaned);
          } else {
            tools.push(cleaned);
          }
        }
      });
    }
  }

  return { tools, technologies };
}

/**
 * Extract risks
 */
export function extractRisks(text: string): Array<{
  description: string;
  severity: 'low' | 'medium' | 'high';
  mitigation?: string;
}> {
  const risks: Array<{ description: string; severity: 'low' | 'medium' | 'high'; mitigation?: string }> = [];

  for (const pattern of EXTRACTION_PATTERNS.riskIndicators) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const description = match[1].trim();
      if (description) {
        // Determine severity based on keywords
        let severity: 'low' | 'medium' | 'high' = 'medium';
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes('critical') || lowerDesc.includes('major') || lowerDesc.includes('biggest')) {
          severity = 'high';
        } else if (lowerDesc.includes('minor') || lowerDesc.includes('small')) {
          severity = 'low';
        }

        risks.push({ description, severity });
      }
    }
  }

  return risks;
}

/**
 * Extract resources (existing/needed/dependencies)
 */
export function extractResources(text: string): {
  existingAssets: string[];
  neededAssets: string[];
  externalDependencies: string[];
} {
  const existingAssets: string[] = [];
  const neededAssets: string[] = [];
  const externalDependencies: string[] = [];

  // Existing assets
  for (const pattern of EXTRACTION_PATTERNS.existingAssetIndicators) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const items = match[1].split(/[,;]/);
      items.forEach(item => {
        const cleaned = item.trim();
        if (cleaned && !existingAssets.includes(cleaned)) {
          existingAssets.push(cleaned);
        }
      });
    }
  }

  // Needed assets
  for (const pattern of EXTRACTION_PATTERNS.neededAssetIndicators) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const items = match[1].split(/[,;]/);
      items.forEach(item => {
        const cleaned = item.trim();
        if (cleaned && !neededAssets.includes(cleaned)) {
          neededAssets.push(cleaned);
        }
      });
    }
  }

  // External dependencies
  for (const pattern of EXTRACTION_PATTERNS.dependencyIndicators) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const items = match[1].split(/[,;]/);
      items.forEach(item => {
        const cleaned = item.trim();
        if (cleaned && !externalDependencies.includes(cleaned)) {
          externalDependencies.push(cleaned);
        }
      });
    }
  }

  return { existingAssets, neededAssets, externalDependencies };
}

/**
 * Suggest components based on project type and description
 */
export function suggestComponents(
  projectType: ProjectType,
  description: string
): Array<{ name: string; purpose: string; suggested: boolean; subAreas?: string[] }> {
  const components: Array<{ name: string; purpose: string; suggested: boolean; subAreas?: string[] }> = [];

  switch (projectType) {
    case 'software':
      components.push(
        {
          name: 'Frontend',
          purpose: 'User interface and client-side logic',
          suggested: true,
          subAreas: ['UI Components', 'State Management', 'Routing'],
        },
        {
          name: 'Backend',
          purpose: 'Server-side logic and API',
          suggested: true,
          subAreas: ['API Endpoints', 'Business Logic', 'Authentication'],
        },
        {
          name: 'Data',
          purpose: 'Database and data management',
          suggested: true,
          subAreas: ['Schema Design', 'Migrations', 'Data Access Layer'],
        },
        {
          name: 'Infrastructure',
          purpose: 'Deployment and operations',
          suggested: true,
          subAreas: ['CI/CD', 'Monitoring', 'Scaling'],
        }
      );
      break;

    case 'research':
      components.push(
        {
          name: 'Literature Review',
          purpose: 'Review existing research and context',
          suggested: true,
          subAreas: ['Paper Collection', 'Analysis', 'Synthesis'],
        },
        {
          name: 'Methodology',
          purpose: 'Research methods and approach',
          suggested: true,
          subAreas: ['Design', 'Protocol', 'Ethics'],
        },
        {
          name: 'Data Collection',
          purpose: 'Gather research data',
          suggested: true,
          subAreas: ['Instruments', 'Sampling', 'Collection Process'],
        },
        {
          name: 'Analysis',
          purpose: 'Analyze collected data',
          suggested: true,
          subAreas: ['Statistical Analysis', 'Qualitative Analysis', 'Visualization'],
        },
        {
          name: 'Writing',
          purpose: 'Write and publish findings',
          suggested: true,
          subAreas: ['Paper Writing', 'Revisions', 'Publication'],
        }
      );
      break;

    case 'product':
      components.push(
        {
          name: 'Design',
          purpose: 'Product design and user experience',
          suggested: true,
          subAreas: ['User Research', 'Prototyping', 'Visual Design'],
        },
        {
          name: 'Engineering',
          purpose: 'Build the product',
          suggested: true,
          subAreas: ['Hardware', 'Software', 'Integration'],
        },
        {
          name: 'Manufacturing',
          purpose: 'Production and supply chain',
          suggested: true,
          subAreas: ['Sourcing', 'Production', 'Quality Control'],
        },
        {
          name: 'Marketing',
          purpose: 'Product marketing and launch',
          suggested: true,
          subAreas: ['Positioning', 'Campaigns', 'Launch'],
        }
      );
      break;

    case 'business':
      components.push(
        {
          name: 'Strategy',
          purpose: 'Business strategy and planning',
          suggested: true,
          subAreas: ['Market Analysis', 'Business Model', 'Roadmap'],
        },
        {
          name: 'Operations',
          purpose: 'Day-to-day business operations',
          suggested: true,
          subAreas: ['Processes', 'Systems', 'Efficiency'],
        },
        {
          name: 'Finance',
          purpose: 'Financial management',
          suggested: true,
          subAreas: ['Budgeting', 'Forecasting', 'Reporting'],
        },
        {
          name: 'Marketing',
          purpose: 'Marketing and sales',
          suggested: true,
          subAreas: ['Brand', 'Lead Generation', 'Sales'],
        }
      );
      break;

    default:
      // Generic components for unknown types
      components.push(
        {
          name: 'Planning',
          purpose: 'Project planning and coordination',
          suggested: true,
          subAreas: ['Requirements', 'Timeline', 'Resources'],
        },
        {
          name: 'Execution',
          purpose: 'Core project work',
          suggested: true,
          subAreas: ['Implementation', 'Testing', 'Iteration'],
        },
        {
          name: 'Delivery',
          purpose: 'Finalize and deliver',
          suggested: true,
          subAreas: ['Quality Assurance', 'Documentation', 'Handoff'],
        }
      );
  }

  return components;
}

/**
 * Calculate confidence score for extracted information
 */
export function calculateConfidence(extracted: ExtractedInformation): number {
  let score = 0;
  let total = 0;

  // Check each field
  if (extracted.projectName) score += 10;
  total += 10;

  if (extracted.description) score += 10;
  total += 10;

  if (extracted.problemStatement) score += 5;
  total += 5;

  if (extracted.vision?.missionStatement) score += 5;
  total += 5;

  if (extracted.vision?.successCriteria && extracted.vision.successCriteria.length >= 3) score += 10;
  total += 10;

  if (extracted.vision?.scope?.inScope && extracted.vision.scope.inScope.length > 0) score += 5;
  total += 5;

  if (extracted.vision?.scope?.outOfScope && extracted.vision.scope.outOfScope.length > 0) score += 5;
  total += 5;

  if (extracted.constraints?.timeline) score += 5;
  total += 5;

  if (extracted.constraints?.resources?.technologies && extracted.constraints.resources.technologies.length > 0) score += 5;
  total += 5;

  if (extracted.stakeholders && extracted.stakeholders.length > 0) score += 5;
  total += 5;

  if (extracted.components && extracted.components.length > 0) score += 5;
  total += 5;

  return score / total;
}
