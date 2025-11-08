/**
 * Sample test to verify Jest setup
 */

describe('Security MCP Test Setup', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  it('should support TypeScript', () => {
    const testValue: string = 'TypeScript works';
    expect(testValue).toContain('TypeScript');
  });
});
