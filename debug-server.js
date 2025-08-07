#!/usr/bin/env node

// Debug script to test the MCP server
console.log('Starting debug...');

try {
  console.log('Testing paths...');
  const { existsSync } = require('fs');
  const { resolve } = require('path');
  
  const paths = [
    resolve(__dirname, 'memberstack-docs-md'),
    resolve(__dirname, '../memberstack-docs-md'),
    resolve(process.cwd(), 'memberstack-docs-md'),
  ];
  
  paths.forEach((path, i) => {
    console.log(`Path ${i}: ${path} - ${existsSync(path) ? 'EXISTS' : 'NOT FOUND'}`);
  });
  
  // Try to run the actual server
  console.log('Attempting to import server...');
  import('./memberstack-docs-mcp/dist/index.js').then(() => {
    console.log('Server imported successfully');
  }).catch(err => {
    console.log('Import failed:', err.message);
  });
  
} catch (error) {
  console.log('Error:', error.message);
}