---
status: diagnosed
phase: 03-搜索面板
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md]
started: 2026-03-31T03:30:00.000Z
updated: 2026-03-31T03:35:00.000Z
---

## Current Test

[diagnosing issue from test 1]

## Tests

### 1. 快捷键唤起搜索面板

expected: 在任意网页按下 Ctrl+Space，屏幕中央出现半透明背景遮罩，中央显示白色圆角搜索面板（600px 宽），搜索框自动获得焦点。
result: issue
reported: "按下快捷键无反应，扩展管理页面显示有错误"
severity: blocker

### 2. 关闭搜索面板

expected: 按 Esc 键或点击背景遮罩，搜索面板消失。再次按 Ctrl+Space 可重新打开。
result: [pending]

### 3. 样式隔离

expected: 搜索面板的样式不受页面 CSS 影响，在不同网站上显示一致（测试至少 2 个不同风格的网站）。
result: [pending]

### 4. 空状态显示所有网页

expected: 打开搜索面板时搜索框为空，结果列表显示所有已保存的网页（来自 Phase 2 同步的标签组数据）。
result: [pending]

### 5. 实时搜索 - 标题匹配

expected: 在搜索框输入网页标题的关键词（如 "GitHub"），结果列表实时更新（约 300ms 延迟），只显示标题包含该关键词的网页。
result: [pending]

### 6. 实时搜索 - URL 匹配

expected: 在搜索框输入 URL 片段（如 "google.com"），结果列表显示 URL 包含该片段的网页。
result: [pending]

### 7. 实时搜索 - 分组名称匹配

expected: 在搜索框输入分组名称（如 "工作"），结果列表显示属于该分组的所有网页。
result: [pending]

### 8. 模糊搜索容错

expected: 输入拼写错误的关键词（如 "Githb" 而不是 "GitHub"），仍能找到相关结果。
result: [pending]

### 9. 搜索结果展示

expected: 每条搜索结果显示：网页标题（粗体黑色）、URL（小号灰色）、分组标签（带颜色的圆角标签）。
result: [pending]

### 10. 点击打开网页

expected: 点击任意搜索结果，在新标签页打开对应网页，搜索面板自动关闭。
result: [pending]

### 11. 分组标签显示

expected: 搜索框下方显示所有分组的标签按钮，每个标签使用对应的分组颜色，最左侧有"全部"按钮。
result: [pending]

### 12. 分组过滤 - 选择分组

expected: 点击某个分组标签（如"工作"），该标签显示蓝色边框高亮，结果列表只显示该分组的网页。
result: [pending]

### 13. 分组过滤 - 返回全部

expected: 点击"全部"按钮，"全部"按钮变为蓝色背景，结果列表显示所有网页。
result: [pending]

### 14. 组合过滤

expected: 选择某个分组后，在搜索框输入关键词，结果列表只显示该分组内匹配关键词的网页。
result: [pending]

### 15. 键盘导航 - 默认选中

expected: 打开搜索面板或输入关键词后，第一个搜索结果自动高亮（蓝色背景 + 左侧蓝色边框）。
result: [pending]

### 16. 键盘导航 - 向下移动

expected: 按下方向键 ↓，高亮移动到下一个结果。连续按下可依次向下移动。
result: [pending]

### 17. 键盘导航 - 向上移动

expected: 按下方向键 ↑，高亮移动到上一个结果。在第一个结果时按 ↑ 保持不变。
result: [pending]

### 18. 键盘导航 - 回车打开

expected: 使用方向键选中某个结果后，按 Enter 键，在新标签页打开该网页，搜索面板自动关闭。
result: [pending]

### 19. 键盘导航 - 搜索重置选择

expected: 选中第 3 个结果后，修改搜索关键词，高亮自动重置到新结果列表的第一个。
result: [pending]

## Summary

total: 19
passed: 0
issues: 1
pending: 18
skipped: 0
blocked: 0

## Gaps

- truth: "在任意网页按下 Ctrl+Space，屏幕中央出现半透明背景遮罩，中央显示白色圆角搜索面板（600px 宽），搜索框自动获得焦点。"
  status: failed
  reason: "User reported: 按下快捷键无反应，扩展管理页面显示有错误"
  severity: blocker
  test: 1
  root_cause: "chrome.commands.onCommand.addListener 在 content script 中调用，但该 API 只能在 background/service worker 中使用"
  debug_session: chrome-shortcut-not-working.md
  artifacts: [src/content/index.tsx, src/background/index.ts]
  missing: [background 到 content script 的消息转发机制]
