/**
 * Technical debt management
 */
import * as path from 'path';
import { TechnicalDebtItem } from '../types.js';
import { readFile, writeFile, fileExists } from '../utils/fileUtils.js';

interface DebtRegister {
  version: string;
  projectPath: string;
  lastUpdated: string;
  items: TechnicalDebtItem[];
}

export class DebtManager {
  private registerPath: string;

  constructor(projectPath: string) {
    this.registerPath = path.join(projectPath, '.technical-debt', 'debt-register.json');
  }

  async addDebt(debt: Partial<Omit<TechnicalDebtItem, 'id' | 'createdAt' | 'lastUpdated'>>): Promise<string> {
    const register = await this.loadRegister();
    const id = `debt-${Date.now()}`;
    const now = new Date().toISOString();

    const newItem: TechnicalDebtItem = {
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

  async listDebt(filters?: { type?: string; severity?: string; status?: string }): Promise<TechnicalDebtItem[]> {
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

  async updateDebt(debtId: string, updates: Partial<TechnicalDebtItem>): Promise<void> {
    const register = await this.loadRegister();
    const item = register.items.find(i => i.id === debtId);

    if (!item) {
      throw new Error(`Debt item ${debtId} not found`);
    }

    Object.assign(item, updates, { lastUpdated: new Date().toISOString() });
    register.lastUpdated = new Date().toISOString();
    await this.saveRegister(register);
  }

  async resolveDebt(debtId: string, notes?: string): Promise<void> {
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
    }, {} as Record<string, number>);

    const bySeverity = items.reduce((acc, item) => {
      acc[item.severity] = (acc[item.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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

  private async loadRegister(): Promise<DebtRegister> {
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

  private async saveRegister(register: DebtRegister): Promise<void> {
    await writeFile(this.registerPath, JSON.stringify(register, null, 2));
  }
}
