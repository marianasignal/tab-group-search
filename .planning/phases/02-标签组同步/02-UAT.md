---
status: testing
phase: 02-标签组同步
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md]
started: 2026-03-31T08:35:00Z
updated: 2026-03-31T08:35:00Z
---

## Current Test

number: 1
name: 扩展首次安装时的初始同步
expected: |
  安装扩展后，打开 Chrome DevTools 查看 Service Worker 控制台。
  应该看到 "Initial sync complete: X records" 日志，其中 X 是当前标签组中的标签页数量。
  打开 Chrome DevTools > Application > Storage > chrome.storage.local，
  应该看到 tab_records 键，包含所有现有标签组的标签页数据。
awaiting: user response

## Tests

### 1. 扩展首次安装时的初始同步
expected: 安装扩展后，打开 Chrome DevTools 查看 Service Worker 控制台。应该看到 "Initial sync complete: X records" 日志，其中 X 是当前标签组中的标签页数量。打开 Chrome DevTools > Application > Storage > chrome.storage.local，应该看到 tab_records 键，包含所有现有标签组的标签页数据。
result: [pending]

### 2. 创建新标签组时自动同步
expected: 在 Chrome 中创建一个新标签组（右键标签页 > 添加到新组）。打开 chrome.storage.local，应该立即看到新标签页的记录出现在 tab_records 中，包含正确的 groupName、title、url 字段。
result: [pending]

### 3. 向现有标签组添加标签页
expected: 将一个标签页拖入现有标签组。打开 chrome.storage.local，应该看到该标签页的记录被添加到 tab_records 中，groupId 和 groupName 与标签组匹配。
result: [pending]

### 4. 重命名标签组时更新记录
expected: 右键标签组 > 重命名，输入新名称后等待 2 秒。打开 chrome.storage.local，该标签组的所有记录的 groupName 字段应该更新为新名称。
result: [pending]

### 5. 同一 URL 在同一标签组中去重
expected: 在同一标签组中打开两个相同 URL 的标签页（例如两个 google.com）。打开 chrome.storage.local，tab_records 中应该只有 1 条该 URL 的记录（最后更新的那个），而不是 2 条。
result: [pending]

### 6. 关闭标签页时删除记录
expected: 关闭标签组中的一个标签页。打开 chrome.storage.local，该标签页的记录应该从 tab_records 中消失。
result: [pending]

### 7. 将标签页移出标签组时删除记录
expected: 右键标签页 > 从组中移除。打开 chrome.storage.local，该标签页的记录应该从 tab_records 中删除。
result: [pending]

### 8. 删除整个标签组时批量删除记录
expected: 右键标签组 > 取消分组。打开 chrome.storage.local，该标签组的所有记录应该从 tab_records 中消失。
result: [pending]

### 9. TabRecord 数据结构完整性
expected: 打开 chrome.storage.local，查看任意一条 tab_records 记录。应该包含 8 个字段：id (UUID)、tabId (数字)、url (字符串)、title (字符串)、groupId (数字)、groupName (字符串)、groupColor (字符串)、syncedAt (时间戳)。
result: [pending]

### 10. Debounce 防抖优化验证
expected: 快速连续重命名标签组（例如输入 "test123"）。在输入过程中打开 Service Worker 控制台，应该看到只有最后一次更新被触发（停止输入 2 秒后），而不是每输入一个字符都触发一次。
result: [pending]

## Summary

total: 10
passed: 0
issues: 0
pending: 10
skipped: 0

## Gaps

[none yet]
