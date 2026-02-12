# Elevenlabs TTS Integration

This plugin now supports optional text-to-speech (TTS) using the Elevenlabs API to announce task completions and important status updates.

## Features

- **Non-blocking**: TTS runs in the background and doesn't delay terminal output
- **Optional**: Disabled by default, easily enabled via config
- **Smart summarization**: Only speaks short, relevant status messages (following "agent vibes" philosophy)
- **Selective announcements**: Filters notifications to avoid spam

## Configuration

Edit `.claude-plugin/config.json` to enable TTS:

```json
{
  "enabled": true,
  "volume": 0.2,
  "playOnStreamingOnly": true,
  "throttleMs": 10,
  "tts": {
    "enabled": true,                         // Enable TTS
    "apiKey": "your-elevenlabs-api-key",    // Your Elevenlabs API key
    "voiceId": "21m00Tcm4TlvDq8ikWAM",      // Voice ID (default: Rachel)
    "modelId": "eleven_monolingual_v1",      // Model ID
    "stability": 0.5,                        // Voice stability (0.0-1.0)
    "similarityBoost": 0.75,                // Voice similarity (0.0-1.0)
    "volume": 0.3                            // TTS volume (0.0-1.0)
  }
}
```

### Alternative: Environment Variable

Instead of putting your API key in the config file, you can set it as an environment variable:

```bash
export ELEVENLABS_API_KEY="your-elevenlabs-api-key"
```

## What Gets Announced

The TTS system follows the "agent vibes" philosophy of keeping announcements short and relevant. It only announces:

### Completion Events
- "Build succeeded"
- "Tests passed" (with count if available)
- "Deployment complete"
- "Code review completed"
- "Task completed"
- "Merge completed"

### Critical Events
- Error messages (shortened to first 50 characters)

### Approval Requests
- "Ready for review"
- "Approval required"

## How It Works

1. **Pattern Matching**: The system monitors streaming text for completion patterns
2. **Summarization**: Extracts a short, relevant summary (max ~100 chars)
3. **Non-blocking TTS**: Calls Elevenlabs API asynchronously in the background
4. **Audio Playback**: Plays the generated audio without interrupting workflow

## Anti-Spam Features

- **Cooldown Period**: 5 seconds between TTS announcements
- **Buffer Size**: Only monitors last 500 characters of output
- **Smart Filtering**: Only triggers on meaningful status messages

## Voice Selection

To use a different voice:

1. Visit [Elevenlabs Voice Library](https://elevenlabs.io/voice-library)
2. Choose a voice and copy its Voice ID
3. Update `voiceId` in your config

Popular voice IDs:
- `21m00Tcm4TlvDq8ikWAM` - Rachel (default, calm)
- `AZnzlk1XvdvUeBnXmlld` - Domi (strong)
- `EXAVITQu4vr4xnSDxMaL` - Bella (soft)
- `ErXwobaYiN019PkySvjV` - Antoni (well-rounded)

## Troubleshooting

**TTS not working?**
- Ensure `tts.enabled` is `true` in config.json
- Check that your API key is valid
- Verify you have API credits in your Elevenlabs account
- Check console for warning messages (search for `[hyper-robco]`)

**Audio not playing?**
- On Linux, ensure you have `mpg123` or `sox` installed
- On macOS, `afplay` should work by default
- In browser contexts, ensure audio autoplay is allowed

**Too many/few announcements?**
- Adjust the cooldown period in `hook.js` (default: 5000ms)
- Modify pattern matching to be more/less selective

## Privacy & Security

- TTS is **optional** and disabled by default
- API key is stored locally in config.json (never committed to git)
- Only short status summaries are sent to Elevenlabs (never full code or sensitive data)
- Audio is played locally after generation

## Cost Considerations

Elevenlabs API pricing (as of 2024):
- Free tier: 10,000 characters/month
- Creator: $5/month for 30,000 characters
- Independent Creator: $11/month for 100,000 characters

Average announcement is 10-30 characters, so the free tier supports ~300-1000 announcements/month.
