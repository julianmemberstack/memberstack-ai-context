#!/usr/bin/env node

import { MemberstackDocsServer } from './server.js';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

async function main() {
  const logFile = '/tmp/memberstack-mcp-debug.log';
  
  function log(message: string) {
    try {
      const { writeFileSync, existsSync } = require('fs');
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${message}\n`;
      if (existsSync(logFile)) {
        const { appendFileSync } = require('fs');
        appendFileSync(logFile, logEntry);
      } else {
        writeFileSync(logFile, logEntry);
      }
    } catch {}
  }

  log('=== MCP Server Starting ===');
  log(`Node version: ${process.version}`);
  log(`Args: ${JSON.stringify(process.argv)}`);
  log(`CWD: ${process.cwd()}`);
  log(`Script URL: ${import.meta.url}`);

  // Get docs path from environment variable or command line argument
  let docsPath = process.env.MEMBERSTACK_DOCS_PATH || process.argv[2];
  
  // If no path provided, try to find docs in npm package location
  if (!docsPath) {
    log('No docs path provided, searching...');
    // Get the directory where this script is located
    const scriptDir = new URL('.', import.meta.url).pathname;
    log(`Script directory: ${scriptDir}`);
    
    // Try different possible locations
    const possiblePaths = [
      resolve(scriptDir, '../memberstack-docs-md'), // Local development
      resolve(scriptDir, '../../memberstack-docs-md'), // Installed as npm package
      resolve(scriptDir, '../../../memberstack-docs-md'), // Deep npm package structure
      join(process.cwd(), 'memberstack-docs-md'), // Current directory
    ];
    
    log('Checking possible paths:');
    for (const path of possiblePaths) {
      const exists = existsSync(path);
      log(`  ${path} - ${exists ? 'EXISTS' : 'NOT FOUND'}`);
      if (exists) {
        docsPath = path;
        break;
      }
    }
    
    if (!docsPath) {
      docsPath = resolve(scriptDir, '../../memberstack-docs-md'); // Default to npm package location
      log(`Using default path: ${docsPath}`);
    }
  }
  
  log(`Final docs path: ${docsPath}`);

  if (!existsSync(docsPath)) {
    log(`ERROR: Documentation directory not found at: ${docsPath}`);
    process.exit(1);
  }

  log(`Docs directory exists, initializing server...`);
  
  try {
    log('Creating MemberstackDocsServer instance...');
    const server = new MemberstackDocsServer(docsPath);
    log('Server created, starting run...');
    await server.run();
    log('Server.run() completed - should be listening on stdio');
  } catch (error) {
    log(`ERROR during server startup: ${(error as any)?.message}`);
    log(`Stack trace: ${(error as any)?.stack}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    try {
      const { writeFileSync } = require('fs');
      const timestamp = new Date().toISOString();
      writeFileSync('/tmp/memberstack-mcp-debug.log', `[${timestamp}] FATAL ERROR in main(): ${error?.message}\nStack: ${error?.stack}\n`, { flag: 'a' });
    } catch {}
    process.exit(1);
  });
}