import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { readFileSafe } from '../utils/file-utils.js';
// Fix for ESM import of traverse
const traverseFunction = typeof traverse === 'function' ? traverse : traverse.default;
/**
 * Parse TypeScript file and extract function/class information using Babel AST
 */
export async function analyzeSourceFile(filePath) {
    try {
        const sourceCode = await readFileSafe(filePath);
        if (!sourceCode) {
            return {
                functions: [],
                classes: [],
                error: `Failed to read source file: ${filePath}`,
            };
        }
        // Parse with Babel (supports TypeScript)
        const ast = parse(sourceCode, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx'],
        });
        const functions = [];
        const classes = [];
        // Traverse AST to extract functions and classes
        traverseFunction(ast, {
            // Function declarations (function foo() {})
            FunctionDeclaration(path) {
                const node = path.node;
                if (node.id) {
                    const funcInfo = extractFunctionInfo(node, path);
                    if (funcInfo) {
                        functions.push(funcInfo);
                    }
                }
            },
            // Arrow functions and function expressions (const foo = () => {})
            VariableDeclarator(path) {
                const node = path.node;
                if ((node.init?.type === 'ArrowFunctionExpression' ||
                    node.init?.type === 'FunctionExpression') &&
                    node.id.type === 'Identifier') {
                    const funcInfo = extractFunctionInfo(node.init, path, node.id.name);
                    if (funcInfo) {
                        functions.push(funcInfo);
                    }
                }
            },
            // Class declarations
            ClassDeclaration(path) {
                const node = path.node;
                if (node.id) {
                    const classInfo = extractClassInfo(node, path);
                    if (classInfo) {
                        classes.push(classInfo);
                    }
                }
            },
        });
        return { functions, classes };
    }
    catch (error) {
        return {
            functions: [],
            classes: [],
            error: `Failed to parse source file: ${error.message}`,
        };
    }
}
/**
 * Extract function information from AST node
 */
function extractFunctionInfo(node, path, name) {
    try {
        const functionName = name || node.id?.name;
        if (!functionName)
            return null;
        // Check if exported
        const isExported = path.parentPath?.isExportNamedDeclaration() ||
            path.parentPath?.isExportDefaultDeclaration() ||
            false;
        // Extract parameters
        const params = (node.params || []).map((param) => {
            return extractParameterInfo(param);
        });
        // Extract return type
        const returnType = extractReturnType(node);
        // Check if async
        const isAsync = node.async === true;
        // Extract JSDoc comment if available
        const docComment = extractDocComment(path);
        return {
            name: functionName,
            params,
            returnType,
            isAsync,
            isExported,
            docComment,
        };
    }
    catch (error) {
        console.error('Failed to extract function info:', error);
        return null;
    }
}
/**
 * Extract class information from AST node
 */
function extractClassInfo(node, path) {
    try {
        const className = node.id?.name;
        if (!className)
            return null;
        // Check if exported
        const isExported = path.parentPath?.isExportNamedDeclaration() ||
            path.parentPath?.isExportDefaultDeclaration() ||
            false;
        const methods = [];
        const properties = [];
        // Extract class methods and properties
        for (const item of node.body.body) {
            if (item.type === 'ClassMethod') {
                const methodInfo = {
                    name: item.key.name,
                    params: (item.params || []).map((p) => extractParameterInfo(p)),
                    returnType: extractReturnType(item),
                    isAsync: item.async === true,
                    isExported: true, // Methods of exported class are accessible
                };
                methods.push(methodInfo);
            }
            else if (item.type === 'ClassProperty') {
                const propertyInfo = {
                    name: item.key.name,
                    type: extractTypeAnnotation(item.typeAnnotation) || 'any',
                    visibility: item.accessibility || 'public',
                };
                properties.push(propertyInfo);
            }
        }
        return {
            name: className,
            methods,
            properties,
            isExported,
        };
    }
    catch (error) {
        console.error('Failed to extract class info:', error);
        return null;
    }
}
/**
 * Extract parameter information
 */
function extractParameterInfo(param) {
    const name = param.name || param.left?.name || 'unknown';
    const type = extractTypeAnnotation(param.typeAnnotation) || 'any';
    const optional = param.optional === true;
    const defaultValue = param.right ? extractLiteralValue(param.right) : undefined;
    return { name, type, optional, defaultValue };
}
/**
 * Extract type annotation from TypeScript node
 */
function extractTypeAnnotation(typeAnnotation) {
    if (!typeAnnotation)
        return undefined;
    const typeNode = typeAnnotation.typeAnnotation || typeAnnotation;
    switch (typeNode.type) {
        case 'TSStringKeyword':
            return 'string';
        case 'TSNumberKeyword':
            return 'number';
        case 'TSBooleanKeyword':
            return 'boolean';
        case 'TSArrayType':
            return 'array';
        case 'TSTypeReference':
            return typeNode.typeName?.name || 'object';
        case 'TSUnionType':
            return 'union';
        case 'TSAnyKeyword':
            return 'any';
        default:
            return 'unknown';
    }
}
/**
 * Extract return type from function node
 */
function extractReturnType(node) {
    if (node.returnType) {
        return extractTypeAnnotation(node.returnType) || 'unknown';
    }
    // Infer from async
    if (node.async) {
        return 'Promise';
    }
    return 'unknown';
}
/**
 * Extract literal value from node
 */
function extractLiteralValue(node) {
    switch (node.type) {
        case 'StringLiteral':
            return node.value;
        case 'NumericLiteral':
            return node.value;
        case 'BooleanLiteral':
            return node.value;
        case 'NullLiteral':
            return null;
        default:
            return undefined;
    }
}
/**
 * Extract JSDoc comment from path
 */
function extractDocComment(path) {
    const leadingComments = path.node.leadingComments;
    if (!leadingComments || leadingComments.length === 0)
        return undefined;
    const jsdocComment = leadingComments.find((c) => c.type === 'CommentBlock');
    return jsdocComment?.value.trim();
}
/**
 * Filter functions by name (for selective test generation)
 */
export function filterFunctionsByName(functions, names) {
    return functions.filter(f => names.includes(f.name));
}
/**
 * Get only exported functions (for unit testing)
 */
export function getExportedFunctions(functions) {
    return functions.filter(f => f.isExported);
}
//# sourceMappingURL=ast-analyzer.js.map