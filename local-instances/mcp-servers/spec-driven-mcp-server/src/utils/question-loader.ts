/**
 * Question Loader - Loads question definitions from JSON files
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { QuestionSet, Scenario, WorkflowStep } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class QuestionLoader {
  private questionsDir: string;

  constructor() {
    this.questionsDir = path.join(__dirname, '..', 'questions');
  }

  /**
   * Load questions for a specific step and scenario
   */
  load(step: WorkflowStep, scenario: Scenario): QuestionSet | null {
    const filePath = path.join(this.questionsDir, step, `${scenario}.json`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as QuestionSet;
    } catch (error) {
      console.error(`Failed to load questions from ${filePath}:`, error);
      return null;
    }
  }
}
