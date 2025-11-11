/**
 * Scenario Detector - Auto-detects project scenario
 */

import * as fs from 'fs';
import * as path from 'path';
import { Scenario } from '../types.js';

export class ScenarioDetector {
  /**
   * Detect the scenario based on project path contents
   */
  static detect(projectPath: string): Scenario {
    // Check if path exists
    if (!fs.existsSync(projectPath)) {
      return 'new-project';
    }

    // Check for existing SDD specs
    const hasConstitution = this.hasConstitution(projectPath);
    const hasSpecs = this.hasSpecs(projectPath);

    if (hasConstitution && hasSpecs) {
      // Has constitution and specs → continuing development (adding features)
      return 'add-feature';
    }

    // Check for existing code
    const hasCode = this.hasCode(projectPath);

    if (hasCode && !hasConstitution) {
      // Has code but no specs → brownfield/existing project
      return 'existing-project';
    }

    // Default: new project
    return 'new-project';
  }

  /**
   * Check if project has a constitution file
   */
  private static hasConstitution(projectPath: string): boolean {
    const possiblePaths = [
      path.join(projectPath, 'specs', '.specify', 'memory', 'constitution.md'),
      path.join(projectPath, '.specify', 'memory', 'constitution.md'),
      path.join(projectPath, 'constitution.md')
    ];

    return possiblePaths.some(p => fs.existsSync(p));
  }

  /**
   * Check if project has spec files
   */
  private static hasSpecs(projectPath: string): boolean {
    const specsDir = path.join(projectPath, 'specs');

    if (!fs.existsSync(specsDir)) {
      return false;
    }

    try {
      const entries = fs.readdirSync(specsDir, { withFileTypes: true });
      // Look for numbered spec directories (e.g., 001-feature-name)
      const hasNumberedSpecs = entries.some(entry =>
        entry.isDirectory() && /^\d{3}-/.test(entry.name)
      );

      return hasNumberedSpecs;
    } catch {
      return false;
    }
  }

  /**
   * Check if project has existing code
   */
  private static hasCode(projectPath: string): boolean {
    if (!fs.existsSync(projectPath)) {
      return false;
    }

    try {
      const entries = fs.readdirSync(projectPath);

      // Check for common code directories
      const hasCodeDirs = entries.some(entry =>
        ['src', 'lib', 'app', 'components', 'services'].includes(entry) &&
        fs.statSync(path.join(projectPath, entry)).isDirectory()
      );

      // Check for common code files
      const hasCodeFiles = entries.some(entry =>
        /\.(ts|js|py|java|go|rs|rb|php|gs)$/.test(entry)
      );

      // Check for Apps Script files specifically
      const hasAppsScriptFiles = entries.some(entry =>
        entry === 'Code.gs' || entry === 'appsscript.json'
      );

      return hasCodeDirs || hasCodeFiles || hasAppsScriptFiles;
    } catch {
      return false;
    }
  }

  /**
   * Get project type based on directory contents
   */
  static detectProjectType(projectPath: string): string {
    if (!fs.existsSync(projectPath)) {
      return 'unknown';
    }

    try {
      const entries = fs.readdirSync(projectPath);

      // Google Apps Script project
      if (entries.includes('appsscript.json') || entries.some(e => e.endsWith('.gs'))) {
        return 'google-apps-script';
      }

      // Node.js project
      if (entries.includes('package.json')) {
        const packageJsonPath = path.join(projectPath, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

        // Check for MCP server
        if (packageJson.dependencies?.['@modelcontextprotocol/sdk']) {
          return 'mcp-server';
        }

        // Check for web frameworks
        if (packageJson.dependencies?.['react'] || packageJson.dependencies?.['next']) {
          return 'web-app';
        }

        if (packageJson.dependencies?.['express'] || packageJson.dependencies?.['fastify']) {
          return 'api';
        }

        return 'node-tool';
      }

      // Python project
      if (entries.includes('requirements.txt') || entries.includes('pyproject.toml')) {
        return 'python-tool';
      }

      // Generic project
      return 'other';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get suggested spec directory path
   */
  static getSuggestedSpecPath(projectPath: string): string {
    return path.join(projectPath, 'specs');
  }

  /**
   * Get next feature number based on existing specs
   */
  static getNextFeatureNumber(projectPath: string): string {
    const specsDir = path.join(projectPath, 'specs');

    if (!fs.existsSync(specsDir)) {
      return '001';
    }

    try {
      const entries = fs.readdirSync(specsDir, { withFileTypes: true });
      const numbers = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .filter(name => /^\d{3}-/.test(name))
        .map(name => parseInt(name.substring(0, 3), 10))
        .filter(num => !isNaN(num));

      if (numbers.length === 0) {
        return '001';
      }

      const maxNumber = Math.max(...numbers);
      return String(maxNumber + 1).padStart(3, '0');
    } catch {
      return '001';
    }
  }

  /**
   * Create a feature directory name from feature name
   */
  static createFeatureDirectoryName(featureName: string, featureNumber?: string): string {
    const number = featureNumber || '001';
    const slug = featureName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return `${number}-${slug}`;
  }
}
