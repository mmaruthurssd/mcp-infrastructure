/**
 * MCP Tool: Create PROJECT OVERVIEW
 *
 * Conducts guided conversation to generate comprehensive PROJECT OVERVIEW document
 * for hierarchical planning v1.0.0
 */
import { z } from 'zod';
/**
 * Question flow definition
 *
 * Organized by phase for progressive disclosure
 */
export const QUESTION_FLOW = {
    // ========== PHASE 1: ESSENTIALS ==========
    'q1-project-name': {
        id: 'q1-project-name',
        question: "What's the name of your project?",
        purpose: 'Identify the project',
        optional: false,
        extractionHints: ['project name'],
    },
    'q2-project-type': {
        id: 'q2-project-type',
        question: "What type of project is this? (software, research, business, product, or other)",
        purpose: 'Determine project category for context',
        optional: false,
        extractionHints: ['project type', 'category'],
    },
    'q3-primary-purpose': {
        id: 'q3-primary-purpose',
        question: "In one or two sentences, what's the main purpose of this project?",
        purpose: 'Get high-level understanding',
        optional: false,
        extractionHints: ['primary purpose', 'main goal', 'problem being solved'],
    },
    // ========== PHASE 2: VISION ==========
    'q4-vision-statement': {
        id: 'q4-vision-statement',
        question: "What's your vision for this project? Where do you want it to be in 6-12 months?",
        purpose: 'Extract vision statement',
        optional: false,
        followUps: ['q5-key-outcomes'],
        extractionHints: ['vision statement', 'future state', 'success looks like'],
    },
    'q5-key-outcomes': {
        id: 'q5-key-outcomes',
        question: "What are the key outcomes you're aiming for? What specific results would make this project successful?",
        purpose: 'Identify measurable outcomes',
        optional: false,
        extractionHints: ['key outcomes', 'success criteria', 'deliverables'],
    },
    'q6-target-audience': {
        id: 'q6-target-audience',
        question: "Who will use or benefit from this project? Who's your target audience?",
        purpose: 'Identify users/beneficiaries',
        optional: true,
        extractionHints: ['target audience', 'users', 'beneficiaries', 'customers'],
    },
    // ========== PHASE 3: STAKEHOLDERS ==========
    'q7-key-stakeholders': {
        id: 'q7-key-stakeholders',
        question: "Who are the key stakeholders for this project? (People who have influence or interest in the outcome)",
        purpose: 'Identify stakeholders',
        optional: true,
        followUps: ['q8-stakeholder-concerns'],
        extractionHints: ['stakeholder names', 'roles', 'influence level'],
    },
    'q8-stakeholder-concerns': {
        id: 'q8-stakeholder-concerns',
        question: "What are the main concerns or priorities of your key stakeholders?",
        purpose: 'Understand stakeholder perspectives',
        optional: true,
        extractionHints: ['concerns', 'priorities', 'expectations'],
    },
    // ========== PHASE 4: RESOURCES ==========
    'q9-team-resources': {
        id: 'q9-team-resources',
        question: "What team or resources do you have available for this project?",
        purpose: 'Identify available resources',
        optional: true,
        followUps: ['q10-tools-tech'],
        extractionHints: ['team members', 'skills', 'roles', 'availability'],
    },
    'q10-tools-tech': {
        id: 'q10-tools-tech',
        question: "What tools, technologies, or platforms will you be using?",
        purpose: 'Identify technical resources',
        optional: true,
        extractionHints: ['tools', 'technologies', 'platforms', 'frameworks'],
    },
    // ========== PHASE 5: CONSTRAINTS ==========
    'q11-timeline': {
        id: 'q11-timeline',
        question: "What's your timeline for this project? Any key dates or milestones?",
        purpose: 'Understand time constraints',
        optional: true,
        extractionHints: ['timeline', 'deadlines', 'milestones', 'launch date'],
    },
    'q12-constraints': {
        id: 'q12-constraints',
        question: "Are there any constraints we should know about? (budget, resources, technical limitations, regulations, etc.)",
        purpose: 'Identify blockers and limitations',
        optional: true,
        extractionHints: [
            'budget constraints',
            'resource limitations',
            'technical constraints',
            'regulatory requirements',
            'dependencies',
        ],
    },
};
/**
 * Get next question based on current state
 */
