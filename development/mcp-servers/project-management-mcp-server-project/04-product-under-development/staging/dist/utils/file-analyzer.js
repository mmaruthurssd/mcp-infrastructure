/**
 * File Analyzer
 *
 * AI-powered file type detection and placement suggestion.
 * Analyzes file paths, names, extensions, and content to suggest optimal placement
 * in the 8-folder template structure.
 *
 * Target: 80%+ accuracy on typical software projects
 */
import * as path from 'path';
// ============================================================================
// File Analyzer
// ============================================================================
export class FileAnalyzer {
    /**
     * Analyze a file and suggest where it should go in the template structure
     */
    static analyzeFile(filePath, projectRoot) {
        const relativePath = path.relative(projectRoot, filePath);
        const basename = path.basename(filePath);
        const extension = path.extname(filePath).toLowerCase();
        const dirname = path.dirname(relativePath);
        // ========================================================================
        // Rule 1: Root configuration files → 03-resources-docs-assets-tools/assets/
        // ========================================================================
        if (this.isRootConfigFile(basename, dirname)) {
            return {
                filePath,
                fileType: 'Configuration',
                suggestedPath: `03-resources-docs-assets-tools/assets/${basename}`,
                reasoning: 'Root-level configuration file (package.json, tsconfig, etc.)',
                confidence: 'high',
            };
        }
        // ========================================================================
        // Rule 2: Documentation files → 03-resources-docs-assets-tools/docs/
        // ========================================================================
        if (this.isDocumentationFile(basename, extension)) {
            return {
                filePath,
                fileType: 'Documentation',
                suggestedPath: `03-resources-docs-assets-tools/docs/${basename}`,
                reasoning: 'Documentation file (markdown, txt, etc.)',
                confidence: 'high',
            };
        }
        // ========================================================================
        // Rule 3: Source code → 04-product-under-development/dev-instance/src/
        // ========================================================================
        if (this.isSourceCode(basename, extension, dirname)) {
            const subPath = this.getSourceCodeSubPath(relativePath, projectRoot);
            return {
                filePath,
                fileType: 'Source Code',
                suggestedPath: `04-product-under-development/dev-instance/${subPath}`,
                reasoning: `Source code file (${extension})`,
                confidence: 'high',
            };
        }
        // ========================================================================
        // Rule 4: Test files → 04-product-under-development/dev-instance/tests/
        // ========================================================================
        if (this.isTestFile(basename, dirname)) {
            return {
                filePath,
                fileType: 'Test',
                suggestedPath: `04-product-under-development/dev-instance/tests/${basename}`,
                reasoning: 'Test file',
                confidence: 'high',
            };
        }
        // ========================================================================
        // Rule 5: Build artifacts → Skip (should be in .gitignore)
        // ========================================================================
        if (this.isBuildArtifact(basename, extension, dirname)) {
            return null; // Skip build artifacts
        }
        // ========================================================================
        // Rule 6: Assets (images, fonts, etc.) → 03-resources-docs-assets-tools/assets/
        // ========================================================================
        if (this.isAsset(extension)) {
            return {
                filePath,
                fileType: 'Asset',
                suggestedPath: `03-resources-docs-assets-tools/assets/${relativePath}`,
                reasoning: `Asset file (${extension})`,
                confidence: 'medium',
            };
        }
        // ========================================================================
        // Rule 7: Scripts → 03-resources-docs-assets-tools/scripts/
        // ========================================================================
        if (this.isScript(basename, extension)) {
            return {
                filePath,
                fileType: 'Script',
                suggestedPath: `03-resources-docs-assets-tools/scripts/${basename}`,
                reasoning: 'Executable script',
                confidence: 'medium',
            };
        }
        // ========================================================================
        // Rule 8: Planning/design docs → 01-planning/
        // ========================================================================
        if (this.isPlanningDoc(basename, dirname)) {
            return {
                filePath,
                fileType: 'Planning Document',
                suggestedPath: `01-planning/${basename}`,
                reasoning: 'Planning or design document',
                confidence: 'medium',
            };
        }
        // ========================================================================
        // Default: Unknown → 07-temp/
        // ========================================================================
        return {
            filePath,
            fileType: 'Unknown',
            suggestedPath: `07-temp/migration-review/${relativePath}`,
            reasoning: 'Unable to determine optimal placement - needs manual review',
            confidence: 'low',
        };
    }
    // ==========================================================================
    // Detection Methods
    // ==========================================================================
    static isRootConfigFile(basename, dirname) {
        // Only match files in the root directory
        if (dirname !== '.') {
            return false;
        }
        const configFiles = [
            'package.json',
            'package-lock.json',
            'yarn.lock',
            'pnpm-lock.yaml',
            'tsconfig.json',
            'jsconfig.json',
            '.eslintrc',
            '.eslintrc.js',
            '.eslintrc.json',
            '.prettierrc',
            '.prettierrc.js',
            '.prettierrc.json',
            'jest.config.js',
            'jest.config.ts',
            'vite.config.js',
            'vite.config.ts',
            'webpack.config.js',
            'rollup.config.js',
            '.gitignore',
            '.env.example',
            'docker-compose.yml',
            'Dockerfile',
        ];
        return configFiles.includes(basename) || basename.startsWith('.env');
    }
    static isDocumentationFile(basename, extension) {
        // Markdown files (except root README - that's special)
        if (extension === '.md' && !basename.toLowerCase().startsWith('readme')) {
            return true;
        }
        // Explicit documentation files
        const docPatterns = [
            'CHANGELOG',
            'CONTRIBUTING',
            'LICENSE',
            'AUTHORS',
            'INSTALL',
            'USAGE',
            'API',
            'GUIDE',
        ];
        return docPatterns.some(pattern => basename.toUpperCase().includes(pattern));
    }
    static isSourceCode(basename, extension, dirname) {
        const sourceExtensions = [
            '.ts',
            '.tsx',
            '.js',
            '.jsx',
            '.py',
            '.java',
            '.cpp',
            '.c',
            '.h',
            '.hpp',
            '.rs',
            '.go',
            '.rb',
            '.php',
            '.swift',
            '.kt',
            '.cs',
            '.vue',
            '.svelte',
        ];
        // Source code typically in src/, lib/, app/ directories
        const sourceDir = dirname.split(path.sep)[0];
        const isInSourceDir = ['src', 'lib', 'app', 'source', 'components', 'pages', 'utils', 'helpers', 'services'].includes(sourceDir);
        return sourceExtensions.includes(extension) && (isInSourceDir || dirname === '.');
    }
    static getSourceCodeSubPath(relativePath, projectRoot) {
        // Try to preserve directory structure if it's in src/, lib/, etc.
        const parts = relativePath.split(path.sep);
        // If already in a src/ structure, preserve it
        if (parts[0] === 'src' || parts[0] === 'lib') {
            return relativePath;
        }
        // Otherwise, put it in src/
        return path.join('src', path.basename(relativePath));
    }
    static isTestFile(basename, dirname) {
        // Test file patterns
        const testPatterns = [
            '.test.',
            '.spec.',
            '_test.',
            '_spec.',
            '.e2e.',
        ];
        if (testPatterns.some(pattern => basename.includes(pattern))) {
            return true;
        }
        // Test directory patterns
        const dirParts = dirname.split(path.sep);
        return dirParts.some(part => part === 'test' || part === 'tests' || part === '__tests__' || part === 'e2e');
    }
    static isBuildArtifact(basename, extension, dirname) {
        // Build artifact directories
        const buildDirs = ['dist', 'build', '.next', 'out', 'target', 'bin', 'coverage'];
        const dirParts = dirname.split(path.sep);
        if (dirParts.some(part => buildDirs.includes(part))) {
            return true;
        }
        // Compiled files
        const artifactExtensions = ['.map', '.min.js', '.min.css'];
        return artifactExtensions.includes(extension);
    }
    static isAsset(extension) {
        const assetExtensions = [
            // Images
            '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
            // Fonts
            '.woff', '.woff2', '.ttf', '.otf', '.eot',
            // Media
            '.mp4', '.webm', '.mp3', '.wav',
            // Data
            '.json', '.csv', '.xml', '.yaml', '.yml',
        ];
        return assetExtensions.includes(extension);
    }
    static isScript(basename, extension) {
        const scriptExtensions = ['.sh', '.bash', '.zsh', '.ps1', '.bat', '.cmd'];
        if (scriptExtensions.includes(extension)) {
            return true;
        }
        // Common script names
        const scriptNames = ['build', 'deploy', 'setup', 'install', 'test', 'start', 'dev'];
        return scriptNames.some(name => basename.toLowerCase().includes(name));
    }
    static isPlanningDoc(basename, dirname) {
        const planningPatterns = [
            'ROADMAP',
            'PLAN',
            'DESIGN',
            'ARCHITECTURE',
            'SPECIFICATION',
            'REQUIREMENTS',
            'PROPOSAL',
            'RFC',
        ];
        // Check basename
        if (planningPatterns.some(pattern => basename.toUpperCase().includes(pattern))) {
            return true;
        }
        // Check if in planning/docs directory
        const dirParts = dirname.split(path.sep);
        return dirParts.some(part => part.toLowerCase() === 'planning' || part.toLowerCase() === 'design');
    }
    /**
     * Calculate overall accuracy for a set of suggestions (for testing)
     */
    static calculateAccuracy(results) {
        const total = results.length;
        const byConfidence = {
            high: results.filter(r => r.confidence === 'high').length,
            medium: results.filter(r => r.confidence === 'medium').length,
            low: results.filter(r => r.confidence === 'low').length,
        };
        // Weighted accuracy: high conf = 1.0, medium = 0.8, low = 0.5
        const weightedSum = byConfidence.high * 1.0 + byConfidence.medium * 0.8 + byConfidence.low * 0.5;
        const overall = Math.round((weightedSum / total) * 100);
        return {
            overall,
            byConfidence,
        };
    }
}
//# sourceMappingURL=file-analyzer.js.map