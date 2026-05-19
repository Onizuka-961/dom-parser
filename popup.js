const extractButton = document.getElementById('extract-dom');
const downloadButton = document.getElementById('download-dom');
const statusElement = document.getElementById('status');
const outputElement = document.getElementById('dom-output');

let extractedDom = '';

function setStatus(message) {
  statusElement.textContent = message;
}

function getFileName(url) {
  try {
    const hostname = new URL(url).hostname || 'page';
    return `${hostname.replace(/[^a-z0-9.-]/gi, '_')}-dom.html`;
  } catch {
    return 'page-dom.html';
  }
}

async function extractDomFromActiveTab() {
  setStatus('Extracting...');
  downloadButton.disabled = true;
  extractedDom = '';

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!activeTab || !activeTab.id) {
    throw new Error('No active tab found.');
  }

  const [result] = await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    func: () => document.documentElement.outerHTML,
  });

  if (!result || typeof result.result !== 'string') {
    throw new Error('Unable to extract the DOM.');
  }

  extractedDom = result.result;
  outputElement.value = extractedDom;
  downloadButton.disabled = false;
  setStatus('DOM extracted successfully.');
}

extractButton.addEventListener('click', async () => {
  try {
    await extractDomFromActiveTab();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.';
    outputElement.value = '';
    setStatus(`Error: ${message}`);
  }
});

downloadButton.addEventListener('click', async () => {
  if (!extractedDom) {
    return;
  }

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const blob = new Blob([extractedDom], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = getFileName(activeTab?.url || '');
  a.click();

  URL.revokeObjectURL(url);
  setStatus('DOM file downloaded.');
});
