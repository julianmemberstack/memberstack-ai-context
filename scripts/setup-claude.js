#!/usr/bin/env node

const { readFileSync, writeFileSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');
const { homedir } = require('os');

const PACKAGE_ROOT = join(__dirname, '..');
const MCP_SERVER_PATH = join(PACKAGE_ROOT, 'memberstack-docs-mcp', 'dist', 'index.js');
const DOCS_PATH = join(PACKAGE_ROOT, 'memberstack-docs-md');

function setupClaude() {
  console.log('🔧 Setting up Claude Code integration...');
  
  const configDir = join(homedir(), 'Library', 'Application Support', 'Claude');
  const configFile = join(configDir, 'mcp_servers.json');
  
  // Create config directory if it doesn't exist
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
    console.log('📁 Created Claude configuration directory');
  }
  
  let config = {};
  
  // Read existing config
  if (existsSync(configFile)) {
    try {
      config = JSON.parse(readFileSync(configFile, 'utf8'));
      console.log('📖 Found existing Claude Code configuration');
    } catch (e) {
      console.log('📝 Creating new Claude Code configuration');
    }
  }
  
  // Add Memberstack docs server
  config['memberstack-docs'] = {
    command: MCP_SERVER_PATH,
    args: [DOCS_PATH],
    env: {
      MEMBERSTACK_DOCS_PATH: DOCS_PATH
    }
  };
  
  // Write updated config
  writeFileSync(configFile, JSON.stringify(config, null, 2));
  
  console.log('✅ Claude Code configuration updated!');
  console.log(`📍 Configuration saved to: ${configFile}`);
  console.log('\n📝 Next steps:');
  console.log('1. Restart Claude Code');
  console.log('2. The following tools will be available:');
  console.log('   • search_memberstack_docs - Search documentation');
  console.log('   • get_method_info - Get method details');
  console.log('   • list_methods_by_category - Browse by category');
  console.log('   • get_section_summary - Section summaries');
  console.log('   • get_code_examples - Code examples');
  console.log('\n🎉 Memberstack AI Context is ready to use!');
}

if (require.main === module) {
  setupClaude();
}

module.exports = { setupClaude };