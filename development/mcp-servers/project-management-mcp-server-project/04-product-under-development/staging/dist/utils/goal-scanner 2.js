/**
 * Goal Scanner Utility
 *
 * Scans goal directories and parses goal files to extract metadata.
 */
import * as fs from 'fs';
import * as path from 'path';
// ============================================================================
// Directory Scanning
// ============================================================================
/**
 * Scan all goal directories and return summaries
 */
export function scanAllGoals(projectPath) {
    const baseDir = path.join(projectPath, 'brainstorming/future-goals');
    return {
        potentialGoals: scanPotentialGoals(baseDir),
        selectedGoals: scanSelectedGoals(baseDir),
        completedGoals: scanArchivedGoals(baseDir, 'implemented'),
        shelvedGoals: scanArchivedGoals(baseDir, 'shelved'),
    };
}
/**
 * Scan potential-goals directory
 */
export function scanPotentialGoals(baseDir) {
    const dir = path.join(baseDir, 'potential-goals');
    if (!fs.existsSync(dir)) {
        return [];
    }
    const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.md') && !f.startsWith('TEMPLATE'))
        .map(f => path.join(dir, f));
    return files.map(parsePotentialGoalFile);
}
/**
 * Scan SELECTED-GOALS.md for selected goals
 */
export function scanSelectedGoals(baseDir) {
    const filePath = path.join(baseDir, 'selected-goals/SELECTED-GOALS.md');
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return parseSelectedGoalsFile(content, filePath);
}
/**
 * Scan archive directory (implemented or shelved)
 */
export function scanArchivedGoals(baseDir, type) {
    const dir = path.join(baseDir, `archive/${type}`);
    if (!fs.existsSync(dir)) {
        return [];
    }
    const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.md') && !f.startsWith('TEMPLATE'))
        .map(f => path.join(dir, f));
    return files.map(f => parseArchivedGoalFile(f, type));
}
// ============================================================================
// File Parsing
// ============================================================================
/**
 * Parse a potential goal markdown file
 */
function parsePotentialGoalFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);
    // Extract goal name from first header (# Goal Name)
    const nameMatch = content.match(/^#\s+(.+)$/m);
    const name = nameMatch ? nameMatch[1].trim() : path.basename(filePath, '.md');
    // Extract Impact score
    const impactMatch = content.match(/\*\*Impact Score:\*\*\s*(\w+)/);
    const impactScore = impactMatch ? impactMatch[1].trim() : 'Unknown';
    // Extract Effort score
    const effortMatch = content.match(/\*\*Effort Score:\*\*\s*(\w+)/);
    const effortScore = effortMatch ? effortMatch[1].trim() : 'Unknown';
    // Extract Tier
    const tierMatch = content.match(/\*\*Suggested Tier:\*\*\s*(\w+)/);
    const tier = tierMatch ? tierMatch[1].trim() : 'Unknown';
    // Extract Last Updated (or use file modification time)
    const lastUpdatedMatch = content.match(/\*\*Last Updated:\*\*\s*(.+)/);
    const lastUpdated = lastUpdatedMatch
        ? lastUpdatedMatch[1].trim()
        : stats.mtime.toISOString().split('T')[0];
    return {
        name,
        tier,
        impactScore,
        effortScore,
        lastUpdated,
        file: filePath,
        createdDate: stats.birthtime.toISOString().split('T')[0],
    };
}
/**
 * Parse SELECTED-GOALS.md and extract all selected goals
 */
function parseSelectedGoalsFile(content, filePath) {
    const goals = [];
    // Find all goal entries (### Goal 01: Name)
    const goalRegex = /###\s+(?:✅\s+)?(?:❌\s+)?Goal\s+(\d+):\s+(.+?)\s*\[([^\]]+)\]/g;
    let match;
    while ((match = goalRegex.exec(content)) !== null) {
        const goalId = match[1];
        const goalName = match[2].trim();
        const tierInfo = match[3].trim(); // e.g., "Next"
        // Find the section for this goal to extract details
        const goalSectionRegex = new RegExp(`###\\s+(?:✅\\s+)?(?:❌\\s+)?Goal\\s+${goalId}:[\\s\\S]+?(?=\\n###|\\n##|$)`, '');
        const sectionMatch = content.match(goalSectionRegex);
        if (sectionMatch) {
            const section = sectionMatch[0];
            // Extract fields
            const priority = extractField(section, 'Priority');
            const status = extractField(section, 'Status');
            const owner = extractField(section, 'Owner');
            const targetDate = extractField(section, 'Target Date');
            const impactScore = extractField(section, 'Impact');
            const effortScore = extractField(section, 'Effort');
            const lastUpdated = extractField(section, 'Last Updated');
            const progressMatch = section.match(/\*\*Progress:\*\*\s*(.+)/);
            const progressText = progressMatch ? progressMatch[1].trim() : 'Not started';
            // Parse progress percentage if available
            const progressPercentMatch = progressText.match(/(\d+)%/);
            const progress = progressPercentMatch ? parseInt(progressPercentMatch[1], 10) : 0;
            goals.push({
                id: goalId,
                name: goalName,
                tier: tierInfo,
                impactScore: impactScore || 'Unknown',
                effortScore: effortScore || 'Unknown',
                priority: priority || 'Medium',
                status: status || 'Not Started',
                owner: owner || 'Unassigned',
                targetDate: targetDate || 'TBD',
                progress,
                lastUpdated: lastUpdated || 'Unknown',
                file: filePath,
            });
        }
    }
    return goals;
}
/**
 * Parse an archived goal file (implemented or shelved)
 */
