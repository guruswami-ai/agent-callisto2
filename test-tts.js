#!/usr/bin/env node
/**
 * Test the Elevenlabs TTS integration
 */

const path = require('path');
const tts = require('./.claude-plugin/elevenlabs-tts');

console.log('Testing Elevenlabs TTS Integration...\n');

// Test 1: extractTTSSummary function
console.log('Test 1: TTS Summary Extraction');
const testCases = [
  {
    text: 'Build succeeded with 247 tests passed',
    category: 'COMPLETION',
    expected: 'Build succeeded'
  },
  {
    text: 'All 42 tests passed successfully!',
    category: 'COMPLETION',
    expected: '42 tests passed'
  },
  {
    text: 'Error: Cannot find module "missing-package"',
    category: 'CRITICAL',
    expected: 'Error: Cannot find module "missing-package"'
  },
  {
    text: 'Code review completed successfully',
    category: 'COMPLETION',
    expected: 'Code review completed'
  },
  {
    text: 'Deployment complete to production',
    category: 'COMPLETION',
    expected: 'Deployment complete'
  },
  {
    text: 'Ready for review - please approve',
    category: 'APPROVAL',
    expected: 'Ready for review'
  },
  {
    text: 'Approval required for merge',
    category: 'APPROVAL',
    expected: 'Approval required'
  },
  {
    text: 'Task completed successfully',
    category: 'COMPLETION',
    expected: 'Task completed'
  },
  {
    text: 'Successfully merged pull request #42',
    category: 'COMPLETION',
    expected: 'Merge completed'
  }
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const summary = tts.extractTTSSummary(testCase.text, testCase.category);
  const success = summary.toLowerCase().includes(testCase.expected.toLowerCase()) ||
                  testCase.expected.toLowerCase().includes(summary.toLowerCase());
  
  if (success) {
    console.log(`  ✓ Test ${index + 1}: "${testCase.text.substring(0, 40)}..." → "${summary}"`);
    passed++;
  } else {
    console.log(`  ✗ Test ${index + 1}: Expected "${testCase.expected}" but got "${summary}"`);
    failed++;
  }
});

console.log(`\nSummary extraction: ${passed}/${testCases.length} tests passed`);

// Test 2: Module exports
console.log('\nTest 2: Module Exports');
if (typeof tts.speakNotification === 'function') {
  console.log('  ✓ speakNotification function exported');
} else {
  console.log('  ✗ speakNotification not found');
  failed++;
}

if (typeof tts.extractTTSSummary === 'function') {
  console.log('  ✓ extractTTSSummary function exported');
} else {
  console.log('  ✗ extractTTSSummary not found');
  failed++;
}

if (typeof tts.speakText === 'function') {
  console.log('  ✓ speakText function exported');
} else {
  console.log('  ✗ speakText not found');
  failed++;
}

// Test 3: Hook integration
console.log('\nTest 3: Hook Integration');
const hook = require('./.claude-plugin/hook.js');

if (typeof hook.onCompletion === 'function') {
  console.log('  ✓ onCompletion hook exported');
} else {
  console.log('  ✗ onCompletion hook not found');
  failed++;
}

if (typeof hook.processStreamingText === 'function') {
  console.log('  ✓ processStreamingText function exported');
} else {
  console.log('  ✗ processStreamingText not found');
  failed++;
}

// Test 4: Config validation
console.log('\nTest 4: Configuration');
const config = require('./.claude-plugin/config.json');

if (config.tts) {
  console.log('  ✓ TTS configuration section present');
  
  if (typeof config.tts.enabled === 'boolean') {
    console.log(`  ✓ TTS enabled flag: ${config.tts.enabled}`);
  } else {
    console.log('  ✗ TTS enabled flag missing or invalid');
    failed++;
  }
  
  if (config.tts.voiceId) {
    console.log(`  ✓ Voice ID configured: ${config.tts.voiceId}`);
  } else {
    console.log('  ⚠ Voice ID not set (will use default)');
  }
  
  if (typeof config.tts.volume === 'number') {
    console.log(`  ✓ TTS volume: ${config.tts.volume}`);
  } else {
    console.log('  ⚠ TTS volume not set (will use default)');
  }
} else {
  console.log('  ✗ TTS configuration section missing');
  failed++;
}

// Final results
console.log('\n' + '='.repeat(50));
if (failed === 0) {
  console.log('✅ All TTS tests passed!');
  console.log('\nTo enable TTS:');
  console.log('1. Get an Elevenlabs API key from https://elevenlabs.io');
  console.log('2. Set ELEVENLABS_API_KEY environment variable, or');
  console.log('3. Add your API key to .claude-plugin/config.json');
  console.log('4. Set "tts.enabled": true in config.json');
  process.exit(0);
} else {
  console.log(`❌ ${failed} test(s) failed`);
  process.exit(1);
}
