/**
 * Question Loader - Loads question definitions from JSON files
 */
import { QuestionSet, Scenario, WorkflowStep } from '../types.js';
export declare class QuestionLoader {
    private questionsDir;
    constructor();
    /**
     * Load questions for a specific step and scenario
     */
    load(step: WorkflowStep, scenario: Scenario): QuestionSet | null;
}
//# sourceMappingURL=question-loader.d.ts.map