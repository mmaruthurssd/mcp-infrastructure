/**
 * Workflow Orchestrator - Manages the SDD workflow lifecycle
 */

import { WorkflowState, Scenario, WorkflowStep, StepResponse, Question, QuestionCondition } from '../types.js';
import { StateManager } from '../utils/state-manager-adapter.js';
import { ScenarioDetector } from '../detection/scenario-detector.js';
import { QuestionLoader } from '../utils/question-loader.js';
import { TemplateRenderer } from '../renderers/template-renderer.js';
import { FileManager } from '../utils/file-manager.js';
import { ParallelizationAnalyzer } from 'workflow-orchestrator-mcp-server/dist/core/parallelization-analyzer.js';
import { standardsValidator } from '../standards-validator-client.js';
import * as path from 'path';

export class WorkflowOrchestrator {
  private stateManager: StateManager;
  private questionLoader: QuestionLoader;
  private templateRenderer: TemplateRenderer;

  constructor() {
    this.stateManager = new StateManager();
    this.questionLoader = new QuestionLoader();
    this.templateRenderer = new TemplateRenderer();
  }

  /**
   * Start a new workflow
   */
  start(projectPath: string, description: string, scenario?: Scenario, goalContext?: any): StepResponse {
    // Auto-detect scenario if not provided
    const detectedScenario = scenario || ScenarioDetector.detect(projectPath);

    // Create new workflow state
    const state = this.stateManager.createNew(projectPath, detectedScenario);

    // Set project path in template context
    state.templateContext.PROJECT_PATH = projectPath;

    // If goal context provided, add to template context for inclusion in generated artifacts
    if (goalContext) {
      state.templateContext.GOAL_CONTEXT = goalContext;
      state.templateContext.GOAL_ID = goalContext.goalId || '';
      state.templateContext.GOAL_NAME = goalContext.goalName || '';
      state.templateContext.GOAL_DESCRIPTION = goalContext.goalDescription || '';
      state.templateContext.IMPACT_SCORE = goalContext.impactScore || '';
      state.templateContext.EFFORT_SCORE = goalContext.effortScore || '';
      state.templateContext.TIER = goalContext.tier || '';
    }

    // Save initial state
    this.stateManager.save(state);

    const setupMessage = goalContext
      ? `Starting Spec-Driven Development for Goal ${goalContext.goalId}: ${goalContext.goalName}!\n\nScenario detected: ${this.getScenarioDescription(detectedScenario)}\nGoal Impact/Effort: ${goalContext.impactScore}/${goalContext.effortScore} (Tier: ${goalContext.tier})`
      : `Starting Spec-Driven Development for your project!\n\nScenario detected: ${this.getScenarioDescription(detectedScenario)}`;

    // Return setup response
    return {
      step: 'setup',
      scenario: detectedScenario,
      message: setupMessage,
      questions: [{
        id: 'confirm_path',
        type: 'boolean',
        question: `I'll create specs in: ${ScenarioDetector.getSuggestedSpecPath(projectPath)}\n\nIs this correct?`,
        hint: 'You can provide an alternative path if needed',
        required: true
      }],
      progress: 'Setup',
      nextAction: 'Confirm path to proceed to Step 1: Constitution'
    };
  }

