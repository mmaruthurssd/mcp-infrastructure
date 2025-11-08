// Drawio XML builder stub
export class DrawioXmlBuilder {
  build(options?: any) { return ''; }

  createTierHeader(tier: string): any {
    return { id: `tier-${tier}`, type: 'header', tier };
  }

  createGoalBox(goal: any, position: any): any {
    return { id: goal.id || 'goal', type: 'box', goal, position };
  }

  addCell(cell: any): void {
    // Stub - would add cell to internal structure
  }
}
