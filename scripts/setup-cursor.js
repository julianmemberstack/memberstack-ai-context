#!/usr/bin/env node

const { readFileSync, writeFileSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');
const { homedir } = require('os');

const PACKAGE_ROOT = join(__dirname, '..');
const MCP_SERVER_PATH = join(PACKAGE_ROOT, 'memberstack-docs-mcp', 'dist', 'index.js');
const DOCS_PATH = join(PACKAGE_ROOT, 'memberstack-docs-md');

function setupCursor() {
  console.log('🔧 Setting up Cursor integration...');
  
  // Try multiple possible Cursor config locations
  const possiblePaths = [
    join(homedir(), 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'mcp_servers.json'),
    join(homedir(), '.cursor', 'mcp_servers.json'),
    join(homedir(), 'Library', 'Application Support', 'Cursor', 'mcp_servers.json')
  ];
  
  let configFile = possiblePaths[0]; // Default to first option
  
  // Check if any existing config exists
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      configFile = path;
      break;
    }
  }
  
  const configDir = join(configFile, '..');
  
  // Create config directory if it doesn't exist
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
    console.log('📁 Created Cursor configuration directory');
  }
  
  let config = {};
  
  // Read existing config
  if (existsSync(configFile)) {
    try {
      config = JSON.parse(readFileSync(configFile, 'utf8'));
      console.log('📖 Found existing Cursor configuration');
    } catch (e) {
      console.log('📝 Creating new Cursor configuration');
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
  
  console.log('✅ Cursor configuration updated!');
  console.log(`📍 Configuration saved to: ${configFile}`);
  console.log('\n📝 Next steps:');
  console.log('1. Restart Cursor');
  console.log('2. Memberstack documentation will be available via MCP');
  console.log('3. Use MCP tools to search and access documentation');
  
  console.log('\n💡 Note: If MCP integration doesn\\'t work, you may need to:');
  console.log('   • Check if Cursor supports MCP (feature may be in beta)');
  console.log('   • Manually configure MCP in Cursor settings');
  console.log('\n🎉 Memberstack AI Context is ready to use!');
}

if (require.main === module) {
  setupCursor();
}

module.exports = { setupCursor };