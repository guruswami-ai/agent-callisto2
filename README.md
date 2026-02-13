# Agent Callisto 2 - Terminal Sound Effects Plugin

Add Fallout terminal sound effects to your terminal or AI assistant! This plugin brings the iconic keyboard sounds from [Fallout](https://en.wikipedia.org/wiki/Fallout_(series)) [3](https://en.wikipedia.org/wiki/Fallout_3)/[NV](https://en.wikipedia.org/wiki/Fallout:_New_Vegas) to your computing experience.

## Features

- 🎮 Authentic Fallout terminal keyboard sounds
- 🤖 **NEW**: Claude Code plugin support - hear keystrokes as Claude streams responses
- 🔊 **NEW**: Optional Elevenlabs TTS integration for voice announcements of task completions
- 🖥️ Original Hyper terminal extension support (currently broken due to xterm.js migration)
- 🔔 **NEW**: Intelligent status notification sounds with verbosity control
- 🎛️ Configurable sound volume and behavior

Agent Callisto2 supports multiple audio providers, configured via `audioProvider` in `.claude-plugin/config.json`:

| Provider       | Description                                              | Blocking? |
|---------------|----------------------------------------------------------|-----------|
| `samples`      | Built-in WAV keystroke sounds (default)                 | No        |
| `elevenlabs`   | ElevenLabs TTS with custom Callisto2 voice              | No        |
| `local-tts`    | Local TTS engine (Piper, macOS Say, etc.)               | No        |
| `prerecorded`  | Pre-recorded Callisto2 voice clips                      | No        |

## Install

### Claude Code Plugin

1. Clone this repository into your Claude Code plugins directory:
   ```bash
   git clone https://github.com/guruswami-ai/agent-callisto2 ~/.claude/plugins/agent-callisto2
   ```

2. The plugin will be automatically detected by Claude Code on restart.

3. Audio feedback will play as Claude streams responses in real-time.

## Configuration

Edit `.claude-plugin/config.json` to customise behaviour:

```json
{
  "enabled": true,          // Enable/disable sound effects
  "volume": 0.2,            // Volume level (0.0 to 1.0)
  "playOnStreamingOnly": true,  // Only play during streaming (not on finished responses)
  "throttleMs": 10,         // Delay between character sounds in milliseconds
  "tts": {
    "enabled": false,       // Enable Elevenlabs TTS for status announcements
    "apiKey": "",           // Your Elevenlabs API key (or use ELEVENLABS_API_KEY env var)
    "voiceId": "21m00Tcm4TlvDq8ikWAM",  // Voice ID (default: Rachel)
    "volume": 0.3           // TTS volume level (0.0 to 1.0)
  }
}
```

##### Text-to-Speech (TTS) Feature

**NEW**: Optional Elevenlabs TTS integration for announcing task completions! 

- **Non-blocking**: Announcements happen in the background without delaying output
- **Smart**: Only speaks short, relevant summaries (following "agent vibes" philosophy)
- **Optional**: Disabled by default - enable in config when you want it

See [.claude-plugin/TTS_README.md](.claude-plugin/TTS_README.md) for detailed TTS setup and configuration.


#### How It Works

### Haptic Feedback Setup

Haptic feedback is triggered via an external `logitech-haptic` CLI utility that communicates with the Logitech MX Master 4 mouse. The utility is user-supplied.

Events that trigger haptic pulses:
- **response** – first chunk of a streaming response arrives
- **complete** – response is fully streamed
- **error** – an error pattern is detected

### Local TTS

**No sounds playing?**
- Make sure the plugin is installed in the correct directory (`~/.claude/plugins/agent-callisto2`)
- Check that `config.json` has `"enabled": true`
- Restart Claude Code after installation
- Ensure your browser allows audio playback (some browsers require user interaction first)

```json
{
  "audioProvider": "local-tts",
  "localTts": {
    "enabled": true,
    "engine": "say",
    "voice": "Samantha"
  }
}
```

Supported engines: any CLI tool that accepts `--voice` and `--text` flags, plus macOS `say`.

### Pre-recorded Callisto2 Samples

Place `.wav`, `.mp3`, or `.ogg` files in the `samples/callisto2/` directory and set:

```json
{
  "audioProvider": "prerecorded",
  "preRecordedSamples": {
    "enabled": true,
    "samplesDir": "samples/callisto2"
  }
}
```

A random clip is selected for each response chunk, providing non-blocking audio feedback.

## How It Works

The plugin uses Claude Code's hook system to intercept streaming responses. As each chunk is streamed from Claude, the configured audio provider plays feedback and (optionally) haptic events are triggered on the Logitech MX Master 4.

### Status Notification Sounds

Audio notifications play when certain status messages appear in the terminal output, such as:
- Code review completed
- Build succeeded / successful
- Tests passed
- Deployment successful / complete
- Ready for review
- Approval required / requested
- Merge completed
- Operation completed

#### Verbosity Levels (Inspired by Agent Vibes TTS)
- **Off**: No audio notifications
- **Minimal**: Only critical events (errors, major completions like builds and tests)
- **Normal**: All status messages (default)
- **Verbose**: Extended pattern matching for comprehensive notifications

## Roadmap

- [ ] Extensive library of pre-recorded Callisto2 voice clips for fully non-blocking feedback
- [ ] Local TTS integration with Piper for offline voice synthesis
- [ ] Configurable haptic patterns per event type
- [ ] Web UI for configuration management
- [ ] Per-category volume control

## Testing

```bash
npm test
```

This checks that all required files are present, configuration is valid, and exports are correct.

## Legacy – Hyper Terminal Extension

The original Hyper terminal extension code is retained in `index.js` for reference but is no longer actively maintained. See the `.claude-plugin/` directory for the current Claude CLI plugin implementation.

## License

You need to `git clone` this repository into `~/.hyper_plugins/local/agent-callisto2` and add `agent-callisto2` to `localPlugins` in `.hyper.js`.
