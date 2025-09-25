let detectedTechsCache = {};
let settings = {
  activeTabOnly: true
};
let activeTabId = -1;

function loadSettings() {
  try {
    chrome.storage?.sync?.get(settings, (vals) => {
      if (vals) settings = Object.assign({}, settings, vals);
    });
  } catch {}
}

loadSettings();
chrome.storage?.onChanged?.addListener((changes, area) => {
  if (area === 'sync') {
    for (const [k, v] of Object.entries(changes)) {
      settings[k] = v.newValue;
    }
  }
});

function updateActiveTab(tabId) {
  if (typeof tabId === 'number' && tabId >= 0) activeTabId = tabId;
}

chrome.tabs?.onActivated?.addListener(({ tabId }) => updateActiveTab(tabId));
chrome.windows?.onFocusChanged?.addListener(async () => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) updateActiveTab(tabs[0].id);
  } catch {}
});


function mergeCategory(list, item) {
  if (!list.find(e => e.name === item.name)) list.push(item);
}

function mergeDetections(base, extra) {
  const categories = [
    'frameworks', 'cssFrameworks', 'analytics', 'cms', 'libraries', 'backend', 'databases', 'hosting'
  ];
  const result = base || {
    frameworks: [], cssFrameworks: [], analytics: [], cms: [], libraries: [], backend: [], databases: [], hosting: []
  };
  for (const cat of categories) {
    if (extra?.[cat]) {
      extra[cat].forEach(item => mergeCategory(result[cat], item));
    }
  }
  return result;
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'techDetected') {
    const tabId = sender.tab.id;
    detectedTechsCache[tabId] = mergeDetections(detectedTechsCache[tabId], message.data);
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getTechData') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const techData = detectedTechsCache[currentTab.id] || null;
      sendResponse({ data: techData });
    });
    return true;
  }
});

// Note: webRequest API is not available in Manifest V3 service workers
// Network detection has been moved to content scripts
