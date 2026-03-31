import type { StorageTestData } from '../types/storage';
import * as sync from './sync';

/**
 * 注意力队列 - Service Worker (MV3)
 *
 * 设计原则 (ARC-04 无状态设计):
 * - 所有状态存储在 chrome.storage.local，不使用全局变量
 * - 事件驱动架构，每个 listener 独立工作
 * - Service Worker 可能随时被终止和重启
 */

// ============================================
// 扩展生命周期事件
// ============================================

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Attention Queue] Extension installed:', details.reason);

  // ARC-03: 验证 chrome.storage.local 写入
  const testData: StorageTestData = {
    timestamp: Date.now(),
    message: `Extension ${details.reason} at ${new Date().toISOString()}`,
  };

  try {
    await chrome.storage.local.set({
      'test_data': testData,
      'extension_installed_at': Date.now(),
    });
    console.log('[Attention Queue] Storage write SUCCESS:', testData);
  } catch (error) {
    console.error('[Attention Queue] Storage write FAILED:', error);
  }

  // ARC-03: 验证 chrome.storage.local 读取
  try {
    const result = await chrome.storage.local.get('test_data');
    console.log('[Attention Queue] Storage read SUCCESS:', result.test_data);

    if (result.test_data && result.test_data.timestamp === testData.timestamp) {
      console.log('[Attention Queue] Storage read/write VERIFIED: data matches');
    } else {
      console.error('[Attention Queue] Storage MISMATCH: written data does not match read data');
    }
  } catch (error) {
    console.error('[Attention Queue] Storage read FAILED:', error);
  }

  // ARC-02: 验证 chrome.tabGroups API
  try {
    const tabGroups = await chrome.tabGroups.query({});
    console.log('[Attention Queue] tabGroups.query SUCCESS:', tabGroups.length, 'groups found');
    tabGroups.forEach((group) => {
      console.log(`  - Group: "${group.title || '(untitled)'}" color: ${group.color}`);
    });
  } catch (error) {
    console.error('[Attention Queue] tabGroups.query FAILED:', error);
  }

  // ARC-02: 验证 chrome.tabs API
  try {
    const tabs = await chrome.tabs.query({});
    console.log('[Attention Queue] tabs.query SUCCESS:', tabs.length, 'tabs found');
  } catch (error) {
    console.error('[Attention Queue] tabs.query FAILED:', error);
  }

  console.log('[Attention Queue] === Phase 1 verification complete ===');

  // Phase 2: 初始同步现有标签组
  console.log('[Tab Sync] Starting initial sync...');
  try {
    const groups = await chrome.tabGroups.query({});
    let records = await sync.getAllRecords();

    for (const group of groups) {
      const tabs = await chrome.tabs.query({ groupId: group.id });
      for (const tab of tabs) {
        if (tab.url && tab.title) {
          records = sync.upsertRecord(records, tab, group);
        }
      }
    }

    await sync.saveAllRecords(records);
    console.log('[Tab Sync] Initial sync complete:', records.length, 'records');
  } catch (error) {
    console.error('[Tab Sync] Initial sync failed:', error);
  }
});

// ============================================
// Service Worker 启动日志（验证重启后状态恢复）
// ============================================

(async () => {
  console.log('[Attention Queue] Service Worker started');

  // 验证 Service Worker 重启后数据仍可读取 (ARC-03 + ARC-04)
  try {
    const result = await chrome.storage.local.get(['test_data', 'extension_installed_at']);
    if (result.test_data) {
      console.log('[Attention Queue] Persisted data found from:', new Date(result.test_data.timestamp).toISOString());
      console.log('[Attention Queue] Storage persistence VERIFIED across SW restart');
    } else {
      console.log('[Attention Queue] No persisted data yet (first run or storage cleared)');
    }
  } catch (error) {
    console.error('[Attention Queue] Failed to read persisted data:', error);
  }
})();

// ============================================
// Phase 2: 标签组同步事件监听
// ============================================

// Debounce map for group updates
const groupUpdateTimers = new Map<number, number>();

chrome.tabGroups.onCreated.addListener(async (group) => {
  console.log('[Tab Sync] Group created:', group.id, group.title);
  try {
    const tabs = await chrome.tabs.query({ groupId: group.id });
    let records = await sync.getAllRecords();

    for (const tab of tabs) {
      if (tab.url && tab.title) {
        records = sync.upsertRecord(records, tab, group);
      }
    }

    await sync.saveAllRecords(records);
    console.log('[Tab Sync] Group created, synced', tabs.length, 'tabs');
  } catch (error) {
    console.error('[Tab Sync] Failed to sync created group:', error);
  }
});

