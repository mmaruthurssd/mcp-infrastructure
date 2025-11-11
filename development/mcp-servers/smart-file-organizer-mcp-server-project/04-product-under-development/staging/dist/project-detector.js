import fs from 'fs/promises';
import path from 'path';
export class ProjectDetector {
    folderMap;
    minimumProjectFiles;
    constructor(folderMap) {
        this.folderMap = folderMap;
        this.minimumProjectFiles = folderMap.organizationRules?.projectDetection?.minimumFiles || 3;
    }
    /**
     * Analyze a directory to determine if it's a project
     */
    async analyzeDirectory(dirPath) {
        const result = {
            isProject: false,
            shouldCreateProjectFolder: false,
            reasoning: []
        };
        try {
            const files = await this.listFilesRecursive(dirPath, 2); // Max depth 2
            if (files.length < this.minimumProjectFiles) {
                result.reasoning.push(`Only ${files.length} files found, minimum is ${this.minimumProjectFiles}`);
                return result;
            }
            const projectIndicators = await this.checkProjectIndicators(dirPath, files);
            // Calculate confidence score
            let confidence = 0;
            const indicators = [];
            if (projectIndicators.hasPackageJson) {
                confidence += 0.3;
                indicators.push('Has package.json');
            }
            if (projectIndicators.hasReadme) {
                confidence += 0.2;
                indicators.push('Has README.md');
            }
            if (projectIndicators.hasSrcFolder) {
                confidence += 0.2;
                indicators.push('Has src/ directory');
            }
            if (projectIndicators.hasConfigFiles) {
                confidence += 0.1;
                indicators.push('Has configuration files');
            }
            if (projectIndicators.relatedCodeFiles >= 3) {
                confidence += 0.2;
                indicators.push(`Has ${projectIndicators.relatedCodeFiles} related code files`);
            }
            result.reasoning.push(...indicators);
            // Determine if it's a project (threshold: 0.4)
            if (confidence >= 0.4) {
                result.isProject = true;
                result.shouldCreateProjectFolder = true;
                const projectName = path.basename(dirPath);
                result.projectInfo = {
                    name: projectName,
                    path: dirPath,
                    files: files,
                    hasPackageJson: projectIndicators.hasPackageJson,
                    hasReadme: projectIndicators.hasReadme,
                    hasSrcFolder: projectIndicators.hasSrcFolder,
                    hasConfigFiles: projectIndicators.hasConfigFiles,
                    confidence: confidence,
                    suggestedLocation: this.suggestProjectLocation(projectIndicators, confidence),
                    reasoning: result.reasoning
                };
            }
            else {
                result.reasoning.push(`Confidence score ${confidence.toFixed(2)} is below threshold 0.4`);
            }
        }
        catch (error) {
            result.reasoning.push(`Error analyzing directory: ${error}`);
        }
        return result;
    }
    /**
     * Check for project indicators in a directory
     */
    async checkProjectIndicators(dirPath, files) {
        const result = {
            hasPackageJson: false,
            hasReadme: false,
            hasSrcFolder: false,
            hasConfigFiles: false,
            relatedCodeFiles: 0
        };
        const fileNames = files.map(f => path.basename(f).toLowerCase());
        const configExtensions = ['.json', '.yaml', '.yml', '.toml', '.ini', '.config'];
        const codeExtensions = ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.go', '.rs'];
        // Check for package.json or similar
        if (fileNames.some(f => ['package.json', 'pyproject.toml', 'cargo.toml', 'pom.xml', 'build.gradle'].includes(f))) {
            result.hasPackageJson = true;
        }
        // Check for README
        if (fileNames.some(f => f.startsWith('readme'))) {
            result.hasReadme = true;
        }
        // Check for src/ folder
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            const directories = entries.filter(e => e.isDirectory()).map(e => e.name.toLowerCase());
            if (directories.includes('src') || directories.includes('lib')) {
                result.hasSrcFolder = true;
            }
        }
        catch (error) {
            // Ignore
        }
        // Check for config files
        result.hasConfigFiles = files.some(f => {
            const ext = path.extname(f).toLowerCase();
            return configExtensions.includes(ext);
        });
        // Count related code files
        result.relatedCodeFiles = files.filter(f => {
            const ext = path.extname(f).toLowerCase();
            return codeExtensions.includes(ext);
        }).length;
        return result;
    }
    /**
     * Suggest where a project should be located
     */
    suggestProjectLocation(indicators, confidence) {
        // High confidence + package.json = stable project
        if (confidence >= 0.7 && indicators.hasPackageJson && indicators.hasReadme) {
            return 'projects/';
        }
        // Medium confidence = project in development
        if (confidence >= 0.5) {
            return 'projects-in-development/';
        }
        // Lower confidence = might still be in active work
        return 'active-work/';
    }
    /**
     * Detect if scattered files belong to the same project
     */
    async detectRelatedFiles(files, rootPath) {
        const projects = new Map();
        // Group files by common prefixes or directories
        for (const file of files) {
            const relativePath = path.relative(rootPath, file);
            const parts = relativePath.split(path.sep);
            // If file is in a subdirectory, it might be part of a project
            if (parts.length > 1) {
                const potentialProjectName = parts[0];
                if (!projects.has(potentialProjectName)) {
                    projects.set(potentialProjectName, []);
                }
                projects.get(potentialProjectName).push(file);
            }
        }
        // Filter out groups with too few files
        for (const [projectName, projectFiles] of projects.entries()) {
            if (projectFiles.length < this.minimumProjectFiles) {
                projects.delete(projectName);
            }
        }
        return projects;
    }
    /**
     * Suggest when active-work should graduate to projects/
     */
    async shouldGraduateToProjects(activeWorkPath) {
        const result = {
            shouldGraduate: false,
            confidence: 0,
            reasoning: []
        };
        try {
            const projectCheck = await this.analyzeDirectory(activeWorkPath);
            if (!projectCheck.isProject || !projectCheck.projectInfo) {
                result.reasoning.push('Not detected as a complete project');
                return result;
            }
            const info = projectCheck.projectInfo;
            let confidence = info.confidence;
            // Check if it's stable enough
            if (info.hasPackageJson && info.hasReadme && info.hasSrcFolder) {
                confidence += 0.2;
                result.reasoning.push('Has complete project structure');
            }
            // Check file modification time (if not modified in 30 days, might be stable)
            const lastModified = await this.getLastModifiedTime(activeWorkPath);
            const daysSinceModified = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceModified > 30) {
                confidence += 0.1;
                result.reasoning.push(`No changes in ${Math.floor(daysSinceModified)} days - might be stable`);
            }
            // Threshold for graduation: 0.7
            if (confidence >= 0.7) {
                result.shouldGraduate = true;
                result.confidence = confidence;
                result.reasoning.push(`Confidence ${confidence.toFixed(2)} suggests this is ready to graduate to projects/`);
            }
            else {
                result.reasoning.push(`Confidence ${confidence.toFixed(2)} is below graduation threshold 0.7`);
            }
        }
        catch (error) {
            result.reasoning.push(`Error checking graduation status: ${error}`);
        }
        return result;
    }
    /**
     * Suggest when projects/ should be archived
     */
    async shouldArchive(projectPath) {
        const result = {
            shouldArchive: false,
            confidence: 0,
            reasoning: []
        };
        try {
            const lastModified = await this.getLastModifiedTime(projectPath);
            const daysSinceModified = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
            // Check if deprecated or old
            const files = await this.listFilesRecursive(projectPath, 1);
            const hasDeprecatedIndicator = files.some(f => {
                const name = path.basename(f).toLowerCase();
                return name.includes('deprecated') || name.includes('old') || name.includes('obsolete');
            });
            if (hasDeprecatedIndicator) {
                result.confidence += 0.5;
                result.reasoning.push('Contains files marked as deprecated/old');
            }
            // Not modified in 180+ days
            if (daysSinceModified > 180) {
                result.confidence += 0.3;
                result.reasoning.push(`No changes in ${Math.floor(daysSinceModified)} days`);
            }
            // Check README for deprecation notice
            const readmePath = path.join(projectPath, 'README.md');
            try {
                const readmeContent = await fs.readFile(readmePath, 'utf-8');
                if (readmeContent.toLowerCase().includes('deprecated') ||
                    readmeContent.toLowerCase().includes('no longer maintained')) {
                    result.confidence += 0.4;
                    result.reasoning.push('README indicates project is deprecated');
                }
            }
            catch {
                // No README or can't read
            }
            // Threshold for archiving: 0.6
            if (result.confidence >= 0.6) {
                result.shouldArchive = true;
                result.reasoning.push(`Confidence ${result.confidence.toFixed(2)} suggests this should be archived`);
            }
            else {
                result.reasoning.push(`Confidence ${result.confidence.toFixed(2)} is below archiving threshold 0.6`);
            }
        }
        catch (error) {
            result.reasoning.push(`Error checking archive status: ${error}`);
        }
        return result;
    }
    /**
     * Get last modified time of any file in directory
     */
    async getLastModifiedTime(dirPath) {
        const files = await this.listFilesRecursive(dirPath, 3);
        let latestTime = new Date(0);
        for (const file of files) {
            try {
                const stats = await fs.stat(file);
                if (stats.mtime > latestTime) {
                    latestTime = stats.mtime;
                }
            }
            catch {
                // Ignore files we can't stat
            }
        }
        return latestTime;
    }
    /**
     * List files recursively up to a certain depth
     */
    async listFilesRecursive(dirPath, maxDepth, currentDepth = 0) {
        const files = [];
        if (currentDepth >= maxDepth) {
            return files;
        }
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                // Skip hidden files and node_modules
                if (entry.name.startsWith('.') || entry.name === 'node_modules') {
                    continue;
                }
                const fullPath = path.join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    const subFiles = await this.listFilesRecursive(fullPath, maxDepth, currentDepth + 1);
                    files.push(...subFiles);
                }
                else {
                    files.push(fullPath);
                }
            }
        }
        catch (error) {
            // Ignore directories we can't read
        }
        return files;
    }
}
//# sourceMappingURL=project-detector.js.map