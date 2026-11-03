document.getElementById('openSearch').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log('[Popup] Clicked on tab:', tab.id, tab.url);

  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
    console.log('[Popup] Special page detected, delegating to background');
    // 通知 background 处理（popup 关闭后监听器会被销毁）
    chrome.runtime.sendMessage({
      type: 'OPEN_SEARCH_IN_NEW_TAB',
      notification: {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: '标签组检索插件',
        message: '本页面无法启动搜索面板，即将跳转到 Google'
      }
    });
    window.close();
    return;
  }

  // 普通页面：先尝试直接发送，失败则通过 background
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SEARCH_PANEL' });
    console.log('[Popup] Direct message sent successfully');
  } catch (e) {
    console.log('[Popup] Direct message failed, using background:', e.message);
    chrome.runtime.sendMessage({ type: 'TOGGLE_SEARCH_FROM_POPUP', tabId: tab.id });
  }
  window.close();
});
