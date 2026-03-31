document.getElementById('openSearch').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    alert('无法在 Chrome 特殊页面使用搜索面板\n请在普通网页中使用 Ctrl+Space 快捷键');
    return;
  }

  chrome.runtime.sendMessage({ type: 'TOGGLE_SEARCH_FROM_POPUP', tabId: tab.id });
  window.close();
});
