# Project Research Summary

**Project:** 注意力队列 (Attention Queue) — Chrome 书签/标签页管理扩展
**Domain:** Chrome Browser Extension (Manifest V3)
**Researched:** 2026-03-30
**Confidence:** MEDIUM

## Executive Summary

这是一款 Chrome Manifest V3 浏览器扩展，核心价值是帮助用户快速保存、搜索和管理网页，解决标签页过多导致的注意力分散问题。竞品调研（OneTab、Raindrop.io、Workona、Session Buddy）表明，市场上的工具要么功能过重（协作、订阅）要么过于简单（OneTab 只做收纳），留有空间做一个轻量、快速、本地优先的网页数据库。推荐方向是：聚焦"快速保存 + 3秒找到"的核心场景，v1 本地存储，不上云同步，界面极简。

MV3 架构带来了一个核心约束：Service Worker 随时可能被终止，必须将所有状态立即持久化到 `chrome.storage.local`，不能依赖内存变量。存储容量同样是硬约束（约 10MB），缩略图必须压缩（100KB 以内），大数据走 IndexedDB。这两个约束必须在 Phase 1 架构设计时确立，否则后期重构成本极高。

最大风险是技术选型和架构决策错误导致重写。建议 Phase 1 只做最小可运行架构（Service Worker + storage + Manifest），不引入 UI 框架，验证核心流程后再扩展。快捷键搜索是差异化的关键功能，应在 Phase 3 作为独立里程碑交付，确保"一键唤起、秒级响应"的体验。

## Key Findings

### Recommended Stack

**注意：STACK.md 未生成，以下基于 PITFALLS.md 的间接推断。**

PITFALLS.md 明确警告了框架选型陷阱，推断技术栈建议如下：

**Core technologies:**

- **Chrome Extension MV3:** 目标平台，Manifest V3 是当前标准，MV2 已不被推荐
- **原生 JS (Vanilla JS):** v1 首选，避免 React/Vue 引入 Webpack/Vite 的 CSP 复杂度和包体积问题
- **chrome.storage.local:** 元数据存储（URL、标题、描述、分类），快速读取，约 10MB 上限
- **IndexedDB:** 大文件存储（缩略图、未来的离线内容），绕过 chrome.storage 配额限制
- **chrome.alarms API:** 定时任务替代 setTimeout，Service Worker 终止后可恢复
- **create-chrome-ext / chrome-extension-boilerplate-react:** 如需框架，使用扩展专用脚手架避免 CSP 问题

### Expected Features

**Must have (table stakes):**

- **快速保存** — 核心入口，一键保存当前页，无此功能产品无法使用
- **基础搜索** — 按标题/URL 搜索，3秒找到目标网页
- **分类组织** — 至少一级分类，管理大量网页的基础
- **去重检测** — URL 规范化后检测重复，避免重复保存
- **批量操作** — 批量保存/删除/分类
- **内存优化** — 挂起或关闭已保存的标签页，释放内存

**Should have (competitive differentiators):**

- **快捷键面板** — 快速唤起搜索/管理界面，Power User 核心需求，低复杂度高价值
- **可视化预览** — 缩略图卡片视图，帮助快速识别内容

**Defer (v2+):**

- **跨设备同步** — v1 本地存储验证核心价值，v2 再考虑云同步
- **全文搜索** — 高复杂度，v1 标题/描述搜索足够
- **协作共享** — 个人产品，非团队需求
- **AI 自动分类** — 手动分类收集数据后 v2 考虑
- **离线访问** — 存储成本高，v1 仅存缩略图
- **定时提醒** — 解决"保存后不看"，属于增强功能

### Architecture Approach

**注意：ARCHITECTURE.md 未生成，以下基于 FEATURES.md 和 PITFALLS.md 推断。**

Chrome 扩展的架构由平台强制约束：Service Worker（后台逻辑，无状态）、Content Script（页面注入，负责捕获和 UI 注入）、Popup/Options Page（扩展弹窗和设置）。数据层必须分层：元数据走 chrome.storage.local，大文件走 IndexedDB。所有通信通过 chrome.runtime.sendMessage 实现跨组件协调。

