#!/usr/bin/env node

import { MemberstackDocsServer } from './server.js';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

async function main() {
  // Get docs path from environment variable or command line argument
  let docsPath = process.env.MEMBERSTACK_DOCS_PATH || process.argv[2];
  
  // If no path provided, try to find docs in npm package location
  if (!docsPath) {
    // Try different possible locations
    const possiblePaths = [
      resolve('../memberstack-docs-md'), // Local development
      resolve(__dirname, '../../memberstack-docs-md'), // Installed as npm package
      join(process.cwd(), 'memberstack-docs-md'), // Current directory
    ];
    
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        docsPath = path;
        break;
      }
    }
    
    if (!docsPath) {
      docsPath = resolve(__dirname, '../../memberstack-docs-md'); // Default to npm package location
    }
  }

  if (!existsSync(docsPath)) {
    // Cannot use console.error in MCP servers as it interferes with stdio protocol
    process.exit(1);
  }

  try {
    const server = new MemberstackDocsServer(docsPath);
    await server.run();
  } catch (error) {
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.exit(1);
  });
}