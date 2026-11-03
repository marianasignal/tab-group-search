---
status: awaiting_human_verify
trigger: "React 状态同步问题：SearchPanel 筛选逻辑正确但 UI 显示错误数据"
created: 2026-03-31T10:30:00Z
updated: 2026-03-31T10:50:00Z
---

## Current Focus

hypothesis: Chrome Extension content script 在多个 iframe 中重复注入，导致多个 SearchPanel 实例同时渲染
test: 检查 manifest.json 的 all_frames 配置和实际注入情况
expecting: 如果 all_frames: true，content script 会在主页面和所有 iframe 中注入
next_action: 读取 manifest.json 确认配置，然后修复注入逻辑

## Symptoms

expected: 点击"展现形式"分类按钮后，UI 只显示 6 条该分类的记录
actual: UI 显示了更多记录，包含"日常工具"和"展现形式"两个分类的项目
errors: 无报错，但控制台日志显示筛选逻辑正确（6条记录），UI 却显示更多
reproduction:

1. 打开 SearchPanel
2. 点击"展现形式"分类按钮
3. 观察 UI 显示的记录数量
   started: 未知，用户首次报告

## Eliminated

## Evidence

- timestamp: 2026-03-31T10:30:00Z
  checked: SearchPanel.tsx 代码结构
  found: |
  - useEffect 依赖项正确：[searchQuery, records, selectedGroup]
  - 筛选逻辑清晰：先按 selectedGroup 筛选，再搜索
  - 控制台日志显示筛选后只有 6 条记录
  - setSearchResults(filtered) 在正确位置调用
    implication: 代码逻辑本身没有问题，问题可能在组件实例层面

- timestamp: 2026-03-31T10:35:00Z
  checked: content/index.tsx 挂载逻辑
  found: |
  - content script 在每个页面都会执行
  - 直接在 document.body 上创建容器并挂载 React
  - 没有检查容器是否已存在
  - 没有限制只在 top frame 注入
    implication: 如果页面有 iframe，每个 iframe 都会创建一个 SearchPanel 实例

- timestamp: 2026-03-31T10:36:00Z
  checked: manifest.json 配置
  found: |
  - content_scripts.matches: ["<all_urls>"]
  - 没有配置 all_frames 字段（默认为 true）
  - 这意味着 content script 会在主页面和所有 iframe 中注入
    implication: 这就是根本原因！多个 iframe 导致多个 SearchPanel 实例同时渲染

## Resolution

root_cause: |
Chrome Extension 的 content script 默认会在主页面和所有 iframe 中注入（all_frames: true）。
当前页面如果包含 iframe，每个 iframe 都会创建一个独立的 SearchPanel 实例。
这些实例共享同一个 chrome.storage，所以都能读取到相同的数据。
当用户点击筛选按钮时，每个实例都会独立执行筛选逻辑，但它们的 DOM 可能叠加显示，
导致 UI 显示的记录数量多于实际筛选结果。

fix: |
在 manifest.json 中添加 "all_frames": false，限制 content script 只在顶层页面注入。
或者在 content/index.tsx 中添加检查：if (window !== window.top) return;

verification: |

1. 修改后重新加载扩展
2. 打开包含 iframe 的页面（如 YouTube、Gmail）
3. 触发搜索面板，点击分类筛选
4. 确认 UI 显示的记录数量与控制台日志一致

files_changed: ["src/manifest.json"]
