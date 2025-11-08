export interface EnvVar {
    name: string;
    required: boolean;
    description: string;
    defaultValue?: string;
}
export interface ConfigDir {
    path: string;
    required: boolean;
}
export interface ServerRequirements {
    name: string;
    displayName: string;
    status: "configured" | "needs-secrets" | "missing-dir" | "not-configured";
    statusEmoji: string;
    envVars: EnvVar[];
    configDir: ConfigDir | null;
    guideSection: {
        startLine: number;
        endLine: number;
    };
    recommendedConfig: {
        command: string;
        args: string[];
        env?: Record<string, string>;
    } | null;
}
/**
 * Parse the MCP_CONFIGURATION_GUIDE.md file and extract server requirements
 */
export declare function parseConfigurationGuide(workspaceRoot: string): Map<string, ServerRequirements>;
/**
 * Validate a server configuration against guide requirements
 */
export interface ValidationIssue {
    severity: "error" | "warning" | "info";
    category: "env-var" | "config-dir" | "path-portability" | "guide-compliance" | "build";
    message: string;
    fix?: string;
    guideReference?: string;
}
export declare function validateServerConfig(workspaceRoot: string, serverName: string, actualConfig: {
    command: string;
    args: string[];
    env?: Record<string, string>;
} | null, requirements: ServerRequirements): ValidationIssue[];
//# sourceMappingURL=guide-parser.d.ts.map