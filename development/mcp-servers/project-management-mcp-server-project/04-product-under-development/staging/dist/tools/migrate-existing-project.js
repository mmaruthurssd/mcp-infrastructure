/**
 * Migrate Existing Project Tool
 *
 * Migrate an existing project into the standardized 8-folder template structure.
 * Uses AI-powered file detection to suggest optimal placement with user confirmation.
 */
import * as fs from 'fs';
import * as path from 'path';
import { FileAnalyzer } from '../utils/file-analyzer.js';
// ============================================================================
// Tool Implementation
// ============================================================================
export class MigrateExistingProjectTool {
    static execute(input) {
        const projectPath = path.resolve(input.projectPath);
        // Validate project path exists
        if (!fs.existsSync(projectPath)) {
            return {
                success: false,
                projectPath,
                projectName: input.projectName || 'Unknown',
                analysis: {
                    totalFiles: 0,
                    filesAnalyzed: 0,
                    filesSkipped: 0,
                },
                suggestions: [],
                conflicts: [],
                message: `Project path does not exist: ${projectPath}`,
                formatted: `❌ ERROR: Project path does not exist\n   Path: ${projectPath}`,
            };
        }
        // Determine project name if not provided
        const projectName = input.projectName || path.basename(projectPath);
        // ========================================================================
        // STEP 1: Scan existing project structure
        // ========================================================================
        const scanResult = this.scanProject(projectPath);
        // ========================================================================
        // STEP 2: Analyze files and suggest placements
        // ========================================================================
        const suggestions = [];
        let filesAnalyzed = 0;
        for (const file of scanResult.files) {
            const analysis = FileAnalyzer.analyzeFile(file, projectPath);
            if (analysis) {
                suggestions.push({
                    sourceFile: file,
                    suggestedDestination: analysis.suggestedPath,
                    reasoning: analysis.reasoning,
                    confidence: analysis.confidence,
                    fileType: analysis.fileType,
                });
                filesAnalyzed++;
            }
        }
        // ========================================================================
        // STEP 3: Detect conflicts
        // ========================================================================
        const conflicts = this.detectConflicts(projectPath, suggestions);
        // ========================================================================
        // STEP 4: Format output for user review
        // ========================================================================
        const formatted = this.formatOutput({
            projectName,
            projectPath,
            totalFiles: scanResult.files.length,
            filesAnalyzed,
            filesSkipped: scanResult.files.length - filesAnalyzed,
            suggestions,
            conflicts,
        });
        return {
            success: true,
            projectPath,
            projectName,
            analysis: {
                totalFiles: scanResult.files.length,
                filesAnalyzed,
                filesSkipped: scanResult.files.length - filesAnalyzed,
            },
            suggestions,
            conflicts,
            message: `Migration analysis complete for ${projectName}. ${suggestions.length} files analyzed. Review suggestions and use confirm_migration to proceed.`,
            formatted,
        };
    }
    static getToolDefinition() {
        return {
            name: 'migrate_existing_project',
            description: 'Analyze an existing project and suggest how to migrate it into the standardized 8-folder template structure. Returns AI-powered placement suggestions for user review.',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to the existing project directory to migrate',
                    },
                    projectName: {
                        type: 'string',
                        description: 'Optional project name (defaults to directory name)',
                    },
                },
                required: ['projectPath'],
            },
        };
    }
    // ==========================================================================
    // Helper Methods
    // ==========================================================================
    static scanProject(projectPath) {
        const files = [];
        const directories = [];
        const scanDir = (dir) => {
            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    // Skip node_modules, .git, and other common ignores
                    if (this.shouldSkip(entry.name)) {
                        continue;
                    }
                    if (entry.isDirectory()) {
                        directories.push(fullPath);
                        scanDir(fullPath);
                    }
                    else if (entry.isFile()) {
                        files.push(fullPath);
                    }
                }
            }
            catch (error) {
                console.error(`Error scanning directory ${dir}:`, error);
            }
        };
        scanDir(projectPath);
        return { files, directories };
    }
    static shouldSkip(name) {
        const skipPatterns = [
            'node_modules',
            '.git',
            '.DS_Store',
            'dist',
            'build',
            '.next',
            '.cache',
            'coverage',
            '.vscode',
            '.idea',
            '__pycache__',
            '*.pyc',
        ];
        return skipPatterns.some(pattern => {
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace('*', '.*'));
                return regex.test(name);
            }
            return name === pattern;
        });
    }
    static detectConflicts(projectPath, suggestions) {
        const conflicts = [];
        // Check for README conflicts
        const readmeFiles = suggestions.filter(s => path.basename(s.sourceFile).toLowerCase().startsWith('readme'));
        if (readmeFiles.length > 0) {
            conflicts.push({
                type: 'readme',
                description: `Found ${readmeFiles.length} README file(s). The template creates a main README.md.`,
                options: [
                    'Keep both (existing → 03-resources-docs-assets-tools/docs/, new template README at root)',
                    'Merge content (combine existing with template)',
                    'Use existing only (skip template README)',
                ],
            });
        }
        // Check for existing numbered folders (e.g., if they already have some structure)
        const hasNumberedFolders = fs.existsSync(path.join(projectPath, '01-planning'));
        if (hasNumberedFolders) {
            conflicts.push({
                type: 'folder',
                description: 'Detected existing numbered folder structure (01-, 02-, etc.)',
                options: [
                    'Merge with template (keep existing files, add missing structure)',
                    'Archive existing structure (move to 08-archive/pre-migration/)',
                    'Cancel migration',
                ],
            });
        }
        return conflicts;
    }
    static formatOutput(data) {
        let output = '='.repeat(70) + '\n';
        output += '  MIGRATION ANALYSIS COMPLETE\n';
        output += '='.repeat(70) + '\n\n';
        output += `📂 Project: ${data.projectName}\n`;
        output += `📍 Location: ${data.projectPath}\n\n`;
        output += '─'.repeat(70) + '\n\n';
        output += '📊 ANALYSIS SUMMARY:\n\n';
        output += `   • Total files found: ${data.totalFiles}\n`;
        output += `   • Files analyzed: ${data.filesAnalyzed}\n`;
        output += `   • Files skipped: ${data.filesSkipped}\n\n`;
        // Show accuracy breakdown
        const highConfidence = data.suggestions.filter(s => s.confidence === 'high').length;
        const mediumConfidence = data.suggestions.filter(s => s.confidence === 'medium').length;
        const lowConfidence = data.suggestions.filter(s => s.confidence === 'low').length;
        output += '─'.repeat(70) + '\n\n';
        output += '🎯 CONFIDENCE BREAKDOWN:\n\n';
        output += `   ✅ High confidence:   ${highConfidence} files (${this.percentage(highConfidence, data.filesAnalyzed)}%)\n`;
        output += `   ⚠️  Medium confidence: ${mediumConfidence} files (${this.percentage(mediumConfidence, data.filesAnalyzed)}%)\n`;
        output += `   ❓ Low confidence:    ${lowConfidence} files (${this.percentage(lowConfidence, data.filesAnalyzed)}%)\n\n`;
        // Show conflicts if any
        if (data.conflicts.length > 0) {
            output += '─'.repeat(70) + '\n\n';
            output += '⚠️  CONFLICTS DETECTED:\n\n';
            for (const conflict of data.conflicts) {
                output += `   ${conflict.description}\n`;
                output += `   Options:\n`;
                for (let i = 0; i < conflict.options.length; i++) {
                    output += `     ${i + 1}. ${conflict.options[i]}\n`;
                }
                output += '\n';
            }
        }
        // Show sample suggestions (first 10)
        output += '─'.repeat(70) + '\n\n';
        output += '📝 SAMPLE SUGGESTIONS (first 10):\n\n';
        const sampleSuggestions = data.suggestions.slice(0, 10);
        for (const suggestion of sampleSuggestions) {
            const icon = suggestion.confidence === 'high' ? '✅' : suggestion.confidence === 'medium' ? '⚠️' : '❓';
            const relativePath = path.relative(data.projectPath, suggestion.sourceFile);
            const destFolder = suggestion.suggestedDestination.split('/')[0];
            output += `   ${icon} ${relativePath}\n`;
            output += `      → ${destFolder}/ (${suggestion.fileType})\n`;
            output += `      ${suggestion.reasoning}\n\n`;
        }
        if (data.suggestions.length > 10) {
            output += `   ... and ${data.suggestions.length - 10} more files\n\n`;
        }
        output += '─'.repeat(70) + '\n\n';
        output += '📋 NEXT STEPS:\n\n';
        output += '   1. Review the suggestions above\n';
        output += '   2. Address any conflicts\n';
        output += '   3. Use confirm_migration tool to proceed with migration\n';
        output += '   4. Or manually adjust suggestions as needed\n\n';
        output += '💡 Note: All files will be moved (not copied) to preserve your\n';
        output += '   project structure. Original locations will be documented in\n';
        output += '   the migration summary.\n\n';
        return output;
    }
    static percentage(value, total) {
        return total > 0 ? Math.round((value / total) * 100) : 0;
    }
}
//# sourceMappingURL=migrate-existing-project.js.map