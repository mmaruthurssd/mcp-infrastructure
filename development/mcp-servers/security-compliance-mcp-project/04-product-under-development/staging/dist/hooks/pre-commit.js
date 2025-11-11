#!/usr/bin/env node
/**
 * Git pre-commit hook
 *
 * Scans staged files for credentials and PHI before allowing commit
 */
import { scanForCredentials } from '../tools/scan-for-credentials.js';
import { scanForPHI } from '../tools/scan-for-phi.js';
import { loadConfig } from '../config/security-config.js';
/**
 * Main pre-commit hook execution
 */
async function runPreCommitHook() {
    try {
        const config = loadConfig();
        // Check if hooks are enabled
        if (!config.preCommitHooks.enabled) {
            return 0; // Success - hooks disabled
        }
        // Check for bypass flag
        const bypassFlag = process.env.SKIP_SECURITY_HOOKS === 'true';
        if (bypassFlag) {
            console.warn('⚠️  Security hooks bypassed via SKIP_SECURITY_HOOKS environment variable');
            console.warn('   This should only be used in exceptional circumstances!');
            return 0;
        }
        let hasViolations = false;
        // Scan for credentials if enabled
        if (config.preCommitHooks.scanCredentials) {
            console.log('🔍 Scanning staged files for credentials...');
            const result = await scanForCredentials({
                target: '',
                mode: 'staged',
            });
            if (result.violations.length > 0) {
                hasViolations = true;
                console.error('');
                console.error('❌ CREDENTIAL DETECTION FAILURE');
                console.error('='.repeat(80));
                console.error('');
                console.error(`Found ${result.violations.length} potential credential(s) in staged files:`);
                console.error('');
                // Group by file
                const byFile = new Map();
                result.violations.forEach((v) => {
                    if (!byFile.has(v.file)) {
                        byFile.set(v.file, []);
                    }
                    byFile.get(v.file).push(v);
                });
                byFile.forEach((violations, file) => {
                    console.error(`📄 ${file}:`);
                    violations.forEach((v) => {
                        const severityIcon = {
                            critical: '🔴',
                            high: '🟠',
                            medium: '🟡',
                            low: '🔵',
                        }[v.severity];
                        console.error(`   ${severityIcon} Line ${v.line}: ${v.pattern}`);
                        console.error(`      ${v.suggestion}`);
                    });
                    console.error('');
                });
            }
            else {
                console.log('✅ No credentials detected');
            }
        }
        // Scan for PHI if enabled
        if (config.preCommitHooks.scanPHI) {
            console.log('🔍 Scanning staged files for PHI...');
            const phiResult = await scanForPHI({
                target: '',
                mode: 'staged',
                sensitivity: config.preCommitHooks.phiSensitivity,
            });
            if (phiResult.findings.length > 0) {
                hasViolations = true;
                console.error('');
                console.error('❌ PHI DETECTION FAILURE');
                console.error('='.repeat(80));
                console.error('');
                console.error(`Found ${phiResult.findings.length} PHI instance(s) in staged files:`);
                console.error(`Risk Level: ${phiResult.summary.riskLevel.toUpperCase()}`);
                console.error('');
                // Group by file
                const byFile = new Map();
                phiResult.findings.forEach((f) => {
                    if (!byFile.has(f.file)) {
                        byFile.set(f.file, []);
                    }
                    byFile.get(f.file).push(f);
                });
                byFile.forEach((findings, file) => {
                    console.error(`📄 ${file}:`);
                    findings.forEach((f) => {
                        const categoryIcon = {
                            identifier: '🆔',
                            demographic: '👤',
                            medical: '⚕️',
                            financial: '💰',
                        }[f.category];
                        console.error(`   ${categoryIcon} Line ${f.line}: ${f.pattern}`);
                        console.error(`      ${f.anonymizationSuggestion}`);
                    });
                    console.error('');
                });
                console.error('HIPAA Compliance:');
                console.error(`  ${phiResult.complianceImpact}`);
                console.error('');
            }
            else {
                console.log('✅ No PHI detected');
            }
        }
        // Handle violations
        if (hasViolations) {
            console.error('');
            console.error('='.repeat(80));
            console.error('COMMIT BLOCKED: Security violations detected');
            console.error('='.repeat(80));
            console.error('');
            console.error('To fix:');
            console.error('  1. Remove or redact the sensitive information from your changes');
            console.error('  2. Use environment variables or secrets manager instead');
            console.error('  3. Add false positives to allow-list via manage_allowlist tool');
            console.error('');
            console.error('To bypass (USE WITH CAUTION):');
            console.error('  SKIP_SECURITY_HOOKS=true git commit -m "your message"');
            console.error('');
            if (config.preCommitHooks.blockOnViolations) {
                return 1; // Failure - block commit
            }
            else {
                console.warn('⚠️  Violations detected but commit allowed (blockOnViolations=false)');
                return 0; // Success - warnings only
            }
        }
        console.log('');
        console.log('✅ All security checks passed');
        return 0; // Success
    }
    catch (error) {
        console.error('');
        console.error('❌ Pre-commit hook error:', error instanceof Error ? error.message : String(error));
        console.error('');
        console.error('Commit blocked due to hook error.');
        console.error('To bypass: SKIP_SECURITY_HOOKS=true git commit');
        console.error('');
        return 1; // Failure
    }
}
// Run hook if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runPreCommitHook()
        .then((exitCode) => {
        process.exit(exitCode);
    })
        .catch((error) => {
        console.error('Fatal error in pre-commit hook:', error);
        process.exit(1);
    });
}
export { runPreCommitHook };
//# sourceMappingURL=pre-commit.js.map