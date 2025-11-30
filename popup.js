// Get DOM elements
const intervalInput = document.getElementById('intervalInput');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const randomizeNowBtn = document.getElementById('randomizeNowBtn');
const testTabsBtn = document.getElementById('testTabsBtn');
const statusDiv = document.getElementById('status');
const modeRadios = document.querySelectorAll('input[name="randomizeMode"]');

// Update status display
function updateStatus(isRunning, interval, mode) {
  const statusIcon = statusDiv.querySelector('.status-icon');
  const statusText = statusDiv.querySelector('span:last-child');
  
  if (isRunning) {
    statusText.textContent = `Running (every ${interval}s) - ${getModeLabel(mode)}`;
    statusDiv.className = 'status running';
    statusIcon.textContent = '▶';
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } else {
    statusText.textContent = 'Stopped';
    statusDiv.className = 'status stopped';
    statusIcon.textContent = '⏸';
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

function getModeLabel(mode) {
  const labels = {
    'order': 'Order',
    'names': 'Names & Icons',
    'both': 'Both'
  };
  return labels[mode] || mode;
}

// Load current status on popup open
chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
  if (response) {
    intervalInput.value = response.interval;
    updateStatus(response.isRunning, response.interval, response.mode);
    
    // Set the correct radio button
    const modeRadio = document.querySelector(`input[value="${response.mode}"]`);
    if (modeRadio) {
      modeRadio.checked = true;
    }
  }
});

// Mode radio button change
modeRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.checked) {
      const mode = radio.value;
      chrome.runtime.sendMessage({ 
        action: 'setMode', 
        mode: mode 
      }, (response) => {
        if (response && response.success) {
          chrome.storage.local.set({ randomizeMode: mode });
          // Update status if running
          chrome.runtime.sendMessage({ action: 'getStatus' }, (statusResponse) => {
            if (statusResponse) {
              updateStatus(statusResponse.isRunning, statusResponse.interval, mode);
            }
          });
        }
      });
    }
  });
});

// Start button click
startBtn.addEventListener('click', () => {
  const interval = parseInt(intervalInput.value);
  if (interval < 1) {
    alert('Interval must be at least 1 second');
    return;
  }
  
  const selectedMode = document.querySelector('input[name="randomizeMode"]:checked').value;
  
  chrome.runtime.sendMessage({ 
    action: 'setInterval', 
    interval: interval 
  }, (response) => {
    if (response && response.success) {
      chrome.runtime.sendMessage({ 
        action: 'setMode', 
        mode: selectedMode 
      }, (response) => {
        if (response && response.success) {
          chrome.runtime.sendMessage({ action: 'start' }, (response) => {
            if (response && response.success) {
              updateStatus(true, interval, selectedMode);
              chrome.storage.local.set({ 
                randomizeInterval: interval,
                randomizeMode: selectedMode,
                isRunning: true 
              });
            }
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
      const selectedMode = document.querySelector('input[name="randomizeMode"]:checked').value;
      updateStatus(false, parseInt(intervalInput.value), selectedMode);
      chrome.storage.local.set({ isRunning: false });
    }
  });
});

// Randomize Now button click
randomizeNowBtn.addEventListener('click', () => {
  const selectedMode = document.querySelector('input[name="randomizeMode"]:checked').value;
  
  chrome.runtime.sendMessage({ 
    action: 'setMode', 
    mode: selectedMode 
  }, (response) => {
    if (response && response.success) {
      chrome.runtime.sendMessage({ action: 'randomizeNow' }, () => {
        // Visual feedback
        const originalText = randomizeNowBtn.textContent;
        randomizeNowBtn.textContent = '🎲 Randomizing...';
        randomizeNowBtn.disabled = true;
        setTimeout(() => {
          randomizeNowBtn.textContent = originalText;
          randomizeNowBtn.disabled = false;
        }, 800);
      });
    }
  });
});

// Test Tabs button click
testTabsBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'openTestTabs' }, (response) => {
    if (response && response.success) {
      // Visual feedback
      const originalText = testTabsBtn.textContent;
      testTabsBtn.textContent = '✅ Test Tabs Opened!';
      testTabsBtn.disabled = true;
      setTimeout(() => {
        testTabsBtn.textContent = originalText;
        testTabsBtn.disabled = false;
      }, 2000);
    }
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
          updateStatus(true, interval, statusResponse.mode);
        }
      });
    }
  });
});
