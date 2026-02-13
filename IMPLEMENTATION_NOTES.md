# Agent Callisto2 – Implementation Notes

## Overview
This implementation adds audio notifications to the Agent Callisto 2 terminal plugin for status updates and completion messages. The system is designed to provide unobtrusive audio feedback for important terminal events without overwhelming the user.

## Architecture

### Audio Providers
The plugin supports four audio providers, configured via `audioProvider` in `config.json`:

1. **samples** (default) – Plays built-in WAV keystroke sound effects per character.
2. **elevenlabs** – Sends text chunks to the ElevenLabs TTS API using a custom Callisto2 voice ID. Non-blocking (fire-and-forget HTTPS requests).
3. **local-tts** – Shells out to a local TTS engine (e.g. Piper, macOS `say`). Non-blocking via `execFile`.
4. **prerecorded** – Plays random clips from a directory of pre-recorded Callisto2 voice samples. Non-blocking.

### Haptic Feedback
The plugin calls an external `logitech-haptic` CLI utility to trigger vibration on the Logitech MX Master 4 mouse. Events:
- `response` – first chunk of a streaming response
- `complete` – response finished streaming
- `error` – error pattern detected

Haptic feedback is always non-blocking (fire-and-forget `execFile`).

### Anti-Spam Measures
1. **Cooldown Timer**: 3-second delay between notifications prevents rapid-fire sounds
2. **Buffer Management**: Only keeps the last 500 characters of terminal output to avoid excessive memory usage
3. **Settings Check**: Respects both global sound settings and notification-specific settings

### Audio Selection
Notification sounds are pseudo-randomly selected from a pool of available sound effects:
- `ui_hacking_charenter_01.wav`
- `ui_hacking_charenter_02.wav`
- `ui_hacking_charenter_03.wav`
- `poweron.mp3`

The `getRandom()` function ensures consecutive notifications don't use the same sound.

### Integration Points
1. **Terminal Output Stream**: Intercepts the `term.write()` method to monitor terminal output
2. **Settings Menu**: Adds menu option under Plugins to toggle notifications
3. **Global Settings**: Maintains state via `global.settings.notificationsEnabled`
4. **Proper Cleanup**: Restores original write method on component unmount to prevent memory leaks

Note: The Hyper terminal integration is currently broken due to xterm.js migration. The primary focus is now on Claude Code plugin support.

## Usage

### For Users
1. Install the plugin as documented in README.md
2. For Hyper terminal (legacy): Access menu **Plugins > Status notification sounds**
3. For Claude Code: Configure via `.claude-plugin/config.json`
4. Run commands that produce status messages to hear notifications

### Agent Vibes Inspiration
Agent Vibes is a TTS extension for Claude Code with sophisticated verbosity control and pattern matching. Key concepts adopted:
- Selective audio notifications with configurable verbosity
- Pattern categories (critical, completion, approval)
- Non-blocking audio playback
- Extensible provider system

### Design Goals
1. **Selective Notifications**: Play sounds only for meaningful events
2. **Avoid Spam**: Cooldown timers and verbosity levels
3. **Non-blocking**: All audio and haptic operations are fire-and-forget
4. **Extensible**: New audio providers can be added easily
5. **User Control**: Configurable via `config.json`

## Verbosity Levels
Status notifications support multiple verbosity levels:
- **Off**: No audio notifications
- **Minimal**: Only critical events (errors, major completions)
- **Normal**: All standard status messages (default)
- **Verbose**: Extended pattern matching

## Pattern Matching
The legacy Hyper terminal plugin (`index.js`) uses regex patterns to detect status messages:
- Code review / task completed
- Build succeeded / successful
- Tests passed
- Deployment successful / complete
- Approval required / requested
- Merge completed

## Anti-Spam Measures
1. **Cooldown Timer**: 3-second delay between notifications
2. **Buffer Management**: 500-character rolling buffer
3. **Settings Check**: Respects enable/disable controls

## Future Enhancements
- Extensive library of pre-recorded Callisto2 voice clips for fully non-blocking feedback
- Local TTS integration with Piper for offline voice synthesis
- Configurable haptic patterns per event type
- Per-category volume control
