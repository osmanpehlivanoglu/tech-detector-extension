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

function detectFromHeaders(responseHeaders, url) {
  const detections = {
    frameworks: [], cssFrameworks: [], analytics: [], cms: [], libraries: [], backend: [], databases: [], hosting: []
  };

  const headers = {};
  (responseHeaders || []).forEach(h => {
    const key = h.name.toLowerCase();
    const val = h.value || '';
    // Preserve multiple values by concatenation
    headers[key] = headers[key] ? `${headers[key]}, ${val}` : val;
  });

  const server = headers['server'] || '';
  const powered = headers['x-powered-by'] || headers['powered-by'] || '';

  // Backend
  if (/next\.js/i.test(powered) || /next\.js/i.test(server) ||
      headers['x-nextjs-matched-path'] || headers['x-nextjs-cache']) {
    mergeCategory(detections.backend, { name: 'Next.js API' });
  }
  // Koa
  if (/koa/i.test(powered) || /koa/i.test(server)) {
    mergeCategory(detections.backend, { name: 'Koa' });
  }
  // NestJS
  if (/nestjs/i.test(powered) || headers['x-nestjs']) {
    mergeCategory(detections.backend, { name: 'NestJS' });
  }
  // ASP.NET / ASP.NET Core
  if (/asp\.net/i.test(powered) || /kestrel/i.test(server) || /(x-aspnet|x-aspnetmvc)/i.test(Object.keys(headers).join(',')) ||
      /\.aspnetcore\./i.test(headers['set-cookie'] || '')) {
    mergeCategory(detections.backend, { name: 'ASP.NET' });
  }
  // Strapi
  if (/strapi/i.test(powered) || /strapi/i.test(server)) {
    mergeCategory(detections.backend, { name: 'Strapi' });
  }
  // Generic PHP detection via headers
  if (/php/i.test(powered) || /php/i.test(server) || /phpsessid=/i.test(headers['set-cookie'] || '')) {
    mergeCategory(detections.backend, { name: 'PHP' });
  }
  // Laravel via headers
  if (/laravel/i.test(powered) || /laravel_session=/i.test(headers['set-cookie'] || '') || /xsrf-token=/i.test(headers['set-cookie'] || '')) {
    mergeCategory(detections.backend, { name: 'Laravel' });
  }
  // Symfony via headers
  if (headers['x-debug-token'] || headers['x-debug-token-link'] || headers['x-symfony-cache']) {
    mergeCategory(detections.backend, { name: 'Symfony' });
  }
  if (/express/i.test(powered)) {
    mergeCategory(detections.backend, { name: 'Express.js' });
    mergeCategory(detections.backend, { name: 'Node.js' });
  }

  // Hosting/CDN
  if (headers['x-vercel-id'] || headers['x-vercel-cache'] || /vercel/i.test(server) || headers['x-matched-path']) {
    mergeCategory(detections.hosting, { name: 'Vercel' });
  }
  if (headers['x-nf-request-id']) {
    mergeCategory(detections.hosting, { name: 'Netlify' });
  }
  if (headers['cf-ray'] || /cloudflare/i.test(server)) {
    mergeCategory(detections.hosting, { name: 'Cloudflare' });
  }
  if (headers['x-amz-cf-pop'] || /cloudfront/i.test(server) || /amazonaws/i.test(url)) {
    mergeCategory(detections.hosting, { name: 'AWS' });
  }
  if (/cowboy/i.test(server) || /vegur/i.test(headers['via'] || '')) {
    mergeCategory(detections.hosting, { name: 'Heroku' });
  }

  // CMS via headers
  if (/drupal/i.test(headers['x-generator'] || '')) {
    mergeCategory(detections.cms, { name: 'Drupal' });
  }
  if (headers['x-magento-cache-debug'] || headers['x-magento-tags'] || /magento/i.test(powered)) {
    mergeCategory(detections.cms, { name: 'Magento' });
  }
  if (/shopify/i.test(server) || /shopify/i.test(powered) || /x-shopify/i.test(Object.keys(headers).join(','))) {
    mergeCategory(detections.cms, { name: 'Shopify' });
  }
  // OpenCart
  if (/opencart/i.test(headers['x-powered-by'] || '') || /ocsessid=/i.test(headers['set-cookie'] || '')) {
    mergeCategory(detections.cms, { name: 'OpenCart' });
  }
  // PrestaShop
  if (/prestashop/i.test(headers['x-powered-by'] || '') || /prestashop/i.test(headers['set-cookie'] || '')) {
    mergeCategory(detections.cms, { name: 'PrestaShop' });
  }

  return detections;
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

// Observe response headers to improve backend/hosting detection
if (chrome.webRequest && chrome.webRequest.onHeadersReceived) {
  try {
    chrome.webRequest.onHeadersReceived.addListener(
      (details) => {
        const tabId = details.tabId;
        if (tabId < 0) return;
        if (settings.activeTabOnly && tabId !== activeTabId) return;
        const additions = detectFromHeaders(details.responseHeaders, details.url);
        detectedTechsCache[tabId] = mergeDetections(detectedTechsCache[tabId], additions);
      },
      { urls: ["<all_urls>"], types: ["main_frame", "xmlhttprequest", "sub_frame", "websocket", "other"] },
      ["responseHeaders", "extraHeaders"]
    );
  } catch (e) {
    // Fail open: don't break service worker if filters are invalid on a browser
    console.warn('webRequest listener registration failed:', e);
  }
}

// Observe outgoing requests to infer services from URLs (e.g., Supabase)
if (chrome.webRequest && chrome.webRequest.onBeforeRequest) {
  try {
    chrome.webRequest.onBeforeRequest.addListener(
      (details) => {
        const { tabId, url } = details;
        if (tabId < 0 || !url) return;
        if (settings.activeTabOnly && tabId !== activeTabId) return;
        const additions = {
          frameworks: [], cssFrameworks: [], analytics: [], cms: [], libraries: [], backend: [], databases: [], hosting: []
        };

        // Supabase REST/Realtime endpoints
        if (/\.supabase\.co\//i.test(url) || /supabase\.(io|co|com)/i.test(url)) {
          mergeCategory(additions.databases, { name: 'Supabase' });
          mergeCategory(additions.databases, { name: 'PostgreSQL', inferred: true });
        }

        // Next.js API calls (same-origin /api/ is a strong indicator)
        try {
          const u = new URL(url);
          if (u.pathname.startsWith('/api/')) {
            mergeCategory(additions.backend, { name: 'Next.js API' });
          }
          // Next.js asset/data routes
          if (u.pathname.includes('/_next/data') || u.pathname.startsWith('/_next/')) {
            mergeCategory(additions.frameworks, { name: 'Next.js' });
          }
        } catch {}

        if (additions.backend.length || additions.databases.length || additions.frameworks.length) {
          detectedTechsCache[tabId] = mergeDetections(detectedTechsCache[tabId], additions);
        }
      },
      { urls: ["<all_urls>"], types: ["xmlhttprequest", "websocket", "other"] }
    );
  } catch (e) {
    console.warn('webRequest onBeforeRequest registration failed:', e);
  }
}

// Detect Supabase client via request headers
if (chrome.webRequest && chrome.webRequest.onBeforeSendHeaders) {
  try {
    chrome.webRequest.onBeforeSendHeaders.addListener(
      (details) => {
        const { tabId, requestHeaders } = details;
        if (tabId < 0 || !requestHeaders) return;
        if (settings.activeTabOnly && tabId !== activeTabId) return;
        const headers = {};
        requestHeaders.forEach(h => headers[h.name.toLowerCase()] = h.value || '');
        const xClient = headers['x-client-info'] || '';
        const apikey = headers['apikey'] || '';
        if (/supabase/i.test(xClient) || (/^eyJ/.test(apikey) && apikey.length > 50)) {
          const additions = { frameworks: [], cssFrameworks: [], analytics: [], cms: [], libraries: [], backend: [], databases: [{ name: 'Supabase' }, { name: 'PostgreSQL', inferred: true }], hosting: [] };
          detectedTechsCache[tabId] = mergeDetections(detectedTechsCache[tabId], additions);
        }
      },
      { urls: ["<all_urls>"] },
      ["requestHeaders", "extraHeaders"]
    );
  } catch (e) {
    console.warn('webRequest onBeforeSendHeaders registration failed:', e);
  }
}
