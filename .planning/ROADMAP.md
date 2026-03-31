# Roadmap: 注意力队列 (Attention Queue)

## Overview

从零开始构建一个 Chrome MV3 扩展，实现"标签组的搜索层"：先建立可靠的技术基础，再同步 Chrome 标签组数据到本地，最后交付快捷键搜索面板，让用户在 3 秒内找到任何保存过的网页。

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: 技术架构** - 建立 MV3 扩展骨架，确立无状态 Service Worker + 本地存储设计
- [ ] **Phase 2: 标签组同步** - 监听 Chrome 标签组变化并自动持久化到本地数据库
- [ ] **Phase 3: 搜索面板** - 快捷键唤起的搜索面板，实现产品核心价值

## Phase Details

### Phase 1: 技术架构

**Goal**: 可运行的扩展骨架就位，所有后续功能的地基确立
**Depends on**: Nothing (first phase)
**Requirements**: ARC-01, ARC-02, ARC-03, ARC-04
**Plans:** 2 plans
**Success Criteria** (what must be TRUE):

1. 扩展可以加载到 Chrome 且不报错 (chrome://extensions 显示已启用)
2. Service Worker 可以正常注册并响应事件
3. 数据可以写入 chrome.storage.local 并在 Service Worker 重启后读取
4. chrome.tabGroups API 和 chrome.tabs API 可以正常调用

Plans:

- [x] 01-01-PLAN.md — 项目初始化 + Manifest V3 配置 + 构建管线 (ARC-01)
- [x] 01-02-PLAN.md — Service Worker 实现 + API 验证 (ARC-02, ARC-03, ARC-04)

### Phase 2: 标签组同步

**Goal**: 用户在 Chrome 中对标签组的所有操作都自动持久化，与 Chrome 标签组保持镜像同步
**Depends on**: Phase 1
**Requirements**: SYN-01, SYN-02, SYN-04
**Plans:** 2 plans
**Success Criteria** (what must be TRUE):

1. 用户新建或修改标签组时，数据自动出现在本地存储中
2. 用户关闭标签页/删除标签组时，对应记录自动删除（镜像同步）
3. 同一 URL 在同一标签组中只有 1 条记录
4. 每条记录包含：分组名称、网页标题、URL、同步时间
5. 扩展首次安装时，现有标签组数据已同步

Plans:

- [ ] 02-01-PLAN.md — 数据模型和同步工具函数 (SYN-02, SYN-04)
- [ ] 02-02-PLAN.md — 事件监听器和自动同步 (SYN-01, SYN-02)

### Phase 3: 搜索面板

**Goal**: 用户可以在 3 秒内通过快捷键唤起面板并找到任何保存过的网页
**Depends on**: Phase 2
**Requirements**: SEA-01, SEA-02, SEA-03, SEA-04, SEA-05
**Plans:** 4 plans
**Success Criteria** (what must be TRUE):

1. 按下快捷键，搜索面板立即弹出
2. 输入关键词时结果实时更新（标题、URL、分组名称均可命中）
3. 可以按分组名称过滤，只看某个分组的内容
4. 每条搜索结果展示网页标题、URL 和所属分组
5. 点击结果在新标签页打开对应网页

Plans:

- [x] 03-01-PLAN.md — 搜索面板 UI 组件与快捷键 (SEA-01, SEA-04)
- [x] 03-02-PLAN.md — 实时搜索功能 (SEA-02, SEA-04)
- [x] 03-03-PLAN.md — 分组过滤功能 (SEA-03)
- [ ] 03-04-PLAN.md — 键盘导航优化 (SEA-02, SEA-05)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase         | Plans Complete | Status      | Completed  |
| ------------- | -------------- | ----------- | ---------- |
| 1. 技术架构   | 2/2            | Complete    | 2026-03-30 |
| 2. 标签组同步 | 2/2            | Complete    | 2026-03-31 |
| 3. 搜索面板   | 0/?            | Not started | -          |
