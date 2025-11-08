/**
 * Goal Template Renderer - Stub Implementation
 */

export class GoalTemplateRenderer {
  static render(template: string, data: any): string {
    return template;
  }
  
  static buildPotentialGoalContext(data: any): any {
    return data;
  }
  
  static buildSelectedGoalContext(data: any): any {
    return data;
  }
}

export function renderGoalTemplate(data: any): string {
  return JSON.stringify(data, null, 2);
}
