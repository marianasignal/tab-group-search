# 注意力队列 — v1 需求文档

**Project:** 注意力队列 (Attention Queue)
**Version:** v1
**Date:** 2026-03-30

## 核心定位

**Chrome 标签组的搜索层 + 持久化层**

- 增/删 由 Chrome 原生标签组完成
- 插件负责: 自动同步标签组数据 → 持久化存储 → 快速搜索

## v1 Requirements

### SYNC — 自动同步标签组

- [ ] **SYN-01**: 监听 Chrome 标签组变化 (新增/修改/关闭),自动同步到本地数据库
- [ ] **SYN-02**: 同步内容包含: 分组名称、网页标题、URL、同步时间
- [ ] **SYN-03**: 标签页关闭时保留历史记录 (不自动删除)
- [ ] **SYN-04**: 同一 URL 已存在时更新记录 (不重复存储)

### SEARCH — 搜索与检索 (核心)

- [ ] **SEA-01**: 用户可通过快捷键唤起搜索面板
- [ ] **SEA-02**: 输入关键词实时搜索标题、URL、分组名称
- [ ] **SEA-03**: 可按分组名称过滤浏览
- [ ] **SEA-04**: 搜索结果展示: 网页标题 + URL + 所属分组
- [ ] **SEA-05**: 点击结果在新标签页打开对应网页

### ARCH — 技术基础

- [x] **ARC-01**: Chrome Manifest V3 扩展
- [ ] **ARC-02**: 使用 chrome.tabGroups API + chrome.tabs API 监听标签组变化
- [ ] **ARC-03**: 数据本地存储 (chrome.storage.local)
- [ ] **ARC-04**: Service Worker 无状态设计

## v2 Requirements (Deferred)

- 手动添加不在标签组中的网页
- 缩略图预览
- 跨设备同步
- 全文搜索 (网页正文)
- 管理界面 (编辑/删除历史记录)
- 数据导出

## Out of Scope (v1)

- 手动保存/弹窗确认流程 — Chrome 标签组原生完成
- 独立管理界面 — v1 专注搜索
- 缩略图 — 降低复杂度
- 自动关闭标签页 — 用户通过 Chrome 原生操作

## Traceability

| Requirement | Phase   | Status  |
| ----------- | ------- | ------- |
| ARC-01      | Phase 1 | Complete |
| ARC-02      | Phase 1 | Pending |
| ARC-03      | Phase 1 | Pending |
| ARC-04      | Phase 1 | Pending |
| SYN-01      | Phase 2 | Pending |
| SYN-02      | Phase 2 | Pending |
| SYN-03      | Phase 2 | Pending |
| SYN-04      | Phase 2 | Pending |
| SEA-01      | Phase 3 | Pending |
| SEA-02      | Phase 3 | Pending |
| SEA-03      | Phase 3 | Pending |
| SEA-04      | Phase 3 | Pending |
| SEA-05      | Phase 3 | Pending |

---

_Updated: 2026-03-30 — Roadmap created, traceability expanded to individual requirements_
