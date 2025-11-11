/**
 * Information extraction from conversation responses
 *
 * Uses pattern matching and NLP techniques to extract structured data
 * from natural language user responses
 */
/**
 * Extract information from user response based on question context
 */
export function extractFromResponse(questionId, userResponse, currentData) {
    const response = userResponse.trim();
    switch (questionId) {
        case 'q1-project-name':
            return { ...currentData, projectName: extractProjectName(response) };
        case 'q2-project-type':
            return { ...currentData, projectType: extractProjectType(response) };
        case 'q3-primary-purpose':
            return { ...currentData, primaryPurpose: response };
        case 'q4-vision-statement':
            return { ...currentData, visionStatement: response };
        case 'q5-key-outcomes':
            return { ...currentData, keyOutcomes: extractListItems(response) };
        case 'q6-target-audience':
            return { ...currentData, targetAudience: extractListItems(response) };
        case 'q7-key-stakeholders':
            return { ...currentData, stakeholders: extractStakeholders(response) };
        case 'q8-stakeholder-concerns':
            return {
                ...currentData,
                stakeholders: addStakeholderConcerns(currentData.stakeholders || [], response),
            };
        case 'q9-team-resources':
            return { ...currentData, team: extractListItems(response) };
        case 'q10-tools-tech':
            const toolsAndTech = extractToolsAndTechnologies(response);
            return {
                ...currentData,
                tools: toolsAndTech.tools,
                technologies: toolsAndTech.technologies,
            };
        case 'q11-timeline':
            return { ...currentData, timeline: response };
        case 'q12-constraints':
            const constraints = extractConstraints(response);
            return {
                ...currentData,
                budgetConstraint: constraints.budget,
                resourceConstraints: constraints.resources,
                technicalConstraints: constraints.technical,
                regulatoryConstraints: constraints.regulatory,
            };
        default:
            return currentData;
    }
}
/**
 * Extract project name (clean up extra words)
 */
