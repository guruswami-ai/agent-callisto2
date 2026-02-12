/**
 * Elevenlabs TTS Integration for Hyper-RobCo
 * 
 * Provides text-to-speech functionality using the Elevenlabs API.
 * - Non-blocking: TTS runs in background without delaying output
 * - Optional: Can be enabled/disabled via config
 * - Smart summarization: Only speaks short, relevant status messages
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Extract a short, relevant summary from notification text
 * This follows the "agent vibes" philosophy of keeping TTS concise
 * 
 * @param {string} text - The full notification text
 * @param {string} category - The category of notification (CRITICAL, COMPLETION, APPROVAL)
 * @returns {string} - A short summary suitable for TTS
 */
function extractTTSSummary(text, category) {
  // Remove ANSI escape codes and control characters
  const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '').replace(/[\r\n]+/g, ' ').trim();
  
  // For critical errors, extract just the error type
  if (category === 'CRITICAL') {
    const errorMatch = cleanText.match(/(error|failed|failure|fatal)[:\s]*(.*?)(?:[\.\n]|$)/i);
    if (errorMatch && errorMatch[2] && errorMatch[2].trim()) {
      return `Error: ${errorMatch[2].trim().substring(0, 50)}`;
    }
    return 'Error occurred';
  }
  
  // For completions, create a concise success message
  if (category === 'COMPLETION') {
    if (/build.*succeed/i.test(cleanText)) {
      return 'Build succeeded';
    }
    if (/test.*pass/i.test(cleanText)) {
      const match = cleanText.match(/(\d+)\s+test/i);
      if (match) {
        return `${match[1]} tests passed`;
      }
      return 'Tests passed';
    }
    if (/deployment.*complete/i.test(cleanText)) {
      return 'Deployment complete';
    }
    if (/code review.*complete/i.test(cleanText)) {
      return 'Code review completed';
    }
    if (/review.*complete/i.test(cleanText)) {
      return 'Review completed';
    }
    if (/task.*complete/i.test(cleanText)) {
      return 'Task completed';
    }
    if (/merge.*complete/i.test(cleanText) || /successfully merged/i.test(cleanText)) {
      return 'Merge completed';
    }
    return 'Operation completed';
  }
  
  // For approval requests
  if (category === 'APPROVAL') {
    if (/ready for review/i.test(cleanText)) {
      return 'Ready for review';
    }
    if (/approval.*required/i.test(cleanText) || /approval.*requested/i.test(cleanText)) {
      return 'Approval required';
    }
    return 'Action needed';
  }
  
  // Fallback: take first sentence, max 100 chars
  const firstSentence = cleanText.split(/[.!?]/)[0];
  return firstSentence.substring(0, 100);
}

/**
 * Speak text using Elevenlabs API
 * This is non-blocking and will not delay terminal output
 * 
 * @param {string} text - The text to speak
 * @param {Object} config - Configuration object with API settings
 * @returns {Promise<void>} - Resolves when TTS completes (but doesn't block caller)
 */
