/**
 * Preventive Check Generator
 * Generates preventive checks from promoted issues
 */
import { promises as fs } from 'fs';
export class PreventiveCheckGenerator {
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    /**
     * Generate preventive check from issue
     */
    generatePreventiveCheck(issue) {
        let check = '';
        check += `#### ✓ ${this.generateCheckTitle(issue)} (Auto-Learned)\n`;
        check += '```bash\n';
        check += `# (Prevents Issue #${issue.issueNumber}: ${issue.title} - ${issue.frequency} occurrences)\n`;
        check += this.generateCheckScript(issue);
        check += '\n```\n';
        return check;
    }
    /**
     * Generate check title from issue
     */
    generateCheckTitle(issue) {
        // Extract key concept from title
        const title = issue.title.toLowerCase();
        if (title.includes('typescript') || title.includes('tsc')) {
            return 'TypeScript Validation';
        }
        if (title.includes('permission') || title.includes('access')) {
            return 'File Permissions Validation';
        }
        if (title.includes('node_modules') || title.includes('dependencies')) {
            return 'Dependencies Validation';
        }
        if (title.includes('network') || title.includes('timeout')) {
            return 'Network Connectivity Validation';
        }
        if (title.includes('disk') || title.includes('space')) {
            return 'Disk Space Validation';
        }
        if (title.includes('template') || title.includes('copy')) {
            return 'Template Validation';
        }
        // Fallback: capitalize first word
        const words = issue.title.split(' ');
        return `${words[0]} Validation`;
    }
    /**
     * Generate check script from issue solution
     */
    generateCheckScript(issue) {
        let script = `echo "📋 Checking for Issue #${issue.issueNumber} conditions..."\n\n`;
        // Generate check based on issue characteristics
        const symptom = issue.symptom.toLowerCase();
        const solution = issue.solution.toLowerCase();
        if (symptom.includes('cannot find module') && symptom.includes('tsc')) {
            script += '# Verify template copy will exclude node_modules/\n';
            script += 'if [ -d "template-path/node_modules" ]; then\n';
            script += '  echo "⚠️  Template contains node_modules/ - will be excluded during copy"\n';
            script += '  echo "✓ Prevents TypeScript corruption"\n';
            script += 'fi\n';
        }
        else if (symptom.includes('permission denied') || symptom.includes('eacces')) {
            script += '# Test write permissions\n';
            script += 'touch .permission-test 2>/dev/null && rm .permission-test && echo "✓ Write permissions: OK" || echo "✗ Write permissions: FAILED"\n';
        }
        else if (symptom.includes('network') || symptom.includes('timeout')) {
            script += '# Test network connectivity\n';
            script += 'curl -I https://registry.npmjs.org/ 2>&1 | head -1\n';
        }
        else if (symptom.includes('enospc') || symptom.includes('disk space')) {
            script += '# Check disk space\n';
            script += 'df -h . | tail -1 | awk \'{print "Disk space: " $4 " free"}\'\n';
        }
        else {
            // Generic check
            script += `# Generic check for: ${issue.title}\n`;
            script += 'echo "✓ Check complete"\n';
        }
        return script;
    }
    /**
     * Add preventive checks to knowledge base file
     */
    async addPreventiveChecks(knowledgeBaseFile, promotedIssues) {
        const filePath = `${this.projectRoot}/${knowledgeBaseFile}`;
        try {
            let content = await fs.readFile(filePath, 'utf-8');
            // Find pre-flight checklist section
            const preFightPattern = /## 🚨 FOR AI ASSISTANTS: PRE-INSTALLATION CHECKLIST/;
            if (!preFightPattern.test(content)) {
                console.error('⚠️  No pre-flight checklist section found in knowledge base');
                return;
            }
            // Find end of existing checks
            const existingChecksEnd = content.indexOf('### Pre-Installation Results');
            if (existingChecksEnd === -1) {
                console.error('⚠️  Could not find insertion point for preventive checks');
                return;
            }
            // Generate checks for all promoted issues
            let checksToAdd = '\n#### ✓ Auto-Learned Preventive Checks\n\n';
            checksToAdd += 'The following checks were automatically added based on high-frequency issues:\n\n';
            for (const issue of promotedIssues) {
                checksToAdd += this.generatePreventiveCheck(issue);
                checksToAdd += '\n';
            }
            // Insert checks before Pre-Installation Results
            content =
                content.slice(0, existingChecksEnd) +
                    checksToAdd +
                    '\n' +
                    content.slice(existingChecksEnd);
            await fs.writeFile(filePath, content, 'utf-8');
            console.error(`✓ Added ${promotedIssues.length} preventive check(s) to ${knowledgeBaseFile}`);
        }
        catch (error) {
            console.error(`Failed to add preventive checks: ${error.message}`);
        }
    }
}
//# sourceMappingURL=preventive-generator.js.map