chrome.tabGroups.onUpdated.addListener(async (group) => {
  console.log('[Tab Sync] Group updated:', group.id, group.title);

  // Clear existing timer
  if (groupUpdateTimers.has(group.id)) {
    clearTimeout(groupUpdateTimers.get(group.id));
  }

  // Set new timer (2000ms debounce)
  const timerId = setTimeout(async () => {
    try {
      let records = await sync.getAllRecords();
      records = sync.updateGroupInfo(records, group.id, group.title || '(untitled)', group.color);
      await sync.saveAllRecords(records);
      console.log('[Tab Sync] Group info updated (debounced)');
      groupUpdateTimers.delete(group.id);
    } catch (error) {
      console.error('[Tab Sync] Failed to update group:', error);
    }
  }, 2000);

  groupUpdateTimers.set(group.id, timerId as unknown as number);
});

chrome.tabGroups.onRemoved.addListener(async (group) => {
  console.log('[Tab Sync] Group removed:', group.id);
  try {
    let records = await sync.getAllRecords();
    records = sync.deleteRecordsByGroupId(records, group.id);
    await sync.saveAllRecords(records);
    console.log('[Tab Sync] Group records deleted');
  } catch (error) {
    console.error('[Tab Sync] Failed to delete group records:', error);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.groupId) return;

  console.log('[Tab Sync] Tab groupId changed:', tabId, changeInfo.groupId);
  try {
    let records = await sync.getAllRecords();

    if (changeInfo.groupId === -1) {
      records = sync.deleteRecordByTabId(records, tabId);
      await sync.saveAllRecords(records);
      console.log('[Tab Sync] Tab removed from group');
      return;
    }

    const group = await chrome.tabGroups.get(changeInfo.groupId);
    if (tab.url && tab.title) {
      records = sync.upsertRecord(records, tab, group);
      await sync.saveAllRecords(records);
      console.log('[Tab Sync] Tab added to group:', group.title);
    }
  } catch (error) {
    console.error('[Tab Sync] Failed to sync tab update:', error);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  console.log('[Tab Sync] Tab removed:', tabId);
  try {
    let records = await sync.getAllRecords();
    records = sync.deleteRecordByTabId(records, tabId);
    await sync.saveAllRecords(records);
    console.log('[Tab Sync] Tab record deleted');
  } catch (error) {
    console.error('[Tab Sync] Failed to delete tab record:', error);
  }
});

// ============================================
// Phase 3: 搜索面板快捷键
// ============================================

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-search") {
    console.log('[Search Panel] Toggle command received');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) {
        console.warn('[Search Panel] No active tab found');
        return;
      }

      // 检查是否是特殊页面（chrome://, edge://, about:, etc.）
      if (tab.url && (
        tab.url.startsWith('chrome://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:') ||
        tab.url.startsWith('chrome-extension://')
      )) {
        console.warn('[Search Panel] Cannot inject on special pages:', tab.url);
        return;
      }

      // 尝试发送消息
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SEARCH_PANEL' });
        console.log('[Search Panel] Message sent to tab:', tab.id);
      } catch (sendError: any) {
        // 如果 content script 还没加载，尝试注入
        if (sendError.message?.includes('Could not establish connection')) {
          console.log('[Search Panel] Content script not ready, injecting...');
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['src/content/index.tsx']
            });
            // 等待一小段时间让 content script 初始化
            await new Promise(resolve => setTimeout(resolve, 100));
            // 重试发送消息
            await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SEARCH_PANEL' });
            console.log('[Search Panel] Message sent after injection');
          } catch (injectError) {
            console.error('[Search Panel] Failed to inject content script:', injectError);
          }
        } else {
          throw sendError;
        }
      }
    } catch (error) {
      console.error('[Search Panel] Failed to send message:', error);
    }
  }
});

// 监听来自 content script 和 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_URL') {
    console.log('[Background] Opening URL:', message.url);
    chrome.tabs.create({ url: message.url }, (tab) => {
      console.log('[Background] Tab created:', tab.id);
      sendResponse({ success: true, tabId: tab.id });
    });
    return true;
  }

  if (message.type === 'TOGGLE_SEARCH_FROM_POPUP') {
    console.log('[Background] Toggle search from popup for tab:', message.tabId);

    (async () => {
      try {
        await chrome.tabs.sendMessage(message.tabId, { type: 'TOGGLE_SEARCH_PANEL' });
        sendResponse({ success: true });
      } catch (error: any) {
        // Content script 未加载，尝试注入
        if (error.message?.includes('Could not establish connection')) {
          console.log('[Background] Content script not loaded, injecting...');
          try {
            await chrome.scripting.executeScript({
              target: { tabId: message.tabId },
              files: ['src/content/index.tsx']
            });
            await chrome.scripting.insertCSS({
              target: { tabId: message.tabId },
              files: ['src/content/index.css']
            });
            await new Promise(resolve => setTimeout(resolve, 100));
            await chrome.tabs.sendMessage(message.tabId, { type: 'TOGGLE_SEARCH_PANEL' });
            sendResponse({ success: true });
          } catch (injectError) {
            console.error('[Background] Failed to inject:', injectError);
            sendResponse({ success: false, error: 'injection_failed' });
          }
        } else {
          sendResponse({ success: false, error: error.message });
        }
      }
    })();

    return true;
  }
});