**Major components:**

1. **Service Worker (background.js)** — 事件总线，处理快捷键、上下文菜单、定时任务；零内存状态，所有状态持久化
2. **Content Script (content.js)** — 注入目标页面，捕获页面元数据（标题、URL、描述）和触发截图；必须处理 SPA 导航
3. **Popup (popup.html/js)** — 快速保存入口和搜索面板，用户最常访问的界面
4. **Storage Layer** — chrome.storage.local（元数据）+ IndexedDB（缩略图）双层存储
5. **Options Page (options.html/js)** — 管理界面，查看所有保存内容、分类管理、存储清理

### Critical Pitfalls

1. **Service Worker 生命周期误解** — Service Worker 随时可能被终止，不能用全局变量存状态。预防：所有状态立即写入 chrome.storage.local，使用 chrome.alarms 替代 setTimeout
2. **SPA 页面导航不触发 Content Script** — YouTube/Twitter 等 SPA 使用 History API 导航，Content Script 不重新注入。预防：监听 popstate 和 MutationObserver，Service Worker 监听 chrome.webNavigation.onHistoryStateUpdated
3. **chrome.storage.local 配额耗尽** — 约 10MB 上限，缩略图快速累积。预防：元数据用 chrome.storage，缩略图压缩到 100KB 以内存 IndexedDB，实现配额监控
4. **快捷键冲突和 4 个限制** — Manifest 只能定义最多 4 个默认快捷键，且可能与其他扩展冲突。预防：只设 1-2 个核心快捷键，提供自定义入口
5. **过多权限吓跑用户** — `<all_urls>` 或 `tabs` 权限显示红色警告。预防：优先使用 activeTab，按需申请可选权限

## Implications for Roadmap

基于研究，建议 4 个阶段的路线图结构：

### Phase 1: 核心架构与基础存储

**Rationale:** MV3 的架构约束（Service Worker 无状态、存储分层）必须在最开始确立，后期修改成本极高。先建好地基，再建功能。
**Delivers:** 可运行的扩展骨架 — Manifest、Service Worker、Content Script、双层存储、消息通信
**Addresses:** 存储架构、权限设计
**Avoids:** Service Worker 生命周期陷阱、存储配额陷阱、权限过多陷阱

### Phase 2: 网页捕获与保存

**Rationale:** 保存是整个产品的核心入口，其他功能（搜索、管理）都依赖已保存的数据。
**Delivers:** 一键保存当前页（标题、URL、描述、缩略图）、去重检测、分类标记
**Addresses:** 快速保存、去重检测、基础分类（table stakes）
**Avoids:** SPA 导航陷阱、Content Script 注入时机、截图配额超限、URL 去重不完善

### Phase 3: 快捷键搜索面板

**Rationale:** 搜索是"3秒找到网页"的核心承诺，也是产品的差异化体验。快捷键唤起是 Power User 的关键诉求，独立成一个阶段确保体验质量。
**Delivers:** 快捷键唤起的搜索面板（Overlay），标题/URL 实时搜索，按分类过滤
**Addresses:** 基础搜索（table stakes）、快捷键面板（differentiator）
**Avoids:** 快捷键冲突、超过 4 个快捷键限制、搜索面板 CSP 问题

### Phase 4: 管理界面与数据维护

**Rationale:** 用户需要一个完整视图来管理积累的内容，同时存储配额监控和清理功能是长期使用的保障。
**Delivers:** Options Page 管理界面（列表/卡片视图）、批量操作（删除/分类）、存储使用监控、数据导出
**Addresses:** 批量操作（table stakes）、可视化预览（differentiator）、数据导出（反反特性规避）
**Avoids:** 大量数据时读取缓慢、配额监控缺失

### Phase Ordering Rationale

