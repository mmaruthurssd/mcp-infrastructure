/**
 * Tool: create_from_template
 * Creates a new checklist from a template with variable substitution
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  CreateFromTemplateParams,
  CreateFromTemplateResponse,
} from '../types/index.js';

export async function createFromTemplate(
  params: CreateFromTemplateParams
): Promise<CreateFromTemplateResponse> {
  try {
    // Read template file
    const templateContent = await fs.readFile(params.template_path, 'utf-8');

    // Perform variable substitution
    let outputContent = templateContent;
    if (params.variables) {
      for (const [key, value] of Object.entries(params.variables)) {
        // Replace {{variable_name}} with actual value
        const regex = new RegExp(`{{${key}}}`, 'g');
        outputContent = outputContent.replace(regex, value);
      }
    }

    // Add/update metadata in frontmatter
    const lines = outputContent.split('\n');
    let inFrontmatter = false;
    let frontmatterEndIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        if (!inFrontmatter) {
          inFrontmatter = true;
        } else {
          frontmatterEndIndex = i;
          break;
        }
      }
    }

    // Update or add metadata fields
    const today = new Date().toISOString();
    if (frontmatterEndIndex > 0) {
      // Update existing frontmatter
      const frontmatterLines = lines.slice(1, frontmatterEndIndex);
      const metadata = new Map<string, string>();

      // Parse existing metadata
      for (const line of frontmatterLines) {
        const match = line.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          metadata.set(match[1].trim(), match[2].trim());
        }
      }

      // Update with new values
      metadata.set('created', today);
      metadata.set('last-updated', today);
      metadata.set('status', 'not-started');
      if (params.owner) metadata.set('owner', params.owner);
      if (params.enforcement) metadata.set('enforcement', params.enforcement);

      // Rebuild frontmatter
      const newFrontmatter = ['---'];
      for (const [key, value] of metadata.entries()) {
        newFrontmatter.push(`${key}: ${value}`);
      }
      newFrontmatter.push('---');

      // Replace old frontmatter with new
      lines.splice(0, frontmatterEndIndex + 1, ...newFrontmatter);
      outputContent = lines.join('\n');
    }

    // Ensure output directory exists
    const outputDir = path.dirname(params.output_path);
    await fs.mkdir(outputDir, { recursive: true });

    // Write output file
    await fs.writeFile(params.output_path, outputContent, 'utf-8');

    return {
      success: true,
      message: `Checklist created from template: ${params.output_path}`,
      output_path: params.output_path,
      variables_applied: params.variables
        ? Object.keys(params.variables).length
        : 0,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Failed to create checklist from template: ${errorMessage}`,
      output_path: params.output_path,
      variables_applied: 0,
    };
  }
}
