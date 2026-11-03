# 标签组检索插件

Chrome 浏览器扩展，将网页管理从"标签页状态"转变为"数据库思维"。通过增删查操作管理网页，以注意力为核心，快速找到需要的内容，同时释放浏览器内存。

## 核心功能

| 功能 | 说明 |
|------|------|
| **标签组同步** | 自动将 Chrome 标签组数据持久化到本地存储 |
| **快速搜索** | 按 `Ctrl+Space` 打开搜索面板，3秒内找到任意网页 |
| **分组筛选** | 支持按标签组筛选，快速定位目标内容 |
| **模糊匹配** | 按网页标题和网址进行模糊搜索 |

## 核心价值

> **快速检索** — 用户能在 3 秒内通过关键词或分类找到并打开任何已保存的网页

## 技术栈

- **构建工具**: Vite 5.x
- **前端框架**: React 18.3 + TypeScript
- **样式方案**: Tailwind CSS
- **搜索库**: Fuse.js（模糊搜索）
- **存储方案**: chrome.storage.local

## 项目结构

```
├── src/
│   ├── background/          # Service Worker
│   │   ├── index.ts         # 主入口，处理生命周期和消息
│   │   └── sync.ts          # 标签组同步逻辑
│   ├── content/             # 内容脚本
│   │   ├── index.tsx        # 主入口
│   │   ├── SearchPanel.tsx  # 搜索面板组件
│   │   └── index.css        # 样式
│   ├── popup/               # 弹出窗口
│   │   ├── index.html
│   │   └── index.js
│   ├── types/
│   │   └── storage.ts       # 类型定义
│   └── manifest.json        # 扩展配置
├── public/
│   └── icons/               # 扩展图标
├── dist/                    # 构建输出
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 类型检查
npm run typecheck
```

## 安装

1. 构建项目: `npm run build`
2. 打开 Chrome 扩展管理页面: `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `dist` 文件夹

## 使用

1. **快捷键搜索**: 按 `Ctrl+Space` 打开搜索面板
2. **分组筛选**: 点击顶部分组标签筛选
3. **键盘导航**: ↑↓ 选择，Enter 打开
4. **手动同步**: 点击"同步"按钮并确认后，以当前打开的标签组重建数据，清除之前保存的历史记录

## 设计原则

- **无状态设计**: 所有状态存储在 chrome.storage.local，不使用全局变量
- **事件驱动**: 每个 listener 独立工作，Service Worker 可能随时重启
- **本地保存**: 自动同步保留标签组中已记录的网页；关闭标签页不会自动删除记录，手动同步会重建记录

## 隐私与商店发布

数据在浏览器本地处理，不上传至开发者服务器。详见 [隐私政策](PRIVACY.md)。

Chrome Web Store 上架资料、权限说明和测试步骤见 [商店提交资料](store/SUBMISSION.md)。

## 产品方法论

> 核心在于"简单"，即专注于一个功能并做到极致，而不是做加法。
>
> 产品三段论：预测、单点击穿、All-in，即预测市场趋势，找到一个点击破期，然后投入所有资源。

## 版本历史

- **v1.0.0** - 基础功能：标签组同步、搜索面板、快捷键支持
