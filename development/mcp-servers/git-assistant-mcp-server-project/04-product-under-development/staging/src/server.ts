#!/usr/bin/env node

// Git Assistant MCP Server
// Provides intelligent version control assistance for AI-assisted development

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { GitWrapper } from './git.js';
import { HeuristicsEngine } from './heuristics.js';
import { MessageGenerator } from './message-generator.js';
import { LearningEngine } from './learning-engine.js';
import { SecurityIntegration } from './security-integration.js';
import { standardsValidator } from './standards-validator-client.js';

// Initialize components
const repoPath = process.env.GIT_ASSISTANT_REPO_PATH || process.cwd();
const git = new GitWrapper(repoPath);
const learningEngine = new LearningEngine(repoPath);
const messageGenerator = new MessageGenerator();
const securityIntegration = new SecurityIntegration(repoPath);

// Load security configuration
await securityIntegration.loadConfig();

// Initialize MCP server
const server = new Server(
  {
    name: 'git-assistant',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// === RESOURCES ===

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'git://status',
        name: 'Git Status',
        description: 'Current git repository status (staged, unstaged, untracked files)',
        mimeType: 'application/json',
      },
      {
        uri: 'git://recent-commits',
        name: 'Recent Commits',
        description: 'Last 10 commits in current branch',
        mimeType: 'application/json',
      },
      {
        uri: 'git://diff-summary',
        name: 'Diff Summary',
        description: 'Summary of changes since last commit',
        mimeType: 'application/json',
      },
      {
        uri: 'git://learned-patterns',
        name: 'Learned Patterns',
        description: 'View all patterns the Git Assistant has learned',
        mimeType: 'application/json',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri.toString();

  // Check if git repository
  const isGitRepo = await git.isGitRepository();
  if (!isGitRepo && !uri.includes('learned-patterns')) {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Not a git repository' }, null, 2),
        },
      ],
    };
  }

  try {
    switch (uri) {
      case 'git://status': {
        const status = await git.getStatus();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case 'git://recent-commits': {
        const commits = await git.getRecentCommits(10);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({ commits }, null, 2),
            },
          ],
        };
      }

      case 'git://diff-summary': {
        const diffSummary = await git.getDiffSummary();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(diffSummary, null, 2),
            },
          ],
        };
      }

      case 'git://learned-patterns': {
        const patterns = await learningEngine.listPatterns();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({ patterns }, null, 2),
            },
          ],
        };
      }

      default:
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({ error: 'Unknown resource' }, null, 2),
            },
          ],
        };
    }
  } catch (error: any) {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
    };
  }
});

