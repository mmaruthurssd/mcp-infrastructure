/**
 * Optimization Engine
 * Orchestrates the optimization process
 */
import { IssueTracker } from './issue-tracker.js';
import { Categorizer } from './categorizer.js';
import { DuplicateDetector } from './duplicate-detector.js';
import { ReviewWorkflow } from './review-workflow.js';
import { Validator } from './validator.js';
export class OptimizerEngine {
    issueTracker;
    categorizer;
    duplicateDetector;
    reviewWorkflow;
    validator;
    constructor(projectRoot) {
        this.issueTracker = new IssueTracker(projectRoot);
        this.categorizer = new Categorizer();
        this.duplicateDetector = new DuplicateDetector();
        this.reviewWorkflow = new ReviewWorkflow();
        this.validator = new Validator();
    }
    /**
     * Check if optimization should be triggered
     */
    async checkOptimizationTriggers(knowledgeBaseFile, config) {
        const issues = await this.issueTracker.getIssues(knowledgeBaseFile);
        const triggers = [];
        // Trigger 1: High-impact issues (3+ occurrences)
        const highImpactIssues = issues.filter(i => i.frequency >= config.optimizationTriggers.highImpactThreshold && !i.promoted);
        if (highImpactIssues.length > 0) {
            triggers.push({
                triggered: true,
                type: 'high_impact',
                reason: `${highImpactIssues.length} issue(s) with ${config.optimizationTriggers.highImpactThreshold}+ occurrences`,
                affectedIssues: highImpactIssues.map(i => i.issueNumber),
            });
        }
        // Trigger 2: Technical debt (5+ total issues)
        if (issues.length >= config.optimizationTriggers.technicalDebtThreshold) {
            triggers.push({
                triggered: true,
                type: 'technical_debt',
                reason: `${issues.length} total issues (threshold: ${config.optimizationTriggers.technicalDebtThreshold})`,
            });
        }
        // Trigger 3: Duplicates detected
        if (config.optimizationTriggers.enableDuplicateDetection) {
            const duplicateGroups = this.duplicateDetector.detectDuplicates(issues);
            if (duplicateGroups.length > 0) {
                const affectedIssues = duplicateGroups.flatMap(g => [
                    g.primaryIssue.issueNumber,
                    ...g.duplicates.map(d => d.issueNumber),
                ]);
                triggers.push({
                    triggered: true,
                    type: 'duplicate_detected',
                    reason: `${duplicateGroups.length} duplicate group(s) detected`,
                    affectedIssues,
                });
            }
        }
        return triggers;
    }
    /**
     * Execute full optimization
     */
    async optimize(knowledgeBaseFile, config) {
        console.error(`🔧 Starting optimization for ${config.domain}...`);
        // Check optimization cooldown
        const kb = await this.issueTracker.parseKnowledgeBase(`${this.issueTracker['projectRoot']}/${knowledgeBaseFile}`);
        const cooldownCheck = this.validator.checkOptimizationCooldown(kb, config);
        if (!cooldownCheck.canOptimize) {
            throw new Error(cooldownCheck.reason);
        }
        const issues = await this.issueTracker.getIssues(knowledgeBaseFile);
        const beforeState = {
            totalIssues: issues.length,
            promotedIssues: issues.filter(i => i.promoted).length,
        };
        const result = {
            triggered: await this.checkOptimizationTriggers(knowledgeBaseFile, config),
            actions: {
                duplicatesMerged: 0,
                issuesPromoted: 0,
                categoriesCreated: 0,
                preventiveChecksAdded: 0,
            },
            beforeState,
            afterState: { totalIssues: 0, promotedIssues: 0 },
        };
        // Action 1: Detect and merge duplicates
        const duplicateGroups = this.duplicateDetector.detectDuplicates(issues);
        if (duplicateGroups.length > 0) {
            console.error(`  ✓ Merging ${duplicateGroups.length} duplicate group(s)...`);
            for (const group of duplicateGroups) {
                this.duplicateDetector.mergeDuplicates(group);
                result.actions.duplicatesMerged += group.duplicates.length;
            }
        }
        // Action 2: Categorize all issues
        const categorized = this.categorizer.categorizeAll(issues, config.categories);
        const categoriesUsed = Array.from(categorized.entries()).filter(([_, issues]) => issues.length > 0);
        result.actions.categoriesCreated = categoriesUsed.length;
        console.error(`  ✓ Categorized issues into ${result.actions.categoriesCreated} categories`);
        // Action 3: Promote high-impact issues (with review workflow)
        const highImpactIssues = issues.filter(i => i.frequency >= config.optimizationTriggers.highImpactThreshold &&
            !i.promoted &&
            !i.promotionPending &&
            !i.excludeFromPromotion &&
            !i.mergedInto);
        if (highImpactIssues.length > 0) {
            const requiresReview = this.reviewWorkflow.requiresHumanReview(config);
            if (requiresReview) {
                // Mark for review instead of immediate promotion
                console.error(`  ⏸ Marking ${highImpactIssues.length} issue(s) for human review...`);
                for (const issue of highImpactIssues) {
                    this.reviewWorkflow.markForReview(issue, config);
                }
            }
            else {
                // Auto-approve if eligible
                console.error(`  ✓ Evaluating ${highImpactIssues.length} issue(s) for auto-promotion...`);
                for (const issue of highImpactIssues) {
                    const autoApproved = this.reviewWorkflow.autoApproveIfEligible(issue, config);
                    if (autoApproved) {
                        result.actions.issuesPromoted++;
                        result.actions.preventiveChecksAdded++;
                    }
                    else {
                        this.reviewWorkflow.markForReview(issue, config);
                    }
                }
            }
        }
        // Save optimized knowledge base
        kb.issues = issues;
        kb.promotedToPreFlight = issues.filter(i => i.promoted).length;
        kb.autoLearnedIssues = issues.filter(i => !i.mergedInto).length;
        kb.lastUpdated = new Date().toISOString().split('T')[0];
        kb.lastOptimization = new Date().toISOString();
        await this.issueTracker.saveKnowledgeBase(`${this.issueTracker['projectRoot']}/${knowledgeBaseFile}`, kb);
        result.afterState = {
            totalIssues: issues.filter(i => !i.mergedInto).length,
            promotedIssues: issues.filter(i => i.promoted).length,
        };
        // Calculate prevention impact
        result.preventionImpact = highImpactIssues.map(issue => ({
            issueNumber: issue.issueNumber,
            expectedPreventionRate: this.estimatePreventionRate(issue),
        }));
        console.error(`✅ Optimization complete!`);
        return result;
    }
    /**
     * Estimate prevention rate based on issue characteristics
     */
    estimatePreventionRate(issue) {
        // Higher frequency = more consistent pattern = higher prevention rate
        if (issue.frequency >= 5)
            return '~95-100%';
        if (issue.frequency >= 3)
            return '~85-95%';
        return '~70-85%';
    }
}
//# sourceMappingURL=optimizer.js.map