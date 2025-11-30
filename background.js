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

// Function to create a derangement (permutation where no element is in its original position)
function createDerangement(length) {
  if (length <= 1) return [0];
  if (length === 2) return [1, 0];
  
  let derangement = [];
  let attempts = 0;
  
  // Keep trying until we get a valid derangement
  do {
    derangement = Array.from({ length }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = derangement.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [derangement[i], derangement[j]] = [derangement[j], derangement[i]];
    }
    attempts++;
    // Check if it's a valid derangement (no element in original position)
    const isValid = derangement.every((val, idx) => val !== idx);
    if (isValid) break;
  } while (attempts < 100); // Safety limit
  
  // If we still don't have a derangement, force swaps to ensure no fixed points
  if (derangement.some((val, idx) => val === idx)) {
    // Find all fixed points
    const fixedPoints = [];
    for (let i = 0; i < derangement.length; i++) {
      if (derangement[i] === i) {
        fixedPoints.push(i);
      }
    }
    // Swap fixed points in pairs
    for (let i = 0; i < fixedPoints.length - 1; i += 2) {
      const idx1 = fixedPoints[i];
      const idx2 = fixedPoints[i + 1];
      [derangement[idx1], derangement[idx2]] = [derangement[idx2], derangement[idx1]];
    }
    // If odd number of fixed points, swap last one with a random non-fixed point
    if (fixedPoints.length % 2 === 1) {
      const lastFixed = fixedPoints[fixedPoints.length - 1];
      for (let i = 0; i < derangement.length; i++) {
        if (i !== lastFixed && derangement[i] !== i) {
          [derangement[lastFixed], derangement[i]] = [derangement[i], derangement[lastFixed]];
          break;
        }
      }
    }
  }
  
  return derangement;
}

