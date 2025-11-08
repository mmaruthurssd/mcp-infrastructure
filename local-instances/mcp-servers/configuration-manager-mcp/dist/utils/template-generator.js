/**
 * Template Generator - Generate configuration file templates
 * Provides predefined templates with placeholder replacement
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigurationError } from '../types.js';
/**
 * Replace placeholders in template content
 */
function replacePlaceholders(content, replacements) {
    let result = content;
    for (const [key, value] of Object.entries(replacements)) {
        const placeholder = `{{${key}}}`;
        result = result.replace(new RegExp(placeholder, 'g'), value);
    }
    return result;
}
/**
 * Get template content for MCP server configuration
 */
function getMcpServerTemplate(options) {
    const projectName = options.projectName || 'my-mcp-server';
    const includeComments = options.includeComments !== false;
    let content = `{
  ${includeComments ? '// MCP Server Configuration\n  ' : ''}"mcpServers": {
    "${projectName}": {
      "command": "node",
      "args": ["./dist/index.js"]`;
    if (options.includeExamples) {
        content += `,
      "env": {
        ${includeComments ? '// Optional environment variables\n        ' : ''}"NODE_ENV": "production"
      }`;
    }
    content += `
    }
  }
}`;
    return content;
}
/**
 * Get template content for project configuration
 */
function getProjectTemplate(options) {
    const projectName = options.projectName || 'my-project';
    const includeComments = options.includeComments !== false;
    return `{
  ${includeComments ? '// Project Configuration\n  ' : ''}"name": "${projectName}",
  "type": "software",
  "version": "1.0.0",
  "description": "Project description",
  "owner": "Team Name",
  "status": "active",
  "created": "${new Date().toISOString().split('T')[0]}"
}`;
}
/**
 * Get template content for environment configuration
 */
function getEnvironmentTemplate(options) {
    const includeComments = options.includeComments !== false;
    const includeExamples = options.includeExamples !== false;
    let content = '';
    if (includeComments) {
        content += `# Environment Configuration
# Generated: ${new Date().toISOString()}

`;
    }
    content += `# Application
NODE_ENV=development
PORT=3000

`;
    if (includeExamples) {
        content += `# Database
${includeComments ? '# DATABASE_URL=postgresql://user:password@localhost:5432/dbname\n' : ''}
# API Keys
${includeComments ? '# API_KEY=your-api-key-here\n' : ''}
# Feature Flags
${includeComments ? '# FEATURE_X_ENABLED=true\n' : ''}`;
    }
    return content;
}
/**
 * Get template content for GitHub Actions
 */
function getGitHubActionTemplate(options) {
    const projectName = options.projectName || 'project';
    return `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Build
      run: npm run build

    - name: Deploy
      if: github.ref == 'refs/heads/main'
      run: |
        echo "Deploying ${projectName}..."
`;
}
/**
 * Get template content for Docker
 */
function getDockerTemplate(options) {
    const includeComments = options.includeComments !== false;
    return `${includeComments ? '# Dockerfile\n' : ''}FROM node:18-alpine

WORKDIR /app

${includeComments ? '# Copy package files\n' : ''}COPY package*.json ./

${includeComments ? '# Install dependencies\n' : ''}RUN npm ci --only=production

${includeComments ? '# Copy application files\n' : ''}COPY . .

${includeComments ? '# Build application\n' : ''}RUN npm run build

${includeComments ? '# Expose port\n' : ''}EXPOSE 3000

${includeComments ? '# Start application\n' : ''}CMD ["node", "dist/index.js"]
`;
}
/**
 * Get template content based on type
 */
function getTemplateContent(templateType, options) {
    switch (templateType) {
        case 'mcp-server':
            return getMcpServerTemplate(options);
        case 'project':
            return getProjectTemplate(options);
        case 'environment':
            return getEnvironmentTemplate(options);
        case 'github-action':
            return getGitHubActionTemplate(options);
        case 'docker':
            return getDockerTemplate(options);
        default:
            throw new ConfigurationError('UNKNOWN_TEMPLATE', `Unknown template type: ${templateType}`);
    }
}
/**
 * Get output filename based on template type
 */
function getOutputFilename(templateType) {
    switch (templateType) {
        case 'mcp-server':
            return '.mcp.json';
        case 'project':
            return 'project-config.json';
        case 'environment':
            return '.env';
        case 'github-action':
            return '.github/workflows/ci.yml';
        case 'docker':
            return 'Dockerfile';
        default:
            return 'config.txt';
    }
}
/**
 * Get instructions for next steps
 */
function getInstructions(templateType) {
    switch (templateType) {
        case 'mcp-server':
            return [
                'Update the command and args to match your MCP server setup',
                'Add any required environment variables',
                'Register the MCP server with mcp-config-manager',
            ];
        case 'project':
            return [
                'Update the project description and owner',
                'Set the appropriate project type',
                'Update status as project progresses',
            ];
        case 'environment':
            return [
                'Replace placeholder values with actual configuration',
                'Add to .gitignore to prevent committing secrets',
                'Create environment-specific files (.env.production, etc.)',
            ];
        case 'github-action':
            return [
                'Review and customize the workflow steps',
                'Add any additional jobs or steps',
                'Configure secrets in GitHub repository settings',
            ];
        case 'docker':
            return [
                'Update base image if needed',
                'Adjust build steps for your application',
                'Configure port and environment variables',
            ];
        default:
            return ['Review and customize the generated template'];
    }
}
/**
 * Generate configuration template
 */
export async function generateTemplate(templateType, outputPath, options = {}, customFields = {}) {
    try {
        // Get template content
        let content = getTemplateContent(templateType, options);
        // Apply custom field replacements
        if (Object.keys(customFields).length > 0) {
            content = replacePlaceholders(content, customFields);
        }
        // Determine output file path
        let finalOutputPath = outputPath;
        if (!path.extname(outputPath)) {
            // If outputPath is a directory, append default filename
            finalOutputPath = path.join(outputPath, getOutputFilename(templateType));
        }
        // Check if file exists
        const exists = await fs
            .access(finalOutputPath)
            .then(() => true)
            .catch(() => false);
        if (exists && !options.overwrite) {
            throw new ConfigurationError('FILE_EXISTS', `File already exists: ${finalOutputPath}. Use overwrite option to replace.`);
        }
        // Ensure directory exists
        const dir = path.dirname(finalOutputPath);
        await fs.mkdir(dir, { recursive: true });
        // Write file
        await fs.writeFile(finalOutputPath, content, 'utf-8');
        // Get instructions
        const instructions = getInstructions(templateType);
        return {
            filesCreated: [finalOutputPath],
            content,
            instructions,
        };
    }
    catch (error) {
        if (error instanceof ConfigurationError) {
            throw error;
        }
        throw new ConfigurationError('TEMPLATE_GENERATION_FAILED', `Failed to generate template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Generate multiple environment templates
 */
export async function generateEnvironmentTemplates(outputDir, environments, options = {}) {
    const filesCreated = [];
    for (const env of environments) {
        const filename = env === 'development' ? '.env' : `.env.${env}`;
        const filePath = path.join(outputDir, filename);
        const content = getEnvironmentTemplate({
            ...options,
            includeExamples: env === 'development', // Only include examples in dev
        });
        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');
        filesCreated.push(filePath);
    }
    return filesCreated;
}
//# sourceMappingURL=template-generator.js.map