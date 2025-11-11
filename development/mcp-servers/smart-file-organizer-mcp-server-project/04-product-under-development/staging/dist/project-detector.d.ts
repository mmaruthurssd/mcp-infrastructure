/**
 * Project Detector
 * Detects project boundaries and suggests when files should be grouped as projects
 */
export interface ProjectInfo {
    name: string;
    path: string;
    files: string[];
    hasPackageJson: boolean;
    hasReadme: boolean;
    hasSrcFolder: boolean;
    hasConfigFiles: boolean;
    confidence: number;
    suggestedLocation: string;
    reasoning: string[];
}
export interface ProjectDetectionResult {
    isProject: boolean;
    shouldCreateProjectFolder: boolean;
    projectInfo?: ProjectInfo;
    reasoning: string[];
}
export declare class ProjectDetector {
    private folderMap;
    private minimumProjectFiles;
    constructor(folderMap: any);
    /**
     * Analyze a directory to determine if it's a project
     */
    analyzeDirectory(dirPath: string): Promise<ProjectDetectionResult>;
    /**
     * Check for project indicators in a directory
     */
    private checkProjectIndicators;
    /**
     * Suggest where a project should be located
     */
    private suggestProjectLocation;
    /**
     * Detect if scattered files belong to the same project
     */
    detectRelatedFiles(files: string[], rootPath: string): Promise<Map<string, string[]>>;
    /**
     * Suggest when active-work should graduate to projects/
     */
    shouldGraduateToProjects(activeWorkPath: string): Promise<{
        shouldGraduate: boolean;
        confidence: number;
        reasoning: string[];
    }>;
    /**
     * Suggest when projects/ should be archived
     */
    shouldArchive(projectPath: string): Promise<{
        shouldArchive: boolean;
        confidence: number;
        reasoning: string[];
    }>;
    /**
     * Get last modified time of any file in directory
     */
    private getLastModifiedTime;
    /**
     * List files recursively up to a certain depth
     */
    private listFilesRecursive;
}
//# sourceMappingURL=project-detector.d.ts.map