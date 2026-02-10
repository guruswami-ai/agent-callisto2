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
   git clone https://github.com/guruswami-ai/hyper-robco ~/.claude/plugins/hyper-robco
   ```

2. The plugin will be automatically detected by Claude Code on restart

3. Sounds will play as Claude types responses in real-time!

### Hyper Terminal Extension (Legacy)

**Note**: Currently broken since Hyper migrated from `hterm` to `xterm.js`. Keeping for future reference.

You need to `git clone` this repository into `~/.hyper_plugins/local/hyper-robco` and add `hyper-robco` to `localPlugins` in `.hyper.js`.
