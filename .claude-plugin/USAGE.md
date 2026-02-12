# vault-tap Claude Code Plugin

Example usage and integration guide.

## Plugin Structure

```
vault-tap/
├── .claude-plugin/
│   ├── plugin.json       # Plugin manifest
│   ├── config.json       # User configuration
│   └── hook.js           # Hook implementation
├── sounds/               # Sound effect files
│   ├── ui_hacking_charsingle_*.wav
│   └── ui_hacking_charenter_*.wav
├── index.js              # Original Hyper terminal plugin
├── package.json
└── README.md
```

## Hook System

The plugin uses Claude Code's hook system with the `onStreamingResponse` hook:

```javascript
// Called for each chunk of text as Claude streams
async function onStreamingResponse(context) {
  const { chunk, isComplete } = context;
  
  // Play sounds for each character
  for (const char of chunk) {
    if (char === '\n') {
      playEnterSound();
    } else if (char.trim() !== '') {
      playCharSound();
    }
  }
}
```

## Programmatic Control

You can control the plugin programmatically:

```javascript
const robcoPlugin = require('./hook');

// Enable/disable sounds
robcoPlugin.setEnabled(false);  // Disable
robcoPlugin.setEnabled(true);   // Enable
```

## Integration with Other Plugins

This plugin can work alongside other Claude Code plugins. It only hooks into the streaming response system and doesn't modify the actual content.

## Sound File Attribution

All sound effects are from Fallout 3 and Fallout: New Vegas, owned by Bethesda Softworks.
This plugin is for personal use and is not affiliated with or endorsed by Bethesda.
