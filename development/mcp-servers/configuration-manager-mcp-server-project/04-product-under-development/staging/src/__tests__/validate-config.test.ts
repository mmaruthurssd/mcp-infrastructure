/**
 * Unit tests for validate_config tool
 */

import { validateConfig } from '../tools/validate-config';
import * as configValidator from '../utils/config-validator';

describe('validate_config tool', () => {
  it('should validate a valid config successfully', async () => {
    jest.spyOn(configValidator, 'validateConfig').mockResolvedValue({
      success: true,
      valid: true,
      configPath: '/path/to/config.json',
      schemaUsed: 'built-in:mcp-config',
    });

    const result = await validateConfig({
      configPath: '/path/to/config.json',
      schemaType: 'mcp-config',
    });

    expect(result.success).toBe(true);
    expect(result.valid).toBe(true);
  });

  it('should handle validation errors', async () => {
    jest.spyOn(configValidator, 'validateConfig').mockResolvedValue({
      success: true,
      valid: false,
      configPath: '/path/to/config.json',
      schemaUsed: 'built-in:mcp-config',
      errors: [
        {
          path: '/mcpServers',
          message: 'Required property missing',
          severity: 'error',
        },
      ],
      suggestions: ['Add missing required field: /mcpServers'],
    });

    const result = await validateConfig({
      configPath: '/path/to/config.json',
      schemaType: 'mcp-config',
    });

    expect(result.success).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.suggestions).toContain('Add missing required field: /mcpServers');
  });

  it('should generate text report when requested', async () => {
    jest.spyOn(configValidator, 'validateConfig').mockResolvedValue({
      success: true,
      valid: true,
      configPath: '/path/to/config.json',
      schemaUsed: 'built-in:mcp-config',
      report: 'Configuration Validation Report\n...',
    });

    const result = await validateConfig({
      configPath: '/path/to/config.json',
      schemaType: 'mcp-config',
      reportFormat: 'text',
    });

    expect(result.report).toBeDefined();
    expect(result.report).toContain('Configuration Validation Report');
  });
});
