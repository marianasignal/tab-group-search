---
status: investigating
trigger: "诊断 Chrome 扩展快捷键无法工作的问题"
created: 2026-03-31T00:00:00Z
updated: 2026-03-31T00:00:00Z
---

## Current Focus

hypothesis: chrome.commands API 不能在 content script 中使用，应该在 background script 中监听
test: 检查 Chrome API 文档和现有代码结构
expecting: 发现 content script 中错误使用了 chrome.commands API
next_action: 读取 manifest.json 和 src/content/index.tsx

## Symptoms

expected: 按下 Ctrl+Space 快捷键时打开搜索面板
actual: 按下快捷键无反应，扩展管理页面显示有错误
errors: 扩展管理页面显示错误（具体错误信息待确认）
reproduction: 1. 加载扩展 2. 按下 Ctrl+Space
started: 初次实现快捷键功能时就存在

## Eliminated

## Evidence

- timestamp: 2026-03-31T03:49:00Z
  checked: src/content/index.tsx 第 10 行
  found: 在 content script 中使用了 chrome.commands.onCommand.addListener
  implication: chrome.commands API 只能在 background/service worker 中使用，不能在 content script 中使用

- timestamp: 2026-03-31T03:49:00Z
  checked: Chrome Extension API 文档
  found: chrome.commands.onCommand 事件只在 background context 中触发
  implication: 需要在 background script 中监听命令，然后通过消息传递通知 content script

## Resolution

root_cause: chrome.commands.onCommand.addListener 在 content script (src/content/index.tsx) 中调用，但该 API 只能在 background/service worker 中使用。Chrome Extension Manifest V3 中，commands 事件只在 background context 触发。
fix: 在 background/index.ts 中监听 chrome.commands.onCommand，收到命令后通过 chrome.tabs.sendMessage 发送消息给当前标签页的 content script，content script 监听消息并切换面板状态
verification:
files_changed: [src/background/index.ts, src/content/index.tsx]