async function speakText(text, config) {
  if (!config || !config.tts || !config.tts.enabled) {
    return;
  }
  
  const apiKey = config.tts.apiKey || process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.warn('[hyper-robco] Elevenlabs TTS enabled but no API key found');
    return;
  }
  
  const voiceId = config.tts.voiceId || '21m00Tcm4TlvDq8ikWAM'; // Default voice (Rachel)
  const modelId = config.tts.modelId || 'eleven_monolingual_v1';
  
  // Prepare the request data
  const postData = JSON.stringify({
    text: text,
    model_id: modelId,
    voice_settings: {
      stability: config.tts.stability || 0.5,
      similarity_boost: config.tts.similarityBoost || 0.75
    }
  });
  
  const options = {
    hostname: 'api.elevenlabs.io',
    port: 443,
    path: `/v1/text-to-speech/${voiceId}`,
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Accept': 'audio/mpeg'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        console.warn(`[hyper-robco] Elevenlabs API returned status ${res.statusCode}`);
        resolve(); // Don't reject - just skip TTS
        return;
      }
      
      // Collect audio data
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        try {
          const audioBuffer = Buffer.concat(chunks);
          playAudioBuffer(audioBuffer, config.tts.volume || 0.2);
          resolve();
        } catch (error) {
          console.warn('[hyper-robco] Failed to play TTS audio:', error.message);
          resolve(); // Don't reject - just skip
        }
      });
    });
    
    req.on('error', (error) => {
      console.warn('[hyper-robco] Elevenlabs API request failed:', error.message);
      resolve(); // Don't reject - TTS is optional
    });
    
    // Set a timeout to prevent hanging
    req.setTimeout(10000, () => {
      req.destroy();
      console.warn('[hyper-robco] Elevenlabs API request timed out');
      resolve();
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * Play audio buffer in browser context
 * This function handles both Node.js and browser environments
 * 
 * @param {Buffer} audioBuffer - The audio data
 * @param {number} volume - Volume level (0.0 to 1.0)
 */
function playAudioBuffer(audioBuffer, volume = 0.2) {
  // Check if we're in a browser context
  if (typeof Audio === 'undefined' || typeof Blob === 'undefined') {
    // Not in browser - save to temp file and try to play with system command
    const tempFile = path.join('/tmp', `tts-${Date.now()}.mp3`);
    try {
      fs.writeFileSync(tempFile, audioBuffer);
      
      // Try to play using available system commands based on platform
      const { exec } = require('child_process');
      const os = require('os');
      const platform = os.platform();
      
      let playCommand;
      if (platform === 'darwin') {
        // macOS - afplay supports MP3
        playCommand = `afplay "${tempFile}"`;
      } else if (platform === 'win32') {
        // Windows - use PowerShell with Windows Media Player COM object for MP3 support
        playCommand = `powershell -c "$player = New-Object -ComObject WMPlayer.OCX; $player.URL = '${tempFile}'; $player.controls.play(); Start-Sleep -Seconds 5"`;
      } else {
        // Linux - check for available players and use the first one found
        // First, try to detect which player is available
        const { execSync } = require('child_process');
        let foundPlayer = false;
        
        try {
          execSync('command -v mpg123 >/dev/null 2>&1');
          playCommand = `mpg123 -q "${tempFile}"`;
          foundPlayer = true;
        } catch (e) {
          try {
            execSync('command -v play >/dev/null 2>&1');
            playCommand = `play -q "${tempFile}"`;
            foundPlayer = true;
          } catch (e2) {
            try {
              execSync('command -v ffplay >/dev/null 2>&1');
              playCommand = `ffplay -nodisp -autoexit -v quiet "${tempFile}"`;
              foundPlayer = true;
            } catch (e3) {
              // No suitable player found
              console.warn('[hyper-robco] TTS audio playback not available: no suitable audio player found (install mpg123, sox, or ffmpeg)');
              // Clean up temp file
              try {
                fs.unlinkSync(tempFile);
              } catch (e) {
                // Ignore
              }
              return;
            }
          }
        }
      }
      
      exec(playCommand, (error) => {
        // Clean up temp file after playback attempt
        setTimeout(() => {
          try {
            fs.unlinkSync(tempFile);
          } catch (e) {
            // Ignore cleanup errors
          }
        }, 5000);
        
        if (error && !error.message.includes('command not found')) {
          console.warn('[hyper-robco] Audio playback failed:', error.message);
        }
      });
    } catch (error) {
      console.warn('[hyper-robco] Failed to play TTS audio:', error.message);
    }
    return;
  }
  
  // Browser context - use Web Audio API
  try {
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = volume;
    
    audio.addEventListener('ended', () => {
      URL.revokeObjectURL(url);
    });
    
    audio.play().catch((error) => {
      console.warn('[hyper-robco] Audio playback failed:', error.message);
      URL.revokeObjectURL(url);
    });
  } catch (error) {
    console.warn('[hyper-robco] Failed to create audio from buffer:', error.message);
  }
}

/**
 * Non-blocking TTS handler
 * Schedules TTS in the background without blocking the caller
 * 
 * @param {string} text - The full notification text
 * @param {string} category - The notification category
 * @param {Object} config - Configuration object
 */
function speakNotification(text, category, config) {
  // Run TTS asynchronously without blocking
  setImmediate(async () => {
    try {
      const summary = extractTTSSummary(text, category);
      
      // Only speak if we have a meaningful summary
      if (summary && summary.length > 0) {
        await speakText(summary, config);
      }
    } catch (error) {
      console.warn('[hyper-robco] TTS error:', error.message);
    }
  });
}

module.exports = {
  speakNotification,
  extractTTSSummary,
  speakText
};
