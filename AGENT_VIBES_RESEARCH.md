# Agent Vibes Research & Application to Agent Callisto 2

## Agent Vibes TTS System Analysis

### What is Agent Vibes?
Agent Vibes is a TTS (Text-to-Speech) extension for Claude Code that provides audio feedback with sophisticated verbosity control and pattern matching. The key innovation is **selective audio notifications** with minimal verbosity.

### Key Concepts from Agent Vibes

#### 1. **Verbosity Control**
Agent Vibes uses three levels:
- `/tts-verbosity-low` - Minimal output (only critical messages)
- `/tts-verbosity-medium` - Balanced narration
- `/tts-verbosity-high` - Full transparency

**Low verbosity** only announces:
- Success/failure messages
- Key results
- Status completions
- Skips boilerplate, code, and non-critical info

#### 2. **Pattern Matching with Hooks**
Agent Vibes uses a hook system (`play-tts.sh`) that:
- Intercepts status notifications via PostToolUse events
- Analyzes notification payloads (JSON fields)
- Uses pattern matching to filter which messages trigger audio
- Has configurable filter scripts (e.g., `tts-selective.sh`)

#### 3. **Selective Playback Architecture**
```bash
# Example filter for errors only
echo "$NOTIFICATION_BODY" | jq 'select(.type == "error" or .status == "failed")'
```

Only messages passing the filter trigger TTS playback.

#### 4. **Two-Point Protocol**
- **Acknowledgment**: "Starting file upload"
- **Completion**: "Upload complete!"

Each point can have its own pattern filter.

#### 5. **Mute Controls**
- Project-level: `.claude/agentvibes-muted`
- Global-level: `~/.agentvibes-muted`
- Slash commands: `/tts-mute`, `/tts-unmute`

#### 6. **Provider System**
Supports multiple TTS backends:
- Piper TTS (free, offline, neural voices)
- macOS Say (built-in)
- Termux (Android)
- ElevenLabs (premium, cloud)

### How This Applies to Agent Callisto 2

#### Current Implementation
Our agent-callisto2 plugin:
- ✅ Pattern matching (14 regex patterns)
- ✅ Selective notifications (not all text)
- ✅ Cooldown timer (3 seconds)
- ✅ Verbosity levels (off, minimal, normal, verbose)
- ✅ Multiple audio providers (samples, ElevenLabs, local TTS, pre-recorded)
- ✅ Haptic feedback (Logitech MX Master 4)
- ✅ Custom ElevenLabs voice (Callisto2)
- ✅ Pre-recorded sample support for non-blocking feedback

#### Improvements Inspired by Agent Vibes (Implemented)

##### 1. **Add Verbosity Levels**
```javascript
const VERBOSITY_LEVELS = {
    OFF: 0,      // No notifications
    MINIMAL: 1,  // Only critical: errors, final completions
    NORMAL: 2,   // Current implementation
    VERBOSE: 3   // All status messages
};
```

##### 2. **Configurable Pattern Categories**
```javascript
const PATTERN_CATEGORIES = {
    CRITICAL: [
        /error|failed|failure/i,
        /fatal/i
    ],
    COMPLETION: [
        /completed/i,
        /succeeded/i,
        /passed/i
    ],
    APPROVAL: [
        /approval required/i,
        /ready for review/i
    ]
};
```

Then allow users to enable/disable categories. (Implemented in `index.js` via `PATTERN_CATEGORIES`.)

##### 3. **Filter Function System**
```javascript
// User-configurable filter
function shouldNotify(text, verbosityLevel) {
    switch(verbosityLevel) {
        case VERBOSITY_LEVELS.OFF:
            return false;
        case VERBOSITY_LEVELS.MINIMAL:
            // Only critical errors and final success
            return PATTERN_CATEGORIES.CRITICAL.some(p => p.test(text));
        case VERBOSITY_LEVELS.NORMAL:
            return shouldPlayNotification(text); // Current logic
        case VERBOSITY_LEVELS.VERBOSE:
            return true; // All status patterns
    }
}
```

