#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const { existsSync, readFileSync, writeFileSync, mkdirSync } = require('fs');
const { join, dirname } = require('path');
const { homedir } = require('os');

const command = process.argv[2];
const PACKAGE_ROOT = dirname(__dirname);
const MCP_SERVER_PATH = join(PACKAGE_ROOT, 'memberstack-docs-mcp', 'dist', 'index.js');
const DOCS_PATH = join(PACKAGE_ROOT, 'memberstack-docs-md');

function log(message) {
  console.log(`🔧 ${message}`);
}

function success(message) {
  console.log(`✅ ${message}`);
}

function error(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function setupClaude() {
  log('Setting up Claude Code integration...');
  
  const configDir = join(homedir(), 'Library', 'Application Support', 'Claude');
  const configFile = join(configDir, 'mcp_servers.json');
  
  // Create config directory if it doesn't exist
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  
  let config = {};
  
  // Read existing config
  if (existsSync(configFile)) {
    try {
      config = JSON.parse(readFileSync(configFile, 'utf8'));
      log('Found existing Claude Code configuration');
    } catch (e) {
      log('Creating new Claude Code configuration');
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
  
  success('Claude Code configuration updated!');
  console.log(`Configuration saved to: ${configFile}`);
  console.log('\n📝 Next steps:');
  console.log('1. Restart Claude Code');
  console.log('2. The following tools will be available:');
  console.log('   - search_memberstack_docs');
  console.log('   - get_method_info');
  console.log('   - list_methods_by_category');
  console.log('   - get_section_summary');
  console.log('   - get_code_examples');
}

function setupCursor() {
  log('Setting up Cursor integration...');
  
  const configDir = join(homedir(), 'Library', 'Application Support', 'Cursor', 'User');
  const configFile = join(configDir, 'globalStorage', 'mcp_servers.json');
  
  // Create config directory if it doesn't exist
  if (!existsSync(dirname(configFile))) {
    mkdirSync(dirname(configFile), { recursive: true });
  }
  
  let config = {};
  
  // Read existing config
  if (existsSync(configFile)) {
    try {
      config = JSON.parse(readFileSync(configFile, 'utf8'));
      log('Found existing Cursor configuration');
    } catch (e) {
      log('Creating new Cursor configuration');
    }
  }
  
  // Add Memberstack docs server
  config['memberstack-docs'] = {
    command: MCP_SERVER_PATH,
    args: [DOCS_PATH]
  };
  
  // Write updated config
  writeFileSync(configFile, JSON.stringify(config, null, 2));
  
  success('Cursor configuration updated!');
  console.log(`Configuration saved to: ${configFile}`);
  console.log('\n📝 Next steps:');
  console.log('1. Restart Cursor');
  console.log('2. Memberstack documentation will be available via MCP');
}

function runSetup() {
  log('Setting up Memberstack AI Context...');
  
  // Check if files exist
  if (!existsSync(MCP_SERVER_PATH)) {
    error('MCP server not found. Please run: npm run build');
  }
  
  if (!existsSync(DOCS_PATH)) {
    error('Documentation not found. Package may be corrupted.');
  }
  
  // Auto-detect available editors and offer setup
  console.log('\n🎯 Available setup options:');
  console.log('1. Claude Code (recommended)');
  console.log('2. Cursor');
  console.log('3. Both');
  console.log('4. Manual (show configuration)');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\nWhich editor would you like to configure? (1-4): ', (answer) => {
    switch (answer) {
      case '1':
        setupClaude();
        break;
      case '2':
        setupCursor();
        break;
      case '3':
        setupClaude();
        setupCursor();
        break;
      case '4':
        showManualConfig();
        break;
      default:
        error('Invalid option selected');
    }
    rl.close();
  });
}

function showManualConfig() {
  console.log('\n📋 Manual Configuration:');
  console.log('\nAdd this to your MCP configuration file:');
  console.log('\n```json');
  console.log(JSON.stringify({
    "memberstack-docs": {
      "command": MCP_SERVER_PATH,
      "args": [DOCS_PATH],
      "env": {
        "MEMBERSTACK_DOCS_PATH": DOCS_PATH
      }
    }
  }, null, 2));
  console.log('```');
  
  console.log('\nConfiguration file locations:');
  console.log('• Claude Code: ~/Library/Application Support/Claude/mcp_servers.json');
  console.log('• Cursor: ~/Library/Application Support/Cursor/User/globalStorage/mcp_servers.json');
}

function startServer() {
  log('Starting Memberstack docs MCP server...');
  
  const server = spawn('node', [MCP_SERVER_PATH, DOCS_PATH], {
    stdio: 'inherit',
    env: { ...process.env, MEMBERSTACK_DOCS_PATH: DOCS_PATH }
  });
  
  server.on('error', (err) => {
    error(`Server failed to start: ${err.message}`);
  });
  
  process.on('SIGINT', () => {
    log('Shutting down server...');
    server.kill();
    process.exit(0);
  });
}

function runTest() {
  log('Testing MCP server...');
  
  try {
    const testScript = join(PACKAGE_ROOT, 'memberstack-docs-mcp', 'test-server.js');
    if (existsSync(testScript)) {
      execSync(`node ${testScript}`, { stdio: 'inherit', cwd: PACKAGE_ROOT });
      success('All tests passed!');
    } else {
      error('Test script not found');
    }
  } catch (e) {
    error(`Tests failed: ${e.message}`);
  }
}

function showHelp() {
  console.log(`
🚀 Memberstack AI Context CLI

Usage: memberstack-ai-context <command>

Commands:
  setup         Interactive setup for Claude Code & Cursor
  setup:claude  Setup Claude Code integration only  
  setup:cursor  Setup Cursor integration only
  start         Start the MCP server directly
  test          Run server tests
  help          Show this help message

Examples:
  memberstack-ai-context setup           # Interactive setup
  memberstack-ai-context setup:claude    # Setup Claude Code only
  memberstack-ai-context start           # Start server
  memberstack-ai-context test            # Run tests

For more information: https://github.com/julianmemberstack/memberstack-ai-context
`);
}

// Main command handling
switch (command) {
  case 'setup':
    runSetup();
    break;
  case 'setup:claude':
    setupClaude();
    break;
  case 'setup:cursor':
    setupCursor();
    break;
  case 'start':
    startServer();
    break;
  case 'test':
    runTest();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    if (command) {
      error(`Unknown command: ${command}`);
    }
    showHelp();
}