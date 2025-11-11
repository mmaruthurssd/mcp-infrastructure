#!/usr/bin/env node
/**
 * Git pre-commit hook
 *
 * Scans staged files for credentials and PHI before allowing commit
 */
/**
 * Main pre-commit hook execution
 */
declare function runPreCommitHook(): Promise<number>;
export { runPreCommitHook };
//# sourceMappingURL=pre-commit.d.ts.map