  /**
   * Process an answer and advance workflow
   */
  async answer(projectPath: string, answer: any): Promise<StepResponse> {
    const state = this.stateManager.load(projectPath);

    if (!state) {
      return {
        step: 'setup',
        scenario: 'new-project',
        message: 'No active workflow found. Please start a new workflow first.',
        progress: 'Error',
        error: 'Workflow not found'
      };
    }

    // Handle setup confirmation
    if (state.currentStep === 'setup') {
      return this.handleSetupConfirmation(state, answer);
    }

    // Get current questions
    const questionSet = this.questionLoader.load(state.currentStep, state.scenario);

    if (!questionSet) {
      return {
        step: state.currentStep,
        scenario: state.scenario,
        message: 'Error: Could not load questions',
        progress: this.getProgress(state),
        error: 'Questions not found'
      };
    }

    // Get current question
    const currentQuestion = this.getCurrentQuestion(state, questionSet);

    if (!currentQuestion) {
      // No more questions, advance to next step
      return this.advanceToNextStep(state);
    }

    // Save answer
    this.stateManager.updateAnswer(state, currentQuestion.id, answer);

    // Update template context
    if (currentQuestion.variable) {
      state.templateContext[currentQuestion.variable] = answer;
    }

    // Advance question index
    state.currentQuestionIndex++;

    // Save state
    this.stateManager.save(state);

    // Get next question or advance step
    const nextQuestion = this.getCurrentQuestion(state, questionSet);

    if (nextQuestion) {
      return {
        step: state.currentStep,
        scenario: state.scenario,
        message: `Question ${state.currentQuestionIndex + 1}/${questionSet.questions.length}`,
        question: nextQuestion,
        progress: this.getProgress(state)
      };
    } else {
      // Step complete, generate artifact
      return await this.completeStep(state);
    }
  }

  /**
   * Handle setup confirmation
   */
  private handleSetupConfirmation(state: WorkflowState, confirmed: boolean): StepResponse {
    if (!confirmed) {
      return {
        step: 'setup',
        scenario: state.scenario,
        message: 'Please provide the correct specs directory path',
        progress: 'Setup',
        question: {
          id: 'custom_path',
          type: 'text',
          question: 'Enter the path where specs should be created:',
          required: true
        }
      };
    }

    // Move to constitution step
    state.currentStep = 'constitution';
    state.currentQuestionIndex = 0;
    this.stateManager.save(state);

    const questionSet = this.questionLoader.load('constitution', state.scenario);

    if (!questionSet) {
      return {
        step: 'constitution',
        scenario: state.scenario,
        message: 'Error loading constitution questions',
        progress: 'Error',
        error: 'Questions not found'
      };
    }

    const firstQuestion = questionSet.questions[0];

    return {
      step: 'constitution',
      scenario: state.scenario,
      message: `Step 1/5: Defining Project Constitution\n\nI'll ask you about your project principles and standards.`,
      question: firstQuestion,
      progress: '1/5 (Constitution)'
    };
  }

  /**
   * Get current question, respecting conditions
   */
  private getCurrentQuestion(state: WorkflowState, questionSet: any): Question | null {
    const questions = questionSet.questions;

    for (let i = state.currentQuestionIndex; i < questions.length; i++) {
      const question = questions[i];

      // Check if question has a condition
      if (question.condition) {
        const conditionMet = this.evaluateCondition(question.condition, state.answers);
        if (!conditionMet) {
          state.currentQuestionIndex = i + 1;
          continue; // Skip this question
        }
      }

      state.currentQuestionIndex = i;
      return question;
    }

    return null;
  }

  /**
   * Evaluate question condition
   */
  private evaluateCondition(condition: QuestionCondition, answers: Map<string, any>): boolean {
    const value = answers.get(condition.field);
    return value === condition.equals;
  }

