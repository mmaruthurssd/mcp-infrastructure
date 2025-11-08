/**
 * Git hook manager
 *
 * Install, uninstall, and manage git pre-commit hooks
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
/**
 * Install pre-commit hook
 */
export async function installPreCommitHook(gitDir) {
    try {
        // Find git directory
        const gitRoot = gitDir || findGitRoot();
        if (!gitRoot) {
            return {
                success: false,
                message: 'Not a git repository. Run this command from within a git repository.',
            };
        }
        const hooksDir = path.join(gitRoot, '.git', 'hooks');
        const hookPath = path.join(hooksDir, 'pre-commit');
        const backupPath = path.join(hooksDir, 'pre-commit.backup');
        // Ensure hooks directory exists
        await fs.mkdir(hooksDir, { recursive: true });
        // Check if hook already exists
        let existingHook = null;
        try {
            existingHook = await fs.readFile(hookPath, 'utf-8');
            // Check if it's already our hook
            if (existingHook.includes('security-compliance-mcp')) {
                return {
                    success: false,
                    message: 'Security pre-commit hook is already installed',
                    hookPath,
                };
            }
            // Backup existing hook
            await fs.writeFile(backupPath, existingHook, 'utf-8');
            await fs.chmod(backupPath, 0o755);
        }
        catch (error) {
            // No existing hook, that's fine
            existingHook = null;
        }
        // Create hook script
        const hookScript = generateHookScript();
        await fs.writeFile(hookPath, hookScript, 'utf-8');
        await fs.chmod(hookPath, 0o755);
        const message = existingHook
            ? `Pre-commit hook installed successfully. Previous hook backed up to ${backupPath}`
            : 'Pre-commit hook installed successfully';
        return {
            success: true,
            message,
            hookPath,
            backupPath: existingHook ? backupPath : undefined,
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Failed to install hook: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
/**
 * Uninstall pre-commit hook
 */
export async function uninstallPreCommitHook(gitDir) {
    try {
        const gitRoot = gitDir || findGitRoot();
        if (!gitRoot) {
            return {
                success: false,
                message: 'Not a git repository',
            };
        }
        const hooksDir = path.join(gitRoot, '.git', 'hooks');
        const hookPath = path.join(hooksDir, 'pre-commit');
        const backupPath = path.join(hooksDir, 'pre-commit.backup');
        // Check if our hook is installed
        let existingHook;
        try {
            existingHook = await fs.readFile(hookPath, 'utf-8');
        }
        catch (error) {
            return {
                success: false,
                message: 'No pre-commit hook found',
            };
        }
        if (!existingHook.includes('security-compliance-mcp')) {
            return {
                success: false,
                message: 'Security pre-commit hook is not installed',
            };
        }
        // Remove hook
        await fs.unlink(hookPath);
        // Restore backup if it exists
        try {
            const backup = await fs.readFile(backupPath, 'utf-8');
            await fs.writeFile(hookPath, backup, 'utf-8');
            await fs.chmod(hookPath, 0o755);
            await fs.unlink(backupPath);
            return {
                success: true,
                message: 'Security pre-commit hook uninstalled. Previous hook restored.',
                hookPath,
            };
        }
        catch (error) {
            return {
                success: true,
                message: 'Security pre-commit hook uninstalled',
                hookPath,
            };
        }
    }
    catch (error) {
        return {
            success: false,
            message: `Failed to uninstall hook: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
/**
 * Check hook installation status
 */
export async function checkHookStatus(gitDir) {
    try {
        const gitRoot = gitDir || findGitRoot();
        if (!gitRoot) {
            return {
                installed: false,
                hasBackup: false,
                message: 'Not a git repository',
            };
        }
        const hooksDir = path.join(gitRoot, '.git', 'hooks');
        const hookPath = path.join(hooksDir, 'pre-commit');
        const backupPath = path.join(hooksDir, 'pre-commit.backup');
        let hookContent;
        try {
            hookContent = await fs.readFile(hookPath, 'utf-8');
        }
        catch (error) {
            return {
                installed: false,
                hasBackup: false,
                message: 'No pre-commit hook found',
            };
        }
        const isOurHook = hookContent.includes('security-compliance-mcp');
        let hasBackup = false;
        try {
            await fs.access(backupPath);
            hasBackup = true;
        }
        catch {
            hasBackup = false;
        }
        return {
            installed: isOurHook,
            hookPath,
            hasBackup,
            message: isOurHook
                ? 'Security pre-commit hook is installed'
                : 'Pre-commit hook exists but is not our hook',
        };
    }
    catch (error) {
        return {
            installed: false,
            hasBackup: false,
            message: `Error checking status: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
/**
 * Find git root directory
 */
function findGitRoot() {
    try {
        const output = execSync('git rev-parse --show-toplevel', {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore'],
        });
        return output.trim();
    }
    catch {
        return null;
    }
}
/**
 * Generate hook script that calls our TypeScript hook
 */
function generateHookScript() {
    // Find the path to our compiled pre-commit hook
    // This assumes the hook will be compiled to dist/hooks/pre-commit.js
    const script = `#!/bin/sh
# Security & Compliance MCP Pre-Commit Hook
# Generated by security-compliance-mcp

# Find the MCP server installation directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MCP_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Try to find the hook in common locations
if [ -f "$MCP_DIR/node_modules/security-compliance-mcp/dist/hooks/pre-commit.js" ]; then
  HOOK_PATH="$MCP_DIR/node_modules/security-compliance-mcp/dist/hooks/pre-commit.js"
elif [ -f "$MCP_DIR/dist/hooks/pre-commit.js" ]; then
  HOOK_PATH="$MCP_DIR/dist/hooks/pre-commit.js"
else
  echo "Error: Cannot find security-compliance-mcp pre-commit hook"
  echo "Please ensure the package is properly installed"
  exit 1
fi

# Run the hook
node "$HOOK_PATH"
exit $?
`;
    return script;
}
//# sourceMappingURL=hook-manager.js.map