// === TOOLS ===

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'check_commit_readiness',
        description: 'Analyze repository state and determine if now is a good time to commit',
        inputSchema: {
          type: 'object',
          properties: {
            context: {
              type: 'string',
              description: 'Optional context about what user is working on',
            },
          },
        },
      },
      {
        name: 'suggest_commit_message',
        description: 'Generate a meaningful commit message based on actual code changes',
        inputSchema: {
          type: 'object',
          properties: {
            include_body: {
              type: 'boolean',
              description: 'Include detailed body in commit message',
              default: true,
            },
            style: {
              type: 'string',
              enum: ['conventional', 'simple', 'detailed'],
              description: 'Commit message style',
              default: 'conventional',
            },
          },
        },
      },
      {
        name: 'show_git_guidance',
        description: 'Provide educational guidance on git workflows and best practices',
        inputSchema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              enum: ['commit-frequency', 'commit-messages', 'branching', 'general'],
              description: 'Specific topic to get guidance on',
              default: 'general',
            },
          },
        },
      },
      {
        name: 'analyze_commit_history',
        description: 'Analyze user\'s commit patterns and provide personalized insights',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'add_learned_pattern',
        description: 'Teach the Git Assistant a new pattern based on user feedback',
        inputSchema: {
          type: 'object',
          properties: {
            tool: {
              type: 'string',
              description: 'Tool name (e.g., check_commit_readiness)',
            },
            condition: {
              type: 'string',
              description: 'When to apply this pattern',
            },
            action: {
              type: 'string',
              description: 'What action to take',
            },
            reason: {
              type: 'string',
              description: 'Why this pattern is useful',
            },
          },
          required: ['tool', 'condition', 'action', 'reason'],
        },
      },
      {
        name: 'list_learned_patterns',
        description: 'View all patterns the Git Assistant has learned',
        inputSchema: {
          type: 'object',
          properties: {
            tool: {
              type: 'string',
              description: 'Filter by tool name',
            },
          },
        },
      },
      {
        name: 'remove_learned_pattern',
        description: 'Remove a learned pattern that is no longer useful',
        inputSchema: {
          type: 'object',
          properties: {
            pattern_id: {
              type: 'string',
              description: 'ID of the pattern to remove',
            },
          },
          required: ['pattern_id'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Check if git repository (except for pattern management tools)
  if (!['list_learned_patterns', 'remove_learned_pattern', 'add_learned_pattern'].includes(name)) {
    const isGitRepo = await git.isGitRepository();
    if (!isGitRepo) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: 'Not a git repository' }, null, 2),
          },
        ],
      };
    }
  }

  try {
    switch (name) {
      case 'check_commit_readiness': {
        const diffSummary = await git.getDiffSummary();
        const status = await git.getStatus();
        const timeSinceLastCommit = await git.getTimeSinceLastCommit();
        const recentCommits = await git.getRecentCommits(10);

        // Analyze commit history to get user preferences
        const userPrefs = await learningEngine.analyzeCommitHistory(recentCommits);

        // Check commit readiness
        const heuristics = new HeuristicsEngine(userPrefs);
        const result = heuristics.analyzeCommitReadiness(
          diffSummary,
          timeSinceLastCommit,
          status.staged.length > 0
        );

        // Run security scan if enabled
        if (securityIntegration.isEnabled()) {
          const securityScan = await securityIntegration.scanStaged();

          // Add security check to result
          result.security_check = {
            passed: securityScan.passed,
            severity: securityScan.severity,
            message: securityScan.message,
            credentials_found: securityScan.credentialsFound,
            phi_found: securityScan.phiFound,
            scan_time: securityScan.scanTime,
          };

          // Override readiness if security issues found
          if (!securityScan.passed) {
            result.ready_to_commit = false;
            result.confidence = 0;
            result.recommendation = '❌ Commit blocked due to security issues';
            result.warnings.unshift(securityScan.message);

            // Add detailed security warnings
            if (securityScan.issues.length > 0) {
              result.warnings.push(securityIntegration.formatIssuesForDisplay(securityScan.issues));
              result.suggested_next_steps.unshift(
                '🔒 Resolve security issues before committing',
                '📖 Review SECURITY_BEST_PRACTICES.md for guidance'
              );
            }

            // Learn from security issues
            for (const issue of securityScan.issues) {
              const hasSeen = await learningEngine.hasSeenSecurityIssue(issue.pattern, issue.file);
              if (!hasSeen) {
                await learningEngine.addSecurityPattern(
                  issue.pattern,
                  issue.severity,
                  issue.file,
                  issue.remediation
                );
              }
            }
          }
        }

        // Run standards compliance check
        try {
          // Extract MCP name from repo path
          const mcpNameMatch = repoPath.match(/mcp-servers\/([^/]+)/);
          if (mcpNameMatch) {
            const mcpName = mcpNameMatch[1].replace(/-project$/, '');

            console.log(`\n🔍 Running standards compliance check for '${mcpName}'...`);

            const validation = await standardsValidator.validateMcpCompliance({
              mcpName,
              categories: ['security', 'documentation'],
              failFast: false,
              includeWarnings: false, // Only critical for commit readiness
            });

            const { summary } = validation;

            // Add standards check to result
            result.standards_check = {
              compliant: validation.compliant,
              score: summary.complianceScore,
              critical_violations: summary.criticalViolations,
              warnings: summary.warningViolations,
            };

            // Override readiness if critical violations found
            if (summary.criticalViolations > 0) {
              result.ready_to_commit = false;
              result.confidence = Math.max(0, result.confidence - 30);
              result.warnings.unshift(
                `⚠️  ${summary.criticalViolations} critical standards violation(s) detected (Score: ${summary.complianceScore}/100)`
              );
              result.suggested_next_steps.push(
                '📋 Fix critical standards violations before committing',
                `💡 Run: validate_mcp_compliance({mcpName: "${mcpName}"}) for details`
              );
            } else if (!validation.compliant) {
              // Has warnings but no critical violations
              result.warnings.push(
                `ℹ️  Standards compliance score: ${summary.complianceScore}/100 (${summary.warningViolations} warnings)`
              );
              result.suggested_next_steps.push(
                `📋 Consider fixing standards warnings (Score: ${summary.complianceScore}/100)`
              );
            } else {
              console.log(`✅ Standards compliance check passed (Score: ${summary.complianceScore}/100)`);
            }
          }
        } catch (error: any) {
          // Log error but don't block commit
          console.warn(`⚠️  Standards compliance check failed: ${error.message}`);
          console.warn(`Proceeding with commit readiness check...`);
        }

        // Check for learned patterns
        const learnedPattern = await learningEngine.checkPatterns('check_commit_readiness', {
          file_count: diffSummary.total_files_changed,
          lines_changed: diffSummary.insertions + diffSummary.deletions,
        });

        // Suggest pattern learning
        const learningSuggestion = await learningEngine.suggestPattern(
          'check_commit_readiness',
          { file_count: diffSummary.total_files_changed },
          result
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  ...result,
                  learning_suggestion: learningSuggestion,
                  learned_pattern_applied: learnedPattern?.id || null,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'suggest_commit_message': {
        const includeBody = args?.include_body !== false;
        const style = (args?.style as any) || 'conventional';

        // Quick security check before generating message
        if (securityIntegration.isEnabled()) {
          const quickScan = await securityIntegration.quickScan();

          if (!quickScan.passed) {
            // Return security warning instead of commit message
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      error: 'Security issues detected',
                      severity: quickScan.severity,
                      message: quickScan.message,
                      credentials_found: quickScan.credentialsFound,
                      phi_found: quickScan.phiFound,
                      issues: quickScan.issues.map(issue => ({
                        type: issue.type,
                        file: issue.file,
                        line: issue.line,
                        pattern: issue.pattern,
                        severity: issue.severity,
                        remediation: issue.remediation,
                      })),
                      recommendation: '⚠️ Resolve security issues before committing. Use check_commit_readiness for detailed analysis.',
                      scan_time: quickScan.scanTime,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }
        }

        const diff = await git.getDiff();
        const diffStat = await git.getFullDiffStat();
        const recentCommits = await git.getRecentCommits(10);

        const message = await messageGenerator.generateCommitMessage(
          diff,
          diffStat,
          recentCommits,
          style
        );

        // Suggest pattern learning
        const learningSuggestion = await learningEngine.suggestPattern(
          'suggest_commit_message',
          { style },
          message
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  ...message,
                  security_check: '✅ No security issues detected',
                  learning_suggestion: learningSuggestion,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'show_git_guidance': {
        const topic = (args?.topic as string) || 'general';
        const guidance = getGuidanceContent(topic);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(guidance, null, 2),
            },
          ],
        };
      }

      case 'analyze_commit_history': {
        const commits = await git.getRecentCommits(30);

        const analysis = {
          analysis_period: 'Last 30 commits',
          total_commits: commits.length,
          patterns: await learningEngine.analyzeCommitHistory(commits),
          insights: generateInsights(commits),
          recommendations: generateRecommendations(commits),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(analysis, null, 2),
            },
          ],
        };
      }

      case 'add_learned_pattern': {
        const { tool, condition, action, reason } = args as any;

        const pattern = await learningEngine.addPattern(tool, condition, action, reason);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  pattern_id: pattern.id,
                  message: 'Pattern learned successfully',
                  applies_to: tool,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'list_learned_patterns': {
        const tool = args?.tool as string | undefined;
        const patterns = await learningEngine.listPatterns(tool);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ patterns, count: patterns.length }, null, 2),
            },
          ],
        };
      }

      case 'remove_learned_pattern': {
        const { pattern_id } = args as any;
        const removed = await learningEngine.removePattern(pattern_id);

        if (!removed) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: false, error: 'Pattern not found' }, null, 2),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  pattern_id,
                  message: 'Pattern removed successfully',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: 'Unknown tool' }, null, 2),
            },
          ],
        };
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message, stack: error.stack }, null, 2),
        },
      ],
    };
  }
});

