# Copilot Instructions for hyper-robco

## Project Overview

This is the **hyper-robco** project - a plugin that adds authentic Fallout terminal sound effects to:
- Hyper terminal (legacy support - currently broken due to xterm.js migration)
- Claude Code (primary focus - plays sounds during AI response streaming)

The plugin provides keyboard sounds during typing and status notification sounds for build/test completion messages.

## Technology Stack

- **Language**: JavaScript (Node.js)
- **Runtime Environments**: 
  - Electron (for Hyper terminal)
  - Browser environment (for Claude Code)
- **APIs**: Web Audio API, Electron APIs
- **Audio Format**: WAV files from Fallout 3/New Vegas
- **Plugin Systems**: Hyper plugin API, Claude Code hook system

## Architecture

### Core Components
1. **index.js** - Main Hyper terminal plugin with:
   - Audio player setup and management
   - Terminal output monitoring
   - Status notification pattern matching
   - React component lifecycle hooks

2. **.claude-plugin/hook.js** - Claude Code integration:
   - Streaming response interception
   - Character-by-character sound playback
   - Configuration management

3. **sounds/** - WAV audio files (DO NOT MODIFY)

### Key Design Patterns
- **Sound Management**: Pre-loaded audio players in `SOUNDS` object
- **Random Selection**: Prevents consecutive repeats, uses pseudo-random selection
- **Anti-spam**: Cooldown periods prevent notification spam (3 seconds for status notifications)
- **Settings Persistence**: Uses Electron's `global.settings` for state management

## Code Style and Conventions

### General Guidelines
- Use ES5/CommonJS syntax (for Electron compatibility)
- Keep volume levels at 0.2 (20%) for consistency
- Use named constants for magic numbers (COOLDOWN_MS, BUFFER_SIZE, etc.)
- Write descriptive variable names

### Audio Handling
- Always pre-load audio players during initialization
- Use try-catch blocks around audio playback
- Maintain consistent volume across all sounds
- Respect user's enabled/disabled settings before playing

### Pattern Matching
- Use case-insensitive regex patterns
- Avoid overly broad patterns that trigger false positives
- Group related patterns logically in code comments
- Test patterns thoroughly with real terminal output

### React Components (Hyper)
- Implement proper cleanup in componentWillUnmount
- Restore original methods when unmounting
- Check settings before any audio operations

## Testing Requirements

### Test Commands
```bash
npm test              # Runs test-plugin.js validation
node --check index.js # Syntax validation
```

### What to Test
- Pattern matching accuracy (avoid false positives/negatives)
- Audio playback functionality
- Settings persistence
- Component lifecycle (mount/unmount)
- Memory leak prevention
- Browser/Electron environment differences

### Test Guidelines
- Add tests for new status notification patterns
- Verify cooldown mechanisms work correctly
- Test with various terminal output formats
- Ensure sounds don't play when disabled

## Documentation Standards

### Code Comments
- Explain WHY, not just WHAT
- Document complex regex patterns
- Note platform-specific behavior
- Mark deprecated or legacy code clearly

### Markdown Files
- Keep README.md user-focused (installation, usage, troubleshooting)
- Use IMPLEMENTATION_NOTES.md for technical details
- Maintain SUMMARY.md with project status
- Update documentation when changing features

## Dependencies and External Resources

### Current Dependencies
- Node.js built-in modules (path, process)
- Electron APIs (electron.remote for Hyper)
- No external npm packages (keep it lightweight)

### Adding Dependencies
- Only add dependencies if absolutely necessary
- Prefer built-in Node.js/browser APIs
- Consider bundle size impact
- Document why the dependency is needed

## Boundaries and Constraints

### DO NOT Modify
- Sound files in `/sounds` directory (unless adding new authentic Fallout sounds)
- Core audio playback architecture
- Plugin initialization patterns
- Electron global.settings structure

### DO NOT Introduce
- External API calls or network requests
- Secrets or credentials in code
- Breaking changes to plugin.json schema
- Non-Fallout sound effects
- Telemetry or analytics

### Security Guidelines
- Never log or expose audio file contents
- Validate all user input (config values)
- Limit buffer sizes to prevent memory issues
- Sanitize terminal output before pattern matching

## Build and Development Process

### Development Workflow
1. Make changes to code
2. Run syntax validation: `node --check <file>`
3. Run tests: `npm test`
4. Update documentation if needed
5. Run code review before finalizing

### Installation Locations
- **Hyper**: `~/.hyper_plugins/local/hyper-robco`
- **Claude Code**: `~/.claude/plugins/hyper-robco`

### Testing Changes
- For Hyper: Restart terminal after changes
- For Claude Code: Restart Claude Code application
- Check browser/Electron console for errors
- Verify audio playback with test commands

## Special Considerations

### Verbosity Levels
The plugin supports multiple verbosity levels for status notifications:
- **off**: No audio notifications
- **minimal**: Only critical events (errors, major completions)
- **normal**: All status messages (default)
- **verbose**: Extended pattern matching

When adding new patterns, consider which verbosity level they belong to.

### Platform Differences
- **Renderer Process** (Hyper): Uses `electron.remote`, actual Audio objects
- **Main Process** (Node.js): Mock players for testing
- **Browser** (Claude Code): Pure Web Audio API, no Electron dependencies

Always test code in the target environment.

## Common Tasks

### Adding a New Status Notification Pattern
1. Identify the exact message format from terminal output
2. Create a case-insensitive regex pattern
3. Add to NOTIFICATION_PATTERNS array
4. Add test case for the pattern
5. Document in README.md and IMPLEMENTATION_NOTES.md
6. Verify it doesn't trigger false positives

### Adjusting Audio Timing
- Keyboard sounds: Modify throttleMs in .claude-plugin/config.json
- Status notifications: Adjust COOLDOWN_MS constant
- Test with various typing speeds and command outputs

### Debugging Audio Issues
1. Check browser/Electron console for errors
2. Verify `settings.enabled` is true
3. Test audio file paths are correct
4. Ensure audio files are not corrupted
5. Check volume levels and OS audio settings

## Version and Compatibility

- **Current Version**: 1.0.0
- **License**: GPL-3.0
- **Node.js**: Any recent version (no specific requirement)
- **Hyper**: Currently broken due to xterm.js migration (keep for reference)
- **Claude Code**: Primary target environment

## Project Goals

### Primary Objectives
- Provide immersive retro terminal experience
- Support Claude Code streaming responses
- Maintain authenticity to Fallout terminal aesthetic
- Keep plugin lightweight and performant

### Non-Goals
- Generic sound effect player
- Support for non-Fallout sound themes
- Real-time audio synthesis
- Voice synthesis or TTS

## Best Practices for AI Assistants

When working on this codebase:
1. **Preserve the Fallout aesthetic** - Don't suggest modern UI sounds
2. **Test audio playback** - Always verify sounds actually play
3. **Check both environments** - Consider Hyper AND Claude Code implications
4. **Respect cooldowns** - Audio spam ruins the experience
5. **Document pattern changes** - Status patterns need clear documentation
6. **Maintain backwards compatibility** - Settings should migrate gracefully
7. **Keep it simple** - Resist over-engineering, this is a fun plugin

When making changes, ask yourself:
- Does this maintain the Fallout terminal experience?
- Will this work in both browser and Electron contexts?
- Does this respect user preferences (enabled/disabled)?
- Are there any memory leaks or performance issues?
- Is the code clear enough that others can maintain it?
