# RobCo™ Vault Terminal Adaptation Program™ (VTAP)
_Still using that out-of-date, silent terminal? Wishing your machine clicked like the rest? Prepare For The Future™ and upgrade today for FREE!*_

_*VaultTec vault subscription required._

Add Fallout terminal sound effects to your terminal or AI assistant! This plugin brings the iconic keyboard sounds from [Fallout](https://en.wikipedia.org/wiki/Fallout_(series)) [3](https://en.wikipedia.org/wiki/Fallout_3)/[NV](https://en.wikipedia.org/wiki/Fallout:_New_Vegas) to your 21st century computing experience.

## Features

- 🎮 Authentic Fallout terminal keyboard sounds
- 🤖 **NEW**: Claude Code plugin support - hear keystrokes as Claude streams responses
- 🖥️ Original Hyper terminal extension support (currently broken due to xterm.js migration)

## Install

### Claude Code Plugin

Play terminal sounds as Claude streams its responses:

1. Clone this repository into your Claude Code plugins directory:
   ```bash
   git clone https://github.com/YOUR_USERNAME/hyper-robco ~/.claude/plugins/hyper-robco
   ```
   
   Replace `YOUR_USERNAME` with your GitHub username if you forked the repository.

2. The plugin will be automatically detected by Claude Code on restart

3. Sounds will play as Claude types responses in real-time!

#### Configuration

You can customize the plugin behavior by editing `.claude-plugin/config.json`:

```json
{
  "enabled": true,          // Enable/disable sound effects
  "volume": 0.2,            // Volume level (0.0 to 1.0)
  "playOnStreamingOnly": true,  // Only play during streaming (not on finished responses)
  "throttleMs": 10          // Delay between character sounds in milliseconds
}
```

#### How It Works

The plugin uses Claude Code's hook system to intercept streaming responses. As each character is streamed from Claude, it plays one of the authentic Fallout terminal keyboard sounds, creating a retro computer experience.

**Sound Effects:**
- Character keystrokes: 6 different typing sounds that rotate randomly
- Enter/Newline: 3 different "enter key" sounds for line breaks

All sounds are from Fallout 3/New Vegas terminal interfaces.

#### Troubleshooting

**No sounds playing?**
- Make sure the plugin is installed in the correct directory (`~/.claude/plugins/hyper-robco`)
- Check that `config.json` has `"enabled": true`
- Restart Claude Code after installation
- Ensure your browser allows audio playback (some browsers require user interaction first)

**Sounds too loud/quiet?**
- Adjust the `volume` setting in `.claude-plugin/config.json` (range: 0.0 to 1.0)

**Want to disable temporarily?**
- Set `"enabled": false` in `.claude-plugin/config.json` or call `setEnabled(false)` from the hook module

#### Testing

You can verify the plugin is correctly configured by running:

```bash
npm test
```

This will check that all required files are present and properly formatted.

### Hyper Terminal Extension (Legacy)

**Note**: Currently broken since Hyper migrated from `hterm` to `xterm.js`. Keeping for future reference.

You need to `git clone` this repository into `~/.hyper_plugins/local/hyper-robco` and add `hyper-robco` to `localPlugins` in `.hyper.js`.