  /**
   * Complete current step and generate artifact
   */
  private async completeStep(state: WorkflowState): Promise<StepResponse> {
    let artifactPath: string = '';

    try {
      // Build context from answers
      const context = this.templateRenderer.buildContext(state.answers, state.currentStep);

      // Merge with state template context
      Object.assign(context, state.templateContext);

      // Generate artifact based on step
      switch (state.currentStep) {
        case 'constitution':
          artifactPath = this.generateConstitution(state, context);
          break;
        case 'specification':
          artifactPath = this.generateSpecification(state, context);
          break;
        case 'planning':
          artifactPath = this.generatePlan(state, context);
          break;
        case 'tasks':
          artifactPath = this.generateTasks(state, context);
          break;
      }

      // Advance to next step
      const nextStep = this.getNextStep(state.currentStep);
      state.currentStep = nextStep;
      state.currentQuestionIndex = 0;
      this.stateManager.save(state);

      if (nextStep === 'complete') {
        // Get parallelization analysis from state if tasks were just generated
        let parallelizationMessage = '';
        if (state.parallelizationAnalysis) {
          const analysis = state.parallelizationAnalysis;
          if (analysis.shouldParallelize) {
            parallelizationMessage = `\n\n🔀 **Parallelization Opportunity Detected**:\n- Recommended: ${analysis.mode} execution\n- Estimated Speedup: ${analysis.estimatedSpeedup.toFixed(1)}x\n- Reasoning: ${analysis.reasoning}`;
          } else {
            parallelizationMessage = `\n\n⚠️ **Parallelization Analysis**: Sequential execution recommended (${analysis.reasoning})`;
          }
        }

        // Template validation for MCP projects (Integration #6: Standards Enforcement)
        let templateValidationMessage = '';
        const mcpName = this.extractMcpName(state.projectPath);
        if (mcpName) {
          try {
            const validation = await standardsValidator.validateMcpCompliance({
              mcpName,
              categories: ['template-first'],
              includeWarnings: true,
              failFast: false,
            });

            if (!validation.compliant) {
              templateValidationMessage = `\n\n⚠️ **Template-First Standard**: MCP "${mcpName}" does not have a drop-in template.\n   💡 Create template in templates-and-patterns/mcp-server-templates/templates/${mcpName}-template/\n   📖 See: MCP-DEVELOPMENT-STANDARD.md for template requirements`;
            } else {
              templateValidationMessage = `\n\n✅ **Template-First Standard**: Template exists for "${mcpName}" (Score: ${validation.summary.complianceScore}/100)`;
            }
          } catch (error) {
            // Graceful degradation - don't fail workflow if validation fails
            console.error('Template validation failed:', error);
          }
        }

        return {
          step: 'complete',
          scenario: state.scenario,
          message: `✓ Spec-Driven Development setup complete!\n\nAll artifacts created:\n- Constitution\n- Specification\n- Implementation Plan\n- Task Breakdown${parallelizationMessage}${templateValidationMessage}\n\nYou're ready to implement!\n\n💡 Tip: Consider validating workspace documentation to ensure specs are tracked:\n   workspace-index.validate_workspace_documentation()`,
          progress: '5/5 (Complete)',
          completed: true,
          artifactCreated: artifactPath,
          parallelizationAnalysis: state.parallelizationAnalysis
        };
      }

      return this.startNextStep(state);
    } catch (error) {
      return {
        step: state.currentStep,
        scenario: state.scenario,
        message: `Error generating artifact: ${error}`,
        progress: this.getProgress(state),
        error: String(error)
      };
    }
  }

  /**
   * Generate constitution document
   */
  private generateConstitution(state: WorkflowState, context: any): string {
    const template = this.templateRenderer.render('constitution', context);
    const filePath = FileManager.createConstitutionPath(state.projectPath);
    FileManager.writeFile(filePath, template);
    return filePath;
  }

  /**
   * Generate specification document
   */
  private generateSpecification(state: WorkflowState, context: any): string {
    const featureName = state.answers.get('feature_name') || 'Unnamed Feature';
    const featureNumber = ScenarioDetector.getNextFeatureNumber(state.projectPath);
    const featureDirName = ScenarioDetector.createFeatureDirectoryName(featureName, featureNumber);

    const specPath = FileManager.createSpecStructure(state.projectPath, featureDirName);
    const filePath = path.join(specPath, 'spec.md');

    context.FEATURE_ID = featureNumber;
    state.featureId = featureNumber;
    state.featureName = featureName;

    const template = this.templateRenderer.render('specification', context);
    FileManager.writeFile(filePath, template);

    return filePath;
  }

  /**
   * Generate plan document
   */
  private generatePlan(state: WorkflowState, context: any): string {
    const featureDirName = ScenarioDetector.createFeatureDirectoryName(
      state.featureName || 'feature',
      state.featureId
    );
    const specPath = path.join(state.projectPath, 'specs', featureDirName);
    const filePath = path.join(specPath, 'plan.md');

    const template = this.templateRenderer.render('plan', context);
    FileManager.writeFile(filePath, template);

    return filePath;
  }

