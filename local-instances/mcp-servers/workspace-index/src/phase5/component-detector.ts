/**
 * Phase 5: System Component Detection
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import type {
  ComponentPattern,
  DetectedComponent,
  DetectionResult,
  ComponentType
} from './types.js';

const DETECTION_PATTERNS: ComponentPattern[] = [
  {
    type: 'automation',
    patterns: [
      '.github/workflows/*.yml',
      'automation/*/server.sh',
      'automation/*-server.sh'
    ],
    indicators: ['cron schedule', 'workflow_dispatch', 'on: schedule', 'on:\n  schedule']
  },
  {
    type: 'infrastructure',
    patterns: [
      'google-workspace-oauth-setup/service-account.json',
      '*/backup*.sh',
      '*/restore*.sh',
      'scripts/backup*.sh',
      'scripts/restore*.sh'
    ],
    indicators: ['service account', 'credentials', 'authentication', 'backup', 'restore']
  },
  {
    type: 'integration',
    patterns: [
      'Implementation Projects/*/PROJECT-OVERVIEW.md',
      'projects-in-development/*/PROJECT-OVERVIEW.md'
    ],
    indicators: ['Status: ✅ Production', 'Status: 🟢 Production', 'Status:** ✅ Production', 'Status:** 🟢 Production']
  },
  {
    type: 'protection',
    patterns: [
      '.github/workflows/backup-*.yml',
      'scripts/*-hook.sh',
      '.git/hooks/*'
    ],
    indicators: ['pre-commit', 'pre-push', 'backup', 'security']
  },
  {
    type: 'monitoring',
    patterns: [
      'scripts/*health-check*.sh',
      'scripts/*monitor*.sh'
    ],
    indicators: ['monitoring', 'health check', 'alerting']
  }
];

export class ComponentDetector {
  private readonly minimumAge: number;

  constructor(
    private projectRoot: string,
    minimumAge: number = 7
  ) {
    this.minimumAge = minimumAge;
  }

  async detectComponents(
    includeRecent: boolean = false,
    minConfidence: number = 0.7
  ): Promise<DetectionResult> {
    const components: DetectedComponent[] = [];

    // Detect components for each pattern
    for (const pattern of DETECTION_PATTERNS) {
      const detectedComponents = await this.detectByPattern(pattern);
      components.push(...detectedComponents);
    }

    // Filter by confidence
    const filteredComponents = components.filter(c => c.confidence >= minConfidence);

    // Filter by age if includeRecent is false
    const finalComponents = includeRecent
      ? filteredComponents
      : filteredComponents.filter(c => c.isPermanent);

    // Calculate summary
    const summary = this.calculateSummary(finalComponents);

    return {
      components: finalComponents,
      summary
    };
  }

  private async detectByPattern(pattern: ComponentPattern): Promise<DetectedComponent[]> {
    const components: DetectedComponent[] = [];

    for (const globPattern of pattern.patterns) {
      const matches = await glob(globPattern, {
        cwd: this.projectRoot,
        absolute: false,
        nodir: false
      });

      for (const match of matches) {
        const component = await this.analyzeComponent(match, pattern);
        if (component) {
          components.push(component);
        }
      }
    }

    return components;
  }

  private async analyzeComponent(
    filePath: string,
    pattern: ComponentPattern
  ): Promise<DetectedComponent | null> {
    try {
      const absolutePath = path.join(this.projectRoot, filePath);
      const stats = await fs.stat(absolutePath);

      // Calculate age
      const createdDate = stats.birthtime || stats.mtime;
      const ageInDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const isPermanent = ageInDays >= this.minimumAge;

      // Read file content to check indicators
      const content = await this.readFileContent(absolutePath, stats.isDirectory());
      const matchedIndicators = this.findMatchedIndicators(content, pattern.indicators);

      // Calculate confidence based on indicators
      const confidence = this.calculateConfidence(matchedIndicators, pattern.indicators);

      // Check documentation status
      const documentationStatus = await this.checkDocumentationStatus(filePath);

      // Generate component name
      const name = this.generateComponentName(filePath, pattern.type);

      return {
        name,
        type: pattern.type,
        location: filePath,
        createdDate,
        ageInDays,
        isPermanent,
        isDocumented: documentationStatus.inSystemComponents,
        documentationStatus,
        confidence,
        indicators: matchedIndicators
      };
    } catch (error) {
      // File doesn't exist or can't be read
      return null;
    }
  }

