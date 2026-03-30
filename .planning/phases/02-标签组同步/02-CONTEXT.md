---
phase: 02-标签组同步
created: 2026-03-30
status: ready-for-planning
---

# Phase 2: 标签组同步 - Implementation Context

## Phase Goal

用户在 Chrome 中对标签组的所有操作都自动持久化，与 Chrome 标签组保持镜像同步。

## Core Principle

**与 Chrome 标签组保持镜像同步**
- Chrome 有什么 → 我们存什么
- Chrome 删了什么 → 我们删什么
- 不维护"历史记录"，只镜像当前状态

## Data Model

### TabRecord 结构

```typescript
interface TabRecord {
  id: string;              // 唯一标识 (自生成，如 uuid)
  tabId: number;           // Chrome 标签页 ID (用于精确追踪)
  url: string;             // 网页 URL
  title: string;           // 网页标题
  groupId: number;         // Chrome 标签组 ID
  groupName: string;       // 标签组名称
  groupColor: string;      // 标签组颜色
  syncedAt: number;        // 最后同步时间戳
}
```

### 唯一性规则

- **去重键**: `url + groupId`
- 同一 URL 在同一标签组中只存 1 条记录
- 同一 URL 在不同标签组中存为独立记录

### 存储方案

**Phase 2 使用**: `chrome.storage.local`
- 配额足够（约 10MB，可申请 unlimited）
- 实现简单，与 Phase 1 一致
- 未来数据量增长时可迁移到 IndexedDB

**存储键设计**:
```typescript
{
  'tab_records': TabRecord[],  // 所有标签页记录
  'last_sync': number          // 最后同步时间戳
}
```

## Event Listeners

### 标签组事件

| 事件 | 触发时机 | 同步操作 |
|------|---------|---------|
| `chrome.tabGroups.onCreated` | 创建标签组 | 扫描该组所有标签页并存储 |
| `chrome.tabGroups.onUpdated` | 修改标签组（重命名/换颜色） | 更新所有相关记录的 groupName/groupColor |
| `chrome.tabGroups.onRemoved` | 删除标签组 | 删除该 groupId 的所有记录 |

### 标签页事件

| 事件 | 触发时机 | 同步操作 |
|------|---------|---------|
| `chrome.tabs.onUpdated` | 标签页更新 | 监听 `changeInfo.groupId` 变化：<br>- 加入标签组 → 新增记录<br>- 移出标签组 → 删除记录<br>- 标题/URL 变化 → 更新记录 |
| `chrome.tabs.onRemoved` | 标签页关闭 | 删除对应 tabId 的记录 |

## Initial Sync

**扩展首次安装时**:
1. 监听 `chrome.runtime.onInstalled` 事件
2. 调用 `chrome.tabGroups.query({})` 获取所有标签组
3. 对每个标签组调用 `chrome.tabs.query({ groupId })` 获取标签页
4. 批量存储到 `chrome.storage.local`

**Service Worker 重启时**:
- 不需要重新同步（数据已持久化）
- 只需重新注册事件监听器

## Sync Logic

### 新增记录
```typescript
// 标签页加入标签组时
1. 检查 url + groupId 是否已存在
2. 如果存在 → 更新 syncedAt
3. 如果不存在 → 创建新记录
```

### 更新记录
```typescript
// 标签组重命名时
1. 查找所有 groupId 匹配的记录
2. 批量更新 groupName 和 syncedAt
```

### 删除记录
```typescript
// 标签页关闭时
1. 根据 tabId 查找记录
2. 删除该记录

// 标签组删除时
1. 查找所有 groupId 匹配的记录
2. 批量删除
```

## Edge Cases

### 1. 批量操作
**场景**: 用户一次性关闭整个标签组（触发多个 onRemoved 事件）
**处理**:
- 优先监听 `tabGroups.onRemoved`（一次删除所有记录）
- `tabs.onRemoved` 中检查记录是否已被删除，避免重复操作

### 2. 快速切换标签组
**场景**: 用户快速将标签页从组 A 移到组 B
**处理**:
- `onUpdated` 事件中检测 `groupId` 变化
- 删除旧 groupId 记录 + 创建新 groupId 记录

### 3. 无标签组的标签页
**场景**: 标签页不在任何标签组中（`groupId = -1`）
**处理**:
- **不存储**（Phase 2 只同步标签组内的标签页）
- Phase 3 搜索功能只搜索标签组内容

## Requirements Mapping

| Requirement | Implementation |
|-------------|----------------|
| SYN-01: 监听标签组变化并自动同步 | 注册 tabGroups/tabs 事件监听器 |
| SYN-02: 同步分组名称、标题、URL、时间 | TabRecord 数据结构 |
| SYN-03: 关闭时保留历史记录 | ❌ 需求变更：不保留历史，镜像同步 |
| SYN-04: 同一 URL 更新而不重复 | url + groupId 去重逻辑 |

**需求变更说明**:
- SYN-03 原需求"保留历史记录"与核心原则"镜像同步"冲突
- 决策：Phase 2 不实现历史记录功能，严格镜像 Chrome 当前状态
- 如需历史记录功能，推迟到 v2

## Dependencies

**From Phase 1**:
- ✅ Service Worker 事件驱动架构
- ✅ chrome.storage.local 读写能力
- ✅ chrome.tabGroups/tabs API 可用性

**Provides to Phase 3**:
- 完整的标签组数据库（TabRecord[]）
- 实时同步的数据源（供搜索功能使用）

## Out of Scope (Phase 2)

- ❌ 历史记录功能（已关闭标签组的数据保留）
- ❌ 数据导出/导入
- ❌ 跨设备同步
- ❌ 手动添加不在标签组中的网页
- ❌ 搜索功能（Phase 3）
- ❌ UI 界面（Phase 3）

## Success Criteria

Phase 2 完成后，以下必须为真：

1. ✅ 用户新建标签组时，数据自动出现在 chrome.storage.local
2. ✅ 用户修改标签组名称/颜色时，所有相关记录自动更新
3. ✅ 用户关闭标签页时，对应记录自动删除
4. ✅ 用户删除标签组时，该组所有记录自动删除
5. ✅ 同一 URL 在同一标签组中只有 1 条记录
6. ✅ 扩展首次安装时，现有标签组数据已同步
7. ✅ Service Worker 重启后，事件监听继续工作

## Technical Notes

### Performance Considerations
- 批量操作时使用 `chrome.storage.local.set()` 一次性写入
- 避免在事件监听器中进行耗时操作
- 使用 debounce 处理高频事件（如快速切换标签组）

### Error Handling
- 所有 Chrome API 调用使用 try/catch
- 存储失败时记录错误日志
- 不阻塞用户的 Chrome 操作

### Logging Strategy
- 每次同步操作记录日志（便于 Phase 2 验证）
- 日志前缀: `[Tab Sync]`
- 包含操作类型、tabId、groupId、url

---

*Context finalized: 2026-03-30*
*Ready for planning: Yes*
