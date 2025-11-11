/**
 * Technical debt management
 */
import * as path from 'path';
import { readFile, writeFile, fileExists } from '../utils/fileUtils.js';
export class DebtManager {
    registerPath;
    constructor(projectPath) {
        this.registerPath = path.join(projectPath, '.technical-debt', 'debt-register.json');
    }
    async addDebt(debt) {
        const register = await this.loadRegister();
        const id = `debt-${Date.now()}`;
        const now = new Date().toISOString();
        const newItem = {
            id,
            title: debt.title || 'Untitled',
            description: debt.description || '',
            location: debt.location || '',
            type: debt.type || 'code-quality',
            severity: debt.severity || 'medium',
            status: debt.status || 'open',
            estimatedEffort: debt.estimatedEffort || 'Unknown',
            impact: debt.impact || '',
            createdAt: now,
            lastUpdated: now,
            notes: debt.notes || [],
        };
        register.items.push(newItem);
        register.lastUpdated = now;
        await this.saveRegister(register);
        return id;
    }
    async listDebt(filters) {
        const register = await this.loadRegister();
        let items = register.items;
        if (filters?.type) {
            items = items.filter(item => item.type === filters.type);
        }
        if (filters?.severity) {
            items = items.filter(item => item.severity === filters.severity);
        }
        if (filters?.status) {
            items = items.filter(item => item.status === filters.status);
        }
        return items;
    }
    async updateDebt(debtId, updates) {
        const register = await this.loadRegister();
        const item = register.items.find(i => i.id === debtId);
        if (!item) {
            throw new Error(`Debt item ${debtId} not found`);
        }
        Object.assign(item, updates, { lastUpdated: new Date().toISOString() });
        register.lastUpdated = new Date().toISOString();
        await this.saveRegister(register);
    }
    async resolveDebt(debtId, notes) {
        const register = await this.loadRegister();
        const item = register.items.find(i => i.id === debtId);
        if (!item) {
            throw new Error(`Debt item ${debtId} not found`);
        }
        item.status = 'resolved';
        item.resolvedAt = new Date().toISOString();
        item.lastUpdated = new Date().toISOString();
        if (notes) {
            item.notes.push(notes);
        }
        register.lastUpdated = new Date().toISOString();
        await this.saveRegister(register);
    }
    async generateReport() {
        const register = await this.loadRegister();
        const items = register.items;
        const byType = items.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
        }, {});
        const bySeverity = items.reduce((acc, item) => {
            acc[item.severity] = (acc[item.severity] || 0) + 1;
            return acc;
        }, {});
        const openItems = items.filter(i => i.status === 'open' || i.status === 'in-progress');
        const resolvedItems = items.filter(i => i.status === 'resolved');
        return {
            totalDebt: items.length,
            byType,
            bySeverity,
            openDebt: openItems.length,
            resolvedDebt: resolvedItems.length,
            oldestDebt: items.length > 0 ? items[0].createdAt : null,
        };
    }
    async loadRegister() {
        if (!(await fileExists(this.registerPath))) {
            return {
                version: '1.0',
                projectPath: path.dirname(path.dirname(this.registerPath)),
                lastUpdated: new Date().toISOString(),
                items: [],
            };
        }
        const content = await readFile(this.registerPath);
        return JSON.parse(content);
    }
    async saveRegister(register) {
        await writeFile(this.registerPath, JSON.stringify(register, null, 2));
    }
}
//# sourceMappingURL=debtManager.js.map