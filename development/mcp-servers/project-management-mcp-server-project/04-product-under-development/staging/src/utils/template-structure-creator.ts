// Template structure creator stub
export class TemplateStructureCreator {
  static create(projectPath: string, options?: string | any): any {
    const projectName = typeof options === 'string' ? options : options?.projectName || 'Untitled Project';
    return {
      success: true,
      projectPath,
      projectName,
      structure: {
        directories: [],
        files: []
      }
    };
  }
}