  /**
   * Generate tasks document
   */
  private generateTasks(state: WorkflowState, context: any): string {
    const featureDirName = ScenarioDetector.createFeatureDirectoryName(
      state.featureName || 'feature',
      state.featureId
    );
    const specPath = path.join(state.projectPath, 'specs', featureDirName);
    const filePath = path.join(specPath, 'tasks.md');

    const template = this.templateRenderer.render('tasks', context);
    FileManager.writeFile(filePath, template);

    // Perform parallelization analysis on tasks
    try {
      const analyzer = new ParallelizationAnalyzer({
        enabled: true,
        minSpeedupThreshold: 1.5,
        maxParallelAgents: 3,
        executionStrategy: 'conservative',
        autoExecute: false
      });

      // Extract tasks from context for analysis
      const tasksForAnalysis = this.extractTasksFromContext(context);

      if (tasksForAnalysis.length > 0) {
        const description = state.answers.get('feature_name') || 'Feature implementation';
        const analysis = analyzer['fallbackHeuristic'](tasksForAnalysis);

        // Store analysis in state
        state.parallelizationAnalysis = {
          shouldParallelize: analysis.shouldParallelize,
          estimatedSpeedup: analysis.estimatedSpeedup,
          mode: analysis.mode,
          reasoning: analysis.reasoning
        };

        this.stateManager.save(state);
      }
    } catch (error) {
      // Don't fail task generation if parallelization analysis fails
      console.error('Parallelization analysis failed:', error);
    }

    return filePath;
  }

  /**
   * Extract tasks from template context for parallelization analysis
   */
  private extractTasksFromContext(context: any): Array<{ id: string; description: string; estimatedMinutes?: number; dependsOn?: string[] }> {
    const tasks: Array<{ id: string; description: string; estimatedMinutes?: number; dependsOn?: string[] }> = [];

    // Extract from prerequisite tasks
    if (context.PREREQUISITE_TASKS && Array.isArray(context.PREREQUISITE_TASKS)) {
      context.PREREQUISITE_TASKS.forEach((task: any) => {
        tasks.push({
          id: task.id || `prereq-${tasks.length + 1}`,
          description: task.description || 'Prerequisite task',
          estimatedMinutes: task.estimated_hours ? task.estimated_hours * 60 : undefined,
          dependsOn: task.dependencies && task.dependencies !== 'None' ? task.dependencies.split(',').map((d: string) => d.trim()) : []
        });
      });
    }

    // Extract from phases
    if (context.PHASES && Array.isArray(context.PHASES)) {
      context.PHASES.forEach((phase: any) => {
        if (phase.task_groups && Array.isArray(phase.task_groups)) {
          phase.task_groups.forEach((group: any) => {
            if (group.tasks && Array.isArray(group.tasks)) {
              group.tasks.forEach((task: any) => {
                tasks.push({
                  id: task.id || `task-${tasks.length + 1}`,
                  description: task.description || 'Implementation task',
                  estimatedMinutes: task.estimated_hours ? task.estimated_hours * 60 : undefined,
                  dependsOn: task.dependencies && task.dependencies !== 'None' ? task.dependencies.split(',').map((d: string) => d.trim()) : []
                });
              });
            }
          });
        }
      });
    }

    // Extract from integration tasks
    if (context.INTEGRATION_TASKS && Array.isArray(context.INTEGRATION_TASKS)) {
      context.INTEGRATION_TASKS.forEach((task: any) => {
        tasks.push({
          id: task.id || `integration-${tasks.length + 1}`,
          description: task.description || 'Integration task',
          estimatedMinutes: task.estimated_hours ? task.estimated_hours * 60 : undefined,
          dependsOn: task.dependencies && task.dependencies !== 'None' ? task.dependencies.split(',').map((d: string) => d.trim()) : []
        });
      });
    }

    // Extract from E2E tasks
    if (context.E2E_TASKS && Array.isArray(context.E2E_TASKS)) {
      context.E2E_TASKS.forEach((task: any) => {
        tasks.push({
          id: task.id || `e2e-${tasks.length + 1}`,
          description: task.description || 'E2E test task',
          estimatedMinutes: task.estimated_hours ? task.estimated_hours * 60 : undefined,
          dependsOn: task.dependencies && task.dependencies !== 'None' ? task.dependencies.split(',').map((d: string) => d.trim()) : []
        });
      });
    }

    // Extract from documentation tasks
    if (context.DOCUMENTATION_TASKS && Array.isArray(context.DOCUMENTATION_TASKS)) {
      context.DOCUMENTATION_TASKS.forEach((task: any) => {
        tasks.push({
          id: task.id || `doc-${tasks.length + 1}`,
          description: task.description || 'Documentation task',
          estimatedMinutes: task.estimated_hours ? task.estimated_hours * 60 : undefined,
          dependsOn: task.dependencies && task.dependencies !== 'None' ? task.dependencies.split(',').map((d: string) => d.trim()) : []
        });
      });
    }

    return tasks;
  }

