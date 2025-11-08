// Template structure creator stub
export class TemplateStructureCreator {
    static create(projectPath, options) {
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
//# sourceMappingURL=template-structure-creator.js.map