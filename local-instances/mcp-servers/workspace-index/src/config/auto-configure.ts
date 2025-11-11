/**
 * Phase 4: Auto-Configuration Logic
 *
 * Detects workspace structure and customizes workspace-index-config.json
 * by replacing {{AUTO_DETECT:...}} placeholders with actual paths.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { WorkspaceConfig } from '../adapters/workspace-adapter.js';

interface DetectionResult {
  developmentDir?: string;
  productionDir?: string;
  archiveDir?: string;
  frameworksDir?: string;
  templatesDir?: string;
  documentationRoots: string[];
  workspaceName: string;
  workspaceType: string;
  maturityLevel: 'new' | 'mature';
  maturityThreshold: number;
}

/**
 * Scan workspace to detect structure patterns
 */
export async function detectWorkspaceStructure(workspaceRoot: string): Promise<DetectionResult> {
  const result: DetectionResult = {
    documentationRoots: [],
    workspaceName: path.basename(workspaceRoot),
    workspaceType: 'development',
    maturityLevel: 'new',
    maturityThreshold: 0.95
  };

  // Detect development directory patterns
  const devPatterns = ['development', 'dev', 'staging', 'src'];
  for (const pattern of devPatterns) {
    const dir = path.join(workspaceRoot, pattern);
    try {
      const stat = await fs.stat(dir);
      if (stat.isDirectory()) {
        result.developmentDir = pattern;
        break;
      }
    } catch {
      // Directory doesn't exist, continue
    }
  }

  // Detect production directory patterns
  const prodPatterns = ['local-instances', 'production', 'prod', 'dist', 'build'];
  for (const pattern of prodPatterns) {
    const dir = path.join(workspaceRoot, pattern);
    try {
      const stat = await fs.stat(dir);
      if (stat.isDirectory()) {
        result.productionDir = pattern;
        break;
      }
    } catch {
      // Directory doesn't exist, continue
    }
  }

  // Detect archive directory
  const archivePatterns = ['archive', 'archived', 'historical', 'old'];
  for (const pattern of archivePatterns) {
    const dir = path.join(workspaceRoot, pattern);
    try {
      const stat = await fs.stat(dir);
      if (stat.isDirectory()) {
        result.archiveDir = pattern;
        break;
      }
    } catch {
      // Directory doesn't exist, continue
    }
  }

  // Detect frameworks directory
  if (result.developmentDir) {
    const frameworksPath = path.join(result.developmentDir, 'frameworks');
    const fullFrameworksPath = path.join(workspaceRoot, frameworksPath);
    try {
      const stat = await fs.stat(fullFrameworksPath);
      if (stat.isDirectory()) {
        result.frameworksDir = frameworksPath;
      }
    } catch {
      // Directory doesn't exist
    }
  }

  // Detect templates directory
  const templatesPatterns = ['templates-and-patterns', 'templates', 'patterns'];
  for (const pattern of templatesPatterns) {
    const dir = path.join(workspaceRoot, pattern);
    try {
      const stat = await fs.stat(dir);
      if (stat.isDirectory()) {
        result.templatesDir = pattern;
        break;
      }
    } catch {
      // Directory doesn't exist, continue
    }
  }

  // Detect documentation root files
  const docPatterns = ['README.md', 'WORKSPACE_GUIDE.md', 'WORKSPACE_ARCHITECTURE.md',
                       'SECURITY_BEST_PRACTICES.md', 'CONTRIBUTING.md', 'CHANGELOG.md'];
  for (const docFile of docPatterns) {
    const filePath = path.join(workspaceRoot, docFile);
    try {
      await fs.access(filePath);
      result.documentationRoots.push(docFile);
    } catch {
      // File doesn't exist
    }
  }

  // Determine workspace type based on contents
  try {
    const files = await fs.readdir(workspaceRoot);

    if (files.includes('package.json')) {
      result.workspaceType = 'nodejs';
    } else if (files.includes('requirements.txt') || files.includes('setup.py')) {
      result.workspaceType = 'python';
    } else if (files.includes('.git')) {
      result.workspaceType = 'git-repository';
    } else {
      result.workspaceType = 'general';
    }
  } catch {
    result.workspaceType = 'general';
  }

  // Determine maturity level based on telemetry/learning history
  const telemetryPath = path.join(workspaceRoot, '.telemetry');
  const learningPath = result.archiveDir
    ? path.join(workspaceRoot, result.archiveDir, 'learned-patterns')
    : null;

  let hasLearningHistory = false;

  try {
    await fs.access(telemetryPath);
    hasLearningHistory = true;
  } catch {
    // No telemetry
  }

  if (learningPath) {
    try {
      await fs.access(learningPath);
      hasLearningHistory = true;
    } catch {
      // No learning patterns
    }
  }

  if (hasLearningHistory) {
    result.maturityLevel = 'mature';
    result.maturityThreshold = 0.85; // Lower threshold for mature workspaces
  } else {
    result.maturityLevel = 'new';
    result.maturityThreshold = 0.95; // Higher threshold for new workspaces
  }

  return result;
}

