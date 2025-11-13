import fs from 'fs/promises';
import path from 'path';
import type { ProjectFile, FolderIndex, ProjectIndex, IndexMetadata } from './types.js';

export class IndexGenerator {
  private projectRoot: string;
  private indexMetadata: Map<string, IndexMetadata> = new Map();
  private readonly INDEX_FILE_NAME = 'PROJECT_INDEX.md';
  private readonly METADATA_FILE_NAME = '.index-metadata.json';

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Generate complete project index
   */
  async generateProjectIndex(): Promise<ProjectIndex> {
    const startTime = Date.now();
    const index: ProjectIndex = {
      generated: new Date().toISOString(),
      projectRoot: this.projectRoot,
      totalFiles: 0,
      totalFolders: 0,
      folderIndexes: new Map(),
      filesByCategory: new Map(),
      recentFiles: []
    };

    // Load existing metadata
    await this.loadMetadata();

    // Scan project directory
    const allFiles = await this.scanDirectory(this.projectRoot, true);
    index.totalFiles = allFiles.filter(f => f.type === 'file').length;
    index.totalFolders = allFiles.filter(f => f.type === 'directory').length;

    // Categorize files
    this.categorizeFiles(allFiles, index);

    // Find recent files (modified in last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    index.recentFiles = allFiles
      .filter(f => f.type === 'file' && f.modified && new Date(f.modified).getTime() > sevenDaysAgo)
      .sort((a, b) => new Date(b.modified!).getTime() - new Date(a.modified!).getTime())
      .slice(0, 20);

    // Generate markdown index
    const markdown = this.generateMarkdown(index);
    await this.writeIndexFile(this.projectRoot, markdown);

    // Update metadata
    await this.updateMetadata(this.projectRoot);

    console.error(`Index generated in ${Date.now() - startTime}ms`);
    return index;
  }

  /**
   * Update indexes for specific paths (Phase III - Targeted Updates)
   */
  async updateIndexesForPaths(paths: string[]): Promise<{ updated: string[]; errors: string[] }> {
    const updated: string[] = [];
    const errors: string[] = [];

    await this.loadMetadata();

    for (const relativePath of paths) {
      try {
        const fullPath = path.join(this.projectRoot, relativePath);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
          // Re-index this folder
          const files = await this.scanDirectory(fullPath, false);
          const markdown = this.generateFolderMarkdown(fullPath, files);
          await this.writeIndexFile(fullPath, markdown);
          await this.updateMetadata(fullPath);
          updated.push(relativePath);
        } else {
          // For files, re-index parent directory
          const parentDir = path.dirname(fullPath);
          if (!updated.includes(path.relative(this.projectRoot, parentDir))) {
            const files = await this.scanDirectory(parentDir, false);
            const markdown = this.generateFolderMarkdown(parentDir, files);
            await this.writeIndexFile(parentDir, markdown);
            await this.updateMetadata(parentDir);
            updated.push(path.relative(this.projectRoot, parentDir));
          }
        }
      } catch (error) {
        errors.push(`${relativePath}: ${error}`);
      }
    }

