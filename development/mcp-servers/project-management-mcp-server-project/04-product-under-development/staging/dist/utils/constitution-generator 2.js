/**
 * Constitution Generator
 *
 * Generate project-specific constitutions with principles, guidelines, and constraints.
 */
// ============================================================================
// Constitution Generator Class
// ============================================================================
export class ConstitutionGenerator {
    /**
     * Generate constitution based on mode
     */
    static generate(info, projectType, mode) {
        if (mode === 'quick') {
            return this.generateQuick(info, projectType);
        }
        else {
            return this.generateDeep(info, projectType);
        }
    }
    /**
     * Generate quick mode constitution (3-5 principles, basic)
     */
    static generateQuick(info, projectType) {
        const principles = this.derivePrinciples(info, projectType, 5);
        const constraints = this.formatConstraints(info.constraints);
        const successCriteria = info.successCriteria.length > 0
            ? info.successCriteria
            : this.deriveSuccessCriteria(info, projectType);
        return {
            principles,
            constraints,
            successCriteria,
        };
    }
    /**
     * Generate deep mode constitution (comprehensive)
     */
    static generateDeep(info, projectType) {
        const principles = this.derivePrinciples(info, projectType, 7);
        const decisionFramework = this.createDecisionFramework(principles, info.constraints);
        const guidelines = this.generateGuidelines(projectType, info);
        const constraints = this.formatConstraints(info.constraints);
        const successCriteria = info.successCriteria.length > 0
            ? info.successCriteria
            : this.deriveSuccessCriteria(info, projectType);
        const ethicsStatement = this.createEthicsStatement(projectType, info);
        return {
            principles,
            decisionFramework,
            guidelines,
            constraints,
            successCriteria,
            ethicsStatement,
        };
    }
    // ============================================================================
    // Principle Derivation
    // ============================================================================
    /**
     * Derive project principles from extracted information
     */
    static derivePrinciples(info, projectType, maxPrinciples) {
        const principles = [];
        // Get base principles for project type
        const basePrinciples = this.getBasePrinciplesForType(projectType);
        principles.push(...basePrinciples.slice(0, 2));
        // Derive domain-specific principles from constraints
        if (this.hasRegulatory(info.constraints, 'HIPAA') || this.hasRegulatory(info.constraints, 'health')) {
            principles.push({
                name: 'Patient Privacy First',
                description: 'HIPAA compliance and patient data protection are non-negotiable'
            });
        }
        if (this.hasRegulatory(info.constraints, 'GDPR')) {
            principles.push({
                name: 'Data Privacy',
                description: 'GDPR compliance and user data protection at every level'
            });
        }
        if (this.hasRegulatory(info.constraints, 'SOC 2') || this.hasRegulatory(info.constraints, 'security')) {
            principles.push({
                name: 'Security by Design',
                description: 'Build security into every layer from the start'
            });
        }
        // Derive principles from success criteria
        if (info.successCriteria.some(c => /adoption|user|customer/i.test(c))) {
            principles.push({
                name: 'User-Centric',
                description: 'User adoption and satisfaction drive every decision'
            });
        }
        // Derive from resource constraints
        if (info.resources.budget.length > 0) {
            const hasBudgetLimit = info.resources.budget.some(b => /limit|constraint|limited/i.test(b));
            if (hasBudgetLimit) {
                principles.push({
                    name: 'Cost Conscious',
                    description: 'Deliver maximum value within budget constraints'
                });
            }
        }
        // Derive from timeline constraints
        if (info.constraints.some(c => /deadline|timeline|launch|ship/i.test(c))) {
            principles.push({
                name: 'Ship Incrementally',
                description: 'Deliver value early and often, iterating based on feedback'
            });
        }
        // Quality principle
        principles.push({
            name: 'Quality Over Speed',
            description: 'Build it right the first time, avoid technical debt'
        });
        // Remove duplicates and limit to maxPrinciples
        const uniquePrinciples = this.deduplicatePrinciples(principles);
        return uniquePrinciples.slice(0, maxPrinciples);
    }
    /**
     * Get base principles for project type
     */
    static getBasePrinciplesForType(projectType) {
        const principles = {
            software: [
                { name: 'User Value First', description: 'Every feature must deliver clear value to users' },
                { name: 'Maintainability', description: 'Write code that is easy to understand and modify' },
                { name: 'Test-Driven Quality', description: 'Comprehensive testing ensures reliability' },
            ],
            research: [
                { name: 'Scientific Rigor', description: 'Follow strict methodological standards' },
                { name: 'Reproducibility', description: 'All findings must be reproducible by others' },
                { name: 'Ethical Research', description: 'Uphold highest ethical standards' },
            ],
            business: [
                { name: 'Customer First', description: 'Customer satisfaction is the ultimate metric' },
                { name: 'Sustainable Growth', description: 'Build for long-term success, not short-term wins' },
                { name: 'Data-Driven Decisions', description: 'Let metrics guide strategy' },
            ],
            product: [
                { name: 'User-Centric Design', description: 'Design with deep empathy for user needs' },
                { name: 'Rapid Iteration', description: 'Learn fast through continuous experimentation' },
                { name: 'Market Fit', description: 'Build what users actually want and need' },
            ],
        };
        return principles[projectType] || principles.software;
    }
    /**
     * Create decision framework
     */
    static createDecisionFramework(principles, constraints) {
        const framework = [];
        // Add regulatory constraints first (highest priority)
        if (constraints.some(c => /HIPAA|GDPR|compliance|regulation/i.test(c))) {
            framework.push('Regulatory compliance and legal requirements');
        }
        // Add security if mentioned
        if (constraints.some(c => /security|SOC 2|ISO/i.test(c)) ||
            principles.some(p => /security|privacy/i.test(p.name))) {
            framework.push('Security and data protection');
        }
        // Add quality
        framework.push('Quality and reliability');
        // Add user value
        if (principles.some(p => /user|customer/i.test(p.name))) {
            framework.push('User value and satisfaction');
        }
        // Add timeline
        if (constraints.some(c => /deadline|timeline/i.test(c))) {
            framework.push('Timeline and delivery speed');
        }
        // Add cost
        if (constraints.some(c => /budget|cost/i.test(c))) {
            framework.push('Cost and resource efficiency');
        }
        return framework;
    }
    /**
     * Generate quality guidelines
     */
    static generateGuidelines(projectType, info) {
        const guidelines = [];
        if (projectType === 'software') {
            guidelines.push('All code must pass automated tests before merging');
            guidelines.push('Code reviews required for all changes');
            guidelines.push('Documentation updated with every feature');
            if (this.hasRegulatory(info.constraints, 'HIPAA')) {
                guidelines.push('All PHI must be encrypted at rest and in transit');
                guidelines.push('Audit logs for all data access');
            }
            if (info.successCriteria.some(c => /performance|speed|response time/i.test(c))) {
                guidelines.push('Performance testing for all critical paths');
            }
            if (info.stakeholders.some(s => /mobile|phone/i.test(s))) {
                guidelines.push('Mobile-responsive design required');
            }
        }
        if (projectType === 'research') {
            guidelines.push('All experiments must be pre-registered');
            guidelines.push('Data and code publicly available upon publication');
            guidelines.push('Peer review before major decisions');
        }
        if (projectType === 'business' || projectType === 'product') {
            guidelines.push('Customer feedback collected after every release');
            guidelines.push('A/B testing for major changes');
            guidelines.push('Monthly metrics review');
        }
        return guidelines;
    }
    /**
     * Create ethics statement if applicable
     */
    static createEthicsStatement(projectType, info) {
        // Healthcare projects
        if (this.hasRegulatory(info.constraints, 'HIPAA') ||
            info.stakeholders.some(s => /patient|doctor|physician/i.test(s))) {
            return 'We are committed to protecting patient privacy and ensuring data is used only for patient benefit. All decisions prioritize patient safety and wellbeing.';
        }
        // Data-heavy projects
        if (info.constraints.some(c => /GDPR|privacy|data protection/i.test(c))) {
            return 'We respect user privacy and are committed to transparent data practices. Users have full control over their data.';
        }
        // Research projects
        if (projectType === 'research') {
            return 'We uphold the highest standards of research integrity, including honesty, transparency, and respect for participants.';
        }
        // AI/ML projects
        if (info.resources.technologies.some(t => /AI|ML|machine learning|neural|model/i.test(t)) ||
            info.goals.some(g => /AI|ML|machine learning/i.test(g))) {
            return 'We are committed to responsible AI development, including fairness, transparency, and accountability in all automated decisions.';
        }
        return undefined;
    }
    /**
     * Format constraints
     */
    static formatConstraints(constraints) {
        return constraints.map(c => {
            let type = 'other';
            if (/HIPAA|GDPR|SOC 2|ISO|compliance|regulation/i.test(c)) {
                type = 'regulatory';
            }
            else if (/budget|cost|dollar|money/i.test(c)) {
                type = 'budget';
            }
            else if (/deadline|timeline|by\s+\d|within|launch/i.test(c)) {
                type = 'timeline';
            }
            else if (/integrate|work with|support|stack|platform/i.test(c)) {
                type = 'technical';
            }
            return { type, description: c };
        });
    }
    /**
     * Derive success criteria if none provided
     */
    static deriveSuccessCriteria(info, projectType) {
        const criteria = [];
        if (projectType === 'software' || projectType === 'product') {
            if (info.stakeholders.some(s => /user|customer/i.test(s))) {
                criteria.push('High user adoption (target: 70%+ within 3 months)');
                criteria.push('User satisfaction score > 4/5');
            }
            criteria.push('Zero critical bugs in production');
            criteria.push('Delivery on schedule and within budget');
        }
        if (projectType === 'research') {
            criteria.push('Peer-reviewed publication accepted');
            criteria.push('Reproducible results validated by independent team');
            criteria.push('Findings contribute meaningfully to the field');
        }
        if (projectType === 'business') {
            criteria.push('Positive ROI within 12 months');
            criteria.push('Customer acquisition cost below target');
            criteria.push('Market penetration goals achieved');
        }
        return criteria;
    }
    // ============================================================================
    // Helper Methods
    // ============================================================================
    static hasRegulatory(constraints, keyword) {
        return constraints.some(c => new RegExp(keyword, 'i').test(c));
    }
    static deduplicatePrinciples(principles) {
        const seen = new Set();
        return principles.filter(p => {
            const key = p.name.toLowerCase();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
}
//# sourceMappingURL=constitution-generator%202.js.map