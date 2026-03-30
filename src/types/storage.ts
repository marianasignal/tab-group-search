/**
 * Phase 1 测试用存储数据结构
 * Phase 2 将扩展为完整的标签组数据模型
 */
export interface StorageTestData {
  timestamp: number;
  message: string;
}

/**
 * chrome.storage.local 中的键值结构
 */
export interface StorageSchema {
  'test_data': StorageTestData;
  'extension_installed_at': number;
}
