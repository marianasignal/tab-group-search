document.getElementById('openSearch').addEventListener('click', async () => {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'TOGGLE_SEARCH_FROM_POPUP' });
    if (!response?.success) {
      throw new Error(response?.error || 'Search could not be opened');
    }
    window.close();
  } catch (error) {
    console.error('[Popup] Failed to open search:', error);
    document.getElementById('openSearch').textContent = '打开失败，请点击重试';
  }
});
