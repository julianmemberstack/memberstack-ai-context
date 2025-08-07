#!/usr/bin/env node

import { spawn } from 'child_process';
import { join, resolve } from 'path';

// Test the MCP server by sending some sample requests
async function testMCPServer() {
  console.log('Testing Memberstack MCP Server...\n');
  
  const docsPath = resolve('../memberstack-docs-md');
  const serverPath = './dist/index.js';
  
  // Start the server
  const server = spawn('node', [serverPath, docsPath], {
    stdio: ['pipe', 'pipe', 'inherit'],
    env: { ...process.env, NODE_ENV: 'test' }
  });
  
  let responseCount = 0;
  const expectedResponses = 3;
  
  server.stdout.on('data', (data) => {
    const message = data.toString();
    console.log('Server Response:', JSON.parse(message));
    responseCount++;
    
    if (responseCount >= expectedResponses) {
      console.log('\n✅ All tests completed successfully!');
      server.kill();
      process.exit(0);
    }
  });
  
  server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
  });
  
  // Wait a moment for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 1: List resources
  console.log('Test 1: Listing resources...');
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'resources/list',
    params: {}
  }) + '\n');
  
  // Test 2: Search documentation
  console.log('Test 2: Searching for "login"...');
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'search_memberstack_docs',
      arguments: {
        query: 'login',
        limit: 3
      }
    }
  }) + '\n');
  
  // Test 3: Get method info
  console.log('Test 3: Getting method info for getCurrentMember...');
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'get_method_info',
      arguments: {
        method_name: 'getCurrentMember'
      }
    }
  }) + '\n');
  
  // Cleanup after timeout
  setTimeout(() => {
    console.log('\n⚠️  Test timeout - killing server');
    server.kill();
    process.exit(1);
  }, 10000);
}

testMCPServer().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});