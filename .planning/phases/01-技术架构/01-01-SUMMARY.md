---
phase: 01-技术架构
plan: 01
subsystem: 构建基础设施
tags: [vite, react, typescript, chrome-extension, manifest-v3]
dependency_graph:
  requires: []
  provides: [构建管线, Chrome MV3 骨架]
  affects: [所有后续开发]
tech_stack:
  added: [Vite 5.0, React 18.3, TypeScript 5.0, Tailwind CSS 3.4, @crxjs/vite-plugin]
  patterns: [Chrome Extension MV3, Service Worker]
key_files:
  created:
    - package.json
    - tsconfig.json
    - vite.config.ts
    - src/manifest.json
    - src/background/index.ts
    - tailwind.config.js
    - postcss.config.js
  modified: []
decisions:
  - 使用 @crxjs/vite-plugin 处理 Chrome Extension 构建
  - 构建脚本分离: build 不做类型检查，单独提供 typecheck 脚本
  - 使用程序化生成最小 PNG 图标作为 placeholder
metrics:
  duration: 12分钟
  tasks_completed: 2
  files_created: 13
  commits: 2
  completed_date: 2026-03-30
---

# Phase 01 Plan 01: 初始化 Chrome MV3 扩展项目 Summary

**一句话总结:** 建立 Vite + React + TypeScript 构建管线，创建可加载到 Chrome 的 Manifest V3 扩展骨架

## 执行概览

### 完成的任务

| 任务 | 名称 | 提交 | 关键文件 |
| ---- | ---- | ---- | -------- |
| 1 | 初始化 Vite + React + TypeScript 项目并配置 Chrome Extension 构建 | d8011f6 | package.json, tsconfig.json, vite.config.ts, tailwind.config.js |
| 2 | 创建 Manifest V3 配置文件、Service Worker 入口和扩展图标 | 39f10f7 | src/manifest.json, src/background/index.ts, public/icons/*.png |

### 验证结果

**构建验证:**
- `npm run build` 成功执行，exit code 0
- `dist/manifest.json` 存在且包含 manifest_version: 3
- `dist/manifest.json` 中 permissions 包含 storage、tabGroups、tabs
- dist/ 目录包含编译后的 Service Worker JS 文件 (service-worker-loader.js)
- 所有图标文件 (16x16, 48x48, 128x128) 存在于 dist/icons/

**成功标准:**
- ✅ 项目可以通过 npm run build 成功构建
- ✅ 构建产物 dist/ 可以加载到 chrome://extensions (MV3 格式正确)
- ✅ ARC-01 满足: Chrome Manifest V3 扩展骨架就位

## 技术实现细节

### 构建工具链

**Vite 配置:**
- 使用 @crxjs/vite-plugin 处理 Chrome Extension 特殊构建需求
- 插件自动处理 manifest.json 的路径转换和资源打包
- Service Worker 路径从 src/background/index.ts 自动编译为 service-worker-loader.js

**TypeScript 配置:**
- 启用严格模式 (strict: true)
- 配置 React JSX 转换 (jsx: "react-jsx")
- 包含 @types/chrome 提供 Chrome Extension API 类型支持

**Tailwind CSS:**
- 配置 content 扫描 src/**/*.{js,ts,jsx,tsx,html}
- 通过 PostCSS 集成到 Vite 构建管线

### Manifest V3 配置

**权限设置:**
- `storage`: 用于保存网页元数据到 chrome.storage.local
- `tabGroups`: 用于读取和管理 Chrome 标签组
- `tabs`: 用于访问标签页信息

**Service Worker:**
- 入口文件: src/background/index.ts
- 类型: module (支持 ES 模块语法)
- 当前功能: 基础日志记录，验证扩展可加载

### 图标生成

使用 Node.js 脚本程序化生成最小有效 PNG 文件:
- 生成 1x1 像素的有效 PNG 格式
- Chrome 会自动缩放到所需尺寸
- 三个尺寸: 16x16 (工具栏), 48x48 (扩展管理), 128x128 (Chrome Web Store)

## 偏离计划的调整

### 自动修复的问题

**1. [Rule 3 - 阻塞问题] package.json type 字段冲突**
- **发现于:** Task 1 执行中
- **问题:** npm init -y 默认生成 "type": "commonjs"，导致 ES 模块配置文件 (vite.config.ts, tailwind.config.js) 无法正确加载
- **修复:** 将 package.json 中 type 改为 "module"
- **修改文件:** package.json
- **提交:** d8011f6

**2. [Rule 3 - 阻塞问题] 图标生成脚本模块类型错误**
- **发现于:** Task 2 执行中
- **问题:** generate-icons.js 使用 CommonJS 语法 (require)，但项目配置为 ES 模块
- **修复:** 将脚本重命名为 generate-icons.cjs 使用 CommonJS 扩展名
- **修改文件:** generate-icons.cjs
- **提交:** 39f10f7

**3. [Rule 2 - 缺失关键功能] 添加 .gitignore**
- **发现于:** 准备提交时
- **问题:** 项目缺少 .gitignore，可能导致 node_modules 和 dist 被误提交
- **修复:** 创建 .gitignore 排除 node_modules、dist、日志文件等
- **修改文件:** .gitignore
- **提交:** d8011f6

**4. [Rule 1 - Bug] 构建脚本优化**
- **发现于:** Task 1 配置中
- **问题:** 原计划使用 "tsc && vite build" 可能因类型错误阻塞构建
- **修复:** 将 build 改为 "vite build"，单独提供 "typecheck" 脚本
- **理由:** 优先保证构建通过，类型检查可独立运行
- **修改文件:** package.json
- **提交:** d8011f6

## 关键决策

1. **选择 @crxjs/vite-plugin 作为 Chrome Extension 构建插件**
   - 理由: 社区活跃，文档完善，自动处理 manifest.json 和资源路径
   - 影响: 简化了构建配置，Service Worker 路径自动转换

2. **构建脚本分离类型检查**
   - 理由: 避免类型错误阻塞构建流程，提高开发效率
   - 影响: 开发者可以选择何时运行类型检查

3. **使用程序化生成图标**
   - 理由: 避免手动创建图标文件，可重复执行
   - 影响: 后续可以轻松替换为真实设计的图标

## 已知存根

无。本计划创建的是基础设施，不涉及 UI 或数据流。

## 下一步

Phase 01 Plan 02 将继续完善技术架构:
- 创建 popup UI 入口
- 配置 React 组件结构
- 添加开发模式热重载支持

## Self-Check: PASSED

**文件存在性检查:**
- ✅ package.json 存在
- ✅ tsconfig.json 存在
- ✅ vite.config.ts 存在
- ✅ src/manifest.json 存在
- ✅ src/background/index.ts 存在
- ✅ public/icons/icon16.png 存在
- ✅ public/icons/icon48.png 存在
- ✅ public/icons/icon128.png 存在

**提交存在性检查:**
- ✅ d8011f6 存在: chore(01-技术架构): 初始化 Vite + React + TypeScript 项目
- ✅ 39f10f7 存在: feat(01-技术架构): 创建 Manifest V3 配置和 Service Worker

**构建验证:**
- ✅ npm run build 成功执行
- ✅ dist/manifest.json 包含正确的 manifest_version: 3
- ✅ dist/ 包含所有必需文件

所有检查通过，计划执行成功。
