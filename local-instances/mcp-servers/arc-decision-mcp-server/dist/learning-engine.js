import { readFile, writeFile, access } from 'fs/promises';
import { join } from 'path';
export class LearningEngine {
    projectRoot;
    rulesFile;
    patterns = [];
    constructor(config) {
        this.projectRoot = config.projectRoot;
        this.rulesFile = config.rulesFile || '.mcp-data/arch-decision-patterns.json';
    }
    async initialize() {
        await this.loadPatterns();
    }
    get patternsPath() {
        return join(this.projectRoot, this.rulesFile);
    }
    async loadPatterns() {
        try {
            await access(this.patternsPath);
            const data = await readFile(this.patternsPath, 'utf-8');
            this.patterns = JSON.parse(data);
        }
        catch (error) {
            // File doesn't exist yet, start with empty patterns
            this.patterns = [];
        }
    }
    async savePatterns() {
        const data = JSON.stringify(this.patterns, null, 2);
        await writeFile(this.patternsPath, data, 'utf-8');
    }
    async addPattern(pattern) {
        const id = this.generateId();
        const newPattern = {
            ...pattern,
            id,
            createdAt: new Date().toISOString(),
            timesReferenced: 0
        };
        this.patterns.push(newPattern);
        await this.savePatterns();
        return id;
    }
    async findSimilarPatterns(description, limit = 5) {
        // Simple keyword matching (could be enhanced with embeddings)
        const keywords = description.toLowerCase().split(/\s+/);
        const scored = this.patterns.map(pattern => {
            const patternText = pattern.toolDescription.toLowerCase();
            const matches = keywords.filter(kw => patternText.includes(kw)).length;
            return { pattern, score: matches };
        });
        scored.sort((a, b) => b.score - a.score);
        // Increment reference count for found patterns
        const similar = scored.slice(0, limit).map(s => s.pattern);
        similar.forEach(p => p.timesReferenced++);
        await this.savePatterns();
        return similar;
    }
    async getPattern(id) {
        return this.patterns.find(p => p.id === id) || null;
    }
    async removePattern(id) {
        const initialLength = this.patterns.length;
        this.patterns = this.patterns.filter(p => p.id !== id);
        if (this.patterns.length < initialLength) {
            await this.savePatterns();
            return true;
        }
        return false;
    }
    async updateOutcome(id, outcome) {
        const pattern = this.patterns.find(p => p.id === id);
        if (pattern) {
            pattern.outcome = outcome;
            await this.savePatterns();
            return true;
        }
        return false;
    }
    async listAllPatterns() {
        return [...this.patterns];
    }
    async getStatistics() {
        const byDecision = {};
        const byOutcome = {};
        this.patterns.forEach(p => {
            byDecision[p.decision] = (byDecision[p.decision] || 0) + 1;
            if (p.outcome) {
                byOutcome[p.outcome] = (byOutcome[p.outcome] || 0) + 1;
            }
        });
        const mostReferenced = [...this.patterns]
            .sort((a, b) => b.timesReferenced - a.timesReferenced)
            .slice(0, 5);
        return {
            total: this.patterns.length,
            byDecision,
            byOutcome,
            mostReferenced
        };
    }
    generateId() {
        return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=learning-engine.js.map