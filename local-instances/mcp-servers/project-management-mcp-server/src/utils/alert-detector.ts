// Alert detector stubs
export interface Alert {
  type: string;
  message: string;
  severity: 'urgent' | 'attention' | 'info';
  action: string;
}
export function detectAlerts(goals: any[]): Alert[] { return []; }
