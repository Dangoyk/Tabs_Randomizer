// Default settings
let randomizeInterval = 5;
let randomizeMode = 'order'; // 'order', 'names', or 'both'
let intervalId = null;
let originalTabData = new Map(); // Store original tab titles and favicons

// Function to randomize tab order
async function randomizeTabOrder() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const unpinnedTabs = tabs.filter(tab => !tab.pinned);
    const pinnedTabs = tabs.filter(tab => tab.pinned);
    
    if (unpinnedTabs.length <= 1) {
      return;
    }
    
    const indices = unpinnedTabs.map((_, index) => index);
    
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    // Move tabs to new positions
    for (let i = indices.length - 1; i >= 0; i--) {
      const originalIndex = indices[i];
      const newIndex = i + pinnedTabs.length;
      if (originalIndex !== i) {
        await chrome.tabs.move(unpinnedTabs[originalIndex].id, { index: newIndex });
      }
    }
  } catch (error) {
    console.error('Error randomizing tab order:', error);
  }
}

// Function to randomize tab names and icons
async function randomizeTabNamesAndIcons() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const unpinnedTabs = tabs.filter(tab => !tab.pinned);
    
    if (unpinnedTabs.length <= 1) {
      return;
    }
    
    // Store original data if not already stored
    for (const tab of unpinnedTabs) {
      if (!originalTabData.has(tab.id)) {
        originalTabData.set(tab.id, {
          title: tab.title,
          favIconUrl: tab.favIconUrl || ''
        });
      }
    }
    
    // Collect titles and favicons
    const titles = unpinnedTabs.map(tab => originalTabData.get(tab.id)?.title || tab.title);
    const favicons = unpinnedTabs.map(tab => originalTabData.get(tab.id)?.favIconUrl || tab.favIconUrl || '');
    
    // Shuffle arrays
    const shuffledTitles = [...titles];
    const shuffledFavicons = [...favicons];
    
    for (let i = shuffledTitles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledTitles[i], shuffledTitles[j]] = [shuffledTitles[j], shuffledTitles[i]];
      [shuffledFavicons[i], shuffledFavicons[j]] = [shuffledFavicons[j], shuffledFavicons[i]];
    }
    
    // Apply shuffled titles and favicons to tabs
    for (let i = 0; i < unpinnedTabs.length; i++) {
      const tab = unpinnedTabs[i];
      const newTitle = shuffledTitles[i];
      const newFavicon = shuffledFavicons[i];
      
      try {
        // Inject script to change title and favicon
        if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (title, faviconUrl) => {
              // Update title
              if (title) {
                document.title = title;
              }
              
              // Update favicon
              let link = document.querySelector("link[rel*='icon']");
              if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
              }
              
              if (faviconUrl) {
                link.href = faviconUrl;
              } else if (title) {
                // Fallback: create a simple colored circle with first letter
                const firstLetter = title.charAt(0).toUpperCase();
                const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];
                const color = colors[firstLetter.charCodeAt(0) % colors.length];
                link.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='${color}'/><text x='50' y='65' font-size='50' text-anchor='middle' fill='white' font-weight='bold'>${firstLetter}</text></svg>`;
              }
            },
            args: [newTitle, newFavicon]
          });
        }
      } catch (error) {
        // Some tabs may not be scriptable (chrome:// pages, etc.)
        console.warn(`Could not update tab ${tab.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error randomizing tab names and icons:', error);
  }
}

// Main randomization function
async function randomizeTabs() {
  if (randomizeMode === 'order') {
    await randomizeTabOrder();
  } else if (randomizeMode === 'names') {
    await randomizeTabNamesAndIcons();
  } else if (randomizeMode === 'both') {
    await randomizeTabOrder();
    await randomizeTabNamesAndIcons();
  }
}

// Start the randomization interval
function startRandomization() {
  if (intervalId) {
    clearInterval(intervalId);
  }
  
  const intervalMs = randomizeInterval * 1000;
  intervalId = setInterval(randomizeTabs, intervalMs);
  
  chrome.storage.local.set({ 
    isRunning: true,
    randomizeInterval: randomizeInterval,
    randomizeMode: randomizeMode
  });
  
  console.log(`Tab randomization started: mode=${randomizeMode}, interval=${randomizeInterval}s`);
}

// Stop the randomization interval
function stopRandomization() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    chrome.storage.local.set({ isRunning: false });
    console.log('Tab randomization stopped');
  }
}

// Open test tabs for testing the extension
async function openTestTabs() {
  try {
    const testUrls = [
      'https://www.example.com',
      'https://www.wikipedia.org',
      'https://www.github.com',
      'https://www.stackoverflow.com',
      'https://www.reddit.com'
    ];
    
    // Open all test tabs
    for (const url of testUrls) {
      await chrome.tabs.create({ url: url, active: false });
    }
    
    console.log('Test tabs opened successfully');
    return true;
  } catch (error) {
    console.error('Error opening test tabs:', error);
    return false;
  }
}

// Restore original tab names and icons
async function restoreTabNamesAndIcons() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    
    for (const tab of tabs) {
      const originalData = originalTabData.get(tab.id);
      if (originalData && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (title, favicon) => {
              if (title) document.title = title;
              if (favicon) {
                let link = document.querySelector("link[rel*='icon']");
                if (link) {
                  link.href = favicon;
                }
              }
            },
            args: [originalData.title, originalData.favIconUrl]
          });
        } catch (error) {
          console.warn(`Could not restore tab ${tab.id}:`, error);
        }
      }
    }
    
    originalTabData.clear();
  } catch (error) {
    console.error('Error restoring tab names and icons:', error);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setInterval') {
    randomizeInterval = request.interval;
    if (intervalId) {
      startRandomization();
    }
    sendResponse({ success: true });
  } else if (request.action === 'setMode') {
    randomizeMode = request.mode;
    if (intervalId) {
      startRandomization();
    }
    chrome.storage.local.set({ randomizeMode: randomizeMode });
    sendResponse({ success: true });
  } else if (request.action === 'start') {
    startRandomization();
    sendResponse({ success: true });
  } else if (request.action === 'stop') {
    stopRandomization();
    restoreTabNamesAndIcons();
    sendResponse({ success: true });
  } else if (request.action === 'getStatus') {
    sendResponse({ 
      isRunning: intervalId !== null,
      interval: randomizeInterval,
      mode: randomizeMode
    });
  } else if (request.action === 'randomizeNow') {
    randomizeTabs().then(() => {
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === 'restore') {
    restoreTabNamesAndIcons().then(() => {
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === 'openTestTabs') {
    openTestTabs().then((success) => {
      sendResponse({ success: success });
    });
    return true;
  }
  return true;
});

// Load saved settings on startup
chrome.storage.local.get(['randomizeInterval', 'randomizeMode', 'isRunning'], (result) => {
  if (result.randomizeInterval) {
    randomizeInterval = result.randomizeInterval;
  }
  if (result.randomizeMode) {
    randomizeMode = result.randomizeMode;
  }
  if (result.isRunning) {
    startRandomization();
  }
});

// Clean up when extension is disabled/uninstalled
chrome.runtime.onSuspend.addListener(() => {
  stopRandomization();
  restoreTabNamesAndIcons();
});
