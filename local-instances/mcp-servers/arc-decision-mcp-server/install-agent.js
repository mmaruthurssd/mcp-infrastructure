#!/usr/bin/env node

import { readFile, writeFile, mkdir, access, copyFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setup() {
  console.log('🚀 Setting up Architecture Decision Assistant...\n');

  const projectRoot = process.cwd();
  const agentsDir = join(projectRoot, '.claude', 'agents');
  const agentSource = join(__dirname, 'agent', 'arch-decision.md');
  const agentDest = join(agentsDir, 'arch-decision.md');
  const mcpConfigPath = join(projectRoot, '.mcp.json');

  try {
    // 1. Create .claude/agents directory
    console.log('📁 Creating .claude/agents/ directory...');
    await mkdir(agentsDir, { recursive: true });
    console.log('   ✅ Directory created\n');

    // 2. Copy agent file
    console.log('📋 Copying agent file...');
    await copyFile(agentSource, agentDest);
    console.log(`   ✅ Copied to ${agentDest}\n`);

    // 3. Update or create .mcp.json
    console.log('⚙️  Updating .mcp.json configuration...');

    let mcpConfig = { mcpServers: {} };
    try {
      await access(mcpConfigPath);
      const existing = await readFile(mcpConfigPath, 'utf-8');
      mcpConfig = JSON.parse(existing);
    } catch (error) {
      // File doesn't exist, will create new
      console.log('   Creating new .mcp.json file');
    }

    const serverPath = join(__dirname, 'dist', 'server.js');

    mcpConfig.mcpServers['arch-decision-mcp-server'] = {
      command: 'node',
      args: [serverPath],
      env: {
        ARCH_DECISION_PROJECT_ROOT: '${workspaceFolder}'
      }
    };

    await writeFile(mcpConfigPath, JSON.stringify(mcpConfig, null, 2), 'utf-8');
    console.log('   ✅ Configuration updated\n');

    // 4. Success message
    console.log('✨ Setup complete!\n');
    console.log('To use the Architecture Decision Assistant:');
    console.log('1. Open Claude Code');
    console.log('2. Type: arch decision');
    console.log('3. Describe the tool you want to build\n');
    console.log('The assistant will guide you through the decision process!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setup();
