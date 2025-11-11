import { TechnicalDebtItem } from '../types.js';
export declare class DebtManager {
    private registerPath;
    constructor(projectPath: string);
    addDebt(debt: Partial<Omit<TechnicalDebtItem, 'id' | 'createdAt' | 'lastUpdated'>>): Promise<string>;
    listDebt(filters?: {
        type?: string;
        severity?: string;
        status?: string;
    }): Promise<TechnicalDebtItem[]>;
    updateDebt(debtId: string, updates: Partial<TechnicalDebtItem>): Promise<void>;
    resolveDebt(debtId: string, notes?: string): Promise<void>;
    generateReport(): Promise<{
        totalDebt: number;
        byType: Record<string, number>;
        bySeverity: Record<string, number>;
        openDebt: number;
        resolvedDebt: number;
        oldestDebt: string | null;
    }>;
    private loadRegister;
    private saveRegister;
}
//# sourceMappingURL=debtManager.d.ts.map