  private async readFileContent(filePath: string, isDirectory: boolean): Promise<string> {
    try {
      if (isDirectory) {
        // For directories, read README or key files
        const readmePath = path.join(filePath, 'README.md');
        try {
          return await fs.readFile(readmePath, 'utf-8');
        } catch {
          return '';
        }
      } else {
        return await fs.readFile(filePath, 'utf-8');
      }
    } catch {
      return '';
    }
  }

  private findMatchedIndicators(content: string, indicators: string[]): string[] {
    const matched: string[] = [];
    const lowerContent = content.toLowerCase();

    for (const indicator of indicators) {
      if (lowerContent.includes(indicator.toLowerCase())) {
        matched.push(indicator);
      }
    }

    return matched;
  }

  private calculateConfidence(matched: string[], total: string[]): number {
    if (total.length === 0) return 0.5; // Base confidence if no indicators
    const matchRatio = matched.length / total.length;
    // Boost confidence if at least one indicator matches
    return matched.length > 0 ? Math.min(0.5 + matchRatio * 0.5, 1.0) : 0.3;
  }

  private async checkDocumentationStatus(componentPath: string): Promise<{
    inSystemComponents: boolean;
    inWorkspaceArchitecture: boolean;
    inStartHere: boolean;
  }> {
    const status = {
      inSystemComponents: false,
      inWorkspaceArchitecture: false,
      inStartHere: false
    };

    try {
      // Check SYSTEM-COMPONENTS.md
      const systemComponentsPath = path.join(this.projectRoot, 'SYSTEM-COMPONENTS.md');
      try {
        const content = await fs.readFile(systemComponentsPath, 'utf-8');
        status.inSystemComponents = content.includes(componentPath);
      } catch {
        // File doesn't exist
      }

      // Check WORKSPACE_ARCHITECTURE.md
      const workspaceArchPath = path.join(this.projectRoot, 'WORKSPACE_ARCHITECTURE.md');
      try {
        const content = await fs.readFile(workspaceArchPath, 'utf-8');
        status.inWorkspaceArchitecture = content.includes(componentPath);
      } catch {
        // File doesn't exist
      }

      // Check START_HERE.md
      const startHerePath = path.join(this.projectRoot, 'START_HERE.md');
      try {
        const content = await fs.readFile(startHerePath, 'utf-8');
        status.inStartHere = content.includes(componentPath);
      } catch {
        // File doesn't exist
      }
    } catch (error) {
      // Error checking documentation
    }

    return status;
  }

  private generateComponentName(filePath: string, type: ComponentType): string {
    const basename = path.basename(filePath, path.extname(filePath));

    // Convert kebab-case or snake_case to Title Case
    const titleCase = basename
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Add type suffix if not already present
    const typeSuffix = this.getTypeSuffix(type);
    if (!titleCase.toLowerCase().includes(typeSuffix.toLowerCase())) {
      return `${titleCase} ${typeSuffix}`;
    }

    return titleCase;
  }

  private getTypeSuffix(type: ComponentType): string {
    switch (type) {
      case 'automation':
        return 'Automation';
      case 'infrastructure':
        return 'Infrastructure';
      case 'integration':
        return 'Integration';
      case 'protection':
        return 'Protection';
      case 'monitoring':
        return 'Monitor';
      default:
        return 'Component';
    }
  }

  private calculateSummary(components: DetectedComponent[]): {
    total: number;
    documented: number;
    undocumented: number;
    byType: Record<ComponentType, number>;
  } {
    const byType: Record<ComponentType, number> = {
      automation: 0,
      infrastructure: 0,
      integration: 0,
      protection: 0,
      monitoring: 0
    };

    let documented = 0;

    for (const component of components) {
      byType[component.type]++;
      if (component.isDocumented) {
        documented++;
      }
    }

    return {
      total: components.length,
      documented,
      undocumented: components.length - documented,
      byType
    };
  }
}