export function getNextQuestion(state) {
    const phaseQuestions = {
        essentials: ['q1-project-name', 'q2-project-type', 'q3-primary-purpose'],
        vision: ['q4-vision-statement', 'q5-key-outcomes', 'q6-target-audience'],
        stakeholders: ['q7-key-stakeholders', 'q8-stakeholder-concerns'],
        resources: ['q9-team-resources', 'q10-tools-tech'],
        constraints: ['q11-timeline', 'q12-constraints'],
        confirmation: [],
    };
    const questionsForPhase = phaseQuestions[state.phase] || [];
    // Find first unasked question in current phase
    for (const questionId of questionsForPhase) {
        if (!state.questionsAsked.includes(questionId)) {
            return QUESTION_FLOW[questionId];
        }
    }
    // All questions in phase answered, move to next phase
    const phaseOrder = [
        'essentials',
        'vision',
        'stakeholders',
        'resources',
        'constraints',
        'confirmation',
    ];
    const currentPhaseIndex = phaseOrder.indexOf(state.phase);
    if (currentPhaseIndex < phaseOrder.length - 1) {
        const nextPhase = phaseOrder[currentPhaseIndex + 1];
        state.phase = nextPhase;
        return getNextQuestion(state);
    }
    // All phases complete
    return null;
}
/**
 * Initialize conversation state
 */
export function initializeConversation(projectId) {
    return {
        projectId,
        conversationId: `conv-${Date.now()}`,
        phase: 'essentials',
        questionsAsked: [],
        extractedData: {},
    };
}
import * as fs from 'fs';
import * as path from 'path';
import { extractFromResponse, generateExtractionSummary } from '../utils/conversation-extractor.js';
import { generateProjectOverviewContent, extractedDataToProjectOverview } from '../templates/project-overview.template.js';
import { validateProjectOverview } from '../validation/validators.js';
// In-memory conversation storage (could be persisted to temp files in production)
const activeConversations = new Map();
/**
 * MCP Tool: Create PROJECT OVERVIEW
 *
 * Starts a guided conversation to generate PROJECT OVERVIEW document
 */
export async function createProjectOverview(args) {
    const { projectPath, initialDescription } = args;
    // Validate project path exists
    if (!fs.existsSync(projectPath)) {
        throw new Error(`Project path does not exist: ${projectPath}`);
    }
    // Generate project ID from path
    const projectId = path.basename(projectPath);
    // Initialize conversation
    const state = initializeConversation(projectId);
    // If initial description provided, use it to seed data
    if (initialDescription) {
        state.extractedData.primaryPurpose = initialDescription;
        state.questionsAsked.push('q3-primary-purpose');
    }
    // Store conversation state
    activeConversations.set(state.conversationId, state);
    // Get first question
    const nextQuestion = getNextQuestion(state);
    if (!nextQuestion) {
        throw new Error('Failed to initialize conversation');
    }
    return {
        success: true,
        conversationId: state.conversationId,
        question: nextQuestion.question,
        phase: state.phase,
        progress: {
            current: state.questionsAsked.length,
            total: Object.keys(QUESTION_FLOW).length,
        },
    };
}
/**
 * MCP Tool: Continue PROJECT OVERVIEW conversation
 *
 * Process user response and return next question
 */
