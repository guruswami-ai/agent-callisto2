/**
 * Agent Callisto2 - Claude CLI plugin hook
 * Provides audio and haptic feedback as Claude streams responses.
 *
 * Audio providers:
 *   - "samples"    : Built-in WAV samples (default, non-blocking)
 *   - "elevenlabs" : ElevenLabs TTS with custom Callisto2 voice ID
 *   - "local-tts"  : Local TTS engine (e.g. Piper, macOS Say)
 *   - "prerecorded": Pre-recorded Callisto2 voice clips
 *
 * Haptic feedback:
 *   Integrates with Logitech MX Master 4 mouse via logitech-haptic
 *   utility (user-supplied). Pulses on response, completion, and error events.
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
  throttleMs: 10,
  audioProvider: 'samples',
  elevenlabs: {
    apiKey: '',
    voiceId: '',
    modelId: 'eleven_monolingual_v1',
    voiceName: 'Callisto2'
  },
  haptic: {
    enabled: false,
    device: 'logitech-mx-master-4',
    onResponse: true,
    onComplete: true,
    onError: true
  },
  localTts: {
    enabled: false,
    engine: 'piper',
    voice: 'default'
  },
  preRecordedSamples: {
    enabled: false,
    samplesDir: 'samples/callisto2'
  }
};

try {
  if (fs.existsSync(configPath)) {
    const configData = fs.readFileSync(configPath, 'utf8');
    config = { ...config, ...JSON.parse(configData) };
  }
} catch (err) {
  console.warn('Failed to load agent-callisto2 config:', err.message);
}

// Sound files configuration (default built-in samples)
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
let hapticResponseTriggered = false;

/**
 * Get file:// URL for a sound file
 */
function getSoundFileUrl(filename) {
  return 'file://' + path.join(soundsPath, filename).replace(/\\/g, '/');
}

/**
 * Initialize audio players for the default "samples" provider
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

// ---------------------------------------------------------------------------
// Audio provider: ElevenLabs TTS
// Uses the ElevenLabs API to synthesise speech with a custom Callisto2 voice.
// Requires config.elevenlabs.apiKey and config.elevenlabs.voiceId to be set.
// ---------------------------------------------------------------------------

/**
 * Speak text via ElevenLabs TTS (non-blocking fire-and-forget).
 * Returns immediately; audio playback happens asynchronously.
 */
function speakElevenLabs(text) {
  if (!config.elevenlabs.apiKey || !config.elevenlabs.voiceId) {
    return;
  }
  const voiceId = config.elevenlabs.voiceId;
  const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;

  // Fire-and-forget – we deliberately do not await the fetch so that
  // streaming is not blocked while the TTS request is in flight.
  try {
    const https = require('https');
    const postData = JSON.stringify({
      text,
      model_id: config.elevenlabs.modelId || 'eleven_monolingual_v1',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    });

    const urlObj = new URL(apiUrl);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': config.elevenlabs.apiKey,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, () => {
      // Response handling is intentionally minimal – this is fire-and-forget
    });
    req.on('error', () => {
      // Silently ignore network errors to avoid disrupting the CLI
    });
    req.write(postData);
    req.end();
  } catch (_) {
    // Ignore errors
  }
}

// ---------------------------------------------------------------------------
// Audio provider: Local TTS
// Shells out to a local TTS engine (e.g. piper, say on macOS).
// ---------------------------------------------------------------------------

function speakLocalTts(text) {
  const engine = config.localTts.engine || 'piper';
  const voice = config.localTts.voice || 'default';

  try {
    if (engine === 'say') {
      // macOS built-in TTS
      execFile('say', ['-v', voice, text], () => {});
    } else {
      // Generic TTS command (e.g. piper)
      execFile(engine, ['--voice', voice, '--text', text], () => {});
    }
  } catch (_) {
    // Ignore errors
  }
}

// ---------------------------------------------------------------------------
// Audio provider: Pre-recorded Callisto2 samples
// Plays random clips from a directory of pre-recorded audio files.
// ---------------------------------------------------------------------------

let preRecordedFiles = null;

function getPreRecordedFiles() {
  if (preRecordedFiles !== null) {
    return preRecordedFiles;
  }
  const dir = path.resolve(pluginRoot, config.preRecordedSamples.samplesDir || 'samples/callisto2');
  try {
    if (fs.existsSync(dir)) {
      preRecordedFiles = fs.readdirSync(dir).filter(f => /\.(wav|mp3|ogg)$/i.test(f));
    } else {
      preRecordedFiles = [];
    }
  } catch (_) {
    preRecordedFiles = [];
  }
  return preRecordedFiles;
}

function playPreRecordedSample() {
  const files = getPreRecordedFiles();
  if (files.length === 0) return;

  const file = files[Math.floor(Math.random() * files.length)];
  const filePath = path.resolve(pluginRoot, config.preRecordedSamples.samplesDir || 'samples/callisto2', file);

  if (typeof Audio !== 'undefined') {
    const audio = new Audio('file://' + filePath.replace(/\\/g, '/'));
    audio.volume = config.volume;
    audio.play().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Haptic feedback – Logitech MX Master 4 integration
// Calls an external `logitech-haptic` utility to trigger mouse rumble.
// Users must provide the utility; this is a no-op when not available.
// ---------------------------------------------------------------------------

function triggerHaptic(event) {
  if (!config.haptic.enabled) return;

  const shouldTrigger =
    (event === 'response' && config.haptic.onResponse) ||
    (event === 'complete' && config.haptic.onComplete) ||
    (event === 'error' && config.haptic.onError);

  if (!shouldTrigger) return;

  try {
    execFile('logitech-haptic', ['--device', config.haptic.device, '--event', event], () => {});
  } catch (_) {
    // Silently ignore – haptic utility may not be installed
  }
}

// ---------------------------------------------------------------------------
// Core sound playback helpers
// ---------------------------------------------------------------------------

/**
 * Play a character sound (default samples provider)
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
 * Play an enter/newline sound (default samples provider)
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

// ---------------------------------------------------------------------------
// Hook handler
// ---------------------------------------------------------------------------

/**
 * Hook handler for streaming responses.
 * Called for each chunk of text as Claude streams the response.
 *
 * Depending on config.audioProvider the handler will:
 *   - "samples"    : play built-in WAV keystroke samples
 *   - "elevenlabs" : send the chunk to ElevenLabs TTS
 *   - "local-tts"  : speak via a local TTS engine
 *   - "prerecorded": play a random pre-recorded Callisto2 clip
 *
 * Haptic feedback is triggered on first chunk and on completion.
 * 
 * @param {Object} context - Hook context with information about the response
 * @param {string} context.chunk - The text chunk being streamed
 * @param {boolean} context.isComplete - Whether this is the final chunk
 */
function onStreamingResponse(context) {
  // Lazy initialization
  if (!audioPlayers) {
    audioPlayers = initializePlayers();
  }
  
  const { chunk, isComplete } = context;
  
  if (!config.enabled) {
    return;
  }
  
  // Play sounds for each character in the chunk asynchronously
  // without blocking the streaming response
  let delay = 0;
  for (let i = 0; i < chunk.length; i++) {
    const char = chunk[i];
    
    // Schedule sound playback without blocking
    // Use IIFE to capture char value correctly for each iteration
    ((currentChar) => {
      setTimeout(() => {
        // Play enter sound for newlines
        if (currentChar === '\n') {
          playEnterSound();
        } else if (/\S/.test(currentChar)) {
          // Play character sound for non-whitespace characters
          playCharSound();
        }
      }, delay);
    })(char);
    
    // Increment delay for next character
    delay += config.throttleMs;
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
