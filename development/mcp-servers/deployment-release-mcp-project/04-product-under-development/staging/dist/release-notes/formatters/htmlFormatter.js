/**
 * Format release notes as HTML
 */
export function formatHtml(categories, breakingChanges, contributors, options) {
    const html = [];
    // HTML header
    html.push("<!DOCTYPE html>");
    html.push("<html lang=\"en\">");
    html.push("<head>");
    html.push("  <meta charset=\"UTF-8\">");
    html.push("  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
    html.push(`  <title>Release Notes - ${escapeHtml(options.version)}</title>`);
    html.push("  <style>");
    html.push("    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 20px; color: #333; }");
    html.push("    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }");
    html.push("    h2 { color: #34495e; border-bottom: 2px solid #ecf0f1; padding-bottom: 8px; margin-top: 30px; }");
    html.push("    h3 { color: #7f8c8d; margin-top: 20px; }");
    html.push("    .release-date { color: #7f8c8d; font-size: 0.9em; margin-bottom: 20px; }");
    html.push("    .summary { background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }");
    html.push("    .summary ul { margin: 10px 0; padding-left: 20px; }");
    html.push("    .breaking-changes { background: #ffe6e6; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0; border-radius: 5px; }");
    html.push("    .breaking-changes h2 { color: #e74c3c; border-bottom-color: #e74c3c; }");
    html.push("    .warning { color: #e74c3c; font-weight: bold; }");
    html.push("    .commit-list { list-style: none; padding-left: 0; }");
    html.push("    .commit-list li { margin: 8px 0; padding-left: 20px; position: relative; }");
    html.push("    .commit-list li:before { content: '•'; position: absolute; left: 0; color: #3498db; font-weight: bold; }");
    html.push("    .scope { font-weight: bold; color: #2c3e50; }");
    html.push("    .commit-hash { font-family: 'Courier New', monospace; background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }");
    html.push("    .reference { color: #3498db; text-decoration: none; }");
    html.push("    .contributors { background: #e8f8f5; padding: 15px; border-radius: 5px; }");
    html.push("    .contributors ul { list-style: none; padding-left: 0; columns: 2; }");
    html.push("    .migration-guide { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 10px 0; border-radius: 3px; }");
    html.push("  </style>");
    html.push("</head>");
    html.push("<body>");
    // Header
    html.push(`  <h1>Release Notes - ${escapeHtml(options.version)}</h1>`);
    html.push(`  <p class="release-date"><strong>Release Date:</strong> ${escapeHtml(options.releaseDate)}</p>`);
    // Summary
    const totalCommits = Object.values(categories).reduce((sum, commits) => sum + commits.length, 0);
    html.push("  <div class=\"summary\">");
    html.push("    <h2>Summary</h2>");
    html.push(`    <p>This release includes ${totalCommits} commits with the following changes:</p>`);
    html.push("    <ul>");
    html.push(`      <li><strong>Features:</strong> ${categories.features.length}</li>`);
    html.push(`      <li><strong>Bug Fixes:</strong> ${categories.fixes.length}</li>`);
    html.push(`      <li><strong>Enhancements:</strong> ${categories.enhancements.length}</li>`);
    html.push(`      <li><strong>Performance:</strong> ${categories.performance.length}</li>`);
    html.push(`      <li><strong>Security:</strong> ${categories.security.length}</li>`);
    html.push(`      <li><strong>Dependencies:</strong> ${categories.dependencies.length}</li>`);
    if (options.includeBreakingChanges && breakingChanges.length > 0) {
        html.push(`      <li><strong>Breaking Changes:</strong> ${breakingChanges.length}</li>`);
    }
    html.push("    </ul>");
    html.push("  </div>");
    // Breaking Changes Section
    if (options.includeBreakingChanges && breakingChanges.length > 0) {
        html.push("  <div class=\"breaking-changes\">");
        html.push("    <h2>Breaking Changes</h2>");
        html.push("    <p class=\"warning\">⚠️ Warning: This release contains breaking changes that may require action.</p>");
        for (const breaking of breakingChanges) {
            const firstLine = breaking.description.split("\n")[0];
            html.push(`    <h3>${escapeHtml(firstLine)}</h3>`);
            html.push(`    <p><strong>Commit:</strong> <span class="commit-hash">${escapeHtml(breaking.commit.substring(0, 7))}</span></p>`);
            if (breaking.description.includes("\n")) {
                const fullDesc = breaking.description.split("\n").slice(1).join("\n");
                html.push(`    <p>${escapeHtml(fullDesc)}</p>`);
            }
            if (breaking.migration) {
                html.push("    <div class=\"migration-guide\">");
                html.push("      <strong>Migration Guide:</strong>");
                html.push(`      <p>${escapeHtml(breaking.migration)}</p>`);
                html.push("    </div>");
            }
        }
        html.push("  </div>");
    }
    // Features Section
    if (categories.features.length > 0) {
        html.push("  <h2>Features</h2>");
        html.push("  <ul class=\"commit-list\">");
        for (const commit of categories.features) {
            html.push(`    <li>${formatCommitHtml(commit)}</li>`);
        }
        html.push("  </ul>");
    }
    // Enhancements Section
    if (categories.enhancements.length > 0) {
        html.push("  <h2>Enhancements</h2>");
        html.push("  <ul class=\"commit-list\">");
        for (const commit of categories.enhancements) {
            html.push(`    <li>${formatCommitHtml(commit)}</li>`);
        }
        html.push("  </ul>");
    }
    // Bug Fixes Section
    if (categories.fixes.length > 0) {
        html.push("  <h2>Bug Fixes</h2>");
        html.push("  <ul class=\"commit-list\">");
        for (const commit of categories.fixes) {
            html.push(`    <li>${formatCommitHtml(commit)}</li>`);
        }
        html.push("  </ul>");
    }
    // Performance Section
    if (categories.performance.length > 0) {
        html.push("  <h2>Performance</h2>");
        html.push("  <ul class=\"commit-list\">");
        for (const commit of categories.performance) {
            html.push(`    <li>${formatCommitHtml(commit)}</li>`);
        }
        html.push("  </ul>");
    }
    // Security Section
    if (categories.security.length > 0) {
        html.push("  <h2>Security</h2>");
        html.push("  <ul class=\"commit-list\">");
        for (const commit of categories.security) {
            html.push(`    <li>${formatCommitHtml(commit)}</li>`);
        }
        html.push("  </ul>");
    }
    // Dependencies Section
    if (categories.dependencies.length > 0) {
        html.push("  <h2>Dependencies</h2>");
        html.push("  <ul class=\"commit-list\">");
        for (const commit of categories.dependencies) {
            html.push(`    <li>${formatCommitHtml(commit)}</li>`);
        }
        html.push("  </ul>");
    }
    // Contributors Section
    if (options.includeAuthors && contributors.length > 0) {
        html.push("  <div class=\"contributors\">");
        html.push("    <h2>Contributors</h2>");
        html.push(`    <p>This release was made possible by ${contributors.length} contributor${contributors.length > 1 ? "s" : ""}:</p>`);
        html.push("    <ul>");
        for (const contributor of contributors) {
            html.push(`      <li>${escapeHtml(contributor)}</li>`);
        }
        html.push("    </ul>");
        html.push("  </div>");
    }
    // Close HTML
    html.push("</body>");
    html.push("</html>");
    return html.join("\n");
}
/**
 * Format a single commit as HTML
 */
function formatCommitHtml(commit) {
    const scope = commit.scope ? `<span class="scope">${escapeHtml(commit.scope)}:</span> ` : "";
    const hash = `<span class="commit-hash">${escapeHtml(commit.hash.substring(0, 7))}</span>`;
    const references = commit.references.length > 0
        ? ` (${commit.references.map(ref => `<span class="reference">${escapeHtml(ref)}</span>`).join(", ")})`
        : "";
    return `${scope}${escapeHtml(commit.subject)} ${hash}${references}`;
}
/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}
//# sourceMappingURL=htmlFormatter.js.map