export async function continueProjectOverviewConversation(args) {
    const { conversationId, userResponse } = args;
    // Retrieve conversation state
    const state = activeConversations.get(conversationId);
    if (!state) {
        throw new Error(`Conversation not found: ${conversationId}`);
    }
    // Get current question
    const currentQuestion = state.nextQuestion || getNextQuestion(state);
    if (!currentQuestion) {
        throw new Error('No active question found');
    }
    // Extract information from response
    state.extractedData = extractFromResponse(currentQuestion.id, userResponse, state.extractedData);
    // Mark question as asked
    state.questionsAsked.push(currentQuestion.id);
    // Get next question
    const nextQuestion = getNextQuestion(state);
    if (!nextQuestion) {
        // Conversation complete - generate summary
        const summary = generateExtractionSummary(state.extractedData);
        return {
            success: true,
            phase: 'confirmation',
            progress: {
                current: state.questionsAsked.length,
                total: Object.keys(QUESTION_FLOW).length,
            },
            complete: true,
            summary,
        };
    }
    // Update state with next question
    state.nextQuestion = nextQuestion;
    return {
        success: true,
        question: nextQuestion.question,
        phase: state.phase,
        progress: {
            current: state.questionsAsked.length,
            total: Object.keys(QUESTION_FLOW).length,
        },
        complete: false,
    };
}
/**
 * MCP Tool: Finalize PROJECT OVERVIEW
 *
 * Generate and save PROJECT OVERVIEW document
 */
export async function finalizeProjectOverview(args) {
    const { projectPath, conversationId, confirm } = args;
    if (!confirm) {
        return { success: false, error: 'User cancelled PROJECT OVERVIEW generation' };
    }
    // Retrieve conversation state
    const state = activeConversations.get(conversationId);
    if (!state) {
        throw new Error(`Conversation not found: ${conversationId}`);
    }
    // Validate extracted data
    if (!state.extractedData.projectName) {
        throw new Error('Project name is required');
    }
    // Generate PROJECT OVERVIEW entity
    const projectOverview = extractedDataToProjectOverview(state.extractedData, state.projectId, projectPath);
    // Validate using Zod schema
    const validationResult = validateProjectOverview(projectOverview);
    if (!validationResult.valid) {
        return {
            success: false,
            error: 'Validation failed',
            validationResult,
        };
    }
    // Generate markdown content
    const content = generateProjectOverviewContent(state.extractedData, state.projectId);
    // Ensure 01-planning directory exists
    const planningDir = path.join(projectPath, '01-planning');
    if (!fs.existsSync(planningDir)) {
        fs.mkdirSync(planningDir, { recursive: true });
    }
    // Write PROJECT OVERVIEW file
    const filePath = path.join(planningDir, 'PROJECT-OVERVIEW.md');
    fs.writeFileSync(filePath, content, 'utf-8');
    // Clean up conversation state
    activeConversations.delete(conversationId);
    return {
        success: true,
        filePath,
        validationResult,
    };
}
/**
 * MCP Tool Definition
 */
export const createProjectOverviewTool = {
    name: 'create_project_overview',
    description: 'Start a guided conversation to create a comprehensive PROJECT OVERVIEW document for hierarchical planning v1.0.0',
    inputSchema: z.object({
        projectPath: z.string().describe('Absolute path to the project directory'),
        initialDescription: z
            .string()
            .optional()
            .describe('Optional initial description to seed the conversation'),
    }),
};
/**
 * MCP Tool: Continue PROJECT OVERVIEW conversation
 */
export const continueProjectOverviewConversationTool = {
    name: 'continue_project_overview_conversation',
    description: 'Continue the PROJECT OVERVIEW guided conversation with user response',
    inputSchema: z.object({
        projectPath: z.string().describe('Absolute path to the project directory'),
        conversationId: z.string().describe('Conversation ID from create_project_overview'),
        userResponse: z.string().describe("User's answer to the previous question"),
    }),
};
/**
 * MCP Tool: Finalize PROJECT OVERVIEW
 */
export const finalizeProjectOverviewTool = {
    name: 'finalize_project_overview',
    description: 'Generate and save the PROJECT OVERVIEW document from conversation data',
    inputSchema: z.object({
        projectPath: z.string().describe('Absolute path to the project directory'),
        conversationId: z.string().describe('Conversation ID from create_project_overview'),
        confirm: z.boolean().default(true).describe('Confirm generation'),
    }),
};
/**
 * MCP Tool: Update PROJECT OVERVIEW
 *
 * Update existing PROJECT OVERVIEW with cascade detection and rollback support
 */
