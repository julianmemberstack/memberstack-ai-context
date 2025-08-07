#!/usr/bin/env node

const { setupClaude } = require('./setup-claude');
const { setupCursor } = require('./setup-cursor');

function showMenu() {
  console.log(`
🚀 Memberstack AI Context Setup

Choose your AI coding assistant:

1. Claude Code (recommended)
2. Cursor  
3. Both Claude Code & Cursor
4. Show manual configuration
5. Exit

`);
}

function showManualConfig() {
  const PACKAGE_ROOT = require('path').join(__dirname, '..');
  const MCP_SERVER_PATH = require('path').join(PACKAGE_ROOT, 'memberstack-docs-mcp', 'dist', 'index.js');
  const DOCS_PATH = require('path').join(PACKAGE_ROOT, 'memberstack-docs-md');
  
  console.log(`
📋 Manual Configuration

Add this configuration to your MCP settings file:

\`\`\`json
{
  "memberstack-docs": {
    "command": "${MCP_SERVER_PATH}",
    "args": ["${DOCS_PATH}"],
    "env": {
      "MEMBERSTACK_DOCS_PATH": "${DOCS_PATH}"
    }
  }
}
\`\`\`

Configuration file locations:
• Claude Code: ~/Library/Application Support/Claude/mcp_servers.json
• Cursor: ~/Library/Application Support/Cursor/User/globalStorage/mcp_servers.json

After adding the configuration, restart your editor.
`);
}

async function main() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  function askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  }
  
  showMenu();
  
  try {
    const answer = await askQuestion('Select an option (1-5): ');
    
    switch (answer.trim()) {
      case '1':
        console.log('\n🔧 Setting up Claude Code...\n');
        setupClaude();
        break;
        
      case '2':
        console.log('\n🔧 Setting up Cursor...\n');
        setupCursor();
        break;
        
      case '3':
        console.log('\n🔧 Setting up both Claude Code & Cursor...\n');
        setupClaude();
        console.log('\n' + '='.repeat(50) + '\n');
        setupCursor();
        break;
        
      case '4':
        showManualConfig();
        break;
        
      case '5':
        console.log('👋 Setup cancelled');
        break;
        
      default:
        console.log('❌ Invalid option selected');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}