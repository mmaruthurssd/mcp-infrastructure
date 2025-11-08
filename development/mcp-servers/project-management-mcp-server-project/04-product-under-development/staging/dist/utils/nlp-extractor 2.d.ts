/**
 * NLP Extractor
 *
 * Extract structured information from natural language text using pattern matching.
 */
import type { ExtractedInfo } from './conversation-manager.js';
export interface GoalMention {
    text: string;
    confidence: number;
    context: string;
}
export interface StakeholderMention {
    name: string;
    role?: string;
    type: 'individual' | 'group';
}
export interface ResourceMention {
    type: 'team' | 'tool' | 'technology' | 'budget';
    value: string;
}
export interface AssetMention {
    type: 'existing' | 'needed' | 'external';
    name: string;
    description?: string;
}
export interface ConstraintMention {
    type: 'regulatory' | 'budget' | 'timeline' | 'technical' | 'other';
    description: string;
}
export interface CriteriaMention {
    criterion: string;
    measurable: boolean;
}
export declare class NLPExtractor {
    /**
     * Extract all information from text
     */
    static extractAll(text: string): Partial<ExtractedInfo>;
    /**
     * Extract problem statements
     */
    static extractProblems(text: string): string[];
    /**
     * Extract goal mentions
     */
    static extractGoals(text: string): GoalMention[];
    /**
     * Extract stakeholder mentions
     */
    static extractStakeholders(text: string): StakeholderMention[];
    /**
     * Extract resource mentions
     */
    static extractResources(text: string): ResourceMention[];
    /**
     * Extract asset mentions
     */
    static extractAssets(text: string): AssetMention[];
    /**
     * Extract constraint mentions
     */
    static extractConstraints(text: string): ConstraintMention[];
    /**
     * Extract success criteria
     */
    static extractSuccessCriteria(text: string): CriteriaMention[];
    private static isMeasurable;
}
//# sourceMappingURL=nlp-extractor%202.d.ts.map