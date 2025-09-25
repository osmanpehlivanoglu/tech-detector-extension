// Browser API compatibility
const runtime = (typeof browser !== 'undefined' && browser.runtime) || (typeof chrome !== 'undefined' && chrome.runtime);
const storage = (typeof browser !== 'undefined' && browser.storage) || (typeof chrome !== 'undefined' && chrome.storage);
const tabs = (typeof browser !== 'undefined' && browser.tabs) || (typeof chrome !== 'undefined' && chrome.tabs);
const windows = (typeof browser !== 'undefined' && browser.windows) || (typeof chrome !== 'undefined' && chrome.windows);
const scripting = (typeof browser !== 'undefined' && browser.scripting) || (typeof chrome !== 'undefined' && chrome.scripting);
const action = (typeof browser !== 'undefined' && browser.action) || (typeof chrome !== 'undefined' && chrome.action);

let detectedTechsCache = {};
let settings = {
  activeTabOnly: true
};
let activeTabId = -1;

function loadSettings() {
  try {
    storage?.sync?.get(settings, (vals) => {
      if (vals) settings = Object.assign({}, settings, vals);
    });
  } catch {}
}

loadSettings();
storage?.onChanged?.addListener((changes, area) => {
  if (area === 'sync') {
    for (const [k, v] of Object.entries(changes)) {
      settings[k] = v.newValue;
    }
  }
});

function updateActiveTab(tabId) {
  if (typeof tabId === 'number' && tabId >= 0) activeTabId = tabId;
}

tabs?.onActivated?.addListener(({ tabId }) => updateActiveTab(tabId));
windows?.onFocusChanged?.addListener(async () => {
  try {
    const tabs = await tabs.query({ active: true, currentWindow: true });
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


// Single message handler for all actions
runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'techDetected') {
    const tabId = sender.tab?.id;
    if (tabId) {
      detectedTechsCache[tabId] = mergeDetections(detectedTechsCache[tabId], message.data);
    }
    return false;
  }

  if (message.action === 'getTechData') {
    tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const techData = detectedTechsCache[currentTab?.id] || null;
      sendResponse({ data: techData });
    });
    return true; // Keep connection alive for async response
  }

  return false;
});

action?.onClicked?.addListener((tab) => {
  scripting?.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});

// Note: webRequest API is not available in Manifest V3 service workers
// Network detection has been moved to content scripts
