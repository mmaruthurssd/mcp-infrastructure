/**
 * Phase 5: Documentation Suggester
 * Auto-generates documentation entries for undocumented components
 */

import { promises as fs } from 'fs';
import path from 'path';
import type {
  DetectedComponent,
  DocumentationSuggestion,
  ComponentType
} from './types.js';

export class DocumentationSuggester {
  constructor(private projectRoot: string) {}

  async suggestDocumentation(
    componentPath: string,
    analyzeContent: boolean = true
  ): Promise<DocumentationSuggestion> {
    const absolutePath = path.join(this.projectRoot, componentPath);

    // Analyze component
    const metadata = analyzeContent
      ? await this.analyzeComponent(absolutePath, componentPath)
      : await this.generateBasicMetadata(componentPath);

    // Detect component type and details
    const component = await this.detectComponentDetails(componentPath, metadata);

    // Generate documentation entries
    const suggestedEntries = this.generateDocumentationEntries(component, metadata);

    // Calculate confidence based on analysis depth
    const confidence = this.calculateSuggestionConfidence(metadata, analyzeContent);

    return {
      component,
      suggestedEntries,
      metadata,
      confidence
    };
  }

  private async analyzeComponent(absolutePath: string, relativePath: string): Promise<{
    estimatedPurpose: string;
    suggestedStatus: string;
    dependencies: string[];
    quickStartCommand?: string;
  }> {
    const metadata = {
      estimatedPurpose: '',
      suggestedStatus: '🟡 In Development',
      dependencies: [] as string[],
      quickStartCommand: undefined as string | undefined
    };

    try {
      const stats = await fs.stat(absolutePath);

      if (stats.isDirectory()) {
        // Check for README
        const readmePath = path.join(absolutePath, 'README.md');
        try {
          const readme = await fs.readFile(readmePath, 'utf-8');
          metadata.estimatedPurpose = this.extractPurposeFromReadme(readme);
          metadata.dependencies = this.extractDependencies(readme);
          metadata.quickStartCommand = this.extractQuickStart(readme, relativePath);
        } catch {
          // No README
          metadata.estimatedPurpose = this.inferPurposeFromPath(relativePath);
        }

        // Check for package.json (automation)
        const packagePath = path.join(absolutePath, 'package.json');
        try {
          const pkg = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
          if (pkg.description) {
            metadata.estimatedPurpose = pkg.description;
          }
          if (pkg.dependencies) {
            metadata.dependencies.push(...Object.keys(pkg.dependencies));
          }
        } catch {
          // No package.json
        }
      } else {
        // Single file component
        const content = await fs.readFile(absolutePath, 'utf-8');
        metadata.estimatedPurpose = this.extractPurposeFromContent(content, relativePath);
        metadata.dependencies = this.extractDependenciesFromContent(content);

        // Check for workflow file
        if (relativePath.includes('.github/workflows/')) {
          metadata.suggestedStatus = '✅ Active';
          metadata.quickStartCommand = this.extractWorkflowCommand(relativePath);
        }
      }

      // Infer status from age and content
      const age = Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24));
      if (age > 30) {
        metadata.suggestedStatus = '✅ Active';
      }
    } catch (error) {
      metadata.estimatedPurpose = this.inferPurposeFromPath(relativePath);
    }

    return metadata;
  }

  private async generateBasicMetadata(componentPath: string): Promise<{
    estimatedPurpose: string;
    suggestedStatus: string;
    dependencies: string[];
    quickStartCommand?: string;
  }> {
    return {
      estimatedPurpose: this.inferPurposeFromPath(componentPath),
      suggestedStatus: '🟡 In Development',
      dependencies: [],
      quickStartCommand: undefined
    };
  }

  private async detectComponentDetails(
    componentPath: string,
    metadata: any
  ): Promise<DetectedComponent> {
    // Simplified component detection for suggestion purposes
    const type = this.inferComponentType(componentPath);
    const name = this.generateComponentName(componentPath, type);

    const absolutePath = path.join(this.projectRoot, componentPath);
    let createdDate = new Date();
    let ageInDays = 0;

    try {
      const stats = await fs.stat(absolutePath);
      createdDate = stats.birthtime || stats.mtime;
      ageInDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      // Use current date
    }

    return {
      name,
      type,
      location: componentPath,
      createdDate,
      ageInDays,
      isPermanent: ageInDays >= 7,
      isDocumented: false,
      documentationStatus: {
        inSystemComponents: false,
        inWorkspaceArchitecture: false,
        inStartHere: false
      },
      confidence: 0.8,
      indicators: []
    };
  }

  private inferComponentType(componentPath: string): ComponentType {
    const lower = componentPath.toLowerCase();

    if (lower.includes('.github/workflows') || lower.includes('automation/')) {
      return 'automation';
    }
    if (lower.includes('backup') || lower.includes('restore') || lower.includes('infrastructure')) {
      return 'infrastructure';
    }
    if (lower.includes('integration') || lower.includes('implementation projects')) {
      return 'integration';
    }
    if (lower.includes('hook') || lower.includes('security') || lower.includes('protection')) {
      return 'protection';
    }
    if (lower.includes('monitor') || lower.includes('health')) {
      return 'monitoring';
    }

    return 'infrastructure';
  }

  private generateComponentName(componentPath: string, type: ComponentType): string {
    const basename = path.basename(componentPath, path.extname(componentPath));

    // Convert kebab-case or snake_case to Title Case
    const titleCase = basename
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return titleCase;
  }

  private generateDocumentationEntries(
    component: DetectedComponent,
    metadata: any
  ): {
    systemComponents: string;
    workspaceArchitecture?: string;
    startHere?: string;
  } {
    // Generate SYSTEM-COMPONENTS.md entry
    const systemComponents = this.generateSystemComponentsEntry(component, metadata);

    // Generate WORKSPACE_ARCHITECTURE.md entry (if critical infrastructure)
    const workspaceArchitecture = ['infrastructure', 'protection'].includes(component.type)
      ? this.generateWorkspaceArchitectureEntry(component, metadata)
      : undefined;

    // Generate START_HERE.md entry (if critical)
    const startHere = this.shouldIncludeInStartHere(component)
      ? this.generateStartHereEntry(component, metadata)
      : undefined;

    return {
      systemComponents,
      workspaceArchitecture,
      startHere
    };
  }

  private generateSystemComponentsEntry(component: DetectedComponent, metadata: any): string {
    let entry = `### ${component.name}\n`;
    entry += `**Location:** \`${component.location}\`\n`;
    entry += `**Status:** ${metadata.suggestedStatus}\n`;
    entry += `**Purpose:** ${metadata.estimatedPurpose}\n`;

    if (metadata.dependencies && metadata.dependencies.length > 0) {
      entry += `**Dependencies:** ${metadata.dependencies.slice(0, 3).join(', ')}${metadata.dependencies.length > 3 ? '...' : ''}\n`;
    }

    if (metadata.quickStartCommand) {
      entry += `**Quick Test:** \`${metadata.quickStartCommand}\`\n`;
    }

    return entry;
  }

  private generateWorkspaceArchitectureEntry(component: DetectedComponent, metadata: any): string {
    let entry = `## ${component.name}\n\n`;
    entry += `**Type:** ${component.type}\n`;
    entry += `**Location:** \`${component.location}\`\n\n`;
    entry += `### Purpose\n${metadata.estimatedPurpose}\n\n`;

    if (metadata.dependencies && metadata.dependencies.length > 0) {
      entry += `### Dependencies\n`;
      metadata.dependencies.forEach((dep: string) => {
        entry += `- ${dep}\n`;
      });
      entry += '\n';
    }

    return entry;
  }

  private generateStartHereEntry(component: DetectedComponent, metadata: any): string {
    return `- **${component.name}** - ${metadata.estimatedPurpose}`;
  }

  private shouldIncludeInStartHere(component: DetectedComponent): boolean {
    // Include critical infrastructure and protection components
    return ['infrastructure', 'protection'].includes(component.type);
  }

  private extractPurposeFromReadme(readme: string): string {
    // Look for purpose/description in README
    const lines = readme.split('\n');

    // Check for ## Purpose or ## Description section
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.match(/^#+\s*(Purpose|Description|Overview)/i)) {
        // Return next non-empty line
        for (let j = i + 1; j < lines.length; j++) {
          const content = lines[j].trim();
          if (content && !content.startsWith('#')) {
            return content.replace(/^[*-]\s*/, '');
          }
        }
      }
    }

    // Fallback: use first non-heading paragraph
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.length > 20) {
        return trimmed;
      }
    }

    return 'System component';
  }

  private extractPurposeFromContent(content: string, path: string): string {
    const lines = content.split('\n').slice(0, 20); // Check first 20 lines

    // Look for description comment
    for (const line of lines) {
      const comment = line.match(/(?:\/\/|#)\s*(.+)/);
      if (comment && comment[1].length > 20 && !comment[1].includes('!/usr/bin')) {
        return comment[1].trim();
      }
    }

    return this.inferPurposeFromPath(path);
  }

  private inferPurposeFromPath(componentPath: string): string {
    if (componentPath.includes('backup')) {
      return 'Automated backup system';
    }
    if (componentPath.includes('restore')) {
      return 'Data restoration system';
    }
    if (componentPath.includes('workflow')) {
      return 'Automated workflow';
    }
    if (componentPath.includes('monitor')) {
      return 'System monitoring';
    }
    if (componentPath.includes('health')) {
      return 'Health check system';
    }

    return 'System component';
  }

  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      // Look for import/require statements
      const importMatch = line.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        dependencies.push(importMatch[1]);
      }

      const requireMatch = line.match(/require\(['"]([^'"]+)['"]\)/);
      if (requireMatch) {
        dependencies.push(requireMatch[1]);
      }
    }

    return [...new Set(dependencies)];
  }

  private extractDependenciesFromContent(content: string): string[] {
    return this.extractDependencies(content);
  }

  private extractQuickStart(readme: string, componentPath: string): string | undefined {
    const lines = readme.split('\n');

    // Look for Quick Start section
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^#+\s*Quick\s*Start/i)) {
        // Find first code block
        for (let j = i + 1; j < lines.length; j++) {
          const codeMatch = lines[j].match(/`([^`]+)`/);
          if (codeMatch) {
            return codeMatch[1];
          }
        }
      }
    }

    return undefined;
  }

  private extractWorkflowCommand(workflowPath: string): string {
    const filename = path.basename(workflowPath);
    return `gh run list --workflow=${filename} --limit 5`;
  }

  private calculateSuggestionConfidence(metadata: any, analyzeContent: boolean): number {
    let confidence = 0.5; // Base confidence

    if (analyzeContent) {
      confidence += 0.2;
    }

    if (metadata.estimatedPurpose && metadata.estimatedPurpose.length > 20) {
      confidence += 0.15;
    }

    if (metadata.dependencies && metadata.dependencies.length > 0) {
      confidence += 0.1;
    }

    if (metadata.quickStartCommand) {
      confidence += 0.05;
    }

    return Math.min(confidence, 0.95);
  }
}
