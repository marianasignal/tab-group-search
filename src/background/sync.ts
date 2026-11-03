import type { StorageSchema, TabRecord } from '../types/storage';

/**
 * 标签组同步工具模块
 */

// ============================================
// 存储操作
// ============================================

export async function getAllRecords(): Promise<TabRecord[]> {
  try {
    const result = await chrome.storage.local.get<Partial<StorageSchema>>('tab_records');
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
  groupName: string
): TabRecord | undefined {
  // 使用 groupName 而不是 groupId 去重
  // 因为标签组关闭再打开时 Chrome 会分配新的 groupId
  return records.find(r => r.url === url && r.groupName === groupName);
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
  // 使用 groupName 去重，因为 groupId 在标签组关闭再打开时会变化
  const groupName = group.title || '(untitled)';
  const existing = findRecordByUrlAndGroup(records, tab.url!, groupName);

  if (existing) {
    // 更新现有记录（包括 groupId，因为可能变了）
    return records.map(r =>
      r.id === existing.id
        ? { ...r, tabId: tab.id!, groupId: group.id, title: tab.title!, syncedAt: Date.now() }
        : r
    );
  } else {
    const newRecord: TabRecord = {
      id: crypto.randomUUID(),
      tabId: tab.id!,
      url: tab.url!,
      title: tab.title!,
      groupId: group.id,
      groupName: groupName,
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
