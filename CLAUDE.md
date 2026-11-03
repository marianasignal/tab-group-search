<!-- GSD:project-start source:PROJECT.md -->
## Project

**标签组检索插件 - Tab Group Search**

一个 Chrome 浏览器扩展,将网页管理从"标签页状态"转变为"数据库思维"。用户通过增删查操作管理网页,以注意力为核心,快速找到需要的内容,同时释放浏览器内存。

**Core Value:** **快速检索** — 用户能在 3 秒内通过关键词或分类找到并打开任何已保存的网页
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## 推荐技术栈
### 构建工具
| 技术 | 版本 | 用途 | 选择理由 |
|------|------|------|---------|
| Vite | ^5.0.0 | 构建工具 | 快速 HMR、原生 ESM、配置简单、社区有成熟的 Chrome Extension 模板 |
- 开发体验优秀，HMR 速度快
- 配置简单，可以轻松配置多入口（popup、background、content script）
- 2025/2026 年社区已有大量成熟模板（如 JohnBra/vite-web-extension）
- 相比 Webpack：配置更简洁，构建速度更快
- 相比无构建：支持 TypeScript、Tailwind、模块化，开发效率高
### UI 框架
| 技术 | 版本 | 用途 | 选择理由 |
|------|------|------|---------|
| React | ^18.3.0 | UI 框架 | 生态成熟、开发效率高、适合中等复杂度界面 |
| TypeScript | ^5.0.0 | 类型系统 | 类型安全、IDE 支持好、减少运行时错误 |
- 本项目有搜索面板、管理界面、确认弹窗等多个 UI 组件，React 的组件化开发效率高
- 相比原生 JS：状态管理更清晰，代码可维护性强
- 相比 Vue：React 在 Chrome Extension 社区更成熟，模板更多
- 相比 Preact：体积优势不明显（Extension 不像网页那么在意几 KB），React 生态更完整
- 相比 Solid：社区资源少，学习成本高
### 存储方案
| 技术 | 版本 | 用途 | 使用场景 |
|------|------|------|---------|
| chrome.storage.local | 原生 API | 主存储 | 存储网页元数据（URL、标题、描述、分类）|
| IndexedDB | 原生 API | 辅助存储 | 存储缩略图（Base64 图片数据）|
- **chrome.storage.local**：
- **IndexedDB**：
### 搜索库
| 技术 | 版本 | 用途 | 选择理由 |
|------|------|------|---------|
| Fuse.js | ^7.0.0 | 模糊搜索 | 轻量（~25KB）、零依赖、支持模糊匹配和权重配置 |
- 支持拼写容错（typo tolerance），用户体验好
- 可配置多字段权重搜索（标题权重 > 描述权重）
- 性能足够（~35ms 搜索时间，对于本地数据库完全够用）
- 相比 lunr.js：API 更简单，文档更友好
- 相比原生 filter：搜索质量更高，支持模糊匹配
- 使用 debounce（300ms）减少搜索频率
- 用 React 的 useMemo 缓存 Fuse 实例
### 样式方案
| 技术 | 版本 | 用途 | 选择理由 |
|------|------|------|---------|
| Tailwind CSS | ^3.4.0 | 样式框架 | 快速开发、体积小（按需生成）、无需写 CSS 文件 |
- 开发速度快，不需要命名 CSS 类
- 按需生成，最终体积小
- 与 Vite + React 集成简单
- 相比纯 CSS：开发效率高，样式一致性好
- 相比 CSS-in-JS：性能更好，无运行时开销
## 依赖安装
### 核心依赖
### 开发依赖
## 替代方案对比
| 类别 | 推荐方案 | 替代方案 | 为什么不选 |
|------|---------|---------|-----------|
| 构建工具 | Vite | Webpack | 配置复杂，构建速度慢 |
| 构建工具 | Vite | 无构建 | 无法使用 TypeScript、Tailwind，开发效率低 |
| UI 框架 | React | 原生 JS | 状态管理复杂，代码可维护性差 |
| UI 框架 | React | Vue | Chrome Extension 社区资源少 |
| UI 框架 | React | Preact | 体积优势不明显，生态不如 React 完整 |
| 搜索库 | Fuse.js | lunr.js | API 复杂，学习成本高 |
| 搜索库 | Fuse.js | 原生 filter | 无模糊匹配，搜索体验差 |
| 样式 | Tailwind | 纯 CSS | 开发效率低，样式一致性难保证 |
| 样式 | Tailwind | CSS-in-JS | 有运行时开销，体积更大 |
## 版本说明
- **React 18.3+**：最新稳定版，支持 Concurrent Features
- **Vite 5.x**：最新稳定版，性能最优
- **Fuse.js 7.x**：最新版本，性能和功能都有提升
- **Tailwind 3.4+**：最新版本，支持更多实用类
- **TypeScript 5.x**：最新稳定版，类型推断更强
## 参考资料
- [How to Build a Chrome Extension with React, Tailwind & Vite](https://www.tmdautov.com/how-to-build-chrome-extension-react-tailwind-vite/)
- [JohnBra/vite-web-extension](https://github.com/JohnBra/vite-web-extension)
- [Fuse.js Official Docs](https://www.fusejs.io/)
- [A Deep Dive into Fuse.js: Benchmarking](https://dev.to/koushikmaratha/a-deep-dive-into-fusejs-advanced-use-cases-and-benchmarking-357p)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