export async function updateProjectOverview(args) {
    const { projectPath, updates, incrementVersion = true, changeDescription, dryRun = false } = args;
    let backupPath = null;
    try {
        // Read existing PROJECT OVERVIEW
        const overviewPath = path.join(projectPath, '01-planning', 'PROJECT-OVERVIEW.md');
        if (!fs.existsSync(overviewPath)) {
            throw new Error(`PROJECT OVERVIEW does not exist at ${overviewPath}`);
        }
        // Create backup before making changes
        const existingContent = fs.readFileSync(overviewPath, 'utf-8');
        backupPath = path.join(projectPath, '01-planning', '.PROJECT-OVERVIEW.backup.md');
        fs.writeFileSync(backupPath, existingContent, 'utf-8');
        // Parse existing content
        const oldData = parseProjectOverviewMarkdown(existingContent);
        // Validate updates
        validateUpdatesStructure(updates);
        // Merge updates with existing data
        const updatedData = {
            ...oldData,
            ...updates,
        };
        // Generate updated PROJECT OVERVIEW entity
        const projectId = path.basename(projectPath);
        const oldEntity = extractedDataToProjectOverview(oldData, projectId, projectPath);
        const newEntity = extractedDataToProjectOverview(updatedData, projectId, projectPath);
        // Increment version if requested
        if (incrementVersion) {
            const oldVersion = oldEntity.versionInfo.version;
            const newVersion = oldVersion + 1;
            const timestamp = new Date().toISOString();
            newEntity.versionInfo = {
                version: newVersion,
                createdAt: oldEntity.versionInfo.createdAt,
                updatedAt: timestamp,
                updatedBy: 'Project Management MCP',
                changeDescription: changeDescription || 'PROJECT OVERVIEW updated',
            };
            // Update version history
            newEntity.versionHistory.push({
                version: newVersion,
                date: timestamp,
                changes: [changeDescription || 'PROJECT OVERVIEW updated'],
            });
        }
        // Analyze cascade impacts
        const cascadeImpacts = await analyzeCascadeImpacts(projectPath, oldEntity, newEntity);
        // Validate cascade safety
        const { validateCascadeUpdate } = await import('../utils/hierarchical-utils.js');
        const cascadeValidation = validateCascadeUpdate(cascadeImpacts);
        if (!cascadeValidation.safe && !dryRun) {
            // Clean up backup before returning error
            if (backupPath && fs.existsSync(backupPath)) {
                fs.unlinkSync(backupPath);
            }
            return {
                success: false,
                error: 'Cascade update has blocking issues',
                warnings: [...cascadeValidation.warnings, ...cascadeValidation.blockers],
            };
        }
        // If dry run, return impacts without updating
        if (dryRun) {
            // Clean up backup
            if (backupPath && fs.existsSync(backupPath)) {
                fs.unlinkSync(backupPath);
            }
            return {
                success: true,
                cascadeImpacts,
                warnings: [
                    '[DRY RUN] No changes were made',
                    ...cascadeValidation.warnings,
                ],
            };
        }
        // Validate updated entity
        const validationResult = validateProjectOverview(newEntity);
        if (!validationResult.valid) {
            // Rollback on validation failure
            await rollbackUpdate(overviewPath, backupPath);
            return {
                success: false,
                error: 'Updated PROJECT OVERVIEW failed validation',
                warnings: validationResult.errors.map((e) => e.message || String(e)),
            };
        }
        // Generate updated markdown content
        const updatedContent = generateProjectOverviewContent(updatedData, projectId);
        // Write updated file
        fs.writeFileSync(overviewPath, updatedContent, 'utf-8');
        // Clean up backup on success
        if (backupPath && fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
        }
        return {
            success: true,
            cascadeImpacts,
            updatedFilePath: overviewPath,
            versionInfo: newEntity.versionInfo,
            warnings: cascadeValidation.warnings,
        };
    }
    catch (error) {
        // Rollback on any error
        const overviewPath = path.join(projectPath, '01-planning', 'PROJECT-OVERVIEW.md');
        await rollbackUpdate(overviewPath, backupPath);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            warnings: ['Changes were rolled back due to error'],
        };
    }
}
/**
 * Validate structure of updates object
 */
