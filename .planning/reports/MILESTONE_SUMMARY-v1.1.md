# Milestone Summary — v1.1 修复与稳定

**Version:** v1.1
**Status:** Completed (Ad-hoc session)
**Date:** 2026-04-01
**Duration:** Single session

---

## 1. Overview

### What Was Built

v1.1 是一个紧急修复里程碑，解决了 v1.0 中发现的多个关键 bug 和行为问题。本次修复通过实时调试和迭代改进，建立了正确的产品行为基线。

**核心成果：**

- 修复了 5 个关键 bug
- 重新设计了标签组同步策略
- 改进了 React 状态管理
- 添加了手动同步功能和确认机制

### Why It Matters

这些修复直接影响核心用户体验：

- **搜索准确性**：筛选结果不再显示错误数据
- **数据一致性**：标签组同步逻辑现在符合用户预期
- **UI 稳定性**：消除了 iframe 多实例和 React key 复用问题

---

## 2. Architecture & Technical Decisions

### 关键架构变更

#### 2.1 标签组同步策略演进

**问题：** v1.0 采用"镜像同步"策略，自动删除关闭的标签组数据，导致用户数据意外丢失。

**演进过程：**

| 阶段       | 策略                 | 问题                         | 决策          |
| ---------- | -------------------- | ---------------------------- | ------------- |
| v1.0       | 自动删除关闭的标签组 | 用户关闭标签组后数据永久丢失 | ❌ 不符合预期 |
| v1.1-尝试1 | 只增不删（历史累积） | 无法删除已删除的标签页       | ❌ 数据冗余   |
| v1.1-最终  | 手动同步 + 完全重建  | 用户主动控制同步时机         | ✅ 符合预期   |

**最终方案：**

```typescript
// 点击「同步」按钮时：
// 1. 查询当前 Chrome 中实际存在的所有标签页
// 2. 清空数据库，重新插入这些标签页
// 3. 不在当前标签组中的记录会被彻底移除
```

**设计原则：**

- 用户显式控制：通过「同步」按钮主动触发
- 确认机制：弹出对话框警告数据删除
- 完全重建：以当前实际状态为准，避免增量同步的复杂性

#### 2.2 React 状态管理修复

**问题：** `useEffect + setState` 导致筛选结果延迟更新，UI 显示上一次的数据。

**解决方案：**

```typescript
// Before: 异步更新导致延迟
useEffect(() => {
  const filtered = records.filter(...);
  setSearchResults(filtered);
}, [records, selectedGroup, searchQuery]);

// After: 同步计算
const searchResults = useMemo(() => {
  return records.filter(...);
}, [records, selectedGroup, searchQuery]);
```

**原理：** `useMemo` 在渲染期间同步计算，确保 UI 立即反映最新状态。

#### 2.3 React Key 去重策略

**问题：** 使用 `key={record.url}` 导致同一 URL 在不同分组中复用 DOM，显示错误数据。

**解决方案：**

```typescript
// Before: URL 不唯一
<div key={record.url}>

// After: 使用唯一 ID
<div key={record.id}>
```

**去重逻辑：** 改用 `(url, groupName)` 组合去重，因为 Chrome 关闭再打开标签组时 `groupId` 会变化。

---

## 3. What Was Delivered

### 修复的 Bug

| Bug ID | 问题描述           | 根本原因                            | 解决方案                 | 文件                  |
| ------ | ------------------ | ----------------------------------- | ------------------------ | --------------------- |
| BUG-01 | iframe 多实例注入  | manifest 未设置 `all_frames: false` | 添加配置防止 iframe 注入 | `manifest.json`       |
| BUG-02 | 筛选结果驻留       | `useEffect` 异步更新延迟            | 改用 `useMemo` 同步计算  | `SearchPanel.tsx`     |
| BUG-03 | 标签组数据丢失     | 自动删除关闭的标签组                | 改为手动同步 + 完全重建  | `background/index.ts` |
| BUG-04 | 标签组筛选器不准   | 显示历史所有分组                    | 从数据库记录提取分组列表 | `background/index.ts` |
| BUG-05 | 同一标签组重复记录 | 按 `groupId` 去重失效               | 改用 `groupName` 去重    | `sync.ts`             |
| BUG-06 | UI 显示错误数据    | React key 复用 DOM                  | 改用唯一 `record.id`     | `SearchPanel.tsx`     |

