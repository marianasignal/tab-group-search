document.getElementById('openSearch').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
    // 在特殊页面，打开 google.com 并在新标签页打开搜索面板
    const newTab = await chrome.tabs.create({ url: 'https://www.google.com' });
    // 等待页面加载完成
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === newTab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        setTimeout(() => {
          chrome.runtime.sendMessage({ type: 'TOGGLE_SEARCH_FROM_POPUP', tabId: newTab.id });
        }, 500);
      }
    });
    window.close();
    return;
  }

  chrome.runtime.sendMessage({ type: 'TOGGLE_SEARCH_FROM_POPUP', tabId: tab.id });
  window.close();
});
