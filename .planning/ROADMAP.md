# Roadmap — v1.1 修复与稳定

## Milestone Overview

**Version:** v1.1
**Goal:** 修复 v1.0 所有已知 bug，建立正确的产品行为基线
**Phases:** 1 (Phase 4)
**Requirements:** 8

## Phase Summary

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|-----------------|
| 4 | Bug 修复与行为校正 | 修复所有 v1.0 已知 bug，确保核心功能行为正确 | BUG-01 ~ BUG-04, BEHAVIOR-01 ~ BEHAVIOR-04 | 4 |

## Phase Details

### Phase 4: Bug 修复与行为校正

**Goal:** 修复所有 v1.0 已知 bug，确保搜索面板和标签组同步行为正确

**Requirements:**
- BUG-01: 修复 iframe 多实例注入
- BUG-02: 修复筛选结果驻留问题
- BUG-03: 修复标签组数据持久化逻辑
- BUG-04: 修复标签组筛选器数据源
- BEHAVIOR-01 ~ BEHAVIOR-04: 验证正确行为

**Success Criteria:**
1. 选择标签组后，列表立即只显示该分组的记录
2. 关闭标签组后，网页记录保留在"全部"列表中
3. Chrome 删除标签组后，下次打开面板时该按钮消失
4. 在含有 iframe 的页面上，搜索面板不会叠加显示

**Status:** COMPLETE (已在会话中完成所有修复)

## Coverage Check

- BUG-01 ✓ → Phase 4
- BUG-02 ✓ → Phase 4
- BUG-03 ✓ → Phase 4
- BUG-04 ✓ → Phase 4
- BEHAVIOR-01 ✓ → Phase 4
- BEHAVIOR-02 ✓ → Phase 4
- BEHAVIOR-03 ✓ → Phase 4
- BEHAVIOR-04 ✓ → Phase 4

**Coverage: 100%** ✓
