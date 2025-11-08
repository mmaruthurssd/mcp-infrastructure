import { ReleaseNotes } from '../types/index.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function generateReleaseNotes(args: any) {
  const {
    fromVersion,
    toVersion,
    format = 'markdown'
  } = args;

  try {
    console.error(`[release-notes] Generating release notes from ${fromVersion} to ${toVersion}...`);

    // Try to get git log between versions
    let changes: ReleaseNotes['changes'] = [];
    let contributors: string[] = [];

    try {
      // Get commits between versions
      const { stdout: gitLog } = await execAsync(
        `git log ${fromVersion}..${toVersion} --pretty=format:"%h|%s|%an" 2>/dev/null || echo ""`
      );

      if (gitLog) {
        const commits = gitLog.split('\n').filter(line => line.trim());
        const uniqueContributors = new Set<string>();

        for (const commit of commits) {
          const [hash, message, author] = commit.split('|');

          // Parse conventional commit format
          let type: ReleaseNotes['changes'][0]['type'] = 'feature';
          let description = message;

          if (message.startsWith('feat:') || message.startsWith('feature:')) {
            type = 'feature';
            description = message.replace(/^(feat|feature):\s*/, '');
          } else if (message.startsWith('fix:')) {
            type = 'fix';
            description = message.replace(/^fix:\s*/, '');
          } else if (message.startsWith('docs:')) {
            type = 'docs';
            description = message.replace(/^docs:\s*/, '');
          } else if (message.startsWith('refactor:')) {
            type = 'refactor';
            description = message.replace(/^refactor:\s*/, '');
          } else if (message.includes('BREAKING')) {
            type = 'breaking';
          }

          changes.push({
            type,
            description,
            commit: hash
          });

          uniqueContributors.add(author);
        }

        contributors = Array.from(uniqueContributors);
      } else {
        // No git history, create placeholder
        changes.push({
          type: 'feature',
          description: `Release ${toVersion}`
        });
      }
    } catch (gitError) {
      // Git not available or not a git repository
      console.error(`[release-notes] Git not available, creating basic release notes`);
      changes.push({
        type: 'feature',
        description: `Release ${toVersion}`
      });
    }

    const releaseNotes: ReleaseNotes = {
      version: toVersion,
      date: new Date().toISOString().split('T')[0],
      changes,
      contributors: contributors.length > 0 ? contributors : undefined
    };

    console.error(`[release-notes] ✅ Generated ${changes.length} changes for release notes`);

    let formatted: string;
    switch (format) {
      case 'markdown':
        formatted = formatMarkdown(releaseNotes);
        break;
      case 'html':
        formatted = formatHTML(releaseNotes);
        break;
      case 'json':
        formatted = JSON.stringify(releaseNotes, null, 2);
        break;
      default:
        formatted = formatMarkdown(releaseNotes);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ...releaseNotes,
            format,
            message: `Generated release notes for ${toVersion}`,
            formatted
          }, null, 2)
        }
      ]
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[release-notes] ❌ Error generating release notes: ${errorMessage}`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: errorMessage,
            message: `Failed to generate release notes: ${errorMessage}`
          }, null, 2)
        }
      ]
    };
  }
}

function formatMarkdown(notes: ReleaseNotes): string {
  const groupedChanges: Record<string, ReleaseNotes['changes']> = {
    breaking: [],
    feature: [],
    fix: [],
    docs: [],
    refactor: []
  };

  for (const change of notes.changes) {
    groupedChanges[change.type].push(change);
  }

  const sections: string[] = [];

  if (groupedChanges.breaking.length > 0) {
    sections.push('## ⚠️ Breaking Changes\n\n' +
      groupedChanges.breaking.map(c => `- ${c.description}${c.commit ? ` (${c.commit})` : ''}`).join('\n'));
  }

  if (groupedChanges.feature.length > 0) {
    sections.push('## ✨ Features\n\n' +
      groupedChanges.feature.map(c => `- ${c.description}${c.commit ? ` (${c.commit})` : ''}`).join('\n'));
  }

  if (groupedChanges.fix.length > 0) {
    sections.push('## 🐛 Bug Fixes\n\n' +
      groupedChanges.fix.map(c => `- ${c.description}${c.commit ? ` (${c.commit})` : ''}`).join('\n'));
  }

  if (groupedChanges.refactor.length > 0) {
    sections.push('## ♻️ Refactoring\n\n' +
      groupedChanges.refactor.map(c => `- ${c.description}${c.commit ? ` (${c.commit})` : ''}`).join('\n'));
  }

  if (groupedChanges.docs.length > 0) {
    sections.push('## 📚 Documentation\n\n' +
      groupedChanges.docs.map(c => `- ${c.description}${c.commit ? ` (${c.commit})` : ''}`).join('\n'));
  }

  let markdown = `# Release ${notes.version}\n\n**Date:** ${notes.date}\n\n`;
  markdown += sections.join('\n\n');

  if (notes.contributors && notes.contributors.length > 0) {
    markdown += `\n\n## 👥 Contributors\n\n`;
    markdown += notes.contributors.map(c => `- ${c}`).join('\n');
  }

  return markdown;
}

function formatHTML(notes: ReleaseNotes): string {
  const markdown = formatMarkdown(notes);
  // Simple markdown to HTML conversion
  return markdown
    .replace(/^# (.*)/gm, '<h1>$1</h1>')
    .replace(/^## (.*)/gm, '<h2>$1</h2>')
    .replace(/^- (.*)/gm, '<li>$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}
