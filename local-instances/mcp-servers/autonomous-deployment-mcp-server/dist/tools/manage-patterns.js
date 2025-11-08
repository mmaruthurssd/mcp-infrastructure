/**
 * Pattern Management Tool
 * Supports add, update, delete, and list operations for patterns
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Path to patterns data file
const PATTERNS_FILE = path.join(__dirname, '../data/patterns.json');
/**
 * Validate regex pattern is valid
 */
function validateRegex(regex) {
    try {
        new RegExp(regex);
        return true;
    }
    catch (error) {
        return false;
    }
}
/**
 * Generate auto pattern ID from name
 */
function generatePatternId(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
/**
 * Load patterns from file
 */
async function loadPatterns() {
    const data = await fs.readFile(PATTERNS_FILE, 'utf-8');
    return JSON.parse(data);
}
/**
 * Save patterns to file
 */
async function savePatterns(data) {
    await fs.writeFile(PATTERNS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
/**
 * Add a new pattern
 */
async function addPattern(pattern) {
    const data = await loadPatterns();
    // Validate required fields
    if (!pattern.name || !pattern.regex || !pattern.type || !pattern.severity) {
        throw new Error('Missing required fields: name, regex, type, severity');
    }
    // Validate regex
    if (!validateRegex(pattern.regex)) {
        throw new Error(`Invalid regex pattern: ${pattern.regex}`);
    }
    // Auto-generate ID if not provided
    const id = pattern.id || generatePatternId(pattern.name);
    // Check if ID already exists
    if (data.patterns.some(p => p.id === id)) {
        throw new Error(`Pattern with ID '${id}' already exists`);
    }
    // Create new pattern with defaults
    const newPattern = {
        id,
        name: pattern.name,
        regex: pattern.regex,
        type: pattern.type,
        severity: pattern.severity,
        baseConfidence: pattern.baseConfidence || 0.70,
        suggestedApproaches: pattern.suggestedApproaches || [],
        successRate: null,
        usageCount: 0,
        lastUsed: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(pattern.confidenceMultiplier && { confidenceMultiplier: pattern.confidenceMultiplier }),
        ...(pattern.requiresApproval && { requiresApproval: pattern.requiresApproval }),
    };
    data.patterns.push(newPattern);
    data.metadata.totalPatterns = data.patterns.length;
    data.metadata.lastUpdated = new Date().toISOString();
    await savePatterns(data);
    return `Successfully added pattern '${id}'`;
}
/**
 * Update an existing pattern
 */
async function updatePattern(patternId, updates) {
    const data = await loadPatterns();
    const index = data.patterns.findIndex(p => p.id === patternId);
    if (index === -1) {
        throw new Error(`Pattern with ID '${patternId}' not found`);
    }
    // Validate regex if being updated
    if (updates.regex && !validateRegex(updates.regex)) {
        throw new Error(`Invalid regex pattern: ${updates.regex}`);
    }
    // Update pattern fields
    const updatedPattern = {
        ...data.patterns[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    data.patterns[index] = updatedPattern;
    data.metadata.lastUpdated = new Date().toISOString();
    await savePatterns(data);
    return `Successfully updated pattern '${patternId}'`;
}
/**
 * Delete a pattern (with safety check)
 */
async function deletePattern(patternId) {
    const data = await loadPatterns();
    const index = data.patterns.findIndex(p => p.id === patternId);
    if (index === -1) {
        throw new Error(`Pattern with ID '${patternId}' not found`);
    }
    // Safety check: don't delete if in use (usageCount > 0)
    if (data.patterns[index].usageCount > 0) {
        throw new Error(`Cannot delete pattern '${patternId}' - it has been used ${data.patterns[index].usageCount} times. ` +
            `Consider marking it as deprecated instead.`);
    }
    data.patterns.splice(index, 1);
    data.metadata.totalPatterns = data.patterns.length;
    data.metadata.lastUpdated = new Date().toISOString();
    await savePatterns(data);
    return `Successfully deleted pattern '${patternId}'`;
}
/**
 * List patterns with optional filters
 */
async function listPatterns(filterType, filterSeverity) {
    const data = await loadPatterns();
    let patterns = data.patterns;
    // Apply filters
    if (filterType) {
        patterns = patterns.filter(p => p.type === filterType);
    }
    if (filterSeverity) {
        patterns = patterns.filter(p => p.severity === filterSeverity);
    }
    return patterns;
}
/**
 * Main tool handler
 */
export async function managePatterns(params) {
    try {
        let result;
        switch (params.action) {
            case 'add':
                if (!params.pattern) {
                    throw new Error('Pattern data required for add action');
                }
                result = await addPattern(params.pattern);
                break;
            case 'update':
                if (!params.patternId || !params.pattern) {
                    throw new Error('Pattern ID and update data required for update action');
                }
                result = await updatePattern(params.patternId, params.pattern);
                break;
            case 'delete':
                if (!params.patternId) {
                    throw new Error('Pattern ID required for delete action');
                }
                result = await deletePattern(params.patternId);
                break;
            case 'list':
                const patterns = await listPatterns(params.filterType, params.filterSeverity);
                result = JSON.stringify({
                    count: patterns.length,
                    filters: {
                        type: params.filterType || 'all',
                        severity: params.filterSeverity || 'all',
                    },
                    patterns,
                }, null, 2);
                break;
            default:
                throw new Error(`Unknown action: ${params.action}`);
        }
        return {
            content: [
                {
                    type: 'text',
                    text: result,
                },
            ],
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${errorMessage}`,
                },
            ],
        };
    }
}
//# sourceMappingURL=manage-patterns.js.map