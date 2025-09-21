const DEFAULTS = {
  enableChunkScan: true,
  chunkScanMaxFiles: 15,
  chunkScanMaxTimeMs: 500,
  activeTabOnly: true,
  
};

function restore() {
  chrome.storage.sync.get(DEFAULTS, (values) => {
    document.getElementById('enableChunkScan').checked = !!values.enableChunkScan;
    document.getElementById('activeTabOnly').checked = !!values.activeTabOnly;
    document.getElementById('chunkScanMaxFiles').value = values.chunkScanMaxFiles;
    document.getElementById('chunkScanMaxTimeMs').value = values.chunkScanMaxTimeMs;
  });
}

function save() {
  const values = {
    enableChunkScan: document.getElementById('enableChunkScan').checked,
    activeTabOnly: document.getElementById('activeTabOnly').checked,
    chunkScanMaxFiles: Number(document.getElementById('chunkScanMaxFiles').value) || DEFAULTS.chunkScanMaxFiles,
    chunkScanMaxTimeMs: Number(document.getElementById('chunkScanMaxTimeMs').value) || DEFAULTS.chunkScanMaxTimeMs,
    
  };
  chrome.storage.sync.set(values, () => {
    const status = document.getElementById('status');
    status.textContent = 'Saved';
    setTimeout(() => status.textContent = '', 1200);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  restore();
  document.getElementById('saveBtn').addEventListener('click', save);
});
