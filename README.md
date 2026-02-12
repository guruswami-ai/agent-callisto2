# Agent Callisto2

A Claude CLI plugin that provides audio and haptic feedback for response status — similar in spirit to [Agent Vibes](https://github.com/mberman84/agent-vibes). It features a custom ElevenLabs voice (Callisto2) and haptic feedback through the Logitech MX Master 4 mouse. These hardware-specific requirements are unique to the developer, but the code is designed to be extended with local TTS engines or pre-recorded audio samples.

## Features

- 🎙️ **ElevenLabs TTS** – Custom Callisto2 voice ID for spoken feedback on Claude CLI responses
- 🖱️ **Haptic Feedback** – Logitech MX Master 4 integration for tactile response status cues
- 🔊 **Built-in Sample Sounds** – Keystroke audio effects while Claude streams responses
- 🗣️ **Local TTS Support** – Extensible to Piper, macOS Say, or other local TTS engines
- 🎵 **Pre-recorded Samples** – Support for pre-recorded Callisto2 voice clips for non-blocking feedback
- 🎚️ **Verbosity Levels** – Off / Minimal / Normal / Verbose notification control
- 🔌 **Claude CLI Plugin** – Hooks into Claude Code's streaming response system

## Audio Providers

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
  "enabled": true,
  "volume": 0.2,
  "playOnStreamingOnly": true,
  "throttleMs": 10,
  "audioProvider": "samples",
  "elevenlabs": {
    "apiKey": "",
    "voiceId": "",
    "modelId": "eleven_monolingual_v1",
    "voiceName": "Callisto2"
  },
  "haptic": {
    "enabled": false,
    "device": "logitech-mx-master-4",
    "onResponse": true,
    "onComplete": true,
    "onError": true
  },
  "localTts": {
    "enabled": false,
    "engine": "piper",
    "voice": "default"
  },
  "preRecordedSamples": {
    "enabled": false,
    "samplesDir": "samples/callisto2"
  }
}
```

### ElevenLabs Setup

1. Obtain an API key from [ElevenLabs](https://elevenlabs.io).
2. Create or select a custom voice (the project uses a voice named **Callisto2**).
3. Set `audioProvider` to `"elevenlabs"` and fill in `elevenlabs.apiKey` and `elevenlabs.voiceId`.

### Haptic Feedback Setup

Haptic feedback is triggered via an external `logitech-haptic` CLI utility that communicates with the Logitech MX Master 4 mouse. The utility is user-supplied.

Events that trigger haptic pulses:
- **response** – first chunk of a streaming response arrives
- **complete** – response is fully streamed
- **error** – an error pattern is detected

### Local TTS

Set `audioProvider` to `"local-tts"` and configure the engine:

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

GPL-3.0
