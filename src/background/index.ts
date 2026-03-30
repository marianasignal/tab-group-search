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
  try {
    let records = await sync.getAllRecords();
    records = sync.updateGroupInfo(records, group.id, group.title || '(untitled)', group.color);
    await sync.saveAllRecords(records);
    console.log('[Tab Sync] Group info updated');
  } catch (error) {
    console.error('[Tab Sync] Failed to update group:', error);
  }
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
