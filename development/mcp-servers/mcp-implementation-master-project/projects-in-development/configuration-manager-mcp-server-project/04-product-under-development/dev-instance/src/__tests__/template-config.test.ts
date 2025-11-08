/**
 * Unit tests for template_config tool
 */

import { templateConfig } from '../tools/template-config';
import * as templateGenerator from '../utils/template-generator';

describe('template_config tool', () => {
  it('should generate mcp-server template successfully', async () => {
    jest.spyOn(templateGenerator, 'generateTemplate').mockResolvedValue({
      filesCreated: ['/path/to/.mcp.json'],
      content: '{\n  "mcpServers": {\n    "my-server": {}\n  }\n}',
      instructions: ['Update the command and args to match your MCP server setup'],
    });

    const result = await templateConfig({
      templateType: 'mcp-server',
      outputPath: '/path/to',
      options: { projectName: 'my-server' },
    });

    expect(result.success).toBe(true);
    expect(result.filesCreated).toHaveLength(1);
    expect(result.instructions).toBeDefined();
  });

  it('should generate multiple environment files', async () => {
    jest.spyOn(templateGenerator, 'generateEnvironmentTemplates').mockResolvedValue([
      '/path/to/.env',
      '/path/to/.env.staging',
      '/path/to/.env.production',
    ]);

    const result = await templateConfig({
      templateType: 'environment',
      outputPath: '/path/to',
      options: {
        environments: ['development', 'staging', 'production'],
      },
    });

    expect(result.success).toBe(true);
    expect(result.filesCreated).toHaveLength(3);
  });
});
