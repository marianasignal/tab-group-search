import type { StorageTestData } from '../types/storage';
import * as sync from './sync';

/**
 * 标签组检索插件 - Service Worker (MV3)
 *
 * 设计原则 (ARC-04 无状态设计):
 * - 所有状态存储在 chrome.storage.local，不使用全局变量
 * - 事件驱动架构，每个 listener 独立工作
 * - Service Worker 可能随时被终止和重启
 */

// ============================================
// 工具函数
// ============================================

/**
 * 重试发送消息到 content script，直到成功或达到最大重试次数
 */
async function retrySendMessage(tabId: number, message: any, maxRetries = 30, retryDelay = 300): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await chrome.tabs.sendMessage(tabId, message);
      console.log(`[Background] Message sent successfully on attempt ${i + 1}`);
      return true;
    } catch (e: any) {
      console.log(`[Background] Attempt ${i + 1} failed: ${e.message}`);
      await new Promise(r => setTimeout(r, retryDelay));
    }
  }
  console.error(`[Background] Failed to send message after ${maxRetries} attempts`);
  return false;
}

// ============================================
// 扩展生命周期事件
// ============================================

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Tab Group Search] Extension installed:', details.reason);

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
    console.log('[Tab Group Search] Storage write SUCCESS:', testData);
  } catch (error) {
    console.error('[Tab Group Search] Storage write FAILED:', error);
  }

  // ARC-03: 验证 chrome.storage.local 读取
  try {
    const result = await chrome.storage.local.get('test_data');
    console.log('[Tab Group Search] Storage read SUCCESS:', result.test_data);

    if (result.test_data && result.test_data.timestamp === testData.timestamp) {
      console.log('[Tab Group Search] Storage read/write VERIFIED: data matches');
    } else {
      console.error('[Tab Group Search] Storage MISMATCH: written data does not match read data');
    }
  } catch (error) {
    console.error('[Tab Group Search] Storage read FAILED:', error);
  }

  // ARC-02: 验证 chrome.tabGroups API
  try {
    const tabGroups = await chrome.tabGroups.query({});
    console.log('[Tab Group Search] tabGroups.query SUCCESS:', tabGroups.length, 'groups found');
    tabGroups.forEach((group) => {
      console.log(`  - Group: "${group.title || '(untitled)'}" color: ${group.color}`);
    });
  } catch (error) {
    console.error('[Tab Group Search] tabGroups.query FAILED:', error);
  }

  // ARC-02: 验证 chrome.tabs API
  try {
    const tabs = await chrome.tabs.query({});
    console.log('[Tab Group Search] tabs.query SUCCESS:', tabs.length, 'tabs found');
  } catch (error) {
    console.error('[Tab Group Search] tabs.query FAILED:', error);
  }

  console.log('[Tab Group Search] === Phase 1 verification complete ===');

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
  console.log('[Tab Group Search] Service Worker started');

  try {
    const result = await chrome.storage.local.get(['test_data', 'extension_installed_at']);
    if (result.test_data) {
      console.log('[Tab Group Search] Persisted data found, storage OK');
    }
  } catch (error) {
    console.error('[Tab Group Search] Failed to read persisted data:', error);
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
  // 方案 B: 标签组从 Chrome 关闭时不删除数据库记录
  // 扩展数据库作为独立历史库，只增不删
  console.log('[Tab Sync] Group removed from Chrome:', group.id, '— records preserved in database');
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.groupId) return;

  console.log('[Tab Sync] Tab groupId changed:', tabId, changeInfo.groupId);
  try {
    let records = await sync.getAllRecords();

    if (changeInfo.groupId === -1) {
      // 标签从标签组移出时，不删除记录，只记录日志
      console.log('[Tab Sync] Tab removed from group — record preserved in database');
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

chrome.tabs.onRemoved.addListener((tabId) => {
  // 标签关闭时，不删除数据库记录
  // 网页记录永久保存，用户可通过搜索面板找到并重新打开
  console.log('[Tab Sync] Tab closed:', tabId, '— record preserved in database');
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
        // 显示通知并打开新页跳转到 google.com
        try {
          await chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon128.png'),
            title: '标签组检索插件',
            message: '本页面无法启动搜索面板，即将跳转到 Google'
          });
        } catch (e) {
          console.warn('[Search Panel] Notification failed:', e);
        }
        // 打开新页跳转到 google.com，然后自动打开搜索面板
        const newTab = await chrome.tabs.create({ url: 'https://www.google.com' });
        console.log('[Search Panel] Opened new tab:', newTab.id);
        // 等待页面加载完成后打开搜索面板
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === newTab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            console.log('[Search Panel] New tab loaded, will retry until content script ready');
            // 使用重试机制直到 content script 就绪
            retrySendMessage(newTab.id, { type: 'TOGGLE_SEARCH_PANEL' });
          }
        });
        return;
      }

      // 尝试发送消息，如果失败则说明 content script 未加载
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SEARCH_PANEL' });
        console.log('[Search Panel] Message sent to tab:', tab.id);
      } catch (error) {
        console.log('[Search Panel] Content script not loaded, injecting...');
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/content/index.tsx']
        });
        // 等待 content script 初始化
        await new Promise(resolve => setTimeout(resolve, 100));
        await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SEARCH_PANEL' });
        console.log('[Search Panel] Injected and message sent');
      }
    } catch (error) {
      console.error('[Search Panel] Failed to send message:', error);
    }
  }
});

