# Tabs Randomizer - Chrome Extension

A modern Chrome browser extension that automatically randomizes your browser tabs in multiple ways. Keep your browsing experience fresh and unpredictable with customizable randomization modes!

## ✨ Features

- 🎲 **Multiple Randomization Modes**:
  - **Order Only**: Randomizes the position of tabs
  - **Names & Icons Only**: Swaps tab titles and favicons between tabs
  - **Both**: Randomizes both order and names/icons simultaneously

- ⚙️ **Fully Customizable**: Set the randomization interval to any number of seconds (minimum 1 second)

- 🎯 **Smart Tab Handling**: Pinned tabs remain in their positions and are never randomized

- 🎮 **Manual Control**: Start, stop, or trigger immediate randomization with a single click

- 💾 **Persistent Settings**: Your preferences (interval, mode, and running state) are saved and restored when you restart the browser

- 🎨 **Modern UI**: Beautiful, gradient-based interface with smooth animations and intuitive controls

## 📦 Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Select the folder containing the extension files
6. The extension icon should now appear in your Chrome toolbar

## 🚀 Usage

1. **Click the extension icon** in your Chrome toolbar to open the popup
2. **Choose your randomization mode**:
   - **Randomize Order Only**: Shuffles tab positions
   - **Randomize Names & Icons Only**: Swaps titles and favicons between tabs
   - **Randomize Both**: Does both simultaneously
3. **Set your desired interval** in seconds (e.g., 5 seconds, 30 seconds, 60 seconds)
4. **Click "Start"** to begin automatic tab randomization
5. **Click "Stop"** to pause the randomization (this will also restore original tab names/icons)
6. **Click "Randomize Now"** to immediately randomize tabs without waiting for the interval

### How It Works

- **Tab Order Randomization**: Uses the Fisher-Yates shuffle algorithm to ensure truly random tab ordering
- **Name & Icon Randomization**: Swaps tab titles and favicons between tabs by injecting scripts into web pages
- Only unpinned tabs are randomized; pinned tabs stay in their original positions
- The randomization happens in the background, so you can continue browsing normally
- Your settings (interval, mode, and running state) are saved and will persist across browser restarts

### Important Notes

- **Name/Icon Changes are Temporary**: When you stop the extension or reload a page, tab names and icons will revert to their original values
- **Chrome Pages**: Some Chrome internal pages (chrome:// URLs) cannot be modified and will be skipped
- **Extension Pages**: Extension pages (chrome-extension:// URLs) cannot be modified and will be skipped
- The extension only randomizes tabs in the current window
- If you have only one or zero unpinned tabs, randomization will be skipped

## 📁 Files Structure

```
Tabs Randomizer/
├── manifest.json       # Extension manifest (Chrome Extension v3)
├── background.js       # Service worker that handles tab randomization
├── popup.html          # Modern extension popup UI
├── popup.js            # Popup logic and controls
└── README.md           # This file
```

## 🔐 Permissions

This extension requires the following permissions:

- **tabs**: To access and reorder browser tabs
- **storage**: To save your preferences (interval, mode, and running state)
- **scripting**: To inject scripts that modify tab titles and favicons

## 🛠 Technical Details

- **Manifest Version**: 3 (Chrome Extension Manifest V3)
- **Service Worker**: Uses Chrome's service worker API for background operations
- **Tab Management**: Utilizes the Chrome Tabs API for tab manipulation
- **Script Injection**: Uses Chrome Scripting API to modify page titles and favicons
- **Storage**: Uses Chrome's local storage API for persistence
- **Algorithm**: Fisher-Yates shuffle for true randomization

## 🎨 UI Features

- Modern gradient design with smooth animations
- Clear visual status indicators (running/stopped)
- Intuitive radio button controls for mode selection
- Responsive button states and hover effects
- Real-time status updates showing current mode and interval

## 🔮 Future Enhancements

Potential features for future versions:
- Per-window randomization settings
- Whitelist/blacklist specific tabs
- Different randomization patterns (shuffle, rotate, etc.)
- Statistics and analytics
- Custom favicon generation options
- Preset interval configurations

## 📝 License

This project is open source and available for personal and commercial use.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to fork this project and submit pull requests.

---

**Enjoy your randomized browsing experience!** 🎲✨
