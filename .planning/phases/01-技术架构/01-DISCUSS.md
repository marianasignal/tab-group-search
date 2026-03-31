# Phase 1: 技术架构 — 讨论文档

## 目标

搭建最小可运行的 Chrome MV3 扩展骨架，验证核心技术可行性。

## 需求映射

- ARC-01: Chrome Manifest V3 扩展
- ARC-02: 使用 chrome.tabGroups API + chrome.tabs API
- ARC-03: 数据本地存储 (chrome.storage.local)
- ARC-04: Service Worker 无状态设计

## 成功标准

1. 扩展可以加载到 Chrome 且不报错 (chrome://extensions 显示已启用)
2. Service Worker 可以正常注册并响应事件
3. 数据可以写入 chrome.storage.local 并在 Service Worker 重启后读取
4. chrome.tabGroups API 和 chrome.tabs API 可以正常调用

## 技术栈确认

基于 CLAUDE.md 推荐：

- **构建工具**: Vite ^5.0.0
- **UI 框架**: React ^18.3.0 + TypeScript ^5.0.0
- **存储**: chrome.storage.local (主存储) + IndexedDB (缩略图，v2)
- **搜索**: Fuse.js ^7.0.0 (Phase 3 使用)
- **样式**: Tailwind CSS ^3.4.0

## Phase 1 实现范围

### 最小骨架包含：

1. **项目初始化**
   - 使用 Vite 创建项目
   - 配置 TypeScript
   - 配置 Tailwind CSS
   - 配置 Chrome Extension 构建

2. **Manifest V3 配置**
   - manifest.json (MV3 格式)
   - 声明 permissions: storage, tabGroups, tabs
   - 配置 Service Worker (background)

3. **Service Worker**
   - 创建 background.ts
   - 监听扩展安装事件
   - 测试 chrome.storage.local 读写
   - 测试 chrome.tabGroups API 调用

4. **验证脚本**
   - 简单的测试代码验证 API 可用性
   - 在控制台输出验证结果

### 不包含：

- UI 界面（Phase 3）
- 标签组同步逻辑（Phase 2）
- 搜索功能（Phase 3）
- 复杂的数据结构设计（Phase 2）

## 关键决策点

### 1. 构建配置

**决策**: 使用 Vite + vite-plugin-web-extension

**理由**:
- Vite 构建速度快，HMR 体验好
- vite-plugin-web-extension 专门为 Chrome 扩展优化
- 支持 TypeScript、React、Tailwind 开箱即用

**替代方案**:
- Webpack (配置复杂，构建慢)
- 无构建 (无法使用 TypeScript/React)

### 2. 项目结构

```
tmp/
├── src/
│   ├── background/
│   │   └── index.ts          # Service Worker
│   ├── manifest.json          # MV3 配置
│   └── types/
│       └── chrome.d.ts        # Chrome API 类型定义
├── public/
│   └── icons/                 # 扩展图标
├── dist/                      # 构建输出
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### 3. Service Worker 设计

**约束**: MV3 的 Service Worker 是无状态的，可能随时被终止

**设计原则**:
- 所有状态存储在 chrome.storage.local
- 不依赖全局变量
- 事件驱动架构

### 4. 存储结构（初步）

Phase 1 只需验证读写，不需要完整的数据结构。简单测试数据：

```typescript
interface TestData {
  timestamp: number;
  message: string;
}
```

完整的数据结构在 Phase 2 设计。

## 实现计划

### Plan 1.1: 项目初始化

**目标**: 创建 Vite + React + TypeScript 项目骨架

**步骤**:
1. 初始化 npm 项目
2. 安装依赖 (vite, react, typescript, tailwind)
3. 配置 vite.config.ts
4. 配置 tsconfig.json
5. 配置 tailwind.config.js

**验证**: `npm run build` 成功执行

### Plan 1.2: Manifest V3 配置

**目标**: 创建符合 MV3 规范的 manifest.json

**步骤**:
1. 创建 src/manifest.json
2. 配置 manifest_version: 3
3. 声明 permissions: ["storage", "tabGroups", "tabs"]
4. 配置 background service worker
5. 添加扩展图标

**验证**: manifest.json 通过 Chrome 扩展验证

### Plan 1.3: Service Worker 实现

**目标**: 实现基础 Service Worker，验证 API 可用性

**步骤**:
1. 创建 src/background/index.ts
2. 监听 chrome.runtime.onInstalled 事件
3. 测试 chrome.storage.local.set/get
4. 测试 chrome.tabGroups.query
5. 在控制台输出验证结果

**验证**:
- 扩展加载后控制台显示验证信息
- chrome.storage.local 可以读写
- chrome.tabGroups API 返回当前标签组

### Plan 1.4: 构建和加载测试

**目标**: 验证扩展可以正常构建和加载到 Chrome

**步骤**:
1. 运行 `npm run build`
2. 在 chrome://extensions 加载 dist 目录
3. 检查扩展状态（无错误）
4. 查看 Service Worker 控制台输出

**验证**:
- 扩展在 chrome://extensions 显示为已启用
- Service Worker 控制台显示验证通过信息

## 风险和缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Vite 配置不兼容 MV3 | 构建失败 | 使用成熟的 vite-plugin-web-extension |
| Chrome API 类型定义缺失 | TypeScript 报错 | 安装 @types/chrome |
| Service Worker 调试困难 | 开发效率低 | 使用 chrome://serviceworker-internals 调试 |

## 下一步

完成 Phase 1 后，进入 Phase 2（标签组同步），届时需要：
- 设计完整的数据存储结构
- 实现标签组事件监听
- 实现数据同步逻辑
