// Service Worker for 注意力队列 Chrome Extension
// Phase 1: 基础骨架，验证扩展可加载

console.log('[Attention Queue] Service Worker registered');

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Attention Queue] Extension installed:', details.reason);
});
