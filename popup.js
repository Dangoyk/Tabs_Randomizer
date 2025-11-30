// Get DOM elements
const intervalInput = document.getElementById('intervalInput');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const randomizeNowBtn = document.getElementById('randomizeNowBtn');
const statusDiv = document.getElementById('status');

// Update status display
function updateStatus(isRunning, interval) {
  if (isRunning) {
    statusDiv.textContent = `Running (every ${interval}s)`;
    statusDiv.className = 'status running';
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } else {
    statusDiv.textContent = 'Stopped';
    statusDiv.className = 'status stopped';
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

// Load current status on popup open
chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
  if (response) {
    intervalInput.value = response.interval;
    updateStatus(response.isRunning, response.interval);
  }
});

// Start button click
startBtn.addEventListener('click', () => {
  const interval = parseInt(intervalInput.value);
  if (interval < 1) {
    alert('Interval must be at least 1 second');
    return;
  }
  
  chrome.runtime.sendMessage({ 
    action: 'setInterval', 
    interval: interval 
  }, (response) => {
    if (response && response.success) {
      chrome.runtime.sendMessage({ action: 'start' }, (response) => {
        if (response && response.success) {
          updateStatus(true, interval);
          // Save to storage
          chrome.storage.local.set({ 
            randomizeInterval: interval,
            isRunning: true 
          });
        }
      });
    }
  });
});

// Stop button click
stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'stop' }, (response) => {
    if (response && response.success) {
      updateStatus(false, parseInt(intervalInput.value));
      // Save to storage
      chrome.storage.local.set({ isRunning: false });
    }
  });
});

// Randomize Now button click
randomizeNowBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'randomizeNow' }, () => {
    // Visual feedback
    randomizeNowBtn.textContent = 'Randomizing...';
    setTimeout(() => {
      randomizeNowBtn.textContent = 'Randomize Now';
    }, 500);
  });
});

// Update interval when input changes (if running)
intervalInput.addEventListener('change', () => {
  const interval = parseInt(intervalInput.value);
  if (interval < 1) {
    alert('Interval must be at least 1 second');
    intervalInput.value = 1;
    return;
  }
  
  chrome.runtime.sendMessage({ 
    action: 'setInterval', 
    interval: interval 
  }, (response) => {
    if (response && response.success) {
      chrome.storage.local.set({ randomizeInterval: interval });
      // Update status if running
      chrome.runtime.sendMessage({ action: 'getStatus' }, (statusResponse) => {
        if (statusResponse && statusResponse.isRunning) {
          updateStatus(true, interval);
        }
      });
    }
  });
});

