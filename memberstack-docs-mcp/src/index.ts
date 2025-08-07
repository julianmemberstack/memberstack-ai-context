#!/usr/bin/env node

import { MemberstackDocsServer } from './server.js';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

async function main() {
  // Get docs path from environment variable or command line argument
  let docsPath = process.env.MEMBERSTACK_DOCS_PATH || process.argv[2];
  
  // If no path provided, try to find docs in npm package location
  if (!docsPath) {
    // Get the directory where this script is located
    const scriptDir = new URL('.', import.meta.url).pathname;
    
    // Try different possible locations
    const possiblePaths = [
      resolve(scriptDir, '../memberstack-docs-md'), // Local development
      resolve(scriptDir, '../../memberstack-docs-md'), // Installed as npm package
      resolve(scriptDir, '../../../memberstack-docs-md'), // Deep npm package structure
      join(process.cwd(), 'memberstack-docs-md'), // Current directory
    ];
    
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        docsPath = path;
        break;
      }
    }
    
    if (!docsPath) {
      docsPath = resolve(scriptDir, '../../memberstack-docs-md'); // Default to npm package location
    }
  }

  if (!existsSync(docsPath)) {
    // Write debug info to temp file for troubleshooting
    try {
      const { writeFileSync } = await import('fs');
      const debugInfo = {
        error: 'Documentation directory not found',
        searchedPath: docsPath,
        scriptDir: new URL('.', import.meta.url).pathname,
        cwd: process.cwd(),
        argv: process.argv,
        env: process.env.MEMBERSTACK_DOCS_PATH
      };
      writeFileSync('/tmp/memberstack-debug.json', JSON.stringify(debugInfo, null, 2));
    } catch {}
    process.exit(1);
  }

  try {
    const server = new MemberstackDocsServer(docsPath);
    await server.run();
  } catch (error) {
    // Write debug info for troubleshooting
    try {
      const { writeFileSync } = await import('fs');
      writeFileSync('/tmp/memberstack-debug.json', JSON.stringify({
        error: 'Server startup failed',
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        docsPath
      }, null, 2));
    } catch {}
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.exit(1);
  });
}