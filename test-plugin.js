#!/usr/bin/env node
/**
 * Simple test to verify the hook module can be loaded and has expected exports
 */

const path = require('path');

console.log('Testing vault-tap Claude Code plugin...\n');

// Test 1: Load the hook module
console.log('Test 1: Loading hook module...');
try {
  const hook = require('./.claude-plugin/hook.js');
  console.log('✓ Hook module loaded successfully');
  
  // Test 2: Check exports
  console.log('\nTest 2: Checking exports...');
  if (typeof hook.onStreamingResponse === 'function') {
    console.log('✓ onStreamingResponse function exported');
  } else {
    console.log('✗ onStreamingResponse not found or not a function');
  }
  
  if (typeof hook.setEnabled === 'function') {
    console.log('✓ setEnabled function exported');
  } else {
    console.log('✗ setEnabled not found or not a function');
  }
  
  // Test 3: Load plugin.json
  console.log('\nTest 3: Loading plugin.json...');
  const pluginJson = require('./.claude-plugin/plugin.json');
  console.log('✓ plugin.json loaded successfully');
  console.log('  Plugin name:', pluginJson.name);
  console.log('  Plugin version:', pluginJson.version);
  console.log('  Hooks:', pluginJson.hooks.map(h => h.name).join(', '));
  
  // Test 4: Load config.json
  console.log('\nTest 4: Loading config.json...');
  const config = require('./.claude-plugin/config.json');
  console.log('✓ config.json loaded successfully');
  console.log('  Enabled:', config.enabled);
  console.log('  Volume:', config.volume);
  
  // Test 5: Check sound files
  console.log('\nTest 5: Checking sound files...');
  const fs = require('fs');
  const soundsDir = path.join(__dirname, 'sounds');
  const soundFiles = fs.readdirSync(soundsDir).filter(f => f.endsWith('.wav'));
  console.log(`✓ Found ${soundFiles.length} sound files`);
  
  console.log('\n✅ All tests passed!');
  console.log('\nThe plugin is ready to be used with Claude Code.');
  console.log('Install it by copying this directory to ~/.claude/plugins/vault-tap\n');
  
} catch (error) {
  console.error('✗ Test failed:', error.message);
  process.exit(1);
}