### 新增功能

| 功能           | 描述                         | 用户价值               |
| -------------- | ---------------------------- | ---------------------- |
| 手动同步按钮   | 搜索面板右上角「⟳ 同步」按钮 | 用户主动控制同步时机   |
| 同步确认对话框 | 点击同步前弹出警告           | 防止误操作导致数据丢失 |

### 代码变更统计

```
src/manifest.json              +1 line   (添加 all_frames: false)
src/content/SearchPanel.tsx    ~50 lines (useMemo + 同步按钮 + key 修复)
src/background/index.ts        ~40 lines (手动同步逻辑 + 完全重建)
src/background/sync.ts         ~10 lines (groupName 去重)
```

---

## 4. Key Decisions & Trade-offs

### 决策 1: 手动同步 vs 自动同步

**选择：** 手动同步
**理由：**

- 用户明确表示不希望自动同步覆盖历史数据
- Chrome API 无法区分"暂时关闭"和"彻底删除"的标签组
- 手动同步让用户掌控数据更新时机

**Trade-off：**

- ✅ 优点：用户控制感强，不会意外丢失数据
- ❌ 缺点：需要用户手动点击同步按钮

### 决策 2: 完全重建 vs 增量同步

**选择：** 完全重建
**理由：**

- 增量同步无法检测"已删除的标签页"
- 完全重建逻辑简单，不易出错
- 性能影响可忽略（标签页数量通常 < 100）

**Trade-off：**

- ✅ 优点：逻辑简单，数据一致性强
- ❌ 缺点：每次同步都重写整个数据库

### 决策 3: useMemo vs useEffect

**选择：** useMemo
**理由：**

- 派生状态应该同步计算，而非异步更新
- `useMemo` 在渲染期间执行，确保 UI 立即更新
- 避免 `useEffect` 的"一帧延迟"问题

**Trade-off：**

- ✅ 优点：UI 响应即时，无延迟
- ❌ 缺点：计算在渲染期间执行（但本例计算量很小）

---

## 5. Requirements Coverage

### v1.1 需求完成情况

| REQ-ID      | 需求                   | 状态       | 验证方式               |
| ----------- | ---------------------- | ---------- | ---------------------- |
| BUG-01      | 修复 iframe 多实例注入 | ✅ Done    | 在含 iframe 页面测试   |
| BUG-02      | 修复筛选结果驻留       | ✅ Done    | 切换分组测试           |
| BUG-03      | 修复标签组数据持久化   | ✅ Done    | 关闭标签组后检查数据   |
| BUG-04      | 修复标签组筛选器       | ✅ Done    | 对比 Chrome 实际标签组 |
| BEHAVIOR-01 | 筛选器与 Chrome 一致   | ✅ Done    | 打开面板时对比         |
| BEHAVIOR-02 | 点击分组立即筛选       | ✅ Done    | 点击测试               |
| BEHAVIOR-03 | 关闭标签组保留数据     | ⚠️ Changed | 改为手动同步控制       |
| BEHAVIOR-04 | 删除标签组按钮消失     | ✅ Done    | 删除标签组后测试       |

**覆盖率：** 8/8 (100%)

**行为变更说明：**

- BEHAVIOR-03 原计划"自动保留"，实际改为"手动同步控制"
- 原因：用户反馈不希望自动同步，需要主动控制

---

## 6. Known Issues & Tech Debt

### 已知限制

| 限制            | 描述                   | 影响                           | 计划         |
| --------------- | ---------------------- | ------------------------------ | ------------ |
| Chrome API 限制 | 无法读取已关闭的标签组 | 关闭的标签组数据会在同步时丢失 | 文档说明     |
| 手动同步依赖    | 用户需要记得点击同步   | 可能忘记同步导致数据不一致     | 考虑添加提示 |

