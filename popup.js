document.addEventListener('DOMContentLoaded', async () => {
  // Initialize i18n
  initializeI18n();

  const loadingDiv = document.getElementById('loading');
  const resultsDiv = document.getElementById('results');
  const errorDiv = document.getElementById('error');

  try {
    // Background script'ten veri al
    const response = await chrome.runtime.sendMessage({ action: 'getTechData' });

    if (response && response.data) {
      displayResults(response.data);
    } else {
      // Eğer veri yoksa, content script'i yeniden çalıştır
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      // Biraz bekle ve tekrar dene
      setTimeout(async () => {
        const newResponse = await chrome.runtime.sendMessage({ action: 'getTechData' });
        if (newResponse && newResponse.data) {
          displayResults(newResponse.data);
        } else {
          showError();
        }
      }, 1000);
    }
  } catch (error) {
    console.error('Error:', error);
    showError();
  }


  // Copy JSON
  const copyBtn = document.getElementById('copy-json');
  copyBtn.addEventListener('click', async () => {
    try {
      const resp = await chrome.runtime.sendMessage({ action: 'getTechData' });
      const data = resp?.data || {};
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      copyBtn.textContent = t('copied');
      setTimeout(() => copyBtn.textContent = t('copyJson'), 1200);
    } catch (e) {
      copyBtn.textContent = t('failed');
      setTimeout(() => copyBtn.textContent = t('copyJson'), 1200);
    }
  });

  // Test sites openers
  document.querySelectorAll('.open-site').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      chrome.tabs.create({ url });
    });
  });
});

function displayResults(data) {
  const loadingDiv = document.getElementById('loading');
  const resultsDiv = document.getElementById('results');

  loadingDiv.style.display = 'none';
  resultsDiv.style.display = 'block';

  // Frameworks
  const frameworksDiv = document.getElementById('frameworks');
  displayTechCategory(frameworksDiv, data.frameworks);

  // CSS Frameworks
  const cssFrameworksDiv = document.getElementById('css-frameworks');
  displayTechCategory(cssFrameworksDiv, data.cssFrameworks);

  // Analytics
  const analyticsDiv = document.getElementById('analytics');
  displayTechCategory(analyticsDiv, data.analytics);

  // CMS
  const cmsDiv = document.getElementById('cms');
  displayTechCategory(cmsDiv, data.cms);

  // Libraries
  const librariesDiv = document.getElementById('libraries');
  displayTechCategory(librariesDiv, data.libraries);

  // Backend
  const backendDiv = document.getElementById('backend');
  displayTechCategory(backendDiv, data.backend);

  // Databases
  const databasesDiv = document.getElementById('databases');
  displayTechCategory(databasesDiv, data.databases);

  // Hosting
  const hostingDiv = document.getElementById('hosting');
  displayTechCategory(hostingDiv, data.hosting);
}

function displayTechCategory(container, techs) {
  container.innerHTML = '';

  if (techs.length === 0) {
    const noTechDiv = document.createElement('div');
    noTechDiv.className = 'no-tech';
    noTechDiv.textContent = t('noTechDetected');
    container.appendChild(noTechDiv);
    return;
  }

  techs.forEach(tech => {
    const techDiv = document.createElement('div');
    techDiv.className = 'tech-item';

    const badge = document.createElement('span');
    badge.className = 'tech-badge';

    // Show version if it exists and is not "Unknown"
    let displayText = tech.name;
    if (tech.version && tech.version !== 'Unknown') {
      displayText += ` ${tech.version}`;
    }
    if (tech.inferred) {
      displayText += ' *';
      badge.title = t('inferred');
    }

    badge.textContent = displayText;
    techDiv.appendChild(badge);
    container.appendChild(techDiv);
  });
}




function initializeI18n() {
  // Update title
  document.getElementById('title').textContent = t('title');

  // Update loading text
  document.getElementById('loading').textContent = t('analyzing');

  // Update error text
  document.getElementById('error').textContent = t('error');

  // Update category titles
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = t(key);
  });
}

function showError() {
  const loadingDiv = document.getElementById('loading');
  const errorDiv = document.getElementById('error');

  loadingDiv.style.display = 'none';
  errorDiv.style.display = 'block';
}

// (debug log removed)
