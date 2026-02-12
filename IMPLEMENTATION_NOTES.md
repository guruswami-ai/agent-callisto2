# Agent Callisto2 – Implementation Notes

## Overview
Agent Callisto2 is a Claude CLI plugin (inspired by Agent Vibes) that provides audio and haptic feedback for Claude Code response status. It supports multiple audio providers—including a custom ElevenLabs voice (Callisto2) and pre-recorded samples—and haptic integration with the Logitech MX Master 4 mouse.

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

## Research Summary

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