// === HELPER FUNCTIONS ===

function getGuidanceContent(topic: string): any {
  const guidance: any = {
    'commit-messages': {
      topic: 'commit-messages',
      guidance: {
        summary: 'Write commit messages that explain WHY, not WHAT',
        principles: [
          'Subject line: Imperative mood, 50 chars or less',
          'Body: Explain motivation and context (why change was needed)',
          'Reference issues/tickets when applicable',
          'Use conventional commit format for consistency',
        ],
        good_examples: [
          'fix: prevent duplicate employee records\n\nAdded deduplication check before inserting new employees to avoid constraint violations when users accidentally submit form twice.',
          'refactor: extract validation logic to separate module\n\nValidation was duplicated across 3 tools. Extracted to reusable validators/ directory to improve maintainability and test coverage.',
        ],
        bad_examples: ['update code', 'fix bug', 'WIP', 'changes'],
        resources: [
          'https://chris.beams.io/posts/git-commit/',
          'https://www.conventionalcommits.org/',
        ],
      },
    },
    'commit-frequency': {
      topic: 'commit-frequency',
      guidance: {
        summary: 'Commit early, commit often - but keep commits logical',
        principles: [
          'Commit when you complete a logical unit of work',
          'Don\'t wait too long between commits (< 1-2 hours typical)',
          'Each commit should represent one idea or fix',
          'Commit before switching tasks or taking breaks',
        ],
        good_examples: [
          'After implementing a new feature',
          'After fixing a bug',
          'After refactoring a module',
          'Before lunch or end of day',
        ],
        bad_examples: [
          'After changing one line',
          'After 8 hours of mixed changes',
          'Bundling unrelated changes together',
        ],
        resources: ['https://www.git-tower.com/learn/git/ebook/en/command-line/appendix/best-practices'],
      },
    },
    general: {
      topic: 'general',
      guidance: {
        summary: 'Git best practices for effective version control',
        principles: [
          'Commit early and often',
          'Write meaningful commit messages',
          'Keep commits focused and atomic',
          'Review changes before committing',
          'Don\'t commit broken code',
        ],
        good_examples: [
          'Small, focused commits with clear messages',
          'Regular commits throughout the day',
          'Commits that pass all tests',
        ],
        bad_examples: [
          'Massive commits with everything',
          'Vague commit messages',
          'Committing broken/untested code',
        ],
        resources: [
          'https://www.git-tower.com/learn/git/ebook/en/command-line/appendix/best-practices',
          'https://chris.beams.io/posts/git-commit/',
        ],
      },
    },
  };

  return guidance[topic] || guidance['general'];
}