// 监听来自 content script 和 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_ALL_DATA') {
    (async () => {
      try {
        // 只从持久化数据库读取，不自动同步
        const records = await sync.getAllRecords();

        // 从记录中提取唯一分组列表
        const groupMap = new Map<string, string>();
        for (const r of records) {
          if (!groupMap.has(r.groupName)) {
            groupMap.set(r.groupName, r.groupColor);
          }
        }
        const groupList = Array.from(groupMap.entries()).map(([name, color]) => ({ name, color }));

        console.log('[Background] GET_ALL_DATA returning:', records.length, 'records,', groupList.length, 'groups');
        sendResponse({ records, groups: groupList });
      } catch (error) {
        console.error('[Background] Failed to get all data:', error);
        sendResponse({ records: [], groups: [] });
      }
    })();
    return true;
  }

  if (message.type === 'SYNC_TAB_GROUPS') {
    (async () => {
      try {
        const groups = await chrome.tabGroups.query({});
        console.log('[Background] SYNC_TAB_GROUPS: chrome.tabGroups.query() returned', groups.length, 'groups');
        groups.forEach(g => console.log('  -', g.id, g.title, 'collapsed:', g.collapsed, 'windowId:', g.windowId));

        // 全量替换：以当前实际打开的标签页为基准，完全重建数据库
        const beforeCount = (await sync.getAllRecords()).length;

        // 1. 收集当前所有打开的标签页
        const newRecords: import('../types/storage').TabRecord[] = [];
        for (const group of groups) {
          const tabs = await chrome.tabs.query({ groupId: group.id });
          console.log('[Background] Group', group.title, 'has', tabs.length, 'tabs');
          for (const tab of tabs) {
            if (tab.url && tab.title) {
              newRecords.push({
                id: crypto.randomUUID(),
                tabId: tab.id!,
                url: tab.url,
                title: tab.title,
                groupId: group.id,
                groupName: group.title || '(untitled)',
                groupColor: group.color,
                syncedAt: Date.now(),
              });
            }
          }
        }

        // 2. 完全替换数据库（删除历史，只保留当前）
        await sync.saveAllRecords(newRecords);
        console.log('[Background] SYNC_TAB_GROUPS complete:', beforeCount, '->', newRecords.length, 'records');
        sendResponse({ success: true, recordCount: newRecords.length, deletedCount: beforeCount - newRecords.length });
      } catch (error) {
        console.error('[Background] Failed to sync tab groups:', error);
        sendResponse({ success: false, error: String(error) });
      }
    })();
    return true;
  }

  if (message.type === 'OPEN_URL') {
    console.log('[Background] Opening URL:', message.url);
    chrome.tabs.create({ url: message.url }, (tab) => {
      console.log('[Background] Tab created:', tab.id);
      sendResponse({ success: true, tabId: tab.id });
    });
    return true;
  }

  if (message.type === 'OPEN_SEARCH_IN_NEW_TAB') {
    console.log('[Background] Opening search in new tab');
    (async () => {
      try {
        // 显示通知
        if (message.notification) {
          await chrome.notifications.create(message.notification);
        }
        // 打开新标签页
        const newTab = await chrome.tabs.create({ url: 'https://www.google.com' });
        console.log('[Background] New tab created:', newTab.id);
        // 设置监听器等待页面加载完成
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === newTab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            console.log('[Background] Tab loaded, starting toggle retry for tab:', newTab.id);
            // 重试直到 content script 就绪
            retrySendMessage(newTab.id, { type: 'TOGGLE_SEARCH_PANEL' });
          }
        });
        sendResponse({ success: true, tabId: newTab.id });
      } catch (error: any) {
        console.error('[Background] Failed to open new tab:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.type === 'TOGGLE_SEARCH_FROM_POPUP') {
    console.log('[Background] Toggle search from popup for tab:', message.tabId);

    (async () => {
      const success = await retrySendMessage(message.tabId, { type: 'TOGGLE_SEARCH_PANEL' }, 15);
      sendResponse({ success, error: success ? undefined : 'Content script not responding' });
    })();

    return true;
  }
});