function validateUpdatesStructure(updates) {
    // Check for invalid field types
    if (updates.projectName !== undefined && typeof updates.projectName !== 'string') {
        throw new Error('projectName must be a string');
    }
    if (updates.projectType !== undefined) {
        const validTypes = ['software', 'research', 'business', 'product', 'other'];
        if (!validTypes.includes(updates.projectType)) {
            throw new Error(`projectType must be one of: ${validTypes.join(', ')}`);
        }
    }
    if (updates.goals !== undefined && !Array.isArray(updates.goals)) {
        throw new Error('goals must be an array');
    }
    if (updates.keyOutcomes !== undefined && !Array.isArray(updates.keyOutcomes)) {
        throw new Error('keyOutcomes must be an array');
    }
    if (updates.stakeholders !== undefined && !Array.isArray(updates.stakeholders)) {
        throw new Error('stakeholders must be an array');
    }
    if (updates.team !== undefined && !Array.isArray(updates.team)) {
        throw new Error('team must be an array');
    }
    if (updates.tools !== undefined && !Array.isArray(updates.tools)) {
        throw new Error('tools must be an array');
    }
    if (updates.technologies !== undefined && !Array.isArray(updates.technologies)) {
        throw new Error('technologies must be an array');
    }
}
/**
 * Rollback update by restoring backup
 */
async function rollbackUpdate(filePath, backupPath) {
    if (!backupPath || !fs.existsSync(backupPath)) {
        return; // No backup to restore
    }
    try {
        const backupContent = fs.readFileSync(backupPath, 'utf-8');
        fs.writeFileSync(filePath, backupContent, 'utf-8');
        fs.unlinkSync(backupPath); // Clean up backup after restore
    }
    catch (error) {
        // If rollback fails, keep backup file for manual recovery
        console.error('Failed to rollback changes. Backup preserved at:', backupPath);
    }
}
/**
 * Analyze cascade impacts of PROJECT OVERVIEW changes
 *
 * Reads existing components and analyzes what would be affected
 */
async function analyzeCascadeImpacts(projectPath, oldEntity, newEntity) {
    const { analyzeProjectOverviewImpact } = await import('../utils/hierarchical-utils.js');
    // Read existing components from file system
    const componentsDir = path.join(projectPath, '02-goals-and-roadmap', 'components');
    const components = [];
    if (fs.existsSync(componentsDir)) {
        const componentFolders = fs.readdirSync(componentsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory());
        for (const folder of componentFolders) {
            // In production, would read component metadata
            components.push({
                id: folder.name,
                name: folder.name,
                projectId: oldEntity.id,
            });
        }
    }
    // Analyze impact
    const impacts = analyzeProjectOverviewImpact(oldEntity, newEntity, components);
    return impacts;
}
/**
 * Parse PROJECT OVERVIEW markdown to extract data
 *
 * Simplified parser - in production, use proper markdown/YAML parser
 */