function generateInsights(commits: any[]): string[] {
  const insights: string[] = [];

  if (commits.length < 5) {
    insights.push('⚠️ Limited commit history - insights will improve over time');
    return insights;
  }

  const avgFiles = commits.reduce((sum, c) => sum + c.files_changed, 0) / commits.length;

  if (avgFiles <= 3) {
    insights.push('✅ Your commits are focused (avg ' + avgFiles.toFixed(1) + ' files) - easy to review');
  } else if (avgFiles > 5) {
    insights.push('⚠️ Your commits are large (avg ' + avgFiles.toFixed(1) + ' files) - consider smaller commits');
  }

  // Check for conventional commits
  const conventionalCount = commits.filter((c) =>
    /^(feat|fix|refactor|docs|test|chore|style|perf):/.test(c.message)
  ).length;

  if (conventionalCount / commits.length > 0.7) {
    insights.push('✅ You consistently use conventional commit format');
  } else {
    insights.push('💡 Consider using conventional commit format (feat:, fix:, etc.)');
  }

  return insights;
}

function generateRecommendations(commits: any[]): string[] {
  const recommendations: string[] = [];

  if (commits.length < 10) {
    recommendations.push('Keep committing regularly to build better insights');
    return recommendations;
  }

  const avgFiles = commits.reduce((sum, c) => sum + c.files_changed, 0) / commits.length;

  if (avgFiles > 5) {
    recommendations.push('Consider breaking up commits over 5 files into smaller, focused commits');
  }

  recommendations.push('Continue your current commit practices');
  recommendations.push('Review changes before committing with "git diff"');

  return recommendations;
}

// === START SERVER ===

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Git Assistant MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
