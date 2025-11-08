// Validation stubs
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export function validateComponent(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.componentId) errors.push('Missing componentId');
  if (!data.name) errors.push('Missing name');
  if (!data.description) errors.push('Missing description');

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateProjectOverview(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.projectName) errors.push('Missing projectName');
  if (!data.description) errors.push('Missing description');

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateMajorGoal(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.goalId) errors.push('Missing goalId');
  if (!data.goalName) errors.push('Missing goalName');
  if (!data.description) errors.push('Missing description');

  return {
    valid: errors.length === 0,
    errors
  };
}