function parseProjectOverviewMarkdown(content) {
    const data = {};
    // Extract basic fields using regex
    const nameMatch = content.match(/# PROJECT OVERVIEW: (.+)/);
    if (nameMatch)
        data.projectName = nameMatch[1];
    const typeMatch = content.match(/\*\*Type:\*\* (.+)/);
    if (typeMatch) {
        const type = typeMatch[1].toLowerCase();
        data.projectType = ['software', 'research', 'business', 'product'].includes(type)
            ? type
            : 'other';
    }
    const purposeMatch = content.match(/\*\*Primary Purpose:\*\* (.+)/);
    if (purposeMatch)
        data.primaryPurpose = purposeMatch[1];
    const visionMatch = content.match(/### Vision Statement\n\n([^#]+)/);
    if (visionMatch)
        data.visionStatement = visionMatch[1].trim();
    // Extract lists (simplified)
    data.goals = extractListFromSection(content, '### Strategic Goals');
    data.targetAudience = extractListFromSection(content, '### Target Audience');
    data.keyOutcomes = extractListFromSection(content, '### Key Outcomes');
    data.team = extractListFromSection(content, '### Team');
    data.tools = extractListFromSection(content, '### Tools & Technologies');
    // Extract timeline
    const timelineMatch = content.match(/### Timeline Constraints\n\n([^#]+)/);
    if (timelineMatch)
        data.timeline = timelineMatch[1].trim();
    return data;
}
/**
 * Extract list items from a markdown section
 */
function extractListFromSection(content, sectionHeader) {
    const sectionMatch = content.match(new RegExp(`${sectionHeader}\\n\\n([^#]+)`, 's'));
    if (!sectionMatch)
        return [];
    const sectionContent = sectionMatch[1];
    const items = sectionContent.split('\n')
        .filter(line => line.trim().startsWith('- '))
        .map(line => line.replace(/^- /, '').trim())
        .filter(item => item.length > 0 && !item.startsWith('*'));
    return items;
}
/**
 * MCP Tool Definition: Update PROJECT OVERVIEW
 */
export const updateProjectOverviewTool = {
    name: 'update_project_overview',
    description: 'Update existing PROJECT OVERVIEW with cascade detection and version control',
    inputSchema: z.object({
        projectPath: z.string().describe('Absolute path to the project directory'),
        updates: z.object({
            projectName: z.string().optional(),
            projectType: z.enum(['software', 'research', 'business', 'product', 'other']).optional(),
            primaryPurpose: z.string().optional(),
            visionStatement: z.string().optional(),
            goals: z.array(z.string()).optional(),
            targetAudience: z.array(z.string()).optional(),
            keyOutcomes: z.array(z.string()).optional(),
            stakeholders: z.array(z.any()).optional(),
            team: z.array(z.string()).optional(),
            tools: z.array(z.string()).optional(),
            technologies: z.array(z.string()).optional(),
            budget: z.string().optional(),
            timeline: z.string().optional(),
        }).describe('Fields to update in PROJECT OVERVIEW'),
        incrementVersion: z.boolean().default(true).describe('Increment version number'),
        changeDescription: z.string().optional().describe('Description of changes made'),
        dryRun: z.boolean().default(false).describe('Preview changes without applying them'),
    }),
};
/**
 * MCP Tool: Identify Components from PROJECT OVERVIEW
 *
 * Analyze PROJECT OVERVIEW and suggest logical components
 */
export async function identifyComponentsFromOverview(args) {
    const { projectPath } = args;
    // Read PROJECT OVERVIEW
    const overviewPath = path.join(projectPath, '01-planning', 'PROJECT-OVERVIEW.md');
    if (!fs.existsSync(overviewPath)) {
        throw new Error(`PROJECT OVERVIEW does not exist at ${overviewPath}`);
    }
    const content = fs.readFileSync(overviewPath, 'utf-8');
    const data = parseProjectOverviewMarkdown(content);
    // Analyze and suggest components
    const components = analyzeProjectForComponents(data);
    return {
        success: true,
        suggestedComponents: components,
        reasoning: generateComponentReasoning(data, components),
    };
}
/**
 * Analyze PROJECT OVERVIEW data to suggest components
 *
 * Uses pattern matching and heuristics to identify logical components
 */
function analyzeProjectForComponents(data) {
    const components = [];
    // Pattern 1: Identify functional areas from goals and outcomes
    const functionalAreas = identifyFunctionalAreas(data.goals || [], data.keyOutcomes || []);
    components.push(...functionalAreas);
    // Pattern 2: Identify components from stakeholders
    const stakeholderComponents = identifyStakeholderComponents(data.stakeholders || []);
    components.push(...stakeholderComponents);
    // Pattern 3: Technology-based components
    const techComponents = identifyTechnologyComponents(data.technologies || [], data.tools || []);
    components.push(...techComponents);
    // Pattern 4: Project type defaults
    const defaultComponents = getDefaultComponentsForProjectType(data.projectType);
    // Merge and deduplicate
    const merged = mergeAndDeduplicateComponents([...components, ...defaultComponents]);
    return merged;
}
/**
 * Identify functional areas from goals and outcomes
 */
function identifyFunctionalAreas(goals, outcomes) {
    const components = [];
    const allText = [...goals, ...outcomes].join(' ').toLowerCase();
    // Common functional area keywords
    const patterns = [
        { keywords: ['market', 'sales', 'customer acquisition', 'promotion'], name: 'Marketing', description: 'Marketing and customer acquisition activities' },
        { keywords: ['develop', 'build', 'implement', 'code', 'technical'], name: 'Engineering', description: 'Technical development and implementation' },
        { keywords: ['design', 'ux', 'ui', 'user experience'], name: 'Design', description: 'User experience and interface design' },
        { keywords: ['compliance', 'legal', 'regulation', 'policy'], name: 'Legal & Compliance', description: 'Legal and regulatory compliance' },
        { keywords: ['hire', 'team', 'recruit', 'people'], name: 'Operations', description: 'Operational activities and team management' },
        { keywords: ['data', 'analytics', 'metrics', 'reporting'], name: 'Data & Analytics', description: 'Data collection, analysis, and reporting' },
    ];
    for (const pattern of patterns) {
        const matchCount = pattern.keywords.filter(kw => allText.includes(kw)).length;
        if (matchCount > 0) {
            components.push({
                name: pattern.name,
                description: pattern.description,
                confidence: matchCount >= 2 ? 'high' : matchCount === 1 ? 'medium' : 'low',
                reasoning: `Detected ${matchCount} keyword(s) related to ${pattern.name}`,
                suggestedGoals: goals.filter(g => pattern.keywords.some(kw => g.toLowerCase().includes(kw))),
            });
        }
    }
    return components;
}
/**
 * Identify components from stakeholder roles
 */
function identifyStakeholderComponents(stakeholders) {
    const components = [];
    const roleMap = {};
    for (const stakeholder of stakeholders) {
        const roleLower = stakeholder.role.toLowerCase();
        if (roleLower.includes('marketing') || roleLower.includes('sales')) {
            roleMap['Marketing'] = 'Marketing and sales activities';
        }
        if (roleLower.includes('engineer') || roleLower.includes('developer') || roleLower.includes('technical')) {
            roleMap['Engineering'] = 'Technical development and infrastructure';
        }
        if (roleLower.includes('design') || roleLower.includes('ux')) {
            roleMap['Design'] = 'User experience and design';
        }
        if (roleLower.includes('legal') || roleLower.includes('compliance')) {
            roleMap['Legal & Compliance'] = 'Legal and compliance matters';
        }
        if (roleLower.includes('operations') || roleLower.includes('ops')) {
            roleMap['Operations'] = 'Operational execution';
        }
    }
    for (const [name, description] of Object.entries(roleMap)) {
        const relatedStakeholders = stakeholders
            .filter(s => s.role.toLowerCase().includes(name.toLowerCase()))
            .map(s => s.name);
        components.push({
            name,
            description,
            confidence: 'high',
            reasoning: `Identified from stakeholder roles: ${relatedStakeholders.join(', ')}`,
            stakeholders: relatedStakeholders,
        });
    }
    return components;
}
/**
 * Identify technology-based components
 */
function identifyTechnologyComponents(technologies, tools) {
    const components = [];
    const allTech = [...technologies, ...tools].join(' ').toLowerCase();
    // Backend/API component
    if (allTech.includes('api') || allTech.includes('backend') || allTech.includes('server')) {
        components.push({
            name: 'Backend Services',
            description: 'Backend API and server infrastructure',
            confidence: 'medium',
            reasoning: 'Detected backend/API technologies',
        });
    }
    // Frontend component
    if (allTech.includes('react') || allTech.includes('vue') || allTech.includes('frontend') || allTech.includes('web')) {
        components.push({
            name: 'Frontend Application',
            description: 'User-facing web application',
            confidence: 'medium',
            reasoning: 'Detected frontend technologies',
        });
    }
    // Mobile component
    if (allTech.includes('mobile') || allTech.includes('ios') || allTech.includes('android')) {
        components.push({
            name: 'Mobile Application',
            description: 'Mobile app development',
            confidence: 'medium',
            reasoning: 'Detected mobile technologies',
        });
    }
    // Infrastructure component
    if (allTech.includes('aws') || allTech.includes('azure') || allTech.includes('cloud') || allTech.includes('docker')) {
        components.push({
            name: 'Infrastructure',
            description: 'Cloud infrastructure and deployment',
            confidence: 'medium',
            reasoning: 'Detected cloud/infrastructure technologies',
        });
    }
    return components;
}
/**
 * Get default components based on project type
 */
function getDefaultComponentsForProjectType(projectType) {
    switch (projectType) {
        case 'software':
            return [
                { name: 'Engineering', description: 'Software development', confidence: 'low', reasoning: 'Default for software projects' },
                { name: 'Quality Assurance', description: 'Testing and QA', confidence: 'low', reasoning: 'Default for software projects' },
            ];
        case 'research':
            return [
                { name: 'Research', description: 'Research activities', confidence: 'low', reasoning: 'Default for research projects' },
                { name: 'Data Collection', description: 'Data gathering and analysis', confidence: 'low', reasoning: 'Default for research projects' },
            ];
        case 'business':
            return [
                { name: 'Marketing', description: 'Marketing activities', confidence: 'low', reasoning: 'Default for business projects' },
                { name: 'Operations', description: 'Business operations', confidence: 'low', reasoning: 'Default for business projects' },
            ];
        case 'product':
            return [
                { name: 'Product Development', description: 'Product design and development', confidence: 'low', reasoning: 'Default for product projects' },
                { name: 'Manufacturing', description: 'Production and manufacturing', confidence: 'low', reasoning: 'Default for product projects' },
            ];
        default:
            return [];
    }
}
/**
 * Merge and deduplicate suggested components
 */
function mergeAndDeduplicateComponents(components) {
    const merged = {};
    for (const component of components) {
        const key = component.name.toLowerCase();
        if (merged[key]) {
            // Merge with existing
            const existing = merged[key];
            // Take highest confidence
            if (component.confidence === 'high' || (component.confidence === 'medium' && existing.confidence === 'low')) {
                existing.confidence = component.confidence;
            }
            // Merge reasoning
            existing.reasoning += `; ${component.reasoning}`;
            // Merge goals and stakeholders
            existing.suggestedGoals = [
                ...(existing.suggestedGoals || []),
                ...(component.suggestedGoals || []),
            ];
            existing.stakeholders = [
                ...(existing.stakeholders || []),
                ...(component.stakeholders || []),
            ];
        }
        else {
            merged[key] = component;
        }
    }
    // Sort by confidence
    const confidenceOrder = { high: 0, medium: 1, low: 2 };
    return Object.values(merged).sort((a, b) => confidenceOrder[a.confidence] - confidenceOrder[b.confidence]);
}
/**
 * Generate reasoning summary for component suggestions
 */
function generateComponentReasoning(data, components) {
    let reasoning = `Based on PROJECT OVERVIEW analysis, identified ${components.length} potential components:\n\n`;
    reasoning += `**Analysis Sources:**\n`;
    reasoning += `- ${data.goals?.length || 0} strategic goals\n`;
    reasoning += `- ${data.keyOutcomes?.length || 0} key outcomes\n`;
    reasoning += `- ${data.stakeholders?.length || 0} stakeholders\n`;
    reasoning += `- ${data.technologies?.length || 0} technologies\n`;
    reasoning += `- Project type: ${data.projectType}\n\n`;
    reasoning += `**High Confidence Components (${components.filter(c => c.confidence === 'high').length}):**\n`;
    for (const comp of components.filter(c => c.confidence === 'high')) {
        reasoning += `- ${comp.name}: ${comp.reasoning}\n`;
    }
    reasoning += `\n**Recommendations:**\n`;
    reasoning += `1. Review high confidence components first\n`;
    reasoning += `2. Merge or split components as needed for your project structure\n`;
    reasoning += `3. Consider adding domain-specific components based on your industry\n`;
    return reasoning;
}
/**
 * MCP Tool Definition: Identify Components
 */
export const identifyComponentsFromOverviewTool = {
    name: 'identify_components_from_overview',
    description: 'Analyze PROJECT OVERVIEW and suggest logical components based on goals, stakeholders, and project type',
    inputSchema: z.object({
        projectPath: z.string().describe('Absolute path to the project directory'),
        useAI: z.boolean().default(false).describe('Use AI-based analysis (future feature)'),
    }),
};
//# sourceMappingURL=create-project-overview%202.js.map