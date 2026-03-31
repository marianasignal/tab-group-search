---
phase: 02-标签组同步
plan: 01
subsystem: 数据模型和同步工具
tags: [storage, sync, data-model]
dependency_graph:
  requires: [Phase 1]
  provides: [TabRecord 类型, 同步工具函数]
  affects: [Plan 02-02]
tech_stack:
  added: []
  patterns: [纯函数, 不可变数据]
key_files:
  created:
    - src/background/sync.ts
  modified:
    - src/types/storage.ts
decisions:
  - TabRecord 包含 8 个字段（id, tabId, url, title, groupId, groupName, groupColor, syncedAt）
  - 使用 url + groupId 作为去重键
  - 所有同步函数都是纯函数，不修改原数组
metrics:
  duration: 15分钟
  tasks_completed: 2
  files_created: 1
  commits: 1
  completed_date: 2026-03-31
---

# Phase 02 Plan 01: 数据模型和同步工具 Summary

**一句话总结:** 创建 TabRecord 数据模型和同步工具函数，为标签组自动同步提供数据操作接口

## 执行概览

### 完成的任务

| 任务 | 名称 | 提交 | 关键文件 |
| ---- | ---- | ---- | -------- |
| 1 | 创建同步工具模块 sync.ts | f404500 | src/background/sync.ts |
| 2 | 扩展 storage.ts 添加 TabRecord 类型定义 | f404500 | src/types/storage.ts |

### 验证结果

**自动化验证:**
- ✅ src/types/storage.ts 包含 TabRecord 接口
- ✅ src/types/storage.ts 的 StorageSchema 包含 tab_records 和 last_sync
- ✅ src/background/sync.ts 包含所有核心函数
- ✅ 构建成功

**成功标准:**
- ✅ SYN-02 部分满足: TabRecord 数据结构定义完成
- ✅ SYN-04 部分满足: url + groupId 去重逻辑实现

## 技术实现细节

### TabRecord 数据模型

**字段设计:**
```typescript
interface TabRecord {
  id: string;              // UUID 唯一标识
  tabId: number;           // Chrome 标签页 ID
  url: string;             // 网页 URL
  title: string;           // 网页标题
  groupId: number;         // Chrome 标签组 ID
  groupName: string;       // 标签组名称
  groupColor: string;      // 标签组颜色
  syncedAt: number;        // 最后同步时间戳
}
```

**去重策略:**
- 使用 `url + groupId` 作为唯一性判断
- 同一 URL 在同一标签组中只存 1 条记录
- 同一 URL 在不同标签组中存为独立记录

### 同步工具函数

**存储操作:**
- `getAllRecords()`: 从 chrome.storage.local 读取所有记录
- `saveAllRecords()`: 批量保存记录并更新 last_sync

**查询操作:**
- `findRecordByTabId()`: 根据 tabId 查找
- `findRecordByUrlAndGroup()`: 根据 url + groupId 查找（去重）
- `findRecordsByGroupId()`: 查找某个标签组的所有记录

**增删改操作:**
- `upsertRecord()`: 添加或更新记录（存在则更新 syncedAt，不存在则创建）
- `deleteRecordByTabId()`: 删除单条记录
- `deleteRecordsByGroupId()`: 批量删除标签组记录
- `updateGroupInfo()`: 批量更新标签组信息

**设计原则:**
- 所有函数都是纯函数，不修改输入的 records 数组
- 使用数组的 map/filter 返回新数组
- 符合 Phase 1 的无状态设计原则

## 偏离计划的调整

无。按计划执行。

## 关键决策

1. **使用纯函数设计**
   - 理由: 符合无状态架构，易于测试和维护
   - 影响: 所有同步函数返回新数组而不是修改原数组

2. **使用 crypto.randomUUID() 生成 ID**
   - 理由: 浏览器原生 API，无需额外依赖
   - 影响: 每条记录有全局唯一标识

## 已知存根

无。所有函数都是完整实现。

## 下一步

Plan 02-02: 实现事件监听器，调用这些工具函数完成自动同步。

## Self-Check: PASSED

**文件存在性检查:**
- ✅ src/types/storage.ts 已修改
- ✅ src/background/sync.ts 已创建

**提交存在性检查:**
- ✅ f404500 存在: feat(02-01): 实现标签组同步数据模型和工具函数

**功能验证:**
- ✅ TabRecord 包含所有 8 个字段
- ✅ StorageSchema 包含 tab_records 和 last_sync
- ✅ sync.ts 包含所有必需函数

所有检查通过，计划执行成功。
