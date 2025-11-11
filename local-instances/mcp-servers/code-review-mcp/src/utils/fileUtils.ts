/**
 * File utility functions
 */
import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';

export interface FileInfo {
  path: string;
  content: string;
  language: string;
  linesOfCode: number;
}

export async function readFile(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf-8');
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function getFiles(targetPath: string, extensions?: string[]): Promise<string[]> {
  // Resolve to absolute path
  const absolutePath = path.resolve(targetPath);

  const stats = await fs.stat(absolutePath);

  if (stats.isFile()) {
    return [absolutePath];
  }

  // Directory: glob for files
  // Default to code file extensions if none provided
  const defaultExtensions = ['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'gs'];
  const exts = extensions || defaultExtensions;
  const extPattern = exts.length > 1 ? `{${exts.join(',')}}` : exts[0];
  const pattern = path.join(absolutePath, `**/*.${extPattern}`);

  const files = await glob(pattern, { ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'] });

  return files;
}

export function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  const languageMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.py': 'python',
    '.java': 'java',
    '.gs': 'appsscript',
  };

  return languageMap[ext] || 'unknown';
}

export function countLines(content: string): number {
  return content.split('\n').length;
}

export async function analyzeFile(filePath: string): Promise<FileInfo> {
  const content = await readFile(filePath);
  const language = detectLanguage(filePath);
  const linesOfCode = countLines(content);

  return {
    path: filePath,
    content,
    language,
    linesOfCode,
  };
}