// Function to randomize tab names and icons
async function randomizeTabNamesAndIcons() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    // Filter out pinned tabs, data: URLs (placeholder tabs), chrome:// pages, and placeholder title
    const unpinnedTabs = tabs.filter(tab => 
      !tab.pinned && 
      tab.url && 
      !tab.url.startsWith('data:') && 
      !tab.url.startsWith('chrome://') && 
      !tab.url.startsWith('chrome-extension://') &&
      tab.title !== 'Randomizing Tabs...'
    );
    
    if (unpinnedTabs.length <= 1) {
      return;
    }
    
    // Store original data if not already stored (only for valid tabs)
    for (const tab of unpinnedTabs) {
      // Double-check we're not storing placeholder data
      if (tab.title === 'Randomizing Tabs...' || tab.url.startsWith('data:')) {
        continue;
      }
      if (!originalTabData.has(tab.id)) {
        originalTabData.set(tab.id, {
          title: tab.title,
          favIconUrl: tab.favIconUrl || ''
        });
      }
    }
    
    // Collect titles and favicons from stored original data (skip any that don't have stored data)
    const validTabs = [];
    const titles = [];
    const favicons = [];
    
    for (const tab of unpinnedTabs) {
      const original = originalTabData.get(tab.id);
      // Only include tabs that have original data stored (skip placeholders)
      if (original && original.title !== 'Randomizing Tabs...') {
        validTabs.push(tab);
        titles.push(original.title);
        favicons.push(original.favIconUrl || '');
      }
    }
    
    if (validTabs.length <= 1) {
      return;
    }
    
    // Create derangement to ensure nothing stays in original position
    const derangement = createDerangement(titles.length);
    
    // Apply derangement to create shuffled arrays
    const shuffledTitles = derangement.map(idx => titles[idx]);
    const shuffledFavicons = derangement.map(idx => favicons[idx]);
    
    // Apply shuffled titles and favicons to tabs
    for (let i = 0; i < validTabs.length; i++) {
      const tab = validTabs[i];
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
              
              // Remove all existing favicon links
              const existingIcons = document.querySelectorAll("link[rel*='icon'], link[rel*='shortcut'], link[rel*='apple-touch-icon']");
              existingIcons.forEach(icon => icon.remove());
              
              // Determine the favicon URL to use
              let finalFaviconUrl = faviconUrl;
              if (!finalFaviconUrl && title) {
                // Fallback: create a simple colored circle with first letter
                const firstLetter = title.charAt(0).toUpperCase();
                const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];
                const color = colors[firstLetter.charCodeAt(0) % colors.length];
                finalFaviconUrl = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='${color}'/><text x='50' y='65' font-size='50' text-anchor='middle' fill='white' font-weight='bold'>${firstLetter}</text></svg>`;
              }
              
              if (finalFaviconUrl) {
                // Create primary favicon link
                const link = document.createElement('link');
                link.rel = 'icon';
                link.type = 'image/x-icon';
                link.href = finalFaviconUrl;
                document.head.appendChild(link);
                
                // Also create shortcut icon for better compatibility
                const shortcutLink = document.createElement('link');
                shortcutLink.rel = 'shortcut icon';
                shortcutLink.href = finalFaviconUrl;
                document.head.appendChild(shortcutLink);
                
                // Try to force browser to update favicon by creating a new link element
                // Some browsers cache favicons aggressively
                setTimeout(() => {
                  const forceLink = document.createElement('link');
                  forceLink.rel = 'icon';
                  forceLink.href = finalFaviconUrl + '?t=' + Date.now();
                  document.head.appendChild(forceLink);
                }, 100);
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
async function randomizeTabs(switchToRandomTab = false) {
  if (randomizeMode === 'order') {
    await randomizeTabOrder();
  } else if (randomizeMode === 'names') {
    await randomizeTabNamesAndIcons();
  } else if (randomizeMode === 'both') {
    await randomizeTabOrder();
    await randomizeTabNamesAndIcons();
  }
  
  // Switch to a random tab if requested
  if (switchToRandomTab) {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true, pinned: false });
      if (tabs.length > 0) {
        const randomTab = tabs[Math.floor(Math.random() * tabs.length)];
        await chrome.tabs.update(randomTab.id, { active: true });
      }
    } catch (error) {
      console.error('Error switching to random tab:', error);
    }
  }
}

// Randomize with placeholder tab flow
async function randomizeTabsWithPlaceholder() {
  try {
    // Get current active tab
    const currentTabs = await chrome.tabs.query({ currentWindow: true, active: true });
    const currentTab = currentTabs[0];
    
    // Create placeholder tab
    const placeholderTab = await chrome.tabs.create({
      url: 'data:text/html,<html><head><title>Randomizing Tabs...</title></head><body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin: 0;"><div style="text-align: center;"><h1 style="font-size: 48px; margin: 0 0 20px 0;">🎲</h1><h2 style="margin: 0;">Randomizing your tabs...</h2><p style="margin-top: 20px; opacity: 0.8;">Please wait</p></div></body></html>',
      active: true
    });
    
    // Wait a moment for the placeholder to load
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Perform randomization
    await randomizeTabs(false);
    
    // Wait a bit more to show the randomization happened
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Close placeholder tab
    await chrome.tabs.remove(placeholderTab.id);
    
    // Switch to a random tab
    const tabs = await chrome.tabs.query({ currentWindow: true, pinned: false });
    if (tabs.length > 0) {
      const randomTab = tabs[Math.floor(Math.random() * tabs.length)];
      await chrome.tabs.update(randomTab.id, { active: true });
    }
  } catch (error) {
    console.error('Error in randomizeTabsWithPlaceholder:', error);
    // Fallback to regular randomization
    await randomizeTabs(true);
  }
}

// Start the randomization interval
function startRandomization() {
  if (intervalId) {
    clearInterval(intervalId);
  }
  
  const intervalMs = randomizeInterval * 1000;
  // For automatic intervals, randomize and switch to a random tab
  intervalId = setInterval(() => {
    randomizeTabs(true); // Switch to random tab after randomization
  }, intervalMs);
  
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
      'https://www.reddit.com',
      'https://www.youtube.com',
      'https://www.twitter.com',
      'https://www.linkedin.com',
      'https://www.medium.com',
      'https://www.netflix.com',
      'https://www.amazon.com',
      'https://www.bbc.com',
      'https://www.cnn.com',
      'https://www.nytimes.com',
      'https://www.spotify.com'
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
    randomizeTabsWithPlaceholder().then(() => {
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
