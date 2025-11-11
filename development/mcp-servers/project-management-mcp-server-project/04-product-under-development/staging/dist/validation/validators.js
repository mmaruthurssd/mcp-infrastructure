export function validateComponent(data) {
    const errors = [];
    if (!data.componentId)
        errors.push('Missing componentId');
    if (!data.name)
        errors.push('Missing name');
    if (!data.description)
        errors.push('Missing description');
    return {
        valid: errors.length === 0,
        errors
    };
}
export function validateProjectOverview(data) {
    const errors = [];
    if (!data.projectName)
        errors.push('Missing projectName');
    if (!data.description)
        errors.push('Missing description');
    return {
        valid: errors.length === 0,
        errors
    };
}
export function validateMajorGoal(data) {
    const errors = [];
    if (!data.goalId)
        errors.push('Missing goalId');
    if (!data.goalName)
        errors.push('Missing goalName');
    if (!data.description)
        errors.push('Missing description');
    return {
        valid: errors.length === 0,
        errors
    };
}
//# sourceMappingURL=validators.js.map