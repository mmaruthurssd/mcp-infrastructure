export interface Alert {
    type: string;
    message: string;
    severity: 'urgent' | 'attention' | 'info';
    action: string;
}
export declare function detectAlerts(goals: any[]): Alert[];
//# sourceMappingURL=alert-detector.d.ts.map