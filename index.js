const path = require('path');
const process = require('process');
const electron = require('electron');
var sounds_path = path.join(__dirname, 'sounds').replace(/\\/g, "/");

function getSoundFullPath(sound_name) {
    return 'file://' + sounds_path + '/' + sound_name;
}

if (process.type === "renderer") {
    global = {
        settings: electron.remote.getGlobal('settings')
    }
    
    function makePlayer(sound_name) {
        var audio = new Audio(getSoundFullPath(sound_name));
        audio.volume = 0.2;
        return audio;
    }
} else {
    global.settings = {
        enabled: true,
        notificationsEnabled: true
    };
    
    function makePlayer(sound_name) {
        return {
            'play': function(){}
        };
    }
}

const SOUNDS = {
    'SINGLE': [
        makePlayer('ui_hacking_charsingle_01.wav'),
        makePlayer('ui_hacking_charsingle_02.wav'),
        makePlayer('ui_hacking_charsingle_03.wav'),
        makePlayer('ui_hacking_charsingle_04.wav'),
        makePlayer('ui_hacking_charsingle_05.wav'),
        makePlayer('ui_hacking_charsingle_06.wav'),
    ],
    'ARROW': [
        makePlayer('ui_hacking_charscroll.wav'),
        makePlayer('ui_hacking_charscroll_lp.wav'),
    ],
    'ENTER': [
        makePlayer('ui_hacking_charenter_01.wav'),
        makePlayer('ui_hacking_charenter_02.wav'),
        makePlayer('ui_hacking_charenter_03.wav'),
    ],
    'EVENTS': {
        'OPEN': makePlayer('poweron.mp3'),
        'CLOSE': makePlayer('poweroff.mp3'),
    },
    'NOTIFICATIONS': [
        makePlayer('ui_hacking_charenter_01.wav'),
        makePlayer('ui_hacking_charenter_02.wav'),
        makePlayer('ui_hacking_charenter_03.wav'),
        makePlayer('poweron.mp3'),
    ]
}

function getRandom(list) {
    var limit = list.length;
    var newRand = Math.floor(Math.random() * limit);
    if (list._lastNum !== undefined) {
        if (newRand == list._lastNum) {
            newRand = (newRand + 1) % limit;
        }
    }
    list._lastNum = newRand;
    return list[newRand];
}

// Status notification patterns
// Based on research of common CI/CD and development workflow status messages
// These patterns match completion messages, success notifications, and approval requests
// Pattern matching is case-insensitive to catch variations in output
const STATUS_PATTERNS = [
    /code review completed/i,
    /review completed/i,
    /task completed/i,
    /build succeeded/i,
    /build successful/i,
    /tests? passed/i,
    /deployment successful/i,
    /deployment complete/i,
    /ready for review/i,
    /approval (required|requested)/i,
    /waiting for approval/i,
    /merge completed/i,
    /successfully merged/i,
    /operation completed/i
];

// Track recent notifications to avoid spam
let lastNotificationTime = 0;
const NOTIFICATION_COOLDOWN = 3000; // 3 seconds between notifications
const NOTIFICATION_BUFFER_SIZE = 500; // Keep last 500 chars of output

function shouldPlayNotification(text) {
    if (!global.settings.notificationsEnabled) {
        return false;
    }
    
    const now = Date.now();
    if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
        return false;
    }
    
    for (let pattern of STATUS_PATTERNS) {
        if (pattern.test(text)) {
            lastNotificationTime = now;
            return true;
        }
    }
    
    return false;
}

