import { readFile, writeFile, access, constants } from 'fs/promises';
import { dirname, resolve, join, extname, basename } from 'path';

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely read a file with error handling
 */
export async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Failed to read file ${filePath}:`, error);
    return null;
  }
}

/**
 * Safely write a file with error handling
 */
export async function writeFileSafe(filePath: string, content: string): Promise<boolean> {
  try {
    await writeFile(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Failed to write file ${filePath}:`, error);
    return false;
  }
}

/**
 * Validate that a path is absolute and exists
 */
export async function validateFilePath(filePath: string): Promise<{ valid: boolean; error?: string }> {
  if (!filePath) {
    return { valid: false, error: 'File path is required' };
  }

  if (!filePath.startsWith('/')) {
    return { valid: false, error: 'File path must be absolute' };
  }

  const exists = await fileExists(filePath);
  if (!exists) {
    return { valid: false, error: `File does not exist: ${filePath}` };
  }

  return { valid: true };
}

/**
 * Validate file extension
 */
export function validateFileExtension(filePath: string, allowedExtensions: string[]): { valid: boolean; error?: string } {
  const ext = extname(filePath);
  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension. Expected one of: ${allowedExtensions.join(', ')}. Got: ${ext}`
    };
  }
  return { valid: true };
}

/**
 * Generate test file path from source file path
 * e.g., /path/to/utils.ts → /path/to/utils.test.ts
 */
export function generateTestFilePath(sourceFile: string, framework: string = 'jest'): string {
  const dir = dirname(sourceFile);
  const ext = extname(sourceFile);
  const base = basename(sourceFile, ext);

  // Jest convention: *.test.ts or *.spec.ts
  const testExt = framework === 'mocha' ? '.spec.ts' : '.test.ts';
  return join(dir, `${base}${testExt}`);
}

/**
 * Resolve relative path from project root
 */
export function resolveProjectPath(projectPath: string, relativePath: string): string {
  return resolve(projectPath, relativePath);
}

/**
 * Prevent path traversal attacks
 */
export function sanitizePath(filePath: string): string {
  // Remove any ../ sequences
  const normalized = resolve(filePath);
  return normalized;
}

/**
 * Check if path is within allowed directory
 */
export function isPathWithinDirectory(filePath: string, allowedDir: string): boolean {
  const normalizedFile = resolve(filePath);
  const normalizedDir = resolve(allowedDir);
  return normalizedFile.startsWith(normalizedDir);
}
