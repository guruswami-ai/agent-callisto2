/**
 * Claude Code hook for playing Fallout-style terminal sounds
 * Plays keyboard sounds as Claude streams text responses
 */

const path = require('path');
const fs = require('fs');

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
  
  let newIndex = Math.floor(Math.random() * soundList.length);
  
  // Avoid playing the same sound twice in a row
  if (newIndex === lastSoundIndex && soundList.length > 1) {
    newIndex = (newIndex + 1) % soundList.length;
  }
  
  lastSoundIndex = newIndex;
  return soundList[newIndex];
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
  
  // Play sounds for each character in the chunk
  for (let i = 0; i < chunk.length; i++) {
    const char = chunk[i];
    
    // Play enter sound for newlines
    if (char === '\n') {
      playEnterSound();
    } else if (char.trim() !== '') {
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

// Export the hook
module.exports = {
  onStreamingResponse,
  setEnabled,
};
