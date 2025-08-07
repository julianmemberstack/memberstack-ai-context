#!/usr/bin/env node

import { MemberstackDocsServer } from './server.js';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

async function main() {
  // Get docs path from environment variable or command line argument
  const docsPath = process.env.MEMBERSTACK_DOCS_PATH || 
                   process.argv[2] || 
                   resolve('../memberstack-docs-md');

  if (!existsSync(docsPath)) {
    console.error(`Error: Documentation directory not found at: ${docsPath}`);
    console.error('Please provide the path to your memberstack-docs-md directory:');
    console.error('  - Set MEMBERSTACK_DOCS_PATH environment variable');
    console.error('  - Pass path as command line argument');
    console.error('  - Ensure the directory exists');
    process.exit(1);
  }

  console.error(`Starting Memberstack docs MCP server with docs from: ${docsPath}`);

  try {
    const server = new MemberstackDocsServer(docsPath);
    await server.run();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
}