#!/usr/bin/env node
/**
 * Simple test to verify the Agent Callisto2 hook module can be loaded
 * and has expected exports.
 */

const path = require('path');

console.log('Testing agent-callisto2 Claude CLI plugin...\n');

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
    process.exit(1);
  }
  
  if (typeof hook.setEnabled === 'function') {
    console.log('✓ setEnabled function exported');
  } else {
    console.log('✗ setEnabled not found or not a function');
    process.exit(1);
  }

  if (typeof hook.getConfig === 'function') {
    console.log('✓ getConfig function exported');
  } else {
    console.log('✗ getConfig not found or not a function');
    process.exit(1);
  }
  
  // Test 3: Load plugin.json
  console.log('\nTest 3: Loading plugin.json...');
  const pluginJson = require('./.claude-plugin/plugin.json');
  console.log('✓ plugin.json loaded successfully');
  console.log('  Plugin name:', pluginJson.name);
  console.log('  Plugin version:', pluginJson.version);
  console.log('  Hooks:', pluginJson.hooks.map(h => h.name).join(', '));

  if (pluginJson.name !== 'agent-callisto2') {
    console.log('✗ plugin.json name should be "agent-callisto2"');
    process.exit(1);
  }
  
  // Test 4: Load config.json
  console.log('\nTest 4: Loading config.json...');
  const config = require('./.claude-plugin/config.json');
  console.log('✓ config.json loaded successfully');
  console.log('  Enabled:', config.enabled);
  console.log('  Volume:', config.volume);
  console.log('  Audio provider:', config.audioProvider);

  // Verify new config fields
  if (!config.elevenlabs || !config.elevenlabs.voiceName) {
    console.log('✗ config.json missing elevenlabs configuration');
    process.exit(1);
  }
  console.log('  ElevenLabs voice:', config.elevenlabs.voiceName);

  if (!config.haptic) {
    console.log('✗ config.json missing haptic configuration');
    process.exit(1);
  }
  console.log('  Haptic device:', config.haptic.device);

  if (!config.localTts) {
    console.log('✗ config.json missing localTts configuration');
    process.exit(1);
  }
  console.log('  Local TTS engine:', config.localTts.engine);

  if (!config.preRecordedSamples) {
    console.log('✗ config.json missing preRecordedSamples configuration');
    process.exit(1);
  }
  console.log('  Pre-recorded samples dir:', config.preRecordedSamples.samplesDir);
  
  // Test 5: Check sound files
  console.log('\nTest 5: Checking sound files...');
  const fs = require('fs');
  const soundsDir = path.join(__dirname, 'sounds');
  const soundFiles = fs.readdirSync(soundsDir).filter(f => f.endsWith('.wav'));
  console.log(`✓ Found ${soundFiles.length} sound files`);

  // Test 6: Verify getConfig returns expected fields
  console.log('\nTest 6: Verifying getConfig...');
  const hookConfig = hook.getConfig();
  if (hookConfig.audioProvider !== undefined) {
    console.log('✓ getConfig returns audioProvider');
  } else {
    console.log('✗ getConfig missing audioProvider');
    process.exit(1);
  }
  
  console.log('\n✅ All tests passed!');
  console.log('\nThe plugin is ready to be used with Claude Code.');
  console.log('Install it by copying this directory to ~/.claude/plugins/agent-callisto2\n');
  
} catch (error) {
  console.error('✗ Test failed:', error.message);
  process.exit(1);
}
