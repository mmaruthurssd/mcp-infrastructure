/**
 * Core type definitions for the Spec-Driven Development MCP Server
 */
export type Scenario = 'new-project' | 'existing-project' | 'add-feature';
export type WorkflowStep = 'setup' | 'constitution' | 'specification' | 'planning' | 'tasks' | 'complete';
export type QuestionType = 'text' | 'number' | 'boolean' | 'single_select' | 'multi_select';
export interface SelectOption {
    value: string;
    label: string;
    default?: boolean;
}
export interface QuestionCondition {
    field: string;
    equals: boolean | string | number;
}
export interface Question {
    id: string;
    type: QuestionType;
    question: string;
    hint?: string;
    required: boolean;
    variable?: string;
    impact?: string;
    default?: any;
    min?: number;
    max?: number;
    options?: SelectOption[];
    condition?: QuestionCondition;
}
export interface QuestionSet {
    step: WorkflowStep;
    scenario: Scenario;
    questions: Question[];
    follow_up_questions?: {
        [key: string]: {
            question_template?: string;
            condition?: QuestionCondition;
            fields: Array<{
                id: string;
                question: string;
                hint?: string;
                required: boolean;
            }>;
        };
    };
}
export interface ParallelizationAnalysis {
    shouldParallelize: boolean;
    estimatedSpeedup: number;
    mode: 'parallel' | 'sequential';
    reasoning: string;
}
export interface WorkflowState {
    projectPath: string;
    scenario: Scenario;
    currentStep: WorkflowStep;
    currentQuestionIndex: number;
    featureName?: string;
    featureId?: string;
    projectType?: string;
    answers: Map<string, any>;
    templateContext: TemplateContext;
    parallelizationAnalysis?: ParallelizationAnalysis;
    createdAt: Date;
    lastUpdated: Date;
}
export interface TemplateContext {
    [key: string]: any;
    PROJECT_NAME?: string;
    PROJECT_PATH?: string;
    FEATURE_NAME?: string;
    FEATURE_ID?: string;
    PROJECT_TYPE?: string;
    PHI_HANDLING?: boolean;
    HIPAA_COMPLIANCE?: boolean;
    CREATED_DATE?: string;
    RATIFICATION_DATE?: string;
    STATUS?: string;
}
export interface StepResponse {
    step: WorkflowStep;
    scenario: Scenario;
    message: string;
    question?: Question;
    questions?: Question[];
    progress: string;
    nextAction?: string;
    artifactCreated?: string;
    artifactPath?: string;
    completed?: boolean;
    parallelizationAnalysis?: ParallelizationAnalysis;
    error?: string;
}
export interface ToolResponse {
    success: boolean;
    data?: StepResponse;
    error?: string;
}
export interface FileOperation {
    type: 'create' | 'update' | 'read';
    path: string;
    content?: string;
    success: boolean;
    error?: string;
}
/**
 * Task complexity and status tracking types
 */
export type TaskStatus = 'backlog' | 'in-progress' | 'done' | 'blocked';
export type ComplexityLevel = 'trivial' | 'simple' | 'moderate' | 'complex' | 'very-complex';
export interface TaskComplexity {
    score: number;
    level: ComplexityLevel;
    emoji: string;
    reasoning: string[];
    recommendations: string[];
}
export interface TaskInfo {
    id: string;
    description: string;
    type: 'P' | 'S' | 'TEST' | 'VALIDATE';
    file: string;
    dependencies: string[];
    validation: string[];
    acceptance_criteria?: string[];
    notes?: string;
    complexity?: TaskComplexity;
    estimated_hours?: number;
    is_test?: boolean;
    status?: TaskStatus;
}
//# sourceMappingURL=types.d.ts.map