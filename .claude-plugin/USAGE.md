# Agent Callisto 2 Claude Code Plugin

Example usage and integration guide.

## Plugin Structure

```
agent-callisto2/
├── .claude-plugin/
│   ├── plugin.json       # Plugin manifest
│   ├── config.json       # User configuration (audio provider, haptic, TTS)
│   └── hook.js           # Hook implementation
├── sounds/               # Built-in sound effect files
│   ├── ui_hacking_charsingle_*.wav
│   └── ui_hacking_charenter_*.wav
├── samples/              # (Optional) Pre-recorded Callisto2 voice clips
│   └── callisto2/
├── index.js              # Legacy Hyper terminal plugin
├── package.json
└── README.md
```

## Hook System

The plugin uses Claude Code's hook system with the `onStreamingResponse` hook:

```javascript
// Called for each chunk of text as Claude streams
async function onStreamingResponse(context) {
  const { chunk, isComplete } = context;

  // Trigger haptic feedback on completion
  if (isComplete) {
    triggerHaptic('complete');
    return;
  }

  // Play audio via the configured provider
  // Providers: samples, elevenlabs, local-tts, prerecorded
}
```

## Audio Providers

### Built-in Samples (default)
Plays WAV keystroke sounds character by character.

### ElevenLabs TTS
Sends chunks to the ElevenLabs API using a custom Callisto2 voice ID.

### Local TTS
Shells out to a local TTS engine like Piper or macOS `say`.

### Pre-recorded Callisto2
Plays random clips from `samples/callisto2/`.

## Haptic Feedback

Integrates with the Logitech MX Master 4 via a `logitech-haptic` CLI utility:
- `response` – pulse on first chunk
- `complete` – pulse on completion
- `error` – pulse on error detection

## Programmatic Control

```javascript
const callisto2 = require('./hook');

// Enable/disable sounds
callisto2.setEnabled(false);
callisto2.setEnabled(true);

// Read current configuration
const config = callisto2.getConfig();
```

## Integration with Other Plugins

This plugin works alongside other Claude Code plugins. It only hooks into the streaming response system and doesn't modify actual content.
