# Chrome Extension MV3 架构研究

**项目:** 注意力队列 - 网页数据库管理插件
**研究日期:** 2026-03-30
**置信度:** HIGH

## 核心组件

### 1. Service Worker (background.js)

**职责:**
- 扩展生命周期管理
- 监听快捷键命令 (chrome.commands)
- 处理跨组件消息路由
- 管理存储层操作

**MV3 约束:**
- **无状态设计** — Service Worker 会被随时终止 (30秒无活动)
- 不能依赖全局变量保存状态
- 所有状态必须持久化到 chrome.storage

**最佳实践:**
```javascript
// ❌ 错误: 依赖全局状态
let cachedData = [];

// ✅ 正确: 每次从存储读取
chrome.runtime.onMessage.addListener(async (msg) => {
  const data = await chrome.storage.local.get('queue');
  // 处理消息
});
```

### 2. Content Script

**职责:**
- 注入到网页中捕获页面信息
- 提取标题、URL、缩略图
- 监听页面导航 (SPA 兼容)

**注入时机:**
- `document_idle` (推荐) — 页面加载完成后
- `document_end` — DOM 构建完成但资源未加载
- `document_start` — 最早,但 DOM 可能不完整

**消息传递:**
```javascript
// Content Script → Service Worker
chrome.runtime.sendMessage({
  type: 'CAPTURE_PAGE',
  data: { title, url, thumbnail }
});
```

### 3. Popup (popup.html)

**职责:**
- 快捷搜索面板 (命令面板模式)
- 快速保存确认框
- 轻量级交互

**特点:**
- 点击扩展图标打开
- 关闭后 DOM 销毁,状态丢失
- 适合临时交互,不适合长时间操作

### 4. Options Page (options.html)

**职责:**
- 完整管理界面
- 查看所有队列网页
- 编辑、删除、批量操作
- 存储配额监控

**特点:**
- 独立标签页打开
- 可以长时间保持打开
- 适合复杂操作

## 组件通信

### 消息传递模式

```
Content Script ──┐
                 ├──> Service Worker ──┐
Popup ───────────┘                     ├──> chrome.storage
                                       │
Options Page ──────────────────────────┘
```

**API:**
- `chrome.runtime.sendMessage()` — 发送消息
- `chrome.runtime.onMessage.addListener()` — 接收消息
- `chrome.tabs.sendMessage()` — 向特定标签页发送

## 数据存储层

### 双层存储策略

**chrome.storage.local (10MB 配额)**
- 存储元数据: URL、标题、描述、分类、时间戳
- 快速读写,适合频繁访问
- 自动同步到内存

**IndexedDB (无限配额,需用户授权)**
- 存储大文件: 缩略图 (Base64)
- 适合批量查询
- 需要异步操作

**分层规则:**
```
小于 1KB → chrome.storage.local
大于 1KB → IndexedDB
```

## 快捷键 (chrome.commands)

**注册方式 (manifest.json):**
```json
{
  "commands": {
    "open-search": {
      "suggested_key": {
        "default": "Ctrl+Shift+F"
      },
      "description": "打开搜索面板"
    }
  }
}
```

**限制:**
- 最多 4 个默认快捷键
- 用户可以自定义修改
- 容易与其他扩展冲突

**监听:**
```javascript
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-search') {
    // 打开 popup 或创建新窗口
  }
});
```

## 构建产物结构

```
dist/
├── manifest.json          # 扩展配置
├── background.js          # Service Worker
├── content.js             # Content Script
├── popup.html             # 搜索面板
├── popup.js
├── options.html           # 管理界面
├── options.js
└── assets/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

## 推荐构建顺序

### Phase 1: 核心架构
1. manifest.json 配置
2. Service Worker 基础框架 (消息路由)
3. 存储层抽象 (双层存储 API)
4. 快捷键注册

### Phase 2: 网页捕获
1. Content Script 注入
2. 页面信息提取
3. 缩略图生成
4. 去重逻辑

### Phase 3: 搜索面板
1. Popup UI (命令面板)
2. 搜索算法集成
3. 快捷键触发

### Phase 4: 管理界面
1. Options Page UI
2. 批量操作
3. 存储监控

## 关键决策

| 决策 | 推荐 | 原因 |
|------|------|------|
| Service Worker 状态管理 | 无状态 + chrome.storage | MV3 强制要求 |
| Content Script 注入时机 | document_idle | 兼容性最好 |
| 搜索面板形态 | Popup | 快捷键唤起,轻量级 |
| 管理界面形态 | Options Page | 复杂操作,独立标签页 |
| 存储策略 | 双层 (chrome.storage + IndexedDB) | 平衡性能和配额 |
| 快捷键数量 | 1-2 个 | 避免冲突 |

## 风险与缓解

| 风险 | 缓解策略 | 阶段 |
|------|----------|------|
| Service Worker 被终止 | 无状态设计,所有状态持久化 | Phase 1 |
| 存储配额不足 | 双层存储 + 压缩 + 监控 | Phase 1 |
| SPA 导航不触发 | 监听 history API | Phase 2 |
| 快捷键冲突 | 提供自定义选项 | Phase 3 |

---

**置信度:** HIGH
**来源:** Chrome 官方文档 + 社区最佳实践
**待验证:** 实际性能测试 (Phase 1 技术选型时)
