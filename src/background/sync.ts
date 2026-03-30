import type { TabRecord } from '../types/storage';

/**
 * 标签组同步工具模块
 */

// ============================================
// 存储操作
// ============================================

export async function getAllRecords(): Promise<TabRecord[]> {
  try {
    const result = await chrome.storage.local.get('tab_records');
    return result.tab_records || [];
  } catch (error) {
    console.error('[Tab Sync] Failed to read records:', error);
    return [];
  }
}

export async function saveAllRecords(records: TabRecord[]): Promise<void> {
  try {
    await chrome.storage.local.set({
      'tab_records': records,
      'last_sync': Date.now(),
    });
  } catch (error) {
    console.error('[Tab Sync] Failed to save records:', error);
    throw error;
  }
}

// ============================================
// 查询操作
// ============================================

export function findRecordByTabId(records: TabRecord[], tabId: number): TabRecord | undefined {
  return records.find(r => r.tabId === tabId);
}

export function findRecordByUrlAndGroup(
  records: TabRecord[],
  url: string,
  groupId: number
): TabRecord | undefined {
  return records.find(r => r.url === url && r.groupId === groupId);
}

export function findRecordsByGroupId(records: TabRecord[], groupId: number): TabRecord[] {
  return records.filter(r => r.groupId === groupId);
}

// ============================================
// 增删改操作
// ============================================

export function upsertRecord(
  records: TabRecord[],
  tab: chrome.tabs.Tab,
  group: chrome.tabGroups.TabGroup
): TabRecord[] {
  const existing = findRecordByUrlAndGroup(records, tab.url!, group.id);

  if (existing) {
    return records.map(r =>
      r.id === existing.id
        ? { ...r, title: tab.title!, syncedAt: Date.now() }
        : r
    );
  } else {
    const newRecord: TabRecord = {
      id: crypto.randomUUID(),
      tabId: tab.id!,
      url: tab.url!,
      title: tab.title!,
      groupId: group.id,
      groupName: group.title || '(untitled)',
      groupColor: group.color,
      syncedAt: Date.now(),
    };
    return [...records, newRecord];
  }
}

export function deleteRecordByTabId(records: TabRecord[], tabId: number): TabRecord[] {
  return records.filter(r => r.tabId !== tabId);
}

export function deleteRecordsByGroupId(records: TabRecord[], groupId: number): TabRecord[] {
  return records.filter(r => r.groupId !== groupId);
}

export function updateGroupInfo(
  records: TabRecord[],
  groupId: number,
  groupName: string,
  groupColor: string
): TabRecord[] {
  return records.map(r =>
    r.groupId === groupId
      ? { ...r, groupName, groupColor, syncedAt: Date.now() }
      : r
  );
}