function extractProjectName(response) {
    // Remove common prefixes
    const cleaned = response
        .replace(/^(the project is called|the name is|it'?s called|project name:?)/i, '')
        .trim();
    // Remove quotes if present
    return cleaned.replace(/^["']|["']$/g, '').trim();
}
/**
 * Extract project type
 */
function extractProjectType(response) {
    const lower = response.toLowerCase();
    if (lower.includes('software') || lower.includes('app') || lower.includes('web')) {
        return 'software';
    }
    if (lower.includes('research') || lower.includes('study')) {
        return 'research';
    }
    if (lower.includes('business') || lower.includes('startup')) {
        return 'business';
    }
    if (lower.includes('product') || lower.includes('physical')) {
        return 'product';
    }
    return 'other';
}
/**
 * Extract list items from various formats
 * Handles: bullet points, numbered lists, comma-separated, "and" separated
 */
function extractListItems(response) {
    const items = [];
    // Split by common list separators
    const lines = response.split(/\n|;|,|\s+and\s+/i);
    for (const line of lines) {
        // Remove bullet points, numbers, etc.
        const cleaned = line
            .replace(/^[-*•]\s*/, '') // Remove bullets
            .replace(/^\d+[.)]\s*/, '') // Remove numbers
            .trim();
        if (cleaned.length > 2) {
            // Ignore very short items
            items.push(cleaned);
        }
    }
    // If no items found, treat entire response as single item
    if (items.length === 0 && response.trim().length > 0) {
        return [response.trim()];
    }
    return items;
}
/**
 * Extract stakeholders from response
 */
function extractStakeholders(response) {
    const stakeholders = [];
    // Split by lines or semicolons
    const entries = response.split(/\n|;/);
    for (const entry of entries) {
        const trimmed = entry.trim();
        if (trimmed.length < 3)
            continue;
        // Try to parse "Name (Role)" or "Name - Role" format
        const match = trimmed.match(/^([^(]+)\(([^)]+)\)/) || trimmed.match(/^([^-]+)-\s*(.+)$/);
        if (match) {
            const name = match[1].trim();
            const role = match[2].trim();
            stakeholders.push({
                name,
                role,
                influence: inferInfluence(role),
                interest: inferInterest(role),
            });
        }
        else {
            // Just a name, infer role
            stakeholders.push({
                name: trimmed,
                role: 'Stakeholder',
                influence: 'Medium',
                interest: 'Medium',
            });
        }
    }
    return stakeholders;
}
/**
 * Add concerns to existing stakeholders
 */
function addStakeholderConcerns(stakeholders, concernsResponse) {
    const concerns = extractListItems(concernsResponse);
    // Distribute concerns across stakeholders (simple approach: split evenly)
    if (stakeholders.length > 0) {
        const concernsPerStakeholder = Math.ceil(concerns.length / stakeholders.length);
        return stakeholders.map((s, idx) => ({
            ...s,
            concerns: concerns.slice(idx * concernsPerStakeholder, (idx + 1) * concernsPerStakeholder),
        }));
    }
    return stakeholders;
}
/**
 * Extract tools and technologies (separate them)
 */
function extractToolsAndTechnologies(response) {
    const items = extractListItems(response);
    const tools = [];
    const technologies = [];
    const toolKeywords = ['slack', 'jira', 'github', 'figma', 'notion', 'asana', 'trello'];
    const techKeywords = [
        'react',
        'node',
        'python',
        'java',
        'typescript',
        'aws',
        'azure',
        'docker',
        'kubernetes',
    ];
    for (const item of items) {
        const lower = item.toLowerCase();
        const isTool = toolKeywords.some(keyword => lower.includes(keyword));
        const isTech = techKeywords.some(keyword => lower.includes(keyword));
        if (isTool) {
            tools.push(item);
        }
        else if (isTech) {
            technologies.push(item);
        }
        else {
            // Default: treat as technology
            technologies.push(item);
        }
    }
    return { tools, technologies };
}
/**
 * Extract constraints by type
 */
function extractConstraints(response) {
    const items = extractListItems(response);
    const budget = [];
    const resources = [];
    const technical = [];
    const regulatory = [];
    for (const item of items) {
        const lower = item.toLowerCase();
        if (lower.includes('budget') || lower.includes('cost') || lower.includes('$')) {
            budget.push(item);
        }
        else if (lower.includes('team') ||
            lower.includes('resource') ||
            lower.includes('headcount')) {
            resources.push(item);
        }
        else if (lower.includes('technical') ||
            lower.includes('technology') ||
            lower.includes('platform')) {
            technical.push(item);
        }
        else if (lower.includes('regulation') ||
            lower.includes('compliance') ||
            lower.includes('legal') ||
            lower.includes('gdpr') ||
            lower.includes('hipaa')) {
            regulatory.push(item);
        }
        else {
            // Default to resource constraint
            resources.push(item);
        }
    }
    return {
        budget: budget.length > 0 ? budget.join('; ') : undefined,
        resources,
        technical,
        regulatory,
    };
}
/**
 * Infer influence level from role
 */
function inferInfluence(role) {
    const lower = role.toLowerCase();
    if (lower.includes('ceo') ||
        lower.includes('cto') ||
        lower.includes('founder') ||
        lower.includes('director') ||
        lower.includes('vp')) {
        return 'High';
    }
    if (lower.includes('manager') ||
        lower.includes('lead') ||
        lower.includes('head') ||
        lower.includes('owner')) {
        return 'Medium';
    }
    return 'Low';
}
/**
 * Infer interest level from role
 */
function inferInterest(role) {
    const lower = role.toLowerCase();
    if (lower.includes('user') ||
        lower.includes('customer') ||
        lower.includes('stakeholder') ||
        lower.includes('owner')) {
        return 'High';
    }
    return 'Medium';
}
/**
 * Generate summary of extracted data for confirmation
 */
export function generateExtractionSummary(data) {
    const sections = [];
    sections.push(`# PROJECT OVERVIEW Summary\n`);
    if (data.projectName) {
        sections.push(`**Project Name:** ${data.projectName}`);
    }
    if (data.projectType) {
        sections.push(`**Project Type:** ${data.projectType}`);
    }
    if (data.primaryPurpose) {
        sections.push(`**Primary Purpose:** ${data.primaryPurpose}\n`);
    }
    if (data.visionStatement) {
        sections.push(`## Vision\n${data.visionStatement}\n`);
    }
    if (data.keyOutcomes && data.keyOutcomes.length > 0) {
        sections.push(`## Key Outcomes\n${data.keyOutcomes.map(o => `- ${o}`).join('\n')}\n`);
    }
    if (data.stakeholders && data.stakeholders.length > 0) {
        sections.push(`## Stakeholders\n${data.stakeholders.map(s => `- ${s.name} (${s.role})`).join('\n')}\n`);
    }
    if (data.team && data.team.length > 0) {
        sections.push(`## Team\n${data.team.map(t => `- ${t}`).join('\n')}\n`);
    }
    if (data.timeline) {
        sections.push(`## Timeline\n${data.timeline}\n`);
    }
    return sections.join('\n');
}
//# sourceMappingURL=conversation-extractor.js.map