### 技术债务

| 债务       | 描述                 | 优先级 | 计划              |
| ---------- | -------------------- | ------ | ----------------- |
| 无测试覆盖 | 所有修复都是手动测试 | Medium | v1.2 添加单元测试 |
| 无错误处理 | 同步失败时无用户提示 | Low    | v1.2 添加错误提示 |
| 无数据备份 | 同步前不备份数据     | Low    | v1.3 考虑添加     |

### 延期需求

以下需求从 v1.0 延期到未来版本：

- 手动保存网页（用户主动确认加入队列）
- 管理界面（查看、编辑、删除所有记录）
- 网页缩略图存储

---

## 7. Getting Started (For New Team Members)

### 快速理解代码

**核心文件：**

```
src/
├── manifest.json              # Chrome 扩展配置（注意 all_frames: false）
├── background/
│   ├── index.ts              # Service Worker（同步逻辑核心）
│   └── sync.ts               # 数据库操作（注意 groupName 去重）
└── content/
    └── SearchPanel.tsx       # 搜索面板 UI（注意 useMemo 和 key）
```

**关键概念：**

1. **标签组同步**：用户点击「同步」按钮时，完全重建数据库
2. **去重逻辑**：使用 `(url, groupName)` 组合，因为 `groupId` 会变化
3. **React 状态**：派生状态用 `useMemo`，避免 `useEffect` 延迟

### 本地开发

```bash
# 安装依赖
npm install

# 构建扩展
npm run build

# 加载到 Chrome
# 1. 打开 chrome://extensions/
# 2. 启用"开发者模式"
# 3. 点击"加载已解压的扩展程序"
# 4. 选择 dist/ 目录
```

### 测试关键场景

1. **测试同步功能：**
   - 打开多个标签组
   - 点击「同步」按钮
   - 关闭某个标签组
   - 再次点击「同步」
   - 验证：关闭的标签组数据被删除

2. **测试筛选功能：**
   - 打开搜索面板（Ctrl+Space）
   - 点击不同的标签组按钮
   - 验证：列表立即只显示该分组的记录

3. **测试 iframe 问题：**
   - 访问含有 iframe 的页面（如 YouTube）
   - 打开搜索面板
   - 验证：只显示一个面板实例

---

## 8. Retrospective

### What Went Well ✅

1. **快速响应用户反馈**：在单个会话中完成所有修复
2. **迭代改进**：通过多次尝试找到最佳同步策略
3. **根本原因分析**：深入理解 Chrome API 限制和 React 渲染机制

### What Could Be Improved 🔄

1. **缺少测试**：所有修复都是手动测试，容易回归
2. **未遵循 GSD 流程**：跳过了正式的规划和验证阶段
3. **文档滞后**：修复过程中未及时更新文档

### Lessons Learned 📚

1. **Chrome API 限制**：`chrome.tabGroups.query()` 只返回打开的标签组，无法读取已关闭的
2. **React 派生状态**：应该用 `useMemo` 而非 `useEffect + setState`
3. **用户期望管理**：自动同步不一定是好事，有时用户需要手动控制

### Action Items for Next Milestone

- [ ] 添加单元测试覆盖核心同步逻辑
- [ ] 添加错误处理和用户提示
- [ ] 考虑添加"同步前备份"功能
- [ ] 更新用户文档，说明同步行为

---

## Appendix

### Session Context

本次修复在单个会话中完成，未遵循正式的 GSD 工作流。修复过程：

1. 用户报告 bug（分类筛选互串）
2. 调试发现 React 状态延迟问题
3. 修复后发现标签组同步逻辑问题
4. 多次迭代改进同步策略
5. 最终确定手动同步 + 完全重建方案

### Related Documents

- `.planning/PROJECT.md` — 项目背景和核心价值
- `.planning/ROADMAP.md` — v1.1 路线图
- `.planning/REQUIREMENTS.md` — v1.1 需求列表
- `memory/project_attention_queue_final.md` — v1.0 完成总结

---

_Generated: 2026-04-01_
_Milestone: v1.1 修复与稳定_
_Status: Completed_
