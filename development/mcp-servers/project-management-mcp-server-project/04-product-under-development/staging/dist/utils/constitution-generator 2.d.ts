/**
 * Constitution Generator
 *
 * Generate project-specific constitutions with principles, guidelines, and constraints.
 */
import type { ExtractedInfo, ProjectType, ConstitutionMode } from './conversation-manager.js';
export interface Principle {
    name: string;
    description: string;
}
export interface ConstitutionSections {
    principles: Principle[];
    decisionFramework?: string[];
    guidelines?: string[];
    constraints: Array<{
        type: string;
        description: string;
    }>;
    successCriteria: string[];
    ethicsStatement?: string;
}
export declare class ConstitutionGenerator {
    /**
     * Generate constitution based on mode
     */
    static generate(info: ExtractedInfo, projectType: ProjectType, mode: ConstitutionMode): ConstitutionSections;
    /**
     * Generate quick mode constitution (3-5 principles, basic)
     */
    static generateQuick(info: ExtractedInfo, projectType: ProjectType): ConstitutionSections;
    /**
     * Generate deep mode constitution (comprehensive)
     */
    static generateDeep(info: ExtractedInfo, projectType: ProjectType): ConstitutionSections;
    /**
     * Derive project principles from extracted information
     */
    private static derivePrinciples;
    /**
     * Get base principles for project type
     */
    private static getBasePrinciplesForType;
    /**
     * Create decision framework
     */
    private static createDecisionFramework;
    /**
     * Generate quality guidelines
     */
    private static generateGuidelines;
    /**
     * Create ethics statement if applicable
     */
    private static createEthicsStatement;
    /**
     * Format constraints
     */
    private static formatConstraints;
    /**
     * Derive success criteria if none provided
     */
    private static deriveSuccessCriteria;
    private static hasRegulatory;
    private static deduplicatePrinciples;
}
//# sourceMappingURL=constitution-generator%202.d.ts.map