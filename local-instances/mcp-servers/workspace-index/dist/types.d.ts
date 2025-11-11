export interface ProjectFile {
    name: string;
    path: string;
    relativePath: string;
    type: 'file' | 'directory';
    size?: number;
    modified?: string;
    category?: string;
}
export interface FolderIndex {
    path: string;
    files: ProjectFile[];
    subdirectories: string[];
    fileCount: number;
    lastIndexed: string;
}
export interface ProjectIndex {
    generated: string;
    projectRoot: string;
    totalFiles: number;
    totalFolders: number;
    folderIndexes: Map<string, FolderIndex>;
    filesByCategory: Map<string, ProjectFile[]>;
    recentFiles: ProjectFile[];
}
export interface IndexMetadata {
    path: string;
    lastIndexed: string;
    lastModified: string;
    stale: boolean;
    staleDays?: number;
}
