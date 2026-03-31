---
phase: 03-搜索面板
plan: 05
status: complete
started: 2026-03-31
completed: 2026-03-31
---

# 03-05: 修复快捷键无法唤起搜索面板的问题

## 目标

修复快捷键无法唤起搜索面板的问题，将快捷键监听从 content script 移到 background，通过消息机制实现通信。

## 完成的工作

### Task 1: 在 background 中监听快捷键并转发消息
- 在 `src/background/index.ts` 添加 `chrome.commands.onCommand.addListener` 监听器
- 使用 `chrome.tabs.sendMessage` 将命令转发到当前活动标签页
- 添加错误处理和日志便于调试

### Task 2: 在 content script 中接收消息并切换状态
- 移除 `src/content/index.tsx` 中错误的 `chrome.commands.onCommand` 调用
- 改用 `chrome.runtime.onMessage.addListener` 接收来自 background 的消息
- 正确清理监听器避免内存泄漏
- 保持 Esc 键监听逻辑不变

## 技术方案

**问题根因：** chrome.commands API 只能在 background/service worker 中使用，不能在 content script 中使用。

**解决方案：**
1. Background 监听快捷键命令
2. 通过 `chrome.tabs.sendMessage` 发送消息到 content script
3. Content script 通过 `chrome.runtime.onMessage` 接收消息并切换面板状态

## 验证结果

✓ 构建成功：npm run build 无错误
✓ Background 包含 `chrome.commands.onCommand.addListener`
✓ Content script 包含 `chrome.runtime.onMessage.addListener`
✓ Content script 不再包含 `chrome.commands.onCommand`

## 关键文件

### 创建/修改
- `src/background/index.ts` - 添加快捷键监听器（+19 行）
- `src/content/index.tsx` - 改用消息监听机制（+16 行，-5 行）

## 提交记录

- fd1848d: fix(03-05): 修复快捷键无法唤起搜索面板的问题

## 偏差说明

无偏差，按计划完成。

## Self-Check: PASSED

- [x] 所有任务已执行
- [x] 每个任务单独提交
- [x] SUMMARY.md 已创建
- [x] 构建成功无错误
- [x] 代码符合 must_haves 要求
