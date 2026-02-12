/**
 * Claude Code hook for playing Fallout-style terminal sounds
 * Plays keyboard sounds as Claude streams text responses
 */

const path = require('path');
const fs = require('fs');
const tts = require('./elevenlabs-tts');

// Get the root directory of the plugin
const pluginRoot = path.join(__dirname, '..');
const soundsPath = path.join(pluginRoot, 'sounds');
const configPath = path.join(__dirname, 'config.json');

// Load configuration
let config = {
  enabled: true,
  volume: 0.2,
  playOnStreamingOnly: true,
  throttleMs: 10
};

try {
  if (fs.existsSync(configPath)) {
    const configData = fs.readFileSync(configPath, 'utf8');
    config = { ...config, ...JSON.parse(configData) };
  }
} catch (err) {
  console.warn('Failed to load hyper-robco config:', err.message);
}

// Sound files configuration
const SOUND_FILES = {
  SINGLE: [
    'ui_hacking_charsingle_01.wav',
    'ui_hacking_charsingle_02.wav',
    'ui_hacking_charsingle_03.wav',
    'ui_hacking_charsingle_04.wav',
    'ui_hacking_charsingle_05.wav',
    'ui_hacking_charsingle_06.wav',
  ],
  ENTER: [
    'ui_hacking_charenter_01.wav',
    'ui_hacking_charenter_02.wav',
    'ui_hacking_charenter_03.wav',
  ],
};

let audioPlayers = null;
let lastSoundIndex = 0;

/**
 * Get file:// URL for a sound file
 */
function getSoundFileUrl(filename) {
  return 'file://' + path.join(soundsPath, filename).replace(/\\/g, '/');
}

/**
 * Initialize audio players
 * This should be called in a browser context
 */
function initializePlayers() {
  if (typeof Audio === 'undefined') {
    // Not in browser context, return dummy players
    return {
      SINGLE: SOUND_FILES.SINGLE.map(() => ({ play: () => Promise.resolve() })),
      ENTER: SOUND_FILES.ENTER.map(() => ({ play: () => Promise.resolve() })),
    };
  }

  return {
    SINGLE: SOUND_FILES.SINGLE.map(file => {
      const audio = new Audio(getSoundFileUrl(file));
      audio.volume = config.volume;
      return audio;
    }),
    ENTER: SOUND_FILES.ENTER.map(file => {
      const audio = new Audio(getSoundFileUrl(file));
      audio.volume = config.volume;
      return audio;
    }),
  };
}

/**
 * Get a random sound from the list, avoiding repetition
 */
function getRandomSound(soundList) {
  if (!soundList || soundList.length === 0) {
    return null;
  }
  
  let index = Math.floor(Math.random() * soundList.length);
  
  // Avoid playing the same sound twice in a row
  if (index === lastSoundIndex && soundList.length > 1) {
    index = (index + 1) % soundList.length;
  }
  
  lastSoundIndex = index;
  return soundList[index];
}

/**
 * Play a character sound
 */
function playCharSound() {
  if (!config.enabled || !audioPlayers) {
    return;
  }
  
  const sound = getRandomSound(audioPlayers.SINGLE);
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(() => {
      // Ignore errors (e.g., if user hasn't interacted with page yet)
    });
  }
}

/**
 * Play an enter/newline sound
 */
function playEnterSound() {
  if (!config.enabled || !audioPlayers) {
    return;
  }
  
  const sound = getRandomSound(audioPlayers.ENTER);
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(() => {
      // Ignore errors
    });
  }
}

/**
 * Hook handler for streaming responses
 * This is called for each chunk of text as Claude streams the response
 * 
 * @param {Object} context - Hook context with information about the response
 * @param {string} context.chunk - The text chunk being streamed
 * @param {boolean} context.isComplete - Whether this is the final chunk
 */
