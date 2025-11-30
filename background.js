// Default interval in seconds (5 seconds)
let randomizeInterval = 5;
let intervalId = null;

// Function to randomize tab order
async function randomizeTabs() {
  try {
    // Get all tabs in the current window
    const tabs = await chrome.tabs.query({ currentWindow: true });
    
    // Filter out pinned tabs (we'll keep them in their positions)
    const unpinnedTabs = tabs.filter(tab => !tab.pinned);
    const pinnedTabs = tabs.filter(tab => tab.pinned);
    
    if (unpinnedTabs.length <= 1) {
      return; // No need to randomize if there's 0 or 1 unpinned tab
    }
    
    // Create an array of tab indices
    const indices = unpinnedTabs.map((_, index) => index);
    
    // Fisher-Yates shuffle algorithm
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    // Move tabs to their new positions
    // We need to move from the end to avoid index shifting issues
    for (let i = indices.length - 1; i >= 0; i--) {
      const originalIndex = indices[i];
      const newIndex = i + pinnedTabs.length; // Add pinned tabs offset
      if (originalIndex !== i) {
        await chrome.tabs.move(unpinnedTabs[originalIndex].id, { index: newIndex });
      }
    }
  } catch (error) {
    console.error('Error randomizing tabs:', error);
  }
}

// Start the randomization interval
function startRandomization() {
  // Clear any existing interval
  if (intervalId) {
    clearInterval(intervalId);
  }
  
  // Convert seconds to milliseconds
  const intervalMs = randomizeInterval * 1000;
  
  // Start new interval
  intervalId = setInterval(randomizeTabs, intervalMs);
  
  // Save state to storage
  chrome.storage.local.set({ 
    isRunning: true,
    randomizeInterval: randomizeInterval 
  });
  
  console.log(`Tab randomization started with interval: ${randomizeInterval} seconds`);
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

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setInterval') {
    randomizeInterval = request.interval;
    if (intervalId) {
      startRandomization(); // Restart with new interval
    }
    sendResponse({ success: true });
  } else if (request.action === 'start') {
    startRandomization();
    chrome.storage.local.set({ isRunning: true });
    sendResponse({ success: true });
  } else if (request.action === 'stop') {
    stopRandomization();
    chrome.storage.local.set({ isRunning: false });
    sendResponse({ success: true });
  } else if (request.action === 'getStatus') {
    sendResponse({ 
      isRunning: intervalId !== null,
      interval: randomizeInterval 
    });
  } else if (request.action === 'randomizeNow') {
    randomizeTabs().then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep the message channel open for async response
  }
  return true; // Keep the message channel open for async response
});

// Load saved interval from storage on startup
chrome.storage.local.get(['randomizeInterval', 'isRunning'], (result) => {
  if (result.randomizeInterval) {
    randomizeInterval = result.randomizeInterval;
  }
  if (result.isRunning) {
    startRandomization();
  }
});