##### 4. **Configuration File Support**
Similar to Agent Vibes' `.claude/tts-voice.txt`, we could support:
- `.agent-callisto2-config.json` in user's home directory
- Project-specific: `./.agent-callisto2-config`

```json
{
    "verbosity": "minimal",
    "enabledCategories": ["critical", "completion"],
    "customPatterns": [
        "deployment complete",
        "server started"
    ],
    "volume": 0.2,
    "cooldown": 3000
}
```

##### 5. **Menu Enhancements**
Current: Binary on/off toggle
Improved: Submenu with options
```
Plugins
  └─ Terminal sounds
     └─ Status notification sounds
        ├─ [ ] Off
        ├─ [•] Minimal (errors & completions)
        ├─ [ ] Normal (all status messages)
        └─ [ ] Verbose
```

### Implementation Status

#### Phase 1 ✅ Complete
- ✅ Basic pattern matching
- ✅ Cooldown timer
- ✅ Binary on/off toggle

#### Phase 2 ✅ Complete
- ✅ Verbosity levels (off/minimal/normal/verbose)
- ✅ Category-based filtering
- ✅ Enhanced menu with verbosity options

#### Phase 3 (In Progress)
- ✅ Configuration file support (`config.json`)
- ✅ ElevenLabs TTS with custom Callisto2 voice
- ✅ Haptic feedback (Logitech MX Master 4)
- ✅ Local TTS engine support
- ✅ Pre-recorded sample support
- [ ] Per-category volume control
- [ ] Configurable haptic patterns

### Code Changes for Phase 2

#### 1. Update Settings Object
```javascript
global.settings = {
    enabled: true,
    notificationsEnabled: true,
    notificationVerbosity: 'normal' // 'off', 'minimal', 'normal', 'verbose'
};
```

#### 2. Add Verbosity Logic
```javascript
function shouldPlayNotification(text) {
    if (!global.settings.notificationsEnabled) {
        return false;
    }
    
    const verbosity = global.settings.notificationVerbosity;
    
    if (verbosity === 'off') return false;
    
    const now = Date.now();
    if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
        return false;
    }
    
    let shouldTrigger = false;
    
    if (verbosity === 'minimal') {
        // Only critical patterns
        const criticalPatterns = [
            /error|failed|failure/i,
            /successfully completed/i,
            /build succeeded/i,
            /tests? passed/i
        ];
        shouldTrigger = criticalPatterns.some(p => p.test(text));
    } else if (verbosity === 'verbose') {
        // All status patterns
        shouldTrigger = STATUS_PATTERNS.some(p => p.test(text));
    } else {
        // Normal - current behavior
        shouldTrigger = STATUS_PATTERNS.some(p => p.test(text));
    }
    
    if (shouldTrigger) {
        lastNotificationTime = now;
    }
    
    return shouldTrigger;
}
```

#### 3. Update Menu
```javascript
{
  label: 'Status notification sounds',
  submenu: [
    {
      label: 'Off',
      type: 'radio',
      checked: global.settings.notificationVerbosity === 'off',
      click: () => { global.settings.notificationVerbosity = 'off'; }
    },
    {
      label: 'Minimal (Critical only)',
      type: 'radio',
      checked: global.settings.notificationVerbosity === 'minimal',
      click: () => { global.settings.notificationVerbosity = 'minimal'; }
    },
    {
      label: 'Normal',
      type: 'radio',
      checked: global.settings.notificationVerbosity === 'normal',
      click: () => { global.settings.notificationVerbosity = 'normal'; }
    }
  ]
}
```

### Benefits of This Approach

1. **Reduced Noise**: Users can choose minimal verbosity to only hear critical events
2. **Flexibility**: Different verbosity for different workflows
3. **User Control**: Similar to Agent Vibes' proven UX
4. **Backward Compatible**: Default to 'normal' maintains current behavior

### Conclusion

Agent Vibes' verbosity control is a clever solution that:
- **Reduces auditory clutter** without losing functionality
- **Empowers users** to customize their experience
- **Uses simple pattern categorization** for filtering

We can adopt this approach in agent-callisto2 with minimal changes to the existing codebase, significantly improving the user experience while maintaining the core functionality.
