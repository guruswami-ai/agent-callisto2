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
const { execFile } = require('child_process');

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
async function onStreamingResponse(context) {
  // Lazy initialization of sample players
  if (!audioPlayers) {
    audioPlayers = initializePlayers();
  }
  
  const { chunk, isComplete } = context;
  
  if (!config.enabled) {
    return;
  }

  // Haptic feedback on completion
  if (isComplete) {
    triggerHaptic('complete');
    return;
  }

  if (!chunk) {
    return;
  }

  // Haptic pulse on first response chunk
  if (chunk.length > 0) {
    triggerHaptic('response');
  }

  const provider = config.audioProvider || 'samples';

  if (provider === 'elevenlabs') {
    speakElevenLabs(chunk);
    return;
  }

  if (provider === 'local-tts') {
    speakLocalTts(chunk);
    return;
  }

  if (provider === 'prerecorded') {
    playPreRecordedSample();
    return;
  }

  // Default: built-in sample playback
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

/**
 * Get the current configuration (useful for programmatic access)
 */
function getConfig() {
  return { ...config };
}

// Export the hook
module.exports = {
  onStreamingResponse,
  setEnabled,
  getConfig,
};