async function onStreamingResponse(context) {
  // Lazy initialization
  if (!audioPlayers) {
    audioPlayers = initializePlayers();
  }
  
  const { chunk, isComplete } = context;
  
  if (!chunk || !config.enabled) {
    return;
  }
  
  // Process text for notification patterns (TTS)
  processStreamingText(chunk);
  
  // Play sounds for each character in the chunk
  for (let i = 0; i < chunk.length; i++) {
    const char = chunk[i];
    
    // Play enter sound for newlines
    if (char === '\n') {
      playEnterSound();
    } else if (/\S/.test(char)) {
      // Play character sound for non-whitespace characters
      playCharSound();
    }
    
    // Add a small delay between sounds to avoid overwhelming
    if (i < chunk.length - 1) {
      await new Promise(resolve => setTimeout(resolve, config.throttleMs));
    }
  }
}

/**
 * Enable/disable the sound effects
 */
function setEnabled(enabled) {
  config.enabled = enabled;
}

// Pattern categories for detecting completion events (inspired by Agent Vibes)
const PATTERN_CATEGORIES = {
  CRITICAL: [
    /error/i,
    /failed/i,
    /failure/i,
    /fatal/i
  ],
  COMPLETION: [
    /completed/i,
    /succeeded/i,
    /successful/i,
    /tests? passed/i,
    /build succeeded/i,
    /deployment complete/i,
    /code review completed/i,
    /review completed/i,
    /task completed/i,
    /merge completed/i,
    /successfully merged/i
  ],
  APPROVAL: [
    /approval (required|requested)/i,
    /ready for review/i,
    /waiting for approval/i
  ]
};

// Track recent notifications to avoid spam
let lastTTSTime = 0;
const TTS_COOLDOWN = 5000; // 5 seconds between TTS announcements

/**
 * Detect if text contains a notification pattern
 * @param {string} text - Text to check
 * @returns {string|null} - Category name if match found, null otherwise
 */
function detectNotificationCategory(text) {
  for (const [category, patterns] of Object.entries(PATTERN_CATEGORIES)) {
    if (patterns.some(pattern => pattern.test(text))) {
      return category;
    }
  }
  return null;
}

/**
 * Check if TTS should be triggered for this text
 * @param {string} text - Text to analyze
 * @returns {boolean}
 */
function shouldTriggerTTS(text) {
  if (!config.tts || !config.tts.enabled) {
    return false;
  }
  
  const now = Date.now();
  if (now - lastTTSTime < TTS_COOLDOWN) {
    return false;
  }
  
  const category = detectNotificationCategory(text);
  if (category) {
    lastTTSTime = now;
    return true;
  }
  
  return false;
}

// Buffer to accumulate text for pattern matching
let outputBuffer = '';
const BUFFER_SIZE = 500; // Keep last 500 characters

/**
 * Hook handler for completion events
 * This can be called when tasks complete to trigger TTS
 * 
 * @param {Object} context - Hook context with completion information
 * @param {string} context.message - The completion message
 * @param {string} context.status - The status (success, error, etc.)
 */
async function onCompletion(context) {
  if (!config.tts || !config.tts.enabled) {
    return;
  }
  
  const { message, status } = context;
  
  // Determine category based on status
  let category = 'COMPLETION';
  if (status === 'error' || status === 'failed') {
    category = 'CRITICAL';
  } else if (status === 'approval_needed' || status === 'review_needed') {
    category = 'APPROVAL';
  }
  
  // Trigger TTS in non-blocking way
  if (message) {
    tts.speakNotification(message, category, config);
  }
}

/**
 * Process streamed text for notification patterns
 * This monitors streaming output for completion patterns
 * 
 * @param {string} text - Text chunk to process
 */
function processStreamingText(text) {
  if (!text || !config.tts || !config.tts.enabled) {
    return;
  }
  
  // Append to buffer
  outputBuffer += text;
  
  // Keep buffer size manageable
  if (outputBuffer.length > BUFFER_SIZE) {
    outputBuffer = outputBuffer.slice(-BUFFER_SIZE);
  }
  
  // Check for notification patterns
  if (shouldTriggerTTS(outputBuffer)) {
    const category = detectNotificationCategory(outputBuffer);
    if (category) {
      // Trigger TTS in non-blocking way
      tts.speakNotification(outputBuffer, category, config);
    }
  }
}

// Export the hook
module.exports = {
  onStreamingResponse,
  onCompletion,
  setEnabled,
  processStreamingText
};
