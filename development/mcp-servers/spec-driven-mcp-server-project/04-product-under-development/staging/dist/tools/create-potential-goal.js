/**
 * Create Potential Goal Tool
 *
 * Creates a potential goal markdown file from an evaluation result.
 * Saves the file to the project's potential-goals/ directory.
 */
import * as fs from 'fs';
import * as path from 'path';
import { GoalTemplateRenderer } from '../utils/goal-template-renderer.js';
export class CreatePotentialGoalTool {
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition() {
        return {
            name: 'create_potential_goal',
            description: 'Create a potential goal markdown file from an evaluation result. Saves to the project\'s potential-goals/ directory.',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to the project directory'
                    },
                    goalName: {
                        type: 'string',
                        description: 'Short name for the goal (will be used in filename)'
                    },
                    goalDescription: {
                        type: 'string',
                        description: 'Description of the goal'
                    },
                    context: {
                        type: 'string',
                        description: 'Optional additional context'
                    },
                    impactScore: {
                        type: 'string',
                        enum: ['High', 'Medium', 'Low'],
                        description: 'Impact score from evaluation'
                    },
                    impactReasoning: {
                        type: 'string',
                        description: 'Reasoning for impact score'
                    },
                    peopleAffected: {
                        type: 'number',
                        description: 'Estimated number of people affected'
                    },
                    problemSeverity: {
                        type: 'string',
                        enum: ['High', 'Medium', 'Low'],
                        description: 'Problem severity'
                    },
                    strategicValue: {
                        type: 'string',
                        enum: ['High', 'Medium', 'Low'],
                        description: 'Strategic value'
                    },
                    impactConfidence: {
                        type: 'string',
                        enum: ['High', 'Medium', 'Low'],
                        description: 'Confidence in impact estimate'
                    },
                    effortScore: {
                        type: 'string',
                        enum: ['High', 'Medium', 'Low'],
                        description: 'Effort score from evaluation'
                    },
                    effortReasoning: {
                        type: 'string',
                        description: 'Reasoning for effort score'
                    },
                    timeEstimate: {
                        type: 'string',
                        description: 'Estimated time (e.g., "2-3 days", "1-2 weeks")'
                    },
                    technicalComplexity: {
                        type: 'string',
                        enum: ['High', 'Medium', 'Low'],
                        description: 'Technical complexity'
                    },
                    dependenciesCount: {
                        type: 'number',
                        description: 'Number of dependencies'
                    },
                    scopeClarity: {
                        type: 'string',
                        enum: ['High', 'Medium', 'Low'],
                        description: 'How clear the scope is'
                    },
                    effortConfidence: {
                        type: 'string',
                        enum: ['High', 'Medium', 'Low'],
                        description: 'Confidence in effort estimate'
                    },
                    suggestedTier: {
                        type: 'string',
                        enum: ['Now', 'Next', 'Later', 'Someday'],
                        description: 'Suggested tier from evaluation'
                    },
                    userOverride: {
                        type: 'string',
                        description: 'Optional user override if disagreeing with AI assessment'
                    },
                    problem: {
                        type: 'string',
                        description: 'Answer to: What problem does this solve?'
                    },
                    expectedValue: {
                        type: 'string',
                        description: 'Answer to: What value will this create?'
                    },
                    effortDetails: {
                        type: 'string',
                        description: 'Answer to: How much effort will this take?'
                    },
                    dependencies: {
                        type: 'string',
                        description: 'Answer to: What dependencies exist?'
                    },
                    risks: {
                        type: 'string',
                        description: 'Answer to: What are the risks?'
                    },
                    alternatives: {
                        type: 'string',
                        description: 'Answer to: What alternatives were considered?'
                    },
                    decisionCriteria: {
                        type: 'string',
                        description: 'Answer to: What makes this a clear yes?'
                    },
                    notes: {
                        type: 'string',
                        description: 'Optional additional notes'
                    },
                    suggestions: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'AI suggestions from evaluation'
                    },
                    nextSteps: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Recommended next steps from evaluation'
                    }
                },
                required: [
                    'projectPath',
                    'goalName',
                    'goalDescription',
                    'impactScore',
                    'impactReasoning',
                    'peopleAffected',
                    'problemSeverity',
                    'strategicValue',
                    'impactConfidence',
                    'effortScore',
                    'effortReasoning',
                    'timeEstimate',
                    'technicalComplexity',
                    'dependenciesCount',
                    'scopeClarity',
                    'effortConfidence',
                    'suggestedTier'
                ]
            }
        };
    }
    /**
     * Execute potential goal creation
     */
    static execute(args) {
        try {
            // Validate project path
            if (!fs.existsSync(args.projectPath)) {
                return {
                    success: false,
                    filePath: '',
                    fileName: '',
                    message: '',
                    error: `Project path does not exist: ${args.projectPath}`
                };
            }
            // Ensure potential-goals directory exists
            const potentialGoalsDir = this.getPotentialGoalsDir(args.projectPath);
            if (!fs.existsSync(potentialGoalsDir)) {
                fs.mkdirSync(potentialGoalsDir, { recursive: true });
            }
            // Generate filename from goal name
            const fileName = this.generateFileName(args.goalName);
            const filePath = path.join(potentialGoalsDir, fileName);
            // Check if file already exists
            if (fs.existsSync(filePath)) {
                return {
                    success: false,
                    filePath,
                    fileName,
                    message: '',
                    error: `File already exists: ${fileName}. Please choose a different goal name or delete the existing file.`
                };
            }
            // Render template
            const renderer = new GoalTemplateRenderer();
            const context = GoalTemplateRenderer.buildPotentialGoalContext({
                goalName: args.goalName,
                goalDescription: args.goalDescription,
                context: args.context,
                impactScore: args.impactScore,
                impactReasoning: args.impactReasoning,
                peopleAffected: args.peopleAffected,
                problemSeverity: args.problemSeverity,
                strategicValue: args.strategicValue,
                impactConfidence: args.impactConfidence,
                effortScore: args.effortScore,
                effortReasoning: args.effortReasoning,
                timeEstimate: args.timeEstimate,
                technicalComplexity: args.technicalComplexity,
                dependenciesCount: args.dependenciesCount,
                scopeClarity: args.scopeClarity,
                effortConfidence: args.effortConfidence,
                suggestedTier: args.suggestedTier,
                userOverride: args.userOverride,
                problem: args.problem,
                expectedValue: args.expectedValue,
                effortDetails: args.effortDetails,
                dependencies: args.dependencies,
                risks: args.risks,
                alternatives: args.alternatives,
                decisionCriteria: args.decisionCriteria,
                notes: args.notes,
                suggestions: args.suggestions,
                nextSteps: args.nextSteps
            });
            const content = renderer.render('potential-goal', context);
            // Write file
            fs.writeFileSync(filePath, content, 'utf-8');
            return {
                success: true,
                filePath,
                fileName,
                message: `Successfully created potential goal: ${fileName}\n\nNext steps:\n1. Review the file and update any sections as needed\n2. Add user overrides if you disagree with AI assessment\n3. Answer the 7 evaluation questions for deeper analysis (optional)\n4. When ready to commit, promote to SELECTED-GOALS.md`
            };
        }
        catch (error) {
            return {
                success: false,
                filePath: '',
                fileName: '',
                message: '',
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    /**
     * Helper: Create from evaluation result
     */
    static createFromEvaluation(projectPath, goalName, goalDescription, evaluationResult, context, userOverride, evaluationAnswers) {
        return this.execute({
            projectPath,
            goalName,
            goalDescription,
            context,
            impactScore: evaluationResult.impact.score,
            impactReasoning: evaluationResult.impact.reasoning,
            peopleAffected: evaluationResult.impact.factors.people_affected,
            problemSeverity: evaluationResult.impact.factors.problem_severity,
            strategicValue: evaluationResult.impact.factors.strategic_value,
            impactConfidence: evaluationResult.impact.confidence,
            effortScore: evaluationResult.effort.score,
            effortReasoning: evaluationResult.effort.reasoning,
            timeEstimate: evaluationResult.effort.factors.time_estimate,
            technicalComplexity: evaluationResult.effort.factors.technical_complexity,
            dependenciesCount: evaluationResult.effort.factors.dependencies_count,
            scopeClarity: evaluationResult.effort.factors.scope_clarity,
            effortConfidence: evaluationResult.effort.confidence,
            suggestedTier: evaluationResult.tier.tier,
            userOverride,
            suggestions: evaluationResult.suggestions,
            nextSteps: evaluationResult.nextSteps,
            ...evaluationAnswers
        });
    }
    /**
     * Get potential-goals directory path
     */
    static getPotentialGoalsDir(projectPath) {
        // Check for goal-workflow structure
        const goalWorkflowDir = path.join(projectPath, 'brainstorming', 'future-goals', 'potential-goals');
        if (fs.existsSync(path.join(projectPath, 'brainstorming', 'future-goals'))) {
            return goalWorkflowDir;
        }
        // Fallback: create in project root
        return path.join(projectPath, 'potential-goals');
    }
    /**
     * Generate filename from goal name
     */
    static generateFileName(goalName) {
        // Convert to kebab-case and ensure .md extension
        const kebabName = goalName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        return `${kebabName}.md`;
    }
    /**
     * Format result for display
     */
    static formatResult(result) {
        if (!result.success) {
            return `# Error Creating Potential Goal\n\n${result.error}`;
        }
        let output = '# Potential Goal Created Successfully\n\n';
        output += `**File:** ${result.fileName}\n`;
        output += `**Path:** ${result.filePath}\n\n`;
        output += `${result.message}\n`;
        return output;
    }
}
//# sourceMappingURL=create-potential-goal.js.map