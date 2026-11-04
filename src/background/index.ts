import type { StorageSchema, StorageTestData } from '../types/storage';
import * as sync from './sync';
import searchScript from '../content/index.tsx?script';
import searchStyles from '../content/index.css?inline';

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

async function toggleSearch(tab: chrome.tabs.Tab | undefined): Promise<void> {
  const searchPageUrl = chrome.runtime.getURL('src/search/index.html');

  if (tab?.id !== undefined && tab.url === searchPageUrl) {
    await chrome.tabs.remove(tab.id);
    return;
  }

  if (tab?.id !== undefined && /^https?:\/\//.test(tab.url || '')) {
    try {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SEARCH_PANEL' });
      } catch {
        const [documentCheck] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => document.body instanceof HTMLBodyElement
        });
        if (!documentCheck.result) {
          throw new Error('This document cannot display the search panel');
        }
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          css: searchStyles
        });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [searchScript]
        });
      }
      return;
    } catch (error) {
      console.warn('[Search Panel] Cannot open on this page:', error);
    }
  }

  await chrome.tabs.create({ url: searchPageUrl });
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
    const result = await chrome.storage.local.get<Partial<StorageSchema>>('test_data');
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

chrome.commands.onCommand.addListener(async (command, commandTab) => {
  if (command === "toggle-search") {
    console.log('[Search Panel] Toggle command received');
    try {
      const tab = commandTab || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
      await toggleSearch(tab);
    } catch (error) {
      console.error('[Search Panel] Failed to send message:', error);
    }
  }
});

// 监听来自 content script 和 popup 的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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

  if (message.type === 'TOGGLE_SEARCH_FROM_POPUP') {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await toggleSearch(tab);
        sendResponse({ success: true });
      } catch (error) {
        console.error('[Background] Failed to open search:', error);
        sendResponse({ success: false, error: String(error) });
      }
    })();

    return true;
  }
});
