# Tabs Randomizer - Chrome Extension

A Chrome browser extension that automatically randomizes the order of your browser tabs at regular intervals. Perfect for those who want to keep their browsing experience fresh and unpredictable!

## Features

- 🔄 **Automatic Tab Randomization**: Randomizes tab order at configurable intervals
- ⚙️ **Customizable Interval**: Set the randomization interval to any number of seconds (minimum 1 second)
- 🎯 **Smart Tab Handling**: Pinned tabs remain in their positions and are not randomized
- 🎮 **Manual Control**: Start, stop, or trigger immediate randomization with a single click
- 💾 **Persistent Settings**: Your preferences are saved and restored when you restart the browser

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Select the folder containing the extension files
6. The extension icon should now appear in your Chrome toolbar

## Usage

1. **Click the extension icon** in your Chrome toolbar to open the popup
2. **Set your desired interval** in seconds (e.g., 5 seconds, 30 seconds, 60 seconds)
3. **Click "Start"** to begin automatic tab randomization
4. **Click "Stop"** to pause the randomization
5. **Click "Randomize Now"** to immediately randomize tabs without waiting for the interval

### How It Works

- The extension uses the Fisher-Yates shuffle algorithm to ensure truly random tab ordering
- Only unpinned tabs are randomized; pinned tabs stay in their original positions
- The randomization happens in the background, so you can continue browsing normally
- Your settings (interval and running state) are saved and will persist across browser restarts

## Files Structure

```
Tabs Randomizer/
├── manifest.json       # Extension manifest (Chrome Extension v3)
├── background.js       # Service worker that handles tab randomization
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic and controls
└── README.md           # This file
```

## Permissions

This extension requires the following permissions:

- **tabs**: To access and reorder browser tabs
- **storage**: To save your preferences (interval and running state)

## Technical Details

- **Manifest Version**: 3 (Chrome Extension Manifest V3)
- **Service Worker**: Uses Chrome's service worker API for background operations
- **Tab Management**: Utilizes the Chrome Tabs API for tab manipulation
- **Storage**: Uses Chrome's local storage API for persistence

## Notes

- The extension only randomizes tabs in the current window
- Pinned tabs are always preserved in their original positions
- If you have only one or zero unpinned tabs, randomization will be skipped
- The extension must have the "tabs" permission to function

## Future Enhancements

Potential features for future versions:
- Per-window randomization settings
- Whitelist/blacklist specific tabs
- Different randomization patterns (shuffle, rotate, etc.)
- Statistics and analytics

## License

This project is open source and available for personal and commercial use.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to fork this project and submit pull requests.

---

**Enjoy your randomized browsing experience!** 🎲

