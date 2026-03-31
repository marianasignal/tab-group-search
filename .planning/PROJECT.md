# 注意力队列 - 网页数据库管理插件

## What This Is

一个 Chrome 浏览器扩展,将网页管理从"标签页状态"转变为"数据库思维"。用户通过增删查操作管理网页,以注意力为核心,快速找到需要的内容,同时释放浏览器内存。

## Core Value

**快速检索** — 用户能在 3 秒内通过关键词或分类找到并打开任何已保存的网页

## Context

### 问题
- 打开太多标签页导致查找困难
- 浏览器内存占用过高
- 注意力被大量打开的网页分散

### 解决方案
提供"网页数据库"管理范式:
- **增**: 自动捕获网页,手动确认是否加入队列及分类
- **删**: 从队列移除不需要的网页
- **查**: 快捷键唤起,通过关键词搜索或分类浏览快速找到网页

### 核心使用场景

**1. 保存阶段**
- 用户浏览网页时,插件自动捕获
- 弹出确认框: 是否加入队列? 选择分类?
- 确认后保存(URL去重),标签页保持打开
- 存储: URL、标题、用户描述、分类标签、缩略图

**2. 检索阶段** (日常高频)
- 快捷键唤起搜索面板
- 输入关键词搜索描述/标题,或选择分类浏览
- 点击结果在新标签页打开

**3. 管理阶段**
- 点击插件图标打开完整管理界面
- 查看所有队列网页
- 编辑描述/分类
- 删除不需要的网页

### 目标用户
产品经理 Signal 本人(不会代码,需要管理大量调研网页)

### 技术约束
- Chrome 扩展 (Manifest V3)
- 仅支持 Chromium 内核浏览器
- 本地存储 (chrome.storage.local)

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 用户打开网页时自动捕获并弹出确认框
- [ ] 用户可选择是否加入队列及分类
- [ ] 保存时检测 URL 去重
- [ ] 保存网页的 URL、标题、描述、分类、缩略图
- [ ] 快捷键唤起搜索面板
- [ ] 支持关键词搜索(标题/描述)
- [ ] 支持按分类浏览
- [ ] 点击结果在新标签页打开网页
- [ ] 插件图标打开完整管理界面
- [ ] 管理界面显示所有队列网页
- [ ] 支持编辑网页描述和分类
- [ ] 支持删除队列中的网页

### Out of Scope

- 自动关闭标签页 — v1 保持手动控制
- 网页快照/离线查看 — 存储成本高,v1 仅存缩略图
- 跨浏览器同步 — v1 本地存储即可
- Firefox 支持 — 先验证 Chrome 版本
- 智能分类推荐 — v1 手动分类
- 过期提醒 — v1 不考虑时间维度

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Chrome 扩展 | 用户主要使用 Chrome,优先验证核心价值 | — Pending |
| 自动捕获+手动确认 | 平衡便利性和控制感 | — Pending |
| 保存后标签页保持打开 | 用户习惯,不强制改变行为 | — Pending |
| 新标签页打开 | 避免丢失当前浏览上下文 | — Pending |
| 本地存储 | 简化 v1,无需后端服务 | — Pending |
| URL 去重 | 避免重复保存同一网页 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

## Current Milestone: v1.1 修复与稳定

**Goal:** 复盘 v1.0 的设计与实现问题，修复所有已知 bug，建立正确的产品行为基线

**Target features:**
- 修复 content script iframe 多实例注入问题
- 修复 React 筛选状态延迟（useMemo 替换 useEffect）
- 修复标签组同步逻辑（持久化数据库设计）
- 建立正确的标签组筛选器同步行为

---
*Last updated: 2026-03-31*
