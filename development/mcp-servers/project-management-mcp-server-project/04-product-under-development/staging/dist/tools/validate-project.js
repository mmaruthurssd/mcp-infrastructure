/**
 * Validate Project Tool
 *
 * Validates project structure, YAML frontmatter, RESOURCE-INDEX tracking, goal metadata,
 * and workflow compliance. Provides comprehensive validation with optional auto-fix capabilities.
 */
import * as fs from 'fs';
import * as path from 'path';
// ============================================================================
// Expected Structure
// ============================================================================
const REQUIRED_FOLDERS = [
    '01-planning',
    '02-goals-and-roadmap',
    '02-goals-and-roadmap/potential-goals',
    '02-goals-and-roadmap/selected-goals',
    '02-goals-and-roadmap/workflow-diagrams',
    '03-resources-docs-assets-tools',
    '03-resources-docs-assets-tools/docs',
    '03-resources-docs-assets-tools/assets',
    '03-resources-docs-assets-tools/scripts',
    '04-product-under-development',
    '05-brainstorming',
    '05-brainstorming/future-goals',
    '05-brainstorming/future-goals/brainstorming',
    '05-brainstorming/future-goals/potential-goals',
    '05-brainstorming/future-goals/selected-goals',
    '05-brainstorming/future-goals/archive',
    '06-project-documentation',
    '07-temp',
    '07-temp/workflows',
    '08-archive',
    '08-archive/goals',
    '08-archive/goals/implemented',
    '08-archive/goals/shelved',
    '08-archive/workflows',
    '08-archive/brainstorming',
    '08-archive/deprecated',
];
const REQUIRED_ROOT_FILES = [
    'README.md',
    'EVENT-LOG.md',
    'NEXT-STEPS.md',
    'TROUBLESHOOTING.md',
];
const YAML_REQUIRED_FIELDS = ['type', 'tags'];
// ============================================================================
// Tool Implementation
// ============================================================================
export class ValidateProjectTool {
    static execute(input) {
        const checks = input.checks || ['all'];
        const shouldCheckAll = checks.includes('all');
        const result = {
            success: true,
            checks: {},
            summary: {
                totalIssues: 0,
                criticalIssues: 0,
                warnings: 0,
                fixesApplied: 0,
            },
            message: '',
        };
        // Run requested validations
        if (shouldCheckAll || checks.includes('structure')) {
            result.checks.structure = this.validateStructure(input.projectPath);
            this.updateSummary(result, result.checks.structure);
        }
        if (shouldCheckAll || checks.includes('yaml')) {
            result.checks.yaml = this.validateYamlFrontmatter(input.projectPath);
            this.updateSummary(result, result.checks.yaml);
        }
        if (shouldCheckAll || checks.includes('resource-index')) {
            result.checks.resourceIndex = this.validateResourceIndex(input.projectPath);
            this.updateSummary(result, result.checks.resourceIndex);
        }
        if (shouldCheckAll || checks.includes('goals')) {
            result.checks.goals = this.validateGoals(input.projectPath);
            this.updateSummary(result, result.checks.goals);
        }
        if (shouldCheckAll || checks.includes('workflow')) {
            result.checks.workflow = this.validateWorkflow(input.projectPath);
            this.updateSummary(result, result.checks.workflow);
        }
        // Apply auto-fixes if requested
        if (input.autoFix && result.summary.totalIssues > 0) {
            const fixesApplied = this.applyAutoFixes(input, result);
            result.summary.fixesApplied = fixesApplied;
        }
        // Set overall success
        result.success = result.summary.criticalIssues === 0;
        result.message = this.getSummaryMessage(result);
        return result;
    }
    // ==========================================================================
    // Structure Validation
    // ==========================================================================
    static validateStructure(projectPath) {
        const validation = {
            passed: true,
            missingFolders: [],
            missingRootFiles: [],
            unexpectedItems: [],
            details: [],
        };
        // Check required folders
        for (const folder of REQUIRED_FOLDERS) {
            const folderPath = path.join(projectPath, folder);
            if (!fs.existsSync(folderPath)) {
                validation.missingFolders.push(folder);
                validation.details.push(`❌ Missing folder: ${folder}`);
                validation.passed = false;
            }
            else {
                validation.details.push(`✅ Folder exists: ${folder}`);
            }
        }
        // Check required root files
        for (const file of REQUIRED_ROOT_FILES) {
            const filePath = path.join(projectPath, file);
            if (!fs.existsSync(filePath)) {
                validation.missingRootFiles.push(file);
                validation.details.push(`❌ Missing root file: ${file}`);
                validation.passed = false;
            }
            else {
                validation.details.push(`✅ Root file exists: ${file}`);
            }
        }
        return validation;
    }
    // ==========================================================================
    // YAML Frontmatter Validation
    // ==========================================================================
    static validateYamlFrontmatter(projectPath) {
        const validation = {
            passed: true,
            filesWithoutFrontmatter: [],
            filesWithInvalidFrontmatter: [],
            details: [],
        };
        // Recursively find all .md files
        const mdFiles = this.findMarkdownFiles(projectPath);
        for (const file of mdFiles) {
            const relativePath = path.relative(projectPath, file);
            // Skip node_modules and other ignored paths
            if (this.shouldSkipFile(relativePath)) {
                continue;
            }
            const content = fs.readFileSync(file, 'utf8');
            const frontmatter = this.extractFrontmatter(content);
            if (!frontmatter) {
                validation.filesWithoutFrontmatter.push(relativePath);
                validation.details.push(`❌ No frontmatter: ${relativePath}`);
                validation.passed = false;
            }
            else {
                // Check required fields
                const missingFields = YAML_REQUIRED_FIELDS.filter(field => !frontmatter.hasOwnProperty(field));
                if (missingFields.length > 0) {
                    validation.filesWithInvalidFrontmatter.push(relativePath);
                    validation.details.push(`⚠️  Missing fields (${missingFields.join(', ')}): ${relativePath}`);
                    validation.passed = false;
                }
                else {
                    validation.details.push(`✅ Valid frontmatter: ${relativePath}`);
                }
            }
        }
        return validation;
    }
    // ==========================================================================
    // Resource Index Validation
    // ==========================================================================
    static validateResourceIndex(projectPath) {
        const validation = {
            passed: true,
            untrackedFiles: [],
            missingIndex: false,
            details: [],
        };
        const indexPath = path.join(projectPath, '03-resources-docs-assets-tools', 'RESOURCE-INDEX.md');
        if (!fs.existsSync(indexPath)) {
            validation.missingIndex = true;
            validation.passed = false;
            validation.details.push('❌ RESOURCE-INDEX.md does not exist');
            return validation;
        }
        // Read index content
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        // Find files in resources folder
        const resourcesPath = path.join(projectPath, '03-resources-docs-assets-tools');
        const resourceFiles = this.findResourceFiles(resourcesPath);
        // Check which files are tracked
        for (const file of resourceFiles) {
            const relativePath = path.relative(projectPath, file);
            const fileName = path.basename(file);
            // Skip RESOURCE-INDEX.md itself and READMEs
            if (fileName === 'RESOURCE-INDEX.md' || fileName === 'README.md') {
                continue;
            }
            // Simple check: is file mentioned in index?
            if (!indexContent.includes(fileName)) {
                validation.untrackedFiles.push(relativePath);
                validation.details.push(`⚠️  Not tracked in index: ${relativePath}`);
                validation.passed = false;
            }
        }
        if (validation.passed) {
            validation.details.push('✅ All resources tracked in RESOURCE-INDEX.md');
        }
        return validation;
    }
    // ==========================================================================
    // Goals Validation
    // ==========================================================================
    static validateGoals(projectPath) {
        const validation = {
            passed: true,
            goalsWithMissingMetadata: [],
            goalsWithInvalidMetadata: [],
            details: [],
        };
        // Check potential goals
        const potentialGoalsPath = path.join(projectPath, '02-goals-and-roadmap', 'potential-goals');
        if (fs.existsSync(potentialGoalsPath)) {
            this.validateGoalsInFolder(potentialGoalsPath, validation, 'potential');
        }
        // Check selected goals
        const selectedGoalsPath = path.join(projectPath, '02-goals-and-roadmap', 'selected-goals');
        if (fs.existsSync(selectedGoalsPath)) {
            this.validateGoalsInFolder(selectedGoalsPath, validation, 'selected');
        }
        return validation;
    }
    static validateGoalsInFolder(folderPath, validation, type) {
        const goalFolders = fs
            .readdirSync(folderPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => path.join(folderPath, dirent.name));
        for (const goalFolder of goalFolders) {
            const goalFile = path.join(goalFolder, 'goal.md');
            if (!fs.existsSync(goalFile)) {
                validation.goalsWithMissingMetadata.push(goalFolder);
                validation.details.push(`❌ Missing goal.md: ${path.basename(goalFolder)}`);
                validation.passed = false;
                continue;
            }
            // Validate goal metadata
            const content = fs.readFileSync(goalFile, 'utf8');
            const frontmatter = this.extractFrontmatter(content);
            if (!frontmatter) {
                validation.goalsWithInvalidMetadata.push(goalFolder);
                validation.details.push(`❌ No frontmatter in goal.md: ${path.basename(goalFolder)}`);
                validation.passed = false;
                continue;
            }
            // Check required goal metadata fields
            const requiredFields = type === 'potential'
                ? ['type', 'tags', 'impact', 'effort', 'tier']
                : ['type', 'tags', 'status', 'priority'];
            const missingFields = requiredFields.filter(field => !frontmatter.hasOwnProperty(field));
            if (missingFields.length > 0) {
                validation.goalsWithInvalidMetadata.push(goalFolder);
                validation.details.push(`⚠️  Missing fields (${missingFields.join(', ')}): ${path.basename(goalFolder)}`);
                validation.passed = false;
            }
            else {
                validation.details.push(`✅ Valid goal metadata: ${path.basename(goalFolder)}`);
            }
        }
    }
    // ==========================================================================
    // Workflow Validation
    // ==========================================================================
    static validateWorkflow(projectPath) {
        const validation = {
            passed: true,
            completionPercentage: 0,
            missingSteps: [],
            completedSteps: [],
            details: [],
        };
        const workflowSteps = [
            {
                name: 'Constitution',
                check: () => {
                    const constitutionPath = path.join(projectPath, '01-planning', 'CONSTITUTION.md');
                    const exists = fs.existsSync(constitutionPath);
                    if (exists) {
                        const content = fs.readFileSync(constitutionPath, 'utf8');
                        // Check if it's substantive (more than just template)
                        return content.length > 500 && !content.includes('TODO');
                    }
                    return false;
                },
                description: 'Project constitution generated with principles and guidelines',
            },
            {
                name: 'Goals Extracted',
                check: () => {
                    const potentialGoalsPath = path.join(projectPath, '02-goals-and-roadmap', 'potential-goals');
                    if (!fs.existsSync(potentialGoalsPath))
                        return false;
                    const goals = fs.readdirSync(potentialGoalsPath, { withFileTypes: true })
                        .filter(dirent => dirent.isDirectory());
                    return goals.length > 0;
                },
                description: 'Goals extracted from discussions into potential goals',
            },
            {
                name: 'Stakeholders Documented',
                check: () => {
                    const stakeholdersPath = path.join(projectPath, '03-resources-docs-assets-tools', 'STAKEHOLDERS.md');
                    const exists = fs.existsSync(stakeholdersPath);
                    if (exists) {
                        const content = fs.readFileSync(stakeholdersPath, 'utf8');
                        // Check if it's substantive
                        return content.length > 300 && !content.includes('TODO');
                    }
                    return false;
                },
                description: 'Stakeholders identified and documented with influence/interest analysis',
            },
            {
                name: 'Roadmap Generated',
                check: () => {
                    const roadmapPath = path.join(projectPath, '02-goals-and-roadmap', 'ROADMAP.md');
                    const exists = fs.existsSync(roadmapPath);
                    if (exists) {
                        const content = fs.readFileSync(roadmapPath, 'utf8');
                        // Check if it's substantive (contains phases or milestones)
                        return content.length > 500 && (content.includes('Phase') || content.includes('Milestone'));
                    }
                    return false;
                },
                description: 'Project roadmap generated with phases and milestones',
            },
            {
                name: 'Workflow Diagrams',
                check: () => {
                    const diagramsPath = path.join(projectPath, '02-goals-and-roadmap', 'workflow-diagrams');
                    if (!fs.existsSync(diagramsPath))
                        return false;
                    const diagrams = fs.readdirSync(diagramsPath)
                        .filter(file => file.endsWith('.drawio') || file.endsWith('.png'));
                    return diagrams.length > 0;
                },
                description: 'Visual workflow diagrams created for goals and processes',
            },
            {
                name: 'Selected Goals with Specs',
                check: () => {
                    const selectedGoalsPath = path.join(projectPath, '02-goals-and-roadmap', 'selected-goals');
                    if (!fs.existsSync(selectedGoalsPath))
                        return false;
                    const goalFolders = fs.readdirSync(selectedGoalsPath, { withFileTypes: true })
                        .filter(dirent => dirent.isDirectory());
                    if (goalFolders.length === 0)
                        return true; // No selected goals yet is okay
                    // Check if at least one selected goal has a spec folder
                    const goalsWithSpecs = goalFolders.filter(folder => {
                        const specPath = path.join(selectedGoalsPath, folder.name, 'spec');
                        return fs.existsSync(specPath);
                    });
                    return goalsWithSpecs.length > 0;
                },
                description: 'Promoted goals have spec integration (spec-driven MCP workflow)',
            },
        ];
        // Run all workflow checks
        let completedCount = 0;
        for (const step of workflowSteps) {
            const completed = step.check();
            if (completed) {
                completedCount++;
                validation.completedSteps.push(step.name);
                validation.details.push(`✅ ${step.name}: ${step.description}`);
            }
            else {
                validation.missingSteps.push(step.name);
                validation.details.push(`❌ ${step.name}: ${step.description}`);
            }
        }
        validation.completionPercentage = Math.round((completedCount / workflowSteps.length) * 100);
        validation.passed = validation.completionPercentage >= 80; // 80% threshold for "passing"
        validation.details.unshift(`Workflow Completion: ${validation.completionPercentage}% (${completedCount}/${workflowSteps.length} steps)`);
        return validation;
    }
    // ==========================================================================
    // Auto-Fix
    // ==========================================================================
    static applyAutoFixes(input, result) {
        let fixesApplied = 0;
        // Fix missing folders
        if (result.checks.structure?.missingFolders.length) {
            for (const folder of result.checks.structure.missingFolders) {
                const folderPath = path.join(input.projectPath, folder);
                if (!fs.existsSync(folderPath)) {
                    fs.mkdirSync(folderPath, { recursive: true });
                    fixesApplied++;
                }
            }
        }
        // Fix missing root files
        if (result.checks.structure?.missingRootFiles.length) {
            for (const file of result.checks.structure.missingRootFiles) {
                const filePath = path.join(input.projectPath, file);
                if (!fs.existsSync(filePath)) {
                    const content = this.getDefaultFileContent(file, input.projectPath);
                    fs.writeFileSync(filePath, content, 'utf8');
                    fixesApplied++;
                }
            }
        }
        // Fix missing YAML frontmatter
        if (result.checks.yaml?.filesWithoutFrontmatter.length) {
            for (const file of result.checks.yaml.filesWithoutFrontmatter) {
                const filePath = path.join(input.projectPath, file);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const frontmatter = this.generateDefaultFrontmatter(file);
                    const newContent = `---\n${frontmatter}\n---\n\n${content}`;
                    fs.writeFileSync(filePath, newContent, 'utf8');
                    fixesApplied++;
                }
            }
        }
        return fixesApplied;
    }
    // ==========================================================================
    // Helper Methods
    // ==========================================================================
    static updateSummary(result, validation) {
        if (!validation.passed) {
            result.summary.totalIssues++;
            // Count critical vs warnings
            if (validation.missingFolders?.length || validation.missingRootFiles?.length) {
                result.summary.criticalIssues++;
            }
            else {
                result.summary.warnings++;
            }
        }
    }
    static findMarkdownFiles(dir) {
        const files = [];
        if (!fs.existsSync(dir)) {
            return files;
        }
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                // Skip node_modules and other ignored directories
                if (!this.shouldSkipDirectory(item.name)) {
                    files.push(...this.findMarkdownFiles(fullPath));
                }
            }
            else if (item.name.endsWith('.md')) {
                files.push(fullPath);
            }
        }
        return files;
    }
    static findResourceFiles(dir) {
        const files = [];
        if (!fs.existsSync(dir)) {
            return files;
        }
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                files.push(...this.findResourceFiles(fullPath));
            }
            else {
                files.push(fullPath);
            }
        }
        return files;
    }
    static shouldSkipFile(filePath) {
        const skipPatterns = [
            'node_modules/',
            '.git/',
            'dist/',
            'build/',
            '.DS_Store',
        ];
        return skipPatterns.some(pattern => filePath.includes(pattern));
    }
    static shouldSkipDirectory(dirName) {
        const skipDirs = ['node_modules', '.git', 'dist', 'build'];
        return skipDirs.includes(dirName);
    }
    static extractFrontmatter(content) {
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        if (!match)
            return null;
        const yamlContent = match[1];
        const frontmatter = {};
        // Simple YAML parser (good enough for our needs)
        const lines = yamlContent.split('\n');
        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.slice(0, colonIndex).trim();
                const value = line.slice(colonIndex + 1).trim();
                // Handle arrays
                if (value.startsWith('[') && value.endsWith(']')) {
                    frontmatter[key] = value.slice(1, -1).split(',').map(v => v.trim());
                }
                else {
                    frontmatter[key] = value;
                }
            }
        }
        return frontmatter;
    }
    static generateDefaultFrontmatter(filePath) {
        const fileName = path.basename(filePath, '.md');
        const type = this.inferFileType(fileName);
        const tags = this.inferTags(fileName);
        return `type: ${type}\ntags: [${tags.join(', ')}]`;
    }
    static inferFileType(fileName) {
        if (fileName.includes('README'))
            return 'readme';
        if (fileName.includes('guide') || fileName.includes('GUIDE'))
            return 'guide';
        if (fileName.includes('plan') || fileName.includes('PLAN'))
            return 'plan';
        if (fileName.includes('spec'))
            return 'specification';
        if (fileName.includes('goal'))
            return 'goal';
        return 'reference';
    }
    static inferTags(fileName) {
        const tags = [];
        const lowerName = fileName.toLowerCase();
        if (lowerName.includes('goal'))
            tags.push('goals');
        if (lowerName.includes('plan'))
            tags.push('planning');
        if (lowerName.includes('doc'))
            tags.push('documentation');
        if (lowerName.includes('spec'))
            tags.push('specification');
        if (tags.length === 0)
            tags.push('general');
        return tags;
    }
    static getDefaultFileContent(fileName, projectPath) {
        const today = new Date().toISOString().split('T')[0];
        const projectName = path.basename(projectPath);
        switch (fileName) {
            case 'README.md':
                return `---\ntype: readme\ntags: [project, overview]\n---\n\n# ${projectName}\n\n**Created:** ${today}\n\n## Overview\n\nTODO: Add project description\n`;
            case 'EVENT-LOG.md':
                return `---\ntype: reference\ntags: [event-log, timeline]\n---\n\n# Event Log\n\n**Last Updated:** ${today}\n\n## ${today} - Project Initiated\n\n### Initial Setup\n- Created project structure\n`;
            case 'NEXT-STEPS.md':
                return `---\ntype: reference\ntags: [next-steps, action-items]\n---\n\n# Next Steps\n\n**Last Updated:** ${today}\n\n## Immediate Actions\n\nTODO: Add next steps\n`;
            case 'TROUBLESHOOTING.md':
                return `---\ntype: reference\ntags: [troubleshooting, issues]\n---\n\n# Troubleshooting\n\n**Last Updated:** ${today}\n\n## Common Issues\n\nTODO: Document issues as they arise\n`;
            default:
                return `---\ntype: reference\ntags: [general]\n---\n\n# ${fileName}\n\nCreated: ${today}\n`;
        }
    }
    static getSummaryMessage(result) {
        if (result.success && result.summary.totalIssues === 0) {
            return '✅ Project validation passed! No issues found.';
        }
        const parts = [];
        if (result.summary.criticalIssues > 0) {
            parts.push(`${result.summary.criticalIssues} critical issue(s)`);
        }
        if (result.summary.warnings > 0) {
            parts.push(`${result.summary.warnings} warning(s)`);
        }
        if (result.summary.fixesApplied) {
            parts.push(`${result.summary.fixesApplied} fix(es) applied`);
        }
        return `⚠️  Validation completed with ${parts.join(', ')}`;
    }
    // ==========================================================================
    // Formatting
    // ==========================================================================
    static formatResult(result) {
        let output = '='.repeat(70) + '\n';
        output += '  PROJECT VALIDATION REPORT\n';
        output += '='.repeat(70) + '\n\n';
        // Summary
        output += `📊 SUMMARY\n`;
        output += `   Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}\n`;
        output += `   Total Issues: ${result.summary.totalIssues}\n`;
        output += `   Critical: ${result.summary.criticalIssues}\n`;
        output += `   Warnings: ${result.summary.warnings}\n`;
        if (result.summary.fixesApplied) {
            output += `   Fixes Applied: ${result.summary.fixesApplied}\n`;
        }
        output += '\n' + '─'.repeat(70) + '\n\n';
        // Structure validation
        if (result.checks.structure) {
            output += `📁 STRUCTURE VALIDATION\n`;
            output += `   Status: ${result.checks.structure.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
            if (result.checks.structure.missingFolders.length) {
                output += `   Missing Folders: ${result.checks.structure.missingFolders.length}\n`;
            }
            if (result.checks.structure.missingRootFiles.length) {
                output += `   Missing Root Files: ${result.checks.structure.missingRootFiles.length}\n`;
            }
            output += '\n';
        }
        // YAML validation
        if (result.checks.yaml) {
            output += `📝 YAML FRONTMATTER VALIDATION\n`;
            output += `   Status: ${result.checks.yaml.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
            if (result.checks.yaml.filesWithoutFrontmatter.length) {
                output += `   Files Without Frontmatter: ${result.checks.yaml.filesWithoutFrontmatter.length}\n`;
            }
            if (result.checks.yaml.filesWithInvalidFrontmatter.length) {
                output += `   Files With Invalid Frontmatter: ${result.checks.yaml.filesWithInvalidFrontmatter.length}\n`;
            }
            output += '\n';
        }
        // Resource index validation
        if (result.checks.resourceIndex) {
            output += `📚 RESOURCE INDEX VALIDATION\n`;
            output += `   Status: ${result.checks.resourceIndex.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
            if (result.checks.resourceIndex.missingIndex) {
                output += `   ⚠️  RESOURCE-INDEX.md not found\n`;
            }
            if (result.checks.resourceIndex.untrackedFiles.length) {
                output += `   Untracked Files: ${result.checks.resourceIndex.untrackedFiles.length}\n`;
            }
            output += '\n';
        }
        // Goals validation
        if (result.checks.goals) {
            output += `🎯 GOALS VALIDATION\n`;
            output += `   Status: ${result.checks.goals.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
            if (result.checks.goals.goalsWithMissingMetadata.length) {
                output += `   Goals Missing Metadata: ${result.checks.goals.goalsWithMissingMetadata.length}\n`;
            }
            if (result.checks.goals.goalsWithInvalidMetadata.length) {
                output += `   Goals With Invalid Metadata: ${result.checks.goals.goalsWithInvalidMetadata.length}\n`;
            }
            output += '\n';
        }
        // Workflow validation
        if (result.checks.workflow) {
            output += `🔄 WORKFLOW COMPLIANCE VALIDATION\n`;
            output += `   Status: ${result.checks.workflow.passed ? '✅ PASSED' : '⚠️  NEEDS ATTENTION'}\n`;
            output += `   Completion: ${result.checks.workflow.completionPercentage}%\n`;
            output += `   Completed Steps: ${result.checks.workflow.completedSteps.length}/${result.checks.workflow.completedSteps.length + result.checks.workflow.missingSteps.length}\n`;
            if (result.checks.workflow.missingSteps.length) {
                output += `   Missing Steps: ${result.checks.workflow.missingSteps.join(', ')}\n`;
            }
            output += '\n';
        }
        output += '='.repeat(70) + '\n';
        output += result.message + '\n';
        output += '='.repeat(70) + '\n';
        return output;
    }
    // ==========================================================================
    // Tool Definition
    // ==========================================================================
    static getToolDefinition() {
        return {
            name: 'validate_project',
            description: 'Validate project structure, YAML frontmatter, RESOURCE-INDEX tracking, goal metadata, and workflow compliance. Provides comprehensive validation with optional auto-fix capabilities.',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to the project directory',
                    },
                    checks: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: ['structure', 'yaml', 'resource-index', 'goals', 'workflow', 'all'],
                        },
                        description: 'Types of validation to perform (default: ["all"])',
                    },
                    autoFix: {
                        type: 'boolean',
                        description: 'Automatically fix issues where possible (default: false)',
                    },
                    skipConfirmation: {
                        type: 'boolean',
                        description: 'Skip confirmation prompts for auto-fix (default: false)',
                    },
                },
                required: ['projectPath'],
            },
        };
    }
}
//# sourceMappingURL=validate-project.js.map