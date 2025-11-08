/**
 * Entity Loader - File System Scanner
 *
 * Loads all hierarchical entities from the project file structure.
 * Reads markdown files and constructs in-memory entity representations.
 *
 * Created: 2025-10-27
 */
import { readFile, readdir, stat } from 'fs/promises';
import { join, basename } from 'path';
const DEFAULT_LOADER_OPTIONS = {
    loadProjectOverview: true,
    loadComponents: true,
    loadGoals: true,
    loadTaskWorkflows: true,
    continueOnError: true,
    throwOnMissingProjectOverview: false,
    maxConcurrentReads: 10,
    includeArchivedWorkflows: false,
};
// ============================================================================
// ENTITY LOADER
// ============================================================================
export class EntityLoader {
    projectPath;
    options;
    errors = [];
    constructor(projectPath, options = {}) {
        this.projectPath = projectPath;
        this.options = { ...DEFAULT_LOADER_OPTIONS, ...options };
    }
    /**
     * Load complete hierarchy from file system
     */
    async loadHierarchy() {
        const startTime = Date.now();
        this.errors = [];
        const result = {
            components: new Map(),
            subAreas: new Map(),
            majorGoals: new Map(),
            subGoals: new Map(),
            taskWorkflows: new Map(),
            tasks: new Map(),
            loadedAt: startTime,
            loadDurationMs: 0,
            entityCounts: {
                components: 0,
                subAreas: 0,
                majorGoals: 0,
                subGoals: 0,
                taskWorkflows: 0,
                tasks: 0,
            },
            errors: [],
        };
        try {
            // Load PROJECT OVERVIEW
            if (this.options.loadProjectOverview) {
                result.projectOverview = await this.loadProjectOverview();
            }
            // Load components
            if (this.options.loadComponents) {
                await this.loadComponents(result);
            }
            // Load goals (major goals and sub-goals)
            if (this.options.loadGoals) {
                await this.loadGoals(result);
            }
            // Load task workflows
            if (this.options.loadTaskWorkflows) {
                await this.loadTaskWorkflows(result);
            }
            // Update entity counts
            result.entityCounts = {
                components: result.components.size,
                subAreas: result.subAreas.size,
                majorGoals: result.majorGoals.size,
                subGoals: result.subGoals.size,
                taskWorkflows: result.taskWorkflows.size,
                tasks: result.tasks.size,
            };
            result.errors = this.errors;
            result.loadDurationMs = Date.now() - startTime;
            return result;
        }
        catch (error) {
            this.recordError('project-root', 'hierarchy', error.message);
            throw error;
        }
    }
    // ==========================================================================
    // PROJECT OVERVIEW LOADING
    // ==========================================================================
    /**
     * Load PROJECT OVERVIEW from markdown
     */
    async loadProjectOverview() {
        const overviewPath = join(this.projectPath, 'PROJECT-OVERVIEW.md');
        try {
            const content = await readFile(overviewPath, 'utf-8');
            return this.parseProjectOverview(content, overviewPath);
        }
        catch (error) {
            this.recordError(overviewPath, 'project-overview', error.message);
            if (this.options.throwOnMissingProjectOverview) {
                throw new Error(`Failed to load PROJECT OVERVIEW: ${error.message}`);
            }
            return undefined;
        }
    }
    /**
     * Parse PROJECT OVERVIEW markdown
     */
    parseProjectOverview(content, filePath) {
        // This is a simplified parser - production version would use gray-matter + markdown parsing
        const lines = content.split('\n');
        // Extract basic info from frontmatter or content
        const nameMatch = content.match(/^#\s+(.+)$/m);
        const name = nameMatch ? nameMatch[1] : 'Unnamed Project';
        const id = this.slugify(name);
        return {
            id,
            name,
            description: 'Loaded from file system',
            versionInfo: {
                version: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            versionHistory: [],
            vision: {
                missionStatement: '',
                successCriteria: [],
                scope: { inScope: [], outOfScope: [] },
                risks: [],
            },
            constraints: {
                timeline: { milestones: [] },
                resources: { team: [], tools: [], technologies: [] },
            },
            stakeholders: [],
            resources: {
                existingAssets: [],
                neededAssets: [],
                externalDependencies: [],
            },
            components: [],
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            status: 'active',
            filePath,
        };
    }
    // ==========================================================================
    // COMPONENT LOADING
    // ==========================================================================
    /**
     * Load all components
     */
    async loadComponents(result) {
        const componentsPath = join(this.projectPath, 'components');
        try {
            const componentDirs = await this.readDirectories(componentsPath);
            for (const dir of componentDirs) {
                try {
                    const component = await this.loadComponent(join(componentsPath, dir));
                    if (component) {
                        result.components.set(component.id, component);
                    }
                }
                catch (error) {
                    this.recordError(dir, 'component', error.message);
                    if (!this.options.continueOnError)
                        throw error;
                }
            }
        }
        catch (error) {
            this.recordError(componentsPath, 'components-directory', error.message);
            if (!this.options.continueOnError)
                throw error;
        }
    }
    /**
     * Load single component
     */
    async loadComponent(componentPath) {
        const overviewPath = join(componentPath, 'COMPONENT-OVERVIEW.md');
        try {
            const content = await readFile(overviewPath, 'utf-8');
            return this.parseComponent(content, componentPath, overviewPath);
        }
        catch (error) {
            this.recordError(overviewPath, 'component', error.message);
            return null;
        }
    }
    /**
     * Parse component markdown
     */
    parseComponent(content, folderPath, overviewFilePath) {
        // Simplified parser
        const nameMatch = content.match(/^#\s+(.+)$/m);
        const name = nameMatch ? nameMatch[1].replace('Component:', '').trim() : 'Unnamed Component';
        const id = basename(folderPath);
        return {
            id,
            name,
            description: 'Loaded from file system',
            projectId: 'project',
            versionInfo: {
                version: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            subAreas: [],
            majorGoals: [],
            purpose: '',
            successCriteria: [],
            dependencies: [],
            risks: [],
            progress: this.createEmptyProgress(),
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            status: 'in-progress',
            folderPath,
            overviewFilePath,
        };
    }
    // ==========================================================================
    // GOAL LOADING
    // ==========================================================================
    /**
     * Load all major goals and sub-goals
     */
    async loadGoals(result) {
        const componentsPath = join(this.projectPath, 'components');
        try {
            const componentDirs = await this.readDirectories(componentsPath);
            for (const componentDir of componentDirs) {
                const componentId = componentDir;
                const majorGoalsPath = join(componentsPath, componentDir, 'major-goals');
                try {
                    const goalDirs = await this.readDirectories(majorGoalsPath);
                    for (const goalDir of goalDirs) {
                        try {
                            const goalPath = join(majorGoalsPath, goalDir);
                            const majorGoal = await this.loadMajorGoal(goalPath, componentId);
                            if (majorGoal) {
                                result.majorGoals.set(majorGoal.id, majorGoal);
                                // Load sub-goals for this major goal
                                await this.loadSubGoals(goalPath, majorGoal.id, componentId, result);
                            }
                        }
                        catch (error) {
                            this.recordError(goalDir, 'major-goal', error.message);
                            if (!this.options.continueOnError)
                                throw error;
                        }
                    }
                }
                catch (error) {
                    // major-goals folder might not exist for this component
                    if (error.code !== 'ENOENT') {
                        this.recordError(majorGoalsPath, 'major-goals-directory', error.message);
                    }
                }
            }
        }
        catch (error) {
            this.recordError(componentsPath, 'components-directory', error.message);
            if (!this.options.continueOnError)
                throw error;
        }
    }
    /**
     * Load single major goal
     */
    async loadMajorGoal(goalPath, componentId) {
        try {
            // Find the main goal markdown file
            const files = await readdir(goalPath);
            const goalFile = files.find(f => f.endsWith('.md') && f !== 'GOAL-STATUS.md');
            if (!goalFile) {
                throw new Error('No goal markdown file found');
            }
            const goalFilePath = join(goalPath, goalFile);
            const content = await readFile(goalFilePath, 'utf-8');
            return this.parseMajorGoal(content, goalPath, goalFilePath, componentId);
        }
        catch (error) {
            this.recordError(goalPath, 'major-goal', error.message);
            return null;
        }
    }
    /**
     * Parse major goal markdown
     */
    parseMajorGoal(content, folderPath, goalFilePath, componentId) {
        // Extract goal ID from folder name (e.g., "001-goal-name" -> "001")
        const folderName = basename(folderPath);
        const idMatch = folderName.match(/^(\d+)/);
        const id = idMatch ? idMatch[1] : folderName;
        // Extract name from markdown
        const nameMatch = content.match(/^#\s+(.+)$/m);
        const name = nameMatch ? nameMatch[1] : 'Unnamed Goal';
        return {
            id,
            name,
            description: 'Loaded from file system',
            projectId: 'project',
            componentId,
            priority: 'medium',
            tier: 'now',
            impact: 'medium',
            effort: 'medium',
            problem: '',
            expectedValue: '',
            successCriteria: [],
            dependencies: [],
            risks: [],
            alternatives: [],
            subGoals: [],
            progress: this.createEmptyProgress(),
            timeEstimate: 'Unknown',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            status: 'in-progress',
            folderPath,
            goalFilePath,
            statusFilePath: join(folderPath, 'GOAL-STATUS.md'),
        };
    }
    /**
     * Load sub-goals for a major goal
     */
    async loadSubGoals(goalPath, majorGoalId, componentId, result) {
        const subGoalsPath = join(goalPath, 'sub-goals');
        try {
            const subGoalDirs = await this.readDirectories(subGoalsPath);
            for (const subGoalDir of subGoalDirs) {
                try {
                    const subGoalPath = join(subGoalsPath, subGoalDir);
                    const subGoal = await this.loadSubGoal(subGoalPath, majorGoalId, componentId);
                    if (subGoal) {
                        result.subGoals.set(subGoal.id, subGoal);
                    }
                }
                catch (error) {
                    this.recordError(subGoalDir, 'sub-goal', error.message);
                    if (!this.options.continueOnError)
                        throw error;
                }
            }
        }
        catch (error) {
            // sub-goals folder might not exist yet
            if (error.code !== 'ENOENT') {
                this.recordError(subGoalsPath, 'sub-goals-directory', error.message);
            }
        }
    }
    /**
     * Load single sub-goal
     */
    async loadSubGoal(subGoalPath, majorGoalId, componentId) {
        try {
            const specFilePath = join(subGoalPath, 'SPECIFICATION.md');
            const content = await readFile(specFilePath, 'utf-8');
            return this.parseSubGoal(content, subGoalPath, specFilePath, majorGoalId, componentId);
        }
        catch (error) {
            this.recordError(subGoalPath, 'sub-goal', error.message);
            return null;
        }
    }
    /**
     * Parse sub-goal markdown
     */
    parseSubGoal(content, folderPath, specFilePath, majorGoalId, componentId) {
        // Extract sub-goal ID from folder name (e.g., "1.1")
        const folderName = basename(folderPath);
        const id = folderName;
        // Extract name from markdown
        const nameMatch = content.match(/^#\s+(.+)$/m);
        const name = nameMatch ? nameMatch[1] : 'Unnamed Sub-Goal';
        return {
            id,
            name,
            description: 'Loaded from file system',
            projectId: 'project',
            componentId,
            majorGoalId,
            acceptanceCriteria: [],
            taskWorkflows: [],
            progress: this.createEmptyProgress(),
            timeEstimate: 'Unknown',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            status: 'in-progress',
            folderPath,
            specFilePath,
        };
    }
    // ==========================================================================
    // TASK WORKFLOW LOADING
    // ==========================================================================
    /**
     * Load all task workflows
     */
    async loadTaskWorkflows(result) {
        const tempWorkflowsPath = join(this.projectPath, 'temp', 'workflows');
        try {
            const workflowDirs = await this.readDirectories(tempWorkflowsPath);
            for (const workflowDir of workflowDirs) {
                try {
                    const workflowPath = join(tempWorkflowsPath, workflowDir);
                    const workflow = await this.loadTaskWorkflow(workflowPath);
                    if (workflow) {
                        result.taskWorkflows.set(workflow.workflowId, workflow);
                        // Load tasks for this workflow
                        for (const task of workflow.tasks) {
                            const taskKey = `${workflow.workflowId}:${task.taskId}`;
                            result.tasks.set(taskKey, task);
                        }
                    }
                }
                catch (error) {
                    this.recordError(workflowDir, 'task-workflow', error.message);
                    if (!this.options.continueOnError)
                        throw error;
                }
            }
        }
        catch (error) {
            // temp/workflows folder might not exist
            if (error.code !== 'ENOENT') {
                this.recordError(tempWorkflowsPath, 'workflows-directory', error.message);
            }
        }
    }
    /**
     * Load single task workflow
     */
    async loadTaskWorkflow(workflowPath) {
        try {
            const tasksFilePath = join(workflowPath, 'tasks.md');
            const content = await readFile(tasksFilePath, 'utf-8');
            return this.parseTaskWorkflow(content, workflowPath);
        }
        catch (error) {
            this.recordError(workflowPath, 'task-workflow', error.message);
            return null;
        }
    }
    /**
     * Parse task workflow markdown
     */
    parseTaskWorkflow(content, workflowPath) {
        const workflowId = basename(workflowPath);
        // Extract workflow name from markdown
        const nameMatch = content.match(/^#\s+(.+)$/m);
        const workflowName = nameMatch ? nameMatch[1] : 'Unnamed Workflow';
        // Parse tasks from markdown (simplified)
        const tasks = [];
        const taskMatches = content.matchAll(/^-\s+\[([x\s])\]\s+(.+)$/gm);
        let taskId = 1;
        for (const match of taskMatches) {
            const completed = match[1] === 'x';
            const description = match[2];
            tasks.push({
                taskId: String(taskId),
                description,
                status: completed ? 'completed' : 'pending',
                verified: false,
            });
            taskId++;
        }
        return {
            workflowId,
            workflowName,
            projectId: 'project',
            componentId: 'unknown',
            majorGoalId: 'unknown',
            subGoalId: 'unknown',
            tasks,
            progress: this.createEmptyProgress(),
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            status: 'in-progress',
            workflowPath,
        };
    }
    // ==========================================================================
    // UTILITIES
    // ==========================================================================
    /**
     * Read directories in a path
     */
    async readDirectories(path) {
        const entries = await readdir(path);
        const directories = [];
        for (const entry of entries) {
            const fullPath = join(path, entry);
            const stats = await stat(fullPath);
            if (stats.isDirectory()) {
                directories.push(entry);
            }
        }
        return directories;
    }
    /**
     * Create empty progress object
     */
    createEmptyProgress() {
        return {
            percentage: 0,
            status: 'not-started',
            lastUpdated: new Date().toISOString(),
            completedItems: 0,
            totalItems: 0,
        };
    }
    /**
     * Slugify string to create ID
     */
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    /**
     * Record loading error
     */
    recordError(filePath, entityType, errorMessage) {
        this.errors.push({
            filePath,
            entityType,
            errorMessage,
            timestamp: Date.now(),
        });
    }
}
// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================
/**
 * Load complete hierarchy from project path
 */
export async function loadProjectHierarchy(projectPath, options) {
    const loader = new EntityLoader(projectPath, options);
    return loader.loadHierarchy();
}
/**
 * Load only components
 */
export async function loadComponents(projectPath) {
    const loader = new EntityLoader(projectPath, {
        loadProjectOverview: false,
        loadGoals: false,
        loadTaskWorkflows: false,
    });
    const result = await loader.loadHierarchy();
    return result.components;
}
/**
 * Load only major goals
 */
export async function loadMajorGoals(projectPath) {
    const loader = new EntityLoader(projectPath, {
        loadProjectOverview: false,
        loadComponents: false,
        loadTaskWorkflows: false,
    });
    const result = await loader.loadHierarchy();
    return result.majorGoals;
}
//# sourceMappingURL=entity-loader.js.map