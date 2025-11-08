#!/usr/bin/env node

/**
 * Auto-install script for Git Assistant MCP Server
 * Copies agent file to .claude/agents/ and updates .mcp.json
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Find project root by walking up directories
function findProjectRoot() {
  let currentDir = process.cwd();

  // Walk up until we find package.json, .git, or reach filesystem root
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, 'package.json')) ||
        fs.existsSync(path.join(currentDir, '.git'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  // If not found, use current directory
  return process.cwd();
}

// Main installation function
function install() {
  log('\n🚀 Installing Git Assistant agent...', 'blue');

  try {
    const projectRoot = findProjectRoot();
    log(`\n📁 Project root: ${projectRoot}`, 'blue');

    // 1. Create .claude/agents directory
    const agentsDir = path.join(projectRoot, '.claude', 'agents');
    if (!fs.existsSync(agentsDir)) {
      fs.mkdirSync(agentsDir, { recursive: true });
      log('✅ Created .claude/agents/ directory', 'green');
    } else {
      log('✅ .claude/agents/ directory already exists', 'green');
    }

    // 2. Copy agent file
    const agentSource = path.join(__dirname, 'agent', 'git-assistant.md');
    const agentDest = path.join(agentsDir, 'git-assistant.md');

    if (fs.existsSync(agentSource)) {
      fs.copyFileSync(agentSource, agentDest);
      log('✅ Copied git-assistant.md to .claude/agents/', 'green');
    } else {
      log('⚠️  Agent file not found at agent/git-assistant.md', 'yellow');
      log('   You can manually copy it from the README', 'yellow');
    }

    // 3. Update .mcp.json
    const mcpConfigPath = path.join(projectRoot, '.mcp.json');
    let mcpConfig = { mcpServers: {} };

    if (fs.existsSync(mcpConfigPath)) {
      try {
        mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
      } catch (e) {
        log('⚠️  Could not parse existing .mcp.json', 'yellow');
      }
    }

    // Ensure mcpServers object exists
    if (!mcpConfig.mcpServers) {
      mcpConfig.mcpServers = {};
    }

    // Calculate relative path from project root to server
    const serverPath = path.relative(projectRoot, path.join(__dirname, 'dist', 'server.js'));

    // Add or update git-assistant configuration
    mcpConfig.mcpServers['git-assistant'] = {
      command: 'node',
      args: [`./${serverPath.replace(/\\/g, '/')}`],
      env: {
        GIT_ASSISTANT_REPO_PATH: '${workspaceFolder}',
        GIT_ASSISTANT_DEBUG: 'false'
      }
    };

    fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
    log('✅ Updated .mcp.json configuration', 'green');

    // 4. Success message
    log('\n🎉 Git Assistant agent installed successfully!', 'green');
    log('\n📖 Usage:', 'blue');
    log('   In Claude Code chat, just say:', 'reset');
    log('   "git assistant"', 'yellow');
    log('\n   The agent will:', 'reset');
    log('   • Check if it\'s a good time to commit', 'reset');
    log('   • Suggest meaningful commit messages', 'reset');
    log('   • Provide git workflow guidance', 'reset');
    log('   • Learn your commit patterns\n', 'reset');

  } catch (error) {
    log(`\n❌ Installation failed: ${error.message}`, 'yellow');
    log('\n💡 You can manually set up the agent:', 'blue');
    log('   1. Copy agent file to .claude/agents/git-assistant.md', 'reset');
    log('   2. Update .mcp.json with server configuration', 'reset');
    log('   See README.md for details\n', 'reset');
    process.exit(1);
  }
}

// Run installation
if (require.main === module) {
  install();
}

module.exports = { install };