    return { updated, errors };
  }

  /**
   * Check index freshness (Phase IV - Proactive Monitoring)
   */
  async checkIndexFreshness(relativePath?: string): Promise<IndexMetadata[]> {
    await this.loadMetadata();
    const staleIndexes: IndexMetadata[] = [];

    const checkPath = relativePath
      ? path.join(this.projectRoot, relativePath)
      : this.projectRoot;

    try {
      const metadata = this.indexMetadata.get(checkPath);
      if (!metadata) {
        // No index exists
        staleIndexes.push({
          path: path.relative(this.projectRoot, checkPath),
          lastIndexed: 'never',
          lastModified: 'unknown',
          stale: true
        });
        return staleIndexes;
      }

      // Check if directory has been modified since last index
      const stats = await fs.stat(checkPath);
      const dirModified = stats.mtime.getTime();
      const lastIndexed = new Date(metadata.lastIndexed).getTime();

      if (dirModified > lastIndexed) {
        const staleDays = Math.floor((Date.now() - lastIndexed) / (24 * 60 * 60 * 1000));
        staleIndexes.push({
          ...metadata,
          stale: true,
          staleDays
        });
      }
    } catch (error) {
      // Path doesn't exist or can't be accessed
    }

    return staleIndexes;
  }

  /**
   * Scan directory and return files
   */
  private async scanDirectory(dirPath: string, recursive: boolean): Promise<ProjectFile[]> {
    const files: ProjectFile[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        // Skip hidden files, node_modules, .git, dist, etc.
        if (entry.name.startsWith('.') ||
            entry.name === 'node_modules' ||
            entry.name === 'dist' ||
            entry.name === 'build') {
          continue;
        }

        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.projectRoot, fullPath);

        try {
          const stats = await fs.stat(fullPath);

          const file: ProjectFile = {
            name: entry.name,
            path: fullPath,
            relativePath,
            type: entry.isDirectory() ? 'directory' : 'file',
            size: entry.isFile() ? stats.size : undefined,
            modified: stats.mtime.toISOString(),
            category: this.categorizeFile(entry.name)
          };

          files.push(file);

          // Recurse into subdirectories if requested
          if (recursive && entry.isDirectory()) {
            const subFiles = await this.scanDirectory(fullPath, true);
            files.push(...subFiles);
          }
        } catch (error) {
          // Skip files we can't access
          console.error(`Error accessing ${fullPath}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
    }

    return files;
  }

  /**
   * Categorize file by extension
   */
  private categorizeFile(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();

    const categories: { [key: string]: string[] } = {
      'Documentation': ['.md', '.txt', '.pdf', '.doc', '.docx'],
      'Code': ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.rb', '.php'],
      'Configuration': ['.json', '.yaml', '.yml', '.toml', '.ini', '.env', '.config'],
      'Data': ['.csv', '.xml', '.sql', '.db', '.sqlite'],
      'Images': ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'],
      'Styles': ['.css', '.scss', '.sass', '.less'],
      'Build': ['.lock', '.log'],
    };

    for (const [category, extensions] of Object.entries(categories)) {
      if (extensions.includes(ext)) {
        return category;
      }
    }

    return 'Other';
  }

  /**
   * Categorize all files into categories
   */
  private categorizeFiles(files: ProjectFile[], index: ProjectIndex): void {
    for (const file of files) {
      if (file.type !== 'file') continue;

      const category = file.category || 'Other';
      if (!index.filesByCategory.has(category)) {
        index.filesByCategory.set(category, []);
      }
      index.filesByCategory.get(category)!.push(file);
    }
  }

  /**
   * Generate full markdown index
   */
  private generateMarkdown(index: ProjectIndex): string {
    let md = `# Project Index\n\n`;
    md += `**Generated:** ${new Date(index.generated).toLocaleString()}\n\n`;
    md += `---\n\n`;

    md += `## Overview\n\n`;
    md += `- **Total Files:** ${index.totalFiles}\n`;
    md += `- **Total Folders:** ${index.totalFolders}\n`;
    md += `- **Project Root:** \`${index.projectRoot}\`\n\n`;

    // Recent files
    if (index.recentFiles.length > 0) {
      md += `## Recently Modified Files (Last 7 Days)\n\n`;
      for (const file of index.recentFiles) {
        const modDate = new Date(file.modified!).toLocaleDateString();
        md += `- [\`${file.relativePath}\`](${file.relativePath}) - ${modDate}\n`;
      }
      md += `\n`;
    }

    // Files by category
    md += `## Files by Category\n\n`;
    const sortedCategories = Array.from(index.filesByCategory.entries())
      .sort((a, b) => b[1].length - a[1].length);

    for (const [category, files] of sortedCategories) {
      md += `### ${category} (${files.length} files)\n\n`;
      const sampleFiles = files.slice(0, 10);
      for (const file of sampleFiles) {
        md += `- [\`${file.relativePath}\`](${file.relativePath})\n`;
      }
      if (files.length > 10) {
        md += `- _...and ${files.length - 10} more_\n`;
      }
      md += `\n`;
    }

    md += `---\n\n`;
    md += `_Generated by Project Index Generator MCP Server_\n`;

    return md;
  }

  /**
   * Generate folder-specific markdown
   */
  private generateFolderMarkdown(dirPath: string, files: ProjectFile[]): string {
    const folderName = path.basename(dirPath);
    let md = `# ${folderName} - Folder Index\n\n`;
    md += `**Generated:** ${new Date().toLocaleString()}\n`;
    md += `**Path:** \`${path.relative(this.projectRoot, dirPath)}\`\n\n`;
    md += `---\n\n`;

    const fileList = files.filter(f => f.type === 'file');
    const dirList = files.filter(f => f.type === 'directory');

    if (dirList.length > 0) {
      md += `## Subdirectories (${dirList.length})\n\n`;
      for (const dir of dirList) {
        md += `- 📁 **${dir.name}**\n`;
      }
      md += `\n`;
    }

    if (fileList.length > 0) {
      md += `## Files (${fileList.length})\n\n`;

      // Group by category
      const byCategory = new Map<string, ProjectFile[]>();
      for (const file of fileList) {
        const cat = file.category || 'Other';
        if (!byCategory.has(cat)) byCategory.set(cat, []);
        byCategory.get(cat)!.push(file);
      }

      for (const [category, catFiles] of byCategory) {
        md += `### ${category}\n\n`;
        for (const file of catFiles) {
          const sizeKB = file.size ? `(${(file.size / 1024).toFixed(1)} KB)` : '';
          md += `- ${file.name} ${sizeKB}\n`;
        }
        md += `\n`;
      }
    }

    md += `---\n\n`;
    md += `_Generated by Project Index Generator MCP Server_\n`;

    return md;
  }

  /**
   * Write index file to directory
   */
  private async writeIndexFile(dirPath: string, content: string): Promise<void> {
    const indexPath = path.join(dirPath, this.INDEX_FILE_NAME);
    await fs.writeFile(indexPath, content, 'utf-8');
  }

  /**
   * Load metadata from file
   */
  private async loadMetadata(): Promise<void> {
    const metadataPath = path.join(this.projectRoot, this.METADATA_FILE_NAME);
    try {
      const data = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(data);
      this.indexMetadata = new Map(Object.entries(metadata));
    } catch (error) {
      // No metadata file exists yet
      this.indexMetadata = new Map();
    }
  }

  /**
   * Update metadata for a path
   */
  private async updateMetadata(dirPath: string): Promise<void> {
    try {
      const stats = await fs.stat(dirPath);
      this.indexMetadata.set(dirPath, {
        path: path.relative(this.projectRoot, dirPath),
        lastIndexed: new Date().toISOString(),
        lastModified: stats.mtime.toISOString(),
        stale: false
      });

      await this.saveMetadata();
    } catch (error) {
      console.error(`Error updating metadata for ${dirPath}:`, error);
    }
  }

  /**
   * Save metadata to file
   */
  private async saveMetadata(): Promise<void> {
    const metadataPath = path.join(this.projectRoot, this.METADATA_FILE_NAME);
    const metadata = Object.fromEntries(this.indexMetadata);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }
}