/**
 * Replace {{AUTO_DETECT:...}} placeholders in config
 */
export async function autoConfigureWorkspace(
  workspaceRoot: string,
  templateConfigPath: string
): Promise<WorkspaceConfig> {
  // Read template config
  const templateContent = await fs.readFile(templateConfigPath, 'utf-8');

  // Detect workspace structure
  const detection = await detectWorkspaceStructure(workspaceRoot);

  // Replace placeholders
  let configContent = templateContent;

  // Replace workspace metadata
  configContent = configContent.replace(
    /"{{AUTO_DETECT:workspace_name}}"/g,
    JSON.stringify(detection.workspaceName)
  );
  configContent = configContent.replace(
    /"{{AUTO_DETECT:workspace_root}}"/g,
    JSON.stringify(workspaceRoot)
  );
  configContent = configContent.replace(
    /"{{AUTO_DETECT:workspace_type}}"/g,
    JSON.stringify(detection.workspaceType)
  );

  // Replace workspace structure paths
  configContent = configContent.replace(
    /"{{AUTO_DETECT:development\/}}"/g,
    JSON.stringify(detection.developmentDir || 'development')
  );
  configContent = configContent.replace(
    /"{{AUTO_DETECT:local-instances\/}}"/g,
    JSON.stringify(detection.productionDir || 'local-instances')
  );
  configContent = configContent.replace(
    /"{{AUTO_DETECT:archive\/}}"/g,
    JSON.stringify(detection.archiveDir || 'archive')
  );
  configContent = configContent.replace(
    /"{{AUTO_DETECT:development\/frameworks\/}}"/g,
    JSON.stringify(detection.frameworksDir || 'development/frameworks')
  );
  configContent = configContent.replace(
    /"{{AUTO_DETECT:templates-and-patterns\/}}"/g,
    JSON.stringify(detection.templatesDir || 'templates-and-patterns')
  );

  // Replace documentation_roots (special handling for array)
  const docRootsJson = JSON.stringify(detection.documentationRoots.join(', '));
  configContent = configContent.replace(
    /"{{AUTO_DETECT:documentation_files}}"/g,
    docRootsJson
  );

  // Replace maturity threshold
  configContent = configContent.replace(
    /"{{AUTO_DETECT:maturity_threshold}}"/g,
    detection.maturityThreshold.toString()
  );

  // Replace timestamp
  const timestamp = new Date().toISOString();
  configContent = configContent.replace(
    /"{{AUTO_DETECT:timestamp}}"/g,
    JSON.stringify(timestamp)
  );

  // Replace maturity level
  configContent = configContent.replace(
    /"{{AUTO_DETECT:maturity}}"/g,
    JSON.stringify(detection.maturityLevel)
  );

  // Parse and return config
  const config: WorkspaceConfig = JSON.parse(configContent);

  return config;
}

/**
 * Save customized config to workspace
 */
export async function saveCustomizedConfig(
  config: WorkspaceConfig,
  outputPath: string
): Promise<void> {
  const configContent = JSON.stringify(config, null, 2);
  await fs.writeFile(outputPath, configContent, 'utf-8');
}