- **架构优先于功能：** Phase 1 建立无状态 Service Worker 和分层存储的原则，这是所有后续功能的前提
- **捕获优先于搜索：** 没有保存数据，搜索面板无法测试和验证，Phase 2 必须在 Phase 3 之前
- **核心功能优先于管理：** 保存和搜索是 v1 的核心价值，Phase 4 的管理界面是"完整产品"但非 MVP 的必要条件
- **依赖链：** 快速保存 → 去重检测 → 分类组织 → 基础搜索，完全符合 Phase 2→3→4 的顺序

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 1:** Service Worker 无状态架构的具体实现模式、IndexedDB 在扩展中的最佳实践 — ARCHITECTURE.md 未生成，需要补充研究
- **Phase 2:** chrome.tabs.captureVisibleTab 的权限边界和 SPA 兼容的具体实现方案
- **Phase 3:** 搜索面板以 Overlay 还是 Popup 形式实现的权衡（影响注入方式）

Phases with standard patterns (skip research-phase):

- **Phase 4:** 管理界面是标准 Web 页面开发，模式成熟，无需额外研究

## Confidence Assessment

| Area         | Confidence | Notes                                                                      |
| ------------ | ---------- | -------------------------------------------------------------------------- |
| Stack        | LOW        | STACK.md 未生成，以上推断来自 PITFALLS.md 的间接建议，需验证               |
| Features     | HIGH       | 基于多个竞品分析和用户研究，来源质量高                                     |
| Architecture | LOW        | ARCHITECTURE.md 未生成，基于 Chrome 平台约束推断，核心约束准确但细节需验证 |
| Pitfalls     | MEDIUM     | 基于官方文档和社区实践，与 Chrome MV3 平台约束高度吻合                     |

**Overall confidence:** MEDIUM

### Gaps to Address

- **STACK.md 未生成：** 技术栈选择（特别是是否使用框架、构建工具选择）需要在 Phase 1 规划时补充研究
- **ARCHITECTURE.md 未生成：** 组件通信设计、IndexedDB 使用模式、搜索算法选择需要在 Phase 1 规划时明确
- **搜索面板形态：** Overlay（注入到页面）vs Popup（扩展弹窗）vs New Tab 三种方案各有权衡，需要在 Phase 3 规���时决策
- **存储上限的实际影响：** 100 个网页含缩略图的实际存储占用需要 Phase 1 验证，决定是否需要引入 IndexedDB

## Sources

### Primary (HIGH confidence)

- [Best Tab Managers Comparison 2025](https://botab.net/blog/best-chrome-tab-managers-2025) — 竞品功能对比
- [Chrome Extension Storage API Guide](https://www.mellowtel.com/blog/chrome-extension-storage-api-guide) — 存储 API 限制
- [Google Chrome: maximum of 4 chrome.commands](https://stackoverflow.com/questions/14000217/) — 快捷键限制确认

### Secondary (MEDIUM confidence)

- [OneTab Features Analysis](https://appmus.com/software/onetab) — 竞品功能分析
- [Session Buddy Features](https://appmus.com/software/session-buddy) — 竞品功能分析
- [Workona Tab Manager Help](https://workona.com/help/tab-manager/) — 工作空间模式参考
- [Content script only loading on reload/refresh](https://stackoverflow.com/questions/49665031/) — SPA 导航问题
- [Chrome extension only runs on refresh](https://stackoverflow.com/questions/39627817/) — SPA 导航问题
- [Longer extension service worker lifetimes](https://www.webskaper.no/oppdateringer/longer-esw-lifetimes/) — SW 生命周期
- [Tab Manager Features Users Expect](https://www.rabbitpair.com/en/blog/10-best-tab-manager-chrome-extensions-2025) — 用户期望

### Tertiary (LOW confidence)

- [Reddit: Chrome Tab System Complaints](https://www.reddit.com/r/chrome/comments/rm4tk6/) — 用户痛点
- [Service Worker Lifespan Hacks](https://openillumi.com/en/en-chrome-extension-sw-keep-alive-fix/) — 社区方案，需验证

---

_Research completed: 2026-03-30_
_Ready for roadmap: yes (with noted gaps — STACK.md and ARCHITECTURE.md missing)_
