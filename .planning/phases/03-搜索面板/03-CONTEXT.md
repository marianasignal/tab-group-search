---
phase: 03-搜索面板
created: 2026-03-31
status: ready-for-planning
---

# Phase 3: 搜索面板 - Implementation Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

快捷键唤起的搜索界面，实现关键词搜索和分组过滤，让用户在 3 秒内找到任何保存过的网页。

</domain>

<decisions>
## Implementation Decisions

### 面板形态

- **D-01**: 屏幕中央浮层 - 类似 Spotlight/Alfred 的体验，按快捷键后在屏幕中央弹出浮层，搜索完成后自动消失
- **D-02**: 快捷键使用 Ctrl+Space（用户已安装 Raycast 使用 Alt+Space，不会冲突）
- **D-03**: 通过 Content Script 注入浮层实现 - 在当前标签页注入覆盖整个页面的浮层，需要处理 z-index 和 CSS 隔离

### 搜索交互

- **D-04**: 混合模式 - 输入时实时显示结果，按回车确认选择第一个结果
- **D-05**: 完整键盘支持 - 上下方向键在搜索结果中移动选择，回车打开选中的结果，Esc 关闭面板
- **D-06**: 关闭方式 - Esc 键或点击浮层外部（背景遮罩）都可以关闭面板

### 结果展示

- **D-07**: 显示内容 - 每条结果显示：网页标题（加粗）+ 分组名称（带颜色标签）
- **D-08**: 不显示 URL - 界面更简洁，聚焦于标题和分组
- **D-09**: 按相关度排序 - 使用模糊搜索库（如 Fuse.js）根据关键词匹配程度排序
- **D-10**: 显示全部结果 - 不限制结果数量，用户可以滚动查看所有匹配的网页

### 分组过滤

- **D-11**: 标签按钮过滤 - 显示所有分组的标签按钮（带颜色），点击后只显示该分组的结果
- **D-12**: 标签位置在搜索框下方 - 用户输入关键词后可以进一步通过分组过滤
- **D-13**: 空状态显示全部网页 - 当搜索框为空时，显示所有标签组的网页列表，用户可以浏览所有保存的内容

### Claude's Discretion

- 实时搜索的 debounce 延迟时间（建议 200-300ms）
- 浮层的具体样式设计（宽度、高度、圆角、阴影等）
- 搜索结果列表的每项高度和间距
- 分组标签的具体样式（圆角、padding、字体大小等）
- 键盘导航时的高亮样式
- 加载状态的处理（如果搜索耗时较长）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — Phase 3 需求定义（SEA-01 到 SEA-05）

### Prior Phase Context
- `.planning/phases/02-标签组同步/02-CONTEXT.md` — TabRecord 数据模型和存储方案

No external specs — requirements fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **TabRecord 数据模型** (`src/types/storage.ts`) — 包含 url, title, groupId, groupName, groupColor, syncedAt 字段，可直接用于搜索
- **sync.ts 工具函数** (`src/background/sync.ts`) — getAllRecords() 可用于读取所有标签组数据
- **React 18.3 + TypeScript 5.9** — 已配置完成，可直接开发 React 组件
- **Tailwind CSS 3.4** — 已配置，可用于快速样式开发

### Established Patterns
- **事件驱动架构** — Service Worker 通过 chrome.runtime.onMessage 监听消息
- **chrome.storage.local** — 所有数据存储在本地，读取速度快
- **纯函数设计** — sync.ts 中的所有函数都是纯函数，便于测试

### Integration Points
- **Content Script 注入** — 需要在 manifest.json 中配置 content_scripts
- **快捷键注册** — 需要在 manifest.json 中配置 commands API
- **消息通信** — Content Script 通过 chrome.runtime.sendMessage 与 Service Worker 通信

</code_context>

<specifics>
## Specific Ideas

- 用户提到已安装 Raycast（快捷键 Alt+Space），所以选择 Ctrl+Space 不会冲突
- 类似 Spotlight/Alfred 的体验 — 快速、流畅、不干扰当前工作流
- 空状态显示全部网页 — 用户可以浏览所有保存的标签组内容，不需要输入关键词

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-搜索面板*
*Context gathered: 2026-03-31*