function parseArchivedGoalFile(filePath, type) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);
    // Extract goal name
    const nameMatch = content.match(/^#\s+(.+)$/m);
    const name = nameMatch ? nameMatch[1].trim() : path.basename(filePath, '.md');
    // Extract fields (archived goals might have different format)
    const tier = extractField(content, 'Tier') || 'Unknown';
    const impactScore = extractField(content, 'Impact') || 'Unknown';
    const effortScore = extractField(content, 'Effort') || 'Unknown';
    const lastUpdated = extractField(content, 'Archived Date') ||
        extractField(content, 'Last Updated') ||
        stats.mtime.toISOString().split('T')[0];
    return {
        name,
        tier,
        impactScore,
        effortScore,
        status: type === 'implemented' ? 'Completed' : 'Shelved',
        lastUpdated,
        file: filePath,
        createdDate: stats.birthtime.toISOString().split('T')[0],
    };
}
/**
 * Extract a field value from markdown content
 */
function extractField(content, fieldName) {
    const regex = new RegExp(`\\*\\*${fieldName}:?\\*\\*\\s*(.+?)(?=\\n|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : undefined;
}
/**
 * Filter goals by criteria
 */
export function filterGoals(goals, filters) {
    return goals.filter(goal => {
        if (filters.tier && goal.tier !== filters.tier)
            return false;
        if (filters.priority && goal.priority !== filters.priority)
            return false;
        if (filters.status && goal.status !== filters.status)
            return false;
        if (filters.owner && goal.owner !== filters.owner)
            return false;
        return true;
    });
}
/**
 * Sort goals by specified criteria
 */
export function sortGoals(goals, sortBy) {
    const sorted = [...goals];
    switch (sortBy) {
        case 'impact':
            return sorted.sort((a, b) => {
                const order = { High: 3, Medium: 2, Low: 1, Unknown: 0 };
                return (order[b.impactScore] || 0) -
                    (order[a.impactScore] || 0);
            });
        case 'effort':
            return sorted.sort((a, b) => {
                const order = { Low: 3, Medium: 2, High: 1, Unknown: 0 };
                return (order[b.effortScore] || 0) -
                    (order[a.effortScore] || 0);
            });
        case 'priority':
            return sorted.sort((a, b) => {
                const order = { High: 3, Medium: 2, Low: 1 };
                return (order[(b.priority || 'Medium')] || 0) -
                    (order[(a.priority || 'Medium')] || 0);
            });
        case 'date':
            return sorted.sort((a, b) => {
                const dateA = new Date(a.lastUpdated).getTime();
                const dateB = new Date(b.lastUpdated).getTime();
                return dateB - dateA; // Most recent first
            });
        case 'progress':
            return sorted.sort((a, b) => (b.progress || 0) - (a.progress || 0));
        default:
            return sorted;
    }
}
/**
 * Calculate statistics from scanned goals
 */
export function calculateStatistics(scanned) {
    const allGoals = [
        ...scanned.potentialGoals,
        ...scanned.selectedGoals,
        ...scanned.completedGoals,
        ...scanned.shelvedGoals,
    ];
    // Count by tier
    const byTier = {
        Now: allGoals.filter(g => g.tier === 'Now').length,
        Next: allGoals.filter(g => g.tier === 'Next').length,
        Later: allGoals.filter(g => g.tier === 'Later').length,
        Someday: allGoals.filter(g => g.tier === 'Someday').length,
    };
    // Count by priority (selected goals only)
    const selectedOnly = scanned.selectedGoals;
    const byPriority = {
        High: selectedOnly.filter(g => g.priority === 'High').length,
        Medium: selectedOnly.filter(g => g.priority === 'Medium').length,
        Low: selectedOnly.filter(g => g.priority === 'Low').length,
    };
    // Count by status (selected goals only)
    const byStatus = {
        Planning: selectedOnly.filter(g => g.status === 'Planning').length,
        'Not Started': selectedOnly.filter(g => g.status === 'Not Started').length,
        'In Progress': selectedOnly.filter(g => g.status === 'In Progress').length,
        Blocked: selectedOnly.filter(g => g.status === 'Blocked').length,
        'On Hold': selectedOnly.filter(g => g.status === 'On Hold').length,
    };
    return {
        totalPotential: scanned.potentialGoals.length,
        totalSelected: scanned.selectedGoals.length,
        totalCompleted: scanned.completedGoals.length,
        totalShelved: scanned.shelvedGoals.length,
        byTier,
        byPriority,
        byStatus,
    };
}
//# sourceMappingURL=goal-scanner%202.js.map