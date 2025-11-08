/**
 * Tool: manage_allowlist
 *
 * Add or remove entries from the security allow-list to filter false positives
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { AllowListEntry } from '../types/index.js';
import {
  auditAllowListAdded,
  auditAllowListRemoved,
  generateCorrelationId,
} from '../audit/audit-helper.js';

export interface ManageAllowListArgs {
  action: 'add' | 'remove' | 'list';
  entry?: {
    filePath?: string;
    lineNumber?: number;
    patternName?: string;
    matchedText?: string;
    reason: string;
    addedBy?: string;
  };
  index?: number; // For removing by index
}

export interface AllowListResult {
  success: boolean;
  action: string;
  allowList: AllowListEntry[];
  message: string;
}

/**
 * Manage security allow-list
 */
export async function manageAllowList(args: ManageAllowListArgs, configPath?: string): Promise<AllowListResult> {
  const configFile = configPath || findConfigFile();

  // Load allow-list from the config file
  const allowList = await loadAllowListFromFile(configFile);

  switch (args.action) {
    case 'add':
      return await addToAllowList(allowList, args.entry!, configFile);

    case 'remove':
      return await removeFromAllowList(allowList, args.index!, configFile);

    case 'list':
      return listAllowList(allowList);

    default:
      throw new Error(`Unknown action: ${args.action}`);
  }
}

/**
 * Load allow-list from config file
 */
async function loadAllowListFromFile(configFile: string): Promise<AllowListEntry[]> {
  try {
    const content = await fs.readFile(configFile, 'utf-8');
    const config = JSON.parse(content);
    return config.allowList || [];
  } catch (error) {
    // If file doesn't exist or is invalid, return empty list
    return [];
  }
}

/**
 * Add entry to allow-list
 */
async function addToAllowList(
  currentList: AllowListEntry[],
  entry: NonNullable<ManageAllowListArgs['entry']>,
  configFile: string
): Promise<AllowListResult> {
  // Create new entry with timestamp
  const newEntry: AllowListEntry = {
    ...entry,
    addedDate: entry.addedBy ? new Date().toISOString() : undefined,
  };

  // Validate entry
  if (!newEntry.reason) {
    throw new Error('Reason is required for allow-list entries');
  }

  if (!newEntry.filePath && !newEntry.patternName && !newEntry.matchedText) {
    throw new Error('At least one of filePath, patternName, or matchedText must be specified');
  }

  // Check for duplicates
  const isDuplicate = currentList.some((existing) => {
    return (
      existing.filePath === newEntry.filePath &&
      existing.lineNumber === newEntry.lineNumber &&
      existing.patternName === newEntry.patternName &&
      existing.matchedText === newEntry.matchedText
    );
  });

  if (isDuplicate) {
    return {
      success: false,
      action: 'add',
      allowList: currentList,
      message: 'Entry already exists in allow-list',
    };
  }

  // Add to list
  const updatedList = [...currentList, newEntry];

  // Save to config file
  await saveAllowList(updatedList, configFile);

  // Audit event
  const correlationId = generateCorrelationId();
  await auditAllowListAdded(newEntry, correlationId);

  return {
    success: true,
    action: 'add',
    allowList: updatedList,
    message: `Added entry to allow-list (total: ${updatedList.length})`,
  };
}

/**
 * Remove entry from allow-list by index
 */
async function removeFromAllowList(
  currentList: AllowListEntry[],
  index: number,
  configFile: string
): Promise<AllowListResult> {
  if (index < 0 || index >= currentList.length) {
    throw new Error(`Invalid index: ${index}. Allow-list has ${currentList.length} entries.`);
  }

  // Get entry being removed for audit log
  const removedEntry = currentList[index];

  // Remove entry
  const updatedList = currentList.filter((_, i) => i !== index);

  // Save to config file
  await saveAllowList(updatedList, configFile);

  // Audit event
  const correlationId = generateCorrelationId();
  await auditAllowListRemoved(index, removedEntry, correlationId);

  return {
    success: true,
    action: 'remove',
    allowList: updatedList,
    message: `Removed entry at index ${index} (remaining: ${updatedList.length})`,
  };
}

/**
 * List all allow-list entries
 */
function listAllowList(currentList: AllowListEntry[]): AllowListResult {
  return {
    success: true,
    action: 'list',
    allowList: currentList,
    message: `Allow-list contains ${currentList.length} entries`,
  };
}

/**
 * Save allow-list to config file
 */
async function saveAllowList(allowList: AllowListEntry[], configFile: string): Promise<void> {
  try {
    // Read current config
    const content = await fs.readFile(configFile, 'utf-8');
    const config = JSON.parse(content);

    // Update allow-list
    config.allowList = allowList;

    // Write back
    await fs.writeFile(configFile, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  } catch (error) {
    throw new Error(`Failed to save allow-list: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Find config file in current directory or parent directories
 */
function findConfigFile(): string {
  const configNames = ['security-config.json', '.security-config.json'];
  let currentDir = process.cwd();

  // Search up to 5 levels
  for (let i = 0; i < 5; i++) {
    for (const name of configNames) {
      const configPath = path.join(currentDir, name);
      try {
        // Check if file exists synchronously for simplicity
        if (require('fs').existsSync(configPath)) {
          return configPath;
        }
      } catch {
        // Continue searching
      }
    }

    const parent = path.dirname(currentDir);
    if (parent === currentDir) break; // Reached root
    currentDir = parent;
  }

  // Default to current directory
  return path.join(process.cwd(), 'security-config.json');
}

/**
 * Format allow-list for display
 */
export function formatAllowList(result: AllowListResult): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('SECURITY ALLOW-LIST');
  lines.push('='.repeat(80));
  lines.push('');

  if (result.allowList.length === 0) {
    lines.push('Allow-list is empty.');
    lines.push('');
    lines.push('Use manage_allowlist with action "add" to add entries.');
  } else {
    lines.push(`Total entries: ${result.allowList.length}`);
    lines.push('');

    result.allowList.forEach((entry, index) => {
      lines.push(`[${index}] Allow-List Entry:`);

      if (entry.filePath) {
        lines.push(`  File: ${entry.filePath}`);
      }
      if (entry.lineNumber !== undefined) {
        lines.push(`  Line: ${entry.lineNumber}`);
      }
      if (entry.patternName) {
        lines.push(`  Pattern: ${entry.patternName}`);
      }
      if (entry.matchedText) {
        lines.push(`  Matched Text: ${entry.matchedText}`);
      }

      lines.push(`  Reason: ${entry.reason}`);

      if (entry.addedBy) {
        lines.push(`  Added By: ${entry.addedBy}`);
      }
      if (entry.addedDate) {
        lines.push(`  Added Date: ${new Date(entry.addedDate).toLocaleString()}`);
      }

      lines.push('');
    });
  }

  lines.push('-'.repeat(80));
  lines.push(`Status: ${result.message}`);
  lines.push('='.repeat(80));

  return lines.join('\n');
}
