# BROKEN
Broken since Hyper migrated from `hterm` to `xterm.js`. Sadly it's not an easy fix, but hopefully I'll get to fixing it at some point.

# RobCo™ Vault Terminal Adaptation Program™ (VTAP)
_Still using that out-of-date, silent terminal? Wishing your machine clicked like the rest? Prepare For The Future™ and upgrade today for FREE!*_

_*VaultTec vault subscription required._

This [Hyper](https://hyper.is) extension adds some of the terminal sound effects found in [Fallout](https://en.wikipedia.org/wiki/Fallout_(series)) [3](https://en.wikipedia.org/wiki/Fallout_3)/[NV](https://en.wikipedia.org/wiki/Fallout:_New_Vegas), making your 21st century shell feel as clicky as the games' 23rd century computers. Looks best with a retro theme like `hyperpunk`.

## Features

### Keyboard Sound Effects
Terminal sounds play when typing, including different sounds for regular keys, arrow keys, and Enter.

### Status Notification Sounds
Audio notifications play when certain status messages appear in the terminal output, such as:
- Code review completed
- Build succeeded/successful
- Tests passed
- Deployment successful/complete
- Ready for review
- Approval required/requested
- Merge completed
- Operation completed
- And more...

The notification sounds are pseudo-randomly selected from available sound effects and include a cooldown period to avoid spam (3 seconds between notifications).

#### Verbosity Levels (Inspired by Agent Vibes TTS)
Status notifications support multiple verbosity levels to control how often audio plays:
- **Off**: No audio notifications
- **Minimal**: Only critical events (errors, major completions like builds and tests)
- **Normal**: All status messages (default)
- **Verbose**: Extended pattern matching for comprehensive notifications

## Install
For now, you need to `git clone` this repository into `~/.hyper_plugins/local/hyper-robco` and add `hyper-robco` to `localPlugins` in `.hyper.js`.

## Configuration
Once installed, you can toggle sound effects from the Hyper menu:
- **Plugins > Terminal sounds** - Enable/disable keyboard sound effects
- **Plugins > Status notification sounds** - Choose notification verbosity:
  - **Off** - No audio notifications
  - **Minimal (Critical only)** - Only errors and major completions
  - **Normal** - All status messages (default)
  - **Verbose** - Extended notifications