exports.decorateTerm = (Term, { React, notify }) => {
    return class extends React.Component {

    constructor (props, context) {
      super(props, context);
      this._onTerminal = this._onTerminal.bind(this);
      this._originalWrite = null;
      this._term = null;
    }

    _onTerminal (term) {
        if (this.props && this.props.onTerminal) this.props.onTerminal(term);

        const handlers = [
            [
                "keydown",
                function(e) {
                    if (!global.settings.enabled) {
                        return true;
                    }
                    
                    var repeatable = false;
                    var soundList = SOUNDS.SINGLE;
                    switch (e.key) {
                        case "ArrowDown":
                        case "ArrowUp":
                        case "ArrowLeft":
                        case "ArrowRight":
                            repeatable = true;
                            soundList = SOUNDS.ARROW;
                            break;
                        case "Enter":
                            soundList = SOUNDS.ENTER;
                            break;
                        case "Escape":
                            break;
                        default:
                            break;
                    }
                    
                    if (e.repeat && !repeatable) {
                        return true;
                    }
                    var sound = getRandom(soundList).play();
                    
                    return true;
                }.bind(term.keyboard)
            ],
        ];

        term.uninstallKeyboard();
        for (var i = 0; i < handlers.length; i++) {
            var handler = handlers[i];
            term.keyboard.handlers_ = [handler].concat(term.keyboard.handlers_);
        }
        term.installKeyboard();
        
        // Hook into terminal output to detect status notifications
        // This implementation monitors terminal output for status messages
        // and plays audio notifications when completion/status patterns are detected.
        // The system uses a rolling buffer to capture recent output and avoids
        // spam with a cooldown timer between notifications.
        
        // Store original write method
        const originalWrite = term.write.bind(term);
        let outputBuffer = '';
        
        // Intercept terminal write to monitor output
        term.write = function(data) {
            // Call original write first
            const result = originalWrite(data);
            
            if (!global.settings.enabled || !global.settings.notificationsEnabled) {
                return result;
            }
            
            // Append data to buffer (convert to string if needed)
            const dataStr = typeof data === 'string' ? data : String(data);
            outputBuffer += dataStr;
            
            // Keep buffer size manageable
            if (outputBuffer.length > NOTIFICATION_BUFFER_SIZE) {
                outputBuffer = outputBuffer.slice(-NOTIFICATION_BUFFER_SIZE);
            }
            
            // Check for notification patterns
            if (shouldPlayNotification(outputBuffer)) {
                getRandom(SOUNDS.NOTIFICATIONS).play();
            }
            
            return result;
        };
        
        // Store reference for cleanup
        this._originalWrite = originalWrite;
        this._term = term;
    }

    componentWillUnmount() {
        // Restore original write method when component unmounts
        if (this._term && this._originalWrite) {
            this._term.write = this._originalWrite;
            this._originalWrite = null;
            this._term = null;
        }
    }

    render () {
        return React.createElement(Term, Object.assign({}, this.props, {
            onTerminal: this._onTerminal
        }));
    }

  };
};

exports.middleware = (store) => (next) => (action) => {
    if (global.settings.enabled) {
        if (action.type === 'TERM_GROUP_REQUEST') {
            SOUNDS.EVENTS.CLOSE.currentTime = 0.0;
            SOUNDS.EVENTS.OPEN.play();
        }
        if (action.type === 'TERM_GROUP_EXIT') {
            SOUNDS.EVENTS.CLOSE.currentTime = 0.0;
            SOUNDS.EVENTS.CLOSE.play();
        }
    }
    next(action);
};

exports.decorateMenu = menu =>
  menu.map(
    item => {
      if (item.label !== 'Plugins') return item;
      const newItem = Object.assign({}, item);
      newItem.submenu = newItem.submenu.concat(
        {
          label: 'Terminal sounds',
          checked: global.settings.enabled,
          type: 'checkbox',
          click: (clickedItem) => {
            global.settings.enabled = !global.settings.enabled;
            clickedItem.checked = global.settings.enabled;
          },
        },
        {
          label: 'Status notification sounds',
          checked: global.settings.notificationsEnabled,
          type: 'checkbox',
          click: (clickedItem) => {
            global.settings.notificationsEnabled = !global.settings.notificationsEnabled;
            clickedItem.checked = global.settings.notificationsEnabled;
          },
        }
      );
      return newItem;
    }
  );