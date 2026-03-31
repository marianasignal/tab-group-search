# Requirements — v1.1 修复与稳定

## Milestone Goal

复盘 v1.0 的设计与实现问题，修复所有已知 bug，建立正确的产品行为基线。

## v1.1 Requirements

### BUG 修复

- [ ] **BUG-01**: 修复 content script 在 iframe 中多实例注入（manifest.json 添加 `all_frames: false`）
- [ ] **BUG-02**: 修复搜索面板分类筛选显示上一次结果的驻留问题（useMemo 替换 useEffect）
- [ ] **BUG-03**: 修复标签组数据同步逻辑——标签组数据应持久化保存，不因标签/标签组关闭而删除
- [ ] **BUG-04**: 修复搜索面板标签组筛选器——应显示 Chrome 当前实际存在的标签组，而非历史记录中的所有分组

### 行为正确性

- [ ] **BEHAVIOR-01**: 搜索面板打开时，标签组筛选器与 Chrome 实际标签组保持一致
- [ ] **BEHAVIOR-02**: 点击标签组按钮后，列表立即只显示该分组的网页记录
- [ ] **BEHAVIOR-03**: 关闭标签组后，网页记录仍保留在数据库中（可通过"全部"查看）
- [ ] **BEHAVIOR-04**: 删除 Chrome 标签组后，下次打开面板时该分组按钮消失

## Future Requirements

（从 v1.0 延期）
- 手动保存网页（用户主动确认加入队列）
- 管理界面（查看、编辑、删除所有记录）
- 网页缩略图存储

## Out of Scope (v1.1)

- 新功能开发 — 本里程碑仅修复 bug，不添加新功能
- UI 重设计 — 保持现有视觉风格

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| BUG-01 | 4 | Done |
| BUG-02 | 4 | Done |
| BUG-03 | 4 | Done |
| BUG-04 | 4 | Done |
| BEHAVIOR-01 | 4 | Done |
| BEHAVIOR-02 | 4 | Done |
| BEHAVIOR-03 | 4 | Done |
| BEHAVIOR-04 | 4 | Done |
