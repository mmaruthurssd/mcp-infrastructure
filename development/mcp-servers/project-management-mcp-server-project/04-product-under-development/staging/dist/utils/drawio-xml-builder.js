// Drawio XML builder stub
export class DrawioXmlBuilder {
    build(options) { return ''; }
    createTierHeader(tier) {
        return { id: `tier-${tier}`, type: 'header', tier };
    }
    createGoalBox(goal, position) {
        return { id: goal.id || 'goal', type: 'box', goal, position };
    }
    addCell(cell) {
        // Stub - would add cell to internal structure
    }
}
//# sourceMappingURL=drawio-xml-builder.js.map