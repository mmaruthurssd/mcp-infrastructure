import prettier from 'prettier';

/**
 * Format TypeScript code using Prettier
 */
export async function formatCode(code: string, parser: 'typescript' | 'babel' = 'typescript'): Promise<string> {
  try {
    const formatted = await prettier.format(code, {
      parser,
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
      printWidth: 100,
      tabWidth: 2,
      useTabs: false,
    });
    return formatted;
  } catch (error) {
    console.error('Prettier formatting failed:', error);
    // Return original code if formatting fails
    return code;
  }
}

/**
 * Validate that code can be formatted (i.e., it's syntactically valid)
 */
export async function isValidCode(code: string, parser: 'typescript' | 'babel' = 'typescript'): Promise<boolean> {
  try {
    await prettier.format(code, { parser });
    return true;
  } catch {
    return false;
  }
}

/**
 * Clean up generated code (remove excessive newlines, fix indentation)
 */
export function cleanupCode(code: string): string {
  // Remove excessive blank lines (more than 2 consecutive)
  let cleaned = code.replace(/\n{3,}/g, '\n\n');

  // Ensure file ends with single newline
  cleaned = cleaned.trim() + '\n';

  return cleaned;
}

/**
 * Add header comment to generated test file
 */
export function addFileHeader(sourceFile: string, framework: string): string {
  const timestamp = new Date().toISOString();
  return `/**
 * Auto-generated test file
 * Source: ${sourceFile}
 * Framework: ${framework}
 * Generated: ${timestamp}
 *
 * Note: Review and customize these tests as needed.
 */\n\n`;
}
