/**
 * NLP Extractor
 *
 * Extract structured information from natural language text using pattern matching.
 */
// ============================================================================
// NLP Extractor Class
// ============================================================================
export class NLPExtractor {
    /**
     * Extract all information from text
     */
    static extractAll(text) {
        return {
            problems: this.extractProblems(text),
            goals: this.extractGoals(text).map(g => g.text),
            stakeholders: this.extractStakeholders(text).map(s => s.role ? `${s.name} (${s.role})` : s.name),
            resources: {
                team: this.extractResources(text)
                    .filter(r => r.type === 'team')
                    .map(r => r.value),
                tools: this.extractResources(text)
                    .filter(r => r.type === 'tool')
                    .map(r => r.value),
                technologies: this.extractResources(text)
                    .filter(r => r.type === 'technology')
                    .map(r => r.value),
                budget: this.extractResources(text)
                    .filter(r => r.type === 'budget')
                    .map(r => r.value),
            },
            assets: {
                existing: this.extractAssets(text)
                    .filter(a => a.type === 'existing')
                    .map(a => a.name),
                needed: this.extractAssets(text)
                    .filter(a => a.type === 'needed')
                    .map(a => a.name),
                external: this.extractAssets(text)
                    .filter(a => a.type === 'external')
                    .map(a => a.name),
            },
            constraints: this.extractConstraints(text).map(c => c.description),
            successCriteria: this.extractSuccessCriteria(text).map(c => c.criterion),
        };
    }
    /**
     * Extract problem statements
     */
    static extractProblems(text) {
        const problems = [];
        const lowerText = text.toLowerCase();
        // Pattern 1: "problem is/are"
        const problemPatterns = [
            /(?:the )?problem (?:is|are) ([^.!?]+)[.!?]/gi,
            /(?:we have|we've got|there is|there are) (?:a )?problem with ([^.!?]+)[.!?]/gi,
            /(?:struggling|issue|challenge|difficulty) with ([^.!?]+)[.!?]/gi,
        ];
        for (const pattern of problemPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) {
                    problems.push(match[1].trim());
                }
            }
        }
        // Pattern 2: Negative statements ("can't", "don't have", "missing")
        const negativePatterns = [
            /(?:can't|cannot|unable to|don't have|doesn't have|lacking|missing) ([^.!?]+)[.!?]/gi,
            /(?:users|we|they|staff|team) (?:can't|cannot|struggle to) ([^.!?]+)[.!?]/gi,
        ];
        for (const pattern of negativePatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) {
                    const problem = match[0].trim();
                    if (problem.length > 10 && problem.length < 200) {
                        problems.push(problem);
                    }
                }
            }
        }
        return [...new Set(problems)];
    }
    /**
     * Extract goal mentions
     */
    static extractGoals(text) {
        const goals = [];
        // Action verbs indicating goals
        const actionVerbs = [
            'build', 'create', 'develop', 'implement', 'add', 'fix', 'improve',
            'design', 'launch', 'deploy', 'establish', 'set up', 'integrate'
        ];
        const verbPattern = new RegExp(`(?:need to|want to|should|must|plan to|going to|will) (${actionVerbs.join('|')}) ([^.!?]+)[.!?]`, 'gi');
        const matches = text.matchAll(verbPattern);
        for (const match of matches) {
            const goalText = `${match[1]} ${match[2]}`.trim();
            goals.push({
                text: goalText,
                confidence: 0.8,
                context: match[0],
            });
        }
        // Feature patterns
        const featurePatterns = [
            /(?:app|system|tool|platform|service|feature) (?:for|to|that) ([^.!?]+)[.!?]/gi,
            /(?:a|an) ([a-zA-Z]+ (?:app|system|tool|platform|portal|dashboard)) ([^.!?]*)[.!?]/gi,
        ];
        for (const pattern of featurePatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                const goalText = match[1] ? `${match[1]} ${match[2] || ''}`.trim() : match[0];
                if (goalText.length > 5 && goalText.length < 150) {
                    goals.push({
                        text: goalText,
                        confidence: 0.7,
                        context: match[0],
                    });
                }
            }
        }
        return goals;
    }
    /**
     * Extract stakeholder mentions
     */
    static extractStakeholders(text) {
        const stakeholders = [];
        // Common roles
        const roles = [
            'CEO', 'CTO', 'CMO', 'CFO', 'VP', 'director', 'manager', 'lead',
            'developer', 'engineer', 'designer', 'analyst', 'consultant',
            'physician', 'doctor', 'nurse', 'patient', 'user', 'customer',
            'stakeholder', 'investor', 'board member', 'advisor'
        ];
        // Pattern: "Dr./Mr./Ms. Name" or "Name (Role)"
        const namePattern = /(?:Dr\.|Mr\.|Ms\.|Mrs\.) ([A-Z][a-z]+ [A-Z][a-z]+)/g;
        const matches = text.matchAll(namePattern);
        for (const match of matches) {
            stakeholders.push({
                name: match[1],
                type: 'individual',
            });
        }
        // Pattern: Role mentions
        const rolePattern = new RegExp(`(\\d+)?\\s*(${roles.join('|')})s?`, 'gi');
        const roleMatches = text.matchAll(rolePattern);
        for (const match of roleMatches) {
            const count = match[1] || '';
            const role = match[2];
            stakeholders.push({
                name: `${count} ${role}`.trim(),
                role: role,
                type: count ? 'group' : 'individual',
            });
        }
        // Pattern: Group mentions (e.g., "medical staff", "IT team")
        const groupPatterns = [
            /([\w\s]+) (?:team|staff|department|group|board|committee)/gi,
            /(users?|customers?|clients?|patients?)/gi,
        ];
        for (const pattern of groupPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                stakeholders.push({
                    name: match[0],
                    type: 'group',
                });
            }
        }
        return stakeholders;
    }
    /**
     * Extract resource mentions
     */
    static extractResources(text) {
        const resources = [];
        // Team size patterns
        const teamPatterns = [
            /(\d+)\s+(?:developers?|engineers?|designers?|people|person|members?)/gi,
            /(?:team of|staff of)\s+(\d+)/gi,
        ];
        for (const pattern of teamPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                resources.push({
                    type: 'team',
                    value: match[0],
                });
            }
        }
        // Tool mentions (proper nouns, common tools)
        const commonTools = [
            'GitHub', 'GitLab', 'Jira', 'Linear', 'Figma', 'Sketch', 'Adobe',
            'Slack', 'Teams', 'Zoom', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
            'VS Code', 'IntelliJ', 'Notion', 'Confluence'
        ];
        for (const tool of commonTools) {
            const regex = new RegExp(`\\b${tool}\\b`, 'gi');
            if (regex.test(text)) {
                resources.push({
                    type: 'tool',
                    value: tool,
                });
            }
        }
        // Technology mentions
        const technologies = [
            'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'Go', 'Rust',
            'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST',
            'TypeScript', 'JavaScript', 'Swift', 'Kotlin', 'Flutter'
        ];
        for (const tech of technologies) {
            const regex = new RegExp(`\\b${tech}\\b`, 'gi');
            if (regex.test(text)) {
                resources.push({
                    type: 'technology',
                    value: tech,
                });
            }
        }
        // Budget patterns
        const budgetPatterns = [
            /\$[\d,]+(?:K|M)?/g,
            /(\d+)\s+(?:thousand|million|billion)\s+dollars?/gi,
            /budget of\s+([^.!?]+)[.!?]/gi,
        ];
        for (const pattern of budgetPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                resources.push({
                    type: 'budget',
                    value: match[0],
                });
            }
        }
        return resources;
    }
    /**
     * Extract asset mentions
     */
    static extractAssets(text) {
        const assets = [];
        // Existing assets
        const existingPatterns = [
            /(?:current|existing|legacy|old)\s+([a-zA-Z\s]+(?:system|database|app|application|platform|code|infrastructure))/gi,
            /(?:we have|we've got|already have)\s+(?:a|an)?\s*([a-zA-Z\s]+(?:system|database|app|platform))/gi,
        ];
        for (const pattern of existingPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                assets.push({
                    type: 'existing',
                    name: match[1].trim(),
                });
            }
        }
        // Needed assets
        const neededPatterns = [
            /(?:need|require|must have|missing)\s+(?:a|an)?\s*([a-zA-Z\s]+(?:documentation|design|api|integration|certification))/gi,
            /(?:we'll need|we will need)\s+([^.!?]+)[.!?]/gi,
        ];
        for (const pattern of neededPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                const assetName = match[1].trim();
                if (assetName.length > 5 && assetName.length < 100) {
                    assets.push({
                        type: 'needed',
                        name: assetName,
                    });
                }
            }
        }
        // External dependencies
        const externalPatterns = [
            /(?:third[- ]party|external|vendor)\s+([a-zA-Z\s]+(?:api|service|integration|platform))/gi,
            /(?:using|integrat(?:e|ing) with)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/g,
        ];
        for (const pattern of externalPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                assets.push({
                    type: 'external',
                    name: match[1].trim(),
                });
            }
        }
        return assets;
    }
    /**
     * Extract constraint mentions
     */
    static extractConstraints(text) {
        const constraints = [];
        // Regulatory constraints
        const regulatoryKeywords = ['HIPAA', 'GDPR', 'SOC 2', 'ISO', 'compliance', 'regulation', 'audit'];
        for (const keyword of regulatoryKeywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(text)) {
                // Find the sentence containing this keyword
                const sentences = text.split(/[.!?]+/);
                for (const sentence of sentences) {
                    if (new RegExp(`\\b${keyword}\\b`, 'i').test(sentence)) {
                        constraints.push({
                            type: 'regulatory',
                            description: sentence.trim(),
                        });
                    }
                }
            }
        }
        // Budget constraints
        const budgetPatterns = [
            /budget (?:limit|constraint|cap) of ([^.!?]+)[.!?]/gi,
            /(?:limited to|maximum of|up to)\s+\$[\d,]+(?:K|M)?/gi,
        ];
        for (const pattern of budgetPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                constraints.push({
                    type: 'budget',
                    description: match[0],
                });
            }
        }
        // Timeline constraints
        const timelinePatterns = [
            /(?:deadline|due date|must (?:launch|ship|deliver) by)\s+([^.!?]+)[.!?]/gi,
            /(?:within|in)\s+(\d+\s+(?:days?|weeks?|months?|years?))/gi,
        ];
        for (const pattern of timelinePatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                constraints.push({
                    type: 'timeline',
                    description: match[0],
                });
            }
        }
        // Technical constraints
        const technicalPatterns = [
            /(?:must|required to|need to)\s+(?:integrate with|work with|support)\s+([^.!?]+)[.!?]/gi,
            /(?:limited to|restricted to|only)\s+([a-zA-Z\s]+(?:stack|technology|platform))/gi,
        ];
        for (const pattern of technicalPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                constraints.push({
                    type: 'technical',
                    description: match[0],
                });
            }
        }
        return constraints;
    }
    /**
     * Extract success criteria
     */
    static extractSuccessCriteria(text) {
        const criteria = [];
        // Pattern 1: Explicit success statements
        const successPatterns = [
            /success (?:is|means|defined as) ([^.!?]+)[.!?]/gi,
            /(?:measure success by|success criteria|kpi|metric|goal is) ([^.!?]+)[.!?]/gi,
        ];
        for (const pattern of successPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                const criterion = match[1].trim();
                const measurable = this.isMeasurable(criterion);
                criteria.push({ criterion, measurable });
            }
        }
        // Pattern 2: Quantitative metrics
        const metricPatterns = [
            /(\d+%)\s+([^.!?]+)/g,
            /(?:increase|improve|reduce|decrease)\s+([^.!?]+)\s+by\s+(\d+%)/gi,
            /(?:within|in)\s+(\d+\s+(?:days?|weeks?|months?))/gi,
        ];
        for (const pattern of metricPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                criteria.push({
                    criterion: match[0],
                    measurable: true,
                });
            }
        }
        // Pattern 3: Adoption/usage metrics
        const adoptionPatterns = [
            /(\d+%?)\s+(?:adoption|usage|user|customer|satisfaction)/gi,
            /(?:rating|score) of\s+([\d.]+)/gi,
        ];
        for (const pattern of adoptionPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                criteria.push({
                    criterion: match[0],
                    measurable: true,
                });
            }
        }
        return criteria;
    }
    // ============================================================================
    // Helper Methods
    // ============================================================================
    static isMeasurable(criterion) {
        const measurableIndicators = [
            /\d+/, // Contains numbers
            /%/, // Contains percentage
            /\$/, // Contains dollar amounts
            /increase|decrease|improve|reduce/i,
            /by\s+\d+/,
            /within|in\s+\d+/,
        ];
        return measurableIndicators.some(pattern => pattern.test(criterion));
    }
}
//# sourceMappingURL=nlp-extractor%202.js.map