  /**
   * Start next step
   */
  private startNextStep(state: WorkflowState): StepResponse {
    const questionSet = this.questionLoader.load(state.currentStep, state.scenario);

    if (!questionSet) {
      return {
        step: state.currentStep,
        scenario: state.scenario,
        message: 'Error loading questions for next step',
        progress: this.getProgress(state),
        error: 'Questions not found'
      };
    }

    const firstQuestion = questionSet.questions[0];

    return {
      step: state.currentStep,
      scenario: state.scenario,
      message: `Step ${this.getStepNumber(state.currentStep)}/5: ${this.getStepTitle(state.currentStep)}`,
      question: firstQuestion,
      progress: this.getProgress(state)
    };
  }

  /**
   * Advance workflow to next step
   */
  private async advanceToNextStep(state: WorkflowState): Promise<StepResponse> {
    return await this.completeStep(state);
  }

  /**
   * Get next workflow step
   */
  private getNextStep(currentStep: WorkflowStep): WorkflowStep {
    const steps: WorkflowStep[] = ['setup', 'constitution', 'specification', 'planning', 'tasks', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    return steps[currentIndex + 1] || 'complete';
  }

  /**
   * Get scenario description
   */
  private getScenarioDescription(scenario: Scenario): string {
    switch (scenario) {
      case 'new-project':
        return 'New Project (Greenfield)';
      case 'existing-project':
        return 'Existing Project (Brownfield)';
      case 'add-feature':
        return 'Adding Feature to Existing Project';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get progress string
   */
  private getProgress(state: WorkflowState): string {
    const stepNum = this.getStepNumber(state.currentStep);
    const stepTitle = this.getStepTitle(state.currentStep);
    return `${stepNum}/5 (${stepTitle})`;
  }

  private getStepNumber(step: WorkflowStep): number {
    const steps: WorkflowStep[] = ['setup', 'constitution', 'specification', 'planning', 'tasks', 'complete'];
    return steps.indexOf(step);
  }

  private getStepTitle(step: WorkflowStep): string {
    switch (step) {
      case 'setup': return 'Setup';
      case 'constitution': return 'Constitution';
      case 'specification': return 'Specification';
      case 'planning': return 'Planning';
      case 'tasks': return 'Tasks';
      case 'complete': return 'Complete';
      default: return 'Unknown';
    }
  }

  /**
   * Extract MCP name from project path (if it's an MCP project)
   * Returns null if not an MCP project
   */
  private extractMcpName(projectPath: string): string | null {
    // Check if path contains 'mcp-servers' (both development and local-instances)
    if (!projectPath.includes('mcp-servers')) {
      return null;
    }

    // Extract MCP name from path
    // Handles both:
    // - development/mcp-servers/my-mcp-project/ -> my-mcp
    // - local-instances/mcp-servers/my-mcp-server/ -> my-mcp-server
    const pathParts = projectPath.split(path.sep);
    const mcpServersIndex = pathParts.findIndex(part => part === 'mcp-servers');

    if (mcpServersIndex === -1 || mcpServersIndex >= pathParts.length - 1) {
      return null;
    }

    // Get the directory name after 'mcp-servers'
    let mcpName = pathParts[mcpServersIndex + 1];

    // Remove '-project' suffix if present (development pattern)
    mcpName = mcpName.replace(/-project$/, '');

    return mcpName;
  }
}
