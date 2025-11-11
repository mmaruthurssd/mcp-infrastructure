/**
 * Research Best Practices Tool
 *
 * Provides guidance for researching current best practices for technology decisions.
 * Inspired by Taskmaster AI's research integration with Perplexity.
 *
 * Note: This is a guidance tool that helps structure research queries.
 * Actual web search/API integration would require additional dependencies.
 */
export class ResearchBestPracticesTool {
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition() {
        return {
            name: 'research_best_practices',
            description: 'Get structured guidance for researching best practices on technical topics. Provides search queries, evaluation criteria, and resource recommendations.',
            inputSchema: {
                type: 'object',
                properties: {
                    topic: {
                        type: 'string',
                        description: 'The technical topic or technology to research (e.g., "React state management", "PostgreSQL connection pooling")'
                    },
                    context: {
                        type: 'string',
                        description: 'Project context to tailor recommendations (e.g., "medical practice management system with PHI handling")'
                    },
                    specificQuestions: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Specific questions you need answered about this topic'
                    },
                    constraints: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Constraints or requirements (e.g., "must support TypeScript", "HIPAA compliant")'
                    }
                },
                required: ['topic']
            }
        };
    }
    /**
     * Execute research guidance generation
     */
    static execute(args) {
        const { topic, context, specificQuestions = [], constraints = [] } = args;
        // Generate search queries
        const searchQueries = this.generateSearchQueries(topic, context, constraints);
        // Identify key topics to investigate
        const keyTopics = this.identifyKeyTopics(topic);
        // Define evaluation criteria
        const evaluationCriteria = this.defineEvaluationCriteria(topic, constraints);
        // Recommend resource types
        const resourceTypes = this.recommendResourceTypes(topic);
        // Add cautionary notes
        const cautionaryNotes = this.getCautionaryNotes(topic, context);
        return {
            searchQueries,
            keyTopics,
            evaluationCriteria,
            resourceTypes,
            cautionaryNotes
        };
    }
    /**
     * Generate optimized search queries
     */
    static generateSearchQueries(topic, context, constraints = []) {
        const queries = [];
        // Base query
        queries.push(`${topic} best practices 2024 2025`);
        // Specific implementation query
        queries.push(`how to implement ${topic} production ready`);
        // Comparison query
        queries.push(`${topic} alternatives comparison`);
        // Common issues query
        queries.push(`${topic} common pitfalls mistakes to avoid`);
        // Performance query
        queries.push(`${topic} performance optimization benchmarks`);
        // Add context-specific queries
        if (context) {
            queries.push(`${topic} for ${context}`);
        }
        // Add constraint-specific queries
        constraints.forEach(constraint => {
            queries.push(`${topic} ${constraint}`);
        });
        // Security query if relevant
        if (context?.toLowerCase().includes('phi') ||
            context?.toLowerCase().includes('hipaa') ||
            context?.toLowerCase().includes('medical')) {
            queries.push(`${topic} security best practices HIPAA`);
            queries.push(`${topic} encryption audit logging`);
        }
        return queries;
    }
    /**
     * Identify key topics to investigate
     */
    static identifyKeyTopics(topic) {
        return [
            'Current industry standards',
            'Popular libraries and frameworks',
            'Performance considerations',
            'Security implications',
            'Scalability patterns',
            'Testing strategies',
            'Common anti-patterns to avoid',
            'Migration paths and upgrade strategies',
            'Community support and ecosystem maturity',
            'Documentation quality and learning resources'
        ];
    }
    /**
     * Define evaluation criteria
     */
    static defineEvaluationCriteria(topic, constraints) {
        const criteria = [
            'Recency: Is the information current? (2023-2025 preferred)',
            'Authority: Is the source reputable? (official docs, established experts)',
            'Evidence: Does it include benchmarks, examples, or case studies?',
            'Community: What do multiple independent sources say?',
            'Production-ready: Has it been tested in production environments?'
        ];
        // Add constraint-specific criteria
        if (constraints.some(c => c.toLowerCase().includes('hipaa') || c.toLowerCase().includes('phi'))) {
            criteria.push('HIPAA Compliance: Is it certified or documented for healthcare use?');
            criteria.push('Audit Trail: Does it support comprehensive logging?');
        }
        if (constraints.some(c => c.toLowerCase().includes('typescript'))) {
            criteria.push('TypeScript Support: First-class TypeScript support with types');
        }
        if (constraints.some(c => c.toLowerCase().includes('performance'))) {
            criteria.push('Performance: Documented benchmarks and optimization guides');
        }
        return criteria;
    }
    /**
     * Recommend resource types
     */
    static recommendResourceTypes(topic) {
        return [
            'Official documentation and guides',
            'GitHub repositories with recent activity',
            'Stack Overflow discussions (recent answers)',
            'Technical blogs from recognized experts',
            'Conference talks and presentations',
            'Academic papers (if relevant)',
            'Production case studies',
            'Benchmark comparisons',
            'Security advisories and CVE databases',
            'RFC documents and specifications'
        ];
    }
    /**
     * Get cautionary notes
     */
    static getCautionaryNotes(topic, context) {
        const notes = [
            'Verify information recency - technology evolves rapidly',
            'Cross-reference multiple sources before making decisions',
            'Consider your specific use case - "best practice" varies by context',
            'Evaluate trade-offs - every solution has pros and cons',
            'Test in your environment - benchmarks may not match your workload'
        ];
        if (context?.toLowerCase().includes('phi') ||
            context?.toLowerCase().includes('hipaa') ||
            context?.toLowerCase().includes('medical')) {
            notes.push('⚠️ CRITICAL: Verify HIPAA compliance before implementing in production');
            notes.push('⚠️ Consult with compliance team for PHI handling decisions');
            notes.push('⚠️ Prefer established, audited solutions over cutting-edge options');
        }
        return notes;
    }
    /**
     * Format research guidance for display
     */
    static formatGuidance(guidance) {
        let output = '# Research Guidance\n\n';
        output += '## Recommended Search Queries\n\n';
        guidance.searchQueries.forEach((query, i) => {
            output += `${i + 1}. "${query}"\n`;
        });
        output += '\n## Key Topics to Investigate\n\n';
        guidance.keyTopics.forEach(topic => {
            output += `- ${topic}\n`;
        });
        output += '\n## Evaluation Criteria\n\n';
        guidance.evaluationCriteria.forEach(criterion => {
            output += `- ${criterion}\n`;
        });
        output += '\n## Recommended Resource Types\n\n';
        guidance.resourceTypes.forEach(resource => {
            output += `- ${resource}\n`;
        });
        if (guidance.cautionaryNotes.length > 0) {
            output += '\n## ⚠️ Important Considerations\n\n';
            guidance.cautionaryNotes.forEach(note => {
                output += `- ${note}\n`;
            });
        }
        return output;
    }
}
//# sourceMappingURL=research-best-practices.js.map