/**
 * Validator - Validate configurations and knowledge base format
 *
 * Prevents config corruption and parsing failures
 */
import { DomainConfig, KnowledgeBase, ValidationResult } from './types.js';
export declare class Validator {
    /**
     * Validate domain configuration
     */
    validateDomainConfig(config: any): ValidationResult;
    /**
     * Validate knowledge base structure
     */
    validateKnowledgeBase(kb: any): ValidationResult;
    /**
     * Check for optimization cooldown
     */
    checkOptimizationCooldown(kb: KnowledgeBase, config: DomainConfig): {
        canOptimize: boolean;
        reason?: string;
        minutesRemaining?: number;
    };
    /**
     * Detect circular dependencies in merged issues
     */
    detectCircularMerges(issues: any[]): string[];
    /**
     * Validate markdown format of knowledge base file
     */
    validateMarkdownFormat(content: string): ValidationResult;
}
//# sourceMappingURL=validator.d.ts.map