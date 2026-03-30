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

**Goal**: 用户在 Chrome 中对标签组的所有操作都自动持久化，关闭后也能找到历史记录
**Depends on**: Phase 1
**Requirements**: SYN-01, SYN-02, SYN-03, SYN-04
**Success Criteria** (what must be TRUE):

1. 用户新建或修改标签组时，数据自动出现在本地存储中
2. 关闭的标签页/标签组数据不被删除，仍可查询
3. 同一 URL 重复加入标签组时更新记录而不是新建条目
4. 每条记录包含：分组名称、网页标题、URL、同步时间
   **Plans**: TBD
   **UI hint**: yes

### Phase 3: 搜索面板

**Goal**: 用户可以在 3 秒内通过快捷键唤起面板并找到任何保存过的网页
**Depends on**: Phase 2
**Requirements**: SEA-01, SEA-02, SEA-03, SEA-04, SEA-05
**Success Criteria** (what must be TRUE):

1. 按下快捷键，搜索面板立即弹出
2. 输入关键词时结果实时更新（标题、URL、分组名称均可命中）
3. 可以按分组名称过滤，只看某个分组的内容
4. 每条搜索结果展示网页标题、URL 和所属分组
5. 点击结果在新标签页打开对应网页
   **Plans**: TBD
   **UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase         | Plans Complete | Status      | Completed |
| ------------- | -------------- | ----------- | --------- |
| 1. 技术架构   | 0/2            | Planning    | -         |
| 2. 标签组同步 | 0/?            | Not started | -         |
| 3. 搜索面板   | 0/?            | Not started | -         |
