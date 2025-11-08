/**
 * File Manager - Handles file operations for spec artifacts
 */
import * as fs from 'fs';
import * as path from 'path';
export class FileManager {
    /**
     * Ensure directory exists, create if not
     */
    static ensureDirectory(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
    /**
     * Write file to disk
     */
    static writeFile(filePath, content) {
        const dir = path.dirname(filePath);
        this.ensureDirectory(dir);
        fs.writeFileSync(filePath, content, 'utf-8');
    }
    /**
     * Read file from disk
     */
    static readFile(filePath) {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        return fs.readFileSync(filePath, 'utf-8');
    }
    /**
     * Check if file exists
     */
    static exists(filePath) {
        return fs.existsSync(filePath);
    }
    /**
     * Create spec directory structure
     */
    static createSpecStructure(projectPath, featureDirName) {
        const specPath = path.join(projectPath, 'specs', featureDirName);
        const contractsPath = path.join(specPath, 'contracts');
        this.ensureDirectory(specPath);
        this.ensureDirectory(contractsPath);
        return specPath;
    }
    /**
     * Create constitution directory
     */
    static createConstitutionPath(projectPath) {
        const constitutionDir = path.join(projectPath, 'specs', '.specify', 'memory');
        this.ensureDirectory(constitutionDir);
        return path.join(constitutionDir, 'constitution.md');
    }
}
//# sourceMappingURL=file-manager.js.map