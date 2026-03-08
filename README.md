# LLM Chat Platform 🚀

一个基于 Vue 3 + TypeScript 构建的现代化 AI 聊天平台，提供流畅的对话体验和卓越的性能表现。

![Vue](https://img.shields.io/badge/Vue-3.5.24-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)
![Vite](https://img.shields.io/badge/Vite-7.2.5-purple)
![Node.js](https://img.shields.io/badge/Node.js-16+-green)

## ✨ 核心特性

### 🎯 高性能体验

- **虚拟列表技术**：使用 `vue-virtual-scroller` 优化长对话渲染
- **流式传输**：自定义流式响应处理，实现实时 AI 对话体验
- **智能布局**：Flexbox 布局确保输入框始终可见
- **滑动窗口**：智能管理上下文长度，避免 token 超限

### 🔒 多层安全防护

- **XSS 防护**：集成 DOMPurify 库，全面防范跨站脚本攻击
- **内容净化**：自动过滤恶意 HTML 和 JavaScript 代码
- **安全渲染**：Markdown 内容安全渲染，支持代码高亮

### 🛠 现代化技术栈

- **Vue 3**：组合式 API，响应式编程
- **TypeScript**：类型安全，开发体验优秀
- **Pinia**：现代化状态管理，支持持久化存储
- **Vite**：极速构建，热重载体验
- **WebSocket**：实时双向通信

### 💾 数据管理

- **IndexedDB**：浏览器端数据持久化存储
- **会话管理**：多会话支持，支持搜索和删除
- **文件上传**：支持文本文件上传和内容解析

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm 或 yarn

### 项目结构

```
chat-platform/
├── src/
│   ├── components/     # Vue 组件
│   ├── stores/         # Pinia 状态管理
│   ├── services/       # API 服务
│   ├── utils/          # 工具函数
│   ├── types/          # TypeScript 类型定义
│   └── views/          # 页面视图
├── chat-back/          # Node.js 后端服务
└── README.md
```

### 安装依赖

```bash
# 前端依赖
cd chat-platform
npm install

# 后端依赖
cd ../chat-back
npm install
```

### 环境配置

在 `chat-platform` 目录下创建 `.env` 文件：

```env
VITE_API_KEY=您的通义千问API密钥
VITE_MIMO_API_KEY=您的MIMO API密钥
```

在 `chat-back` 目录下创建 `.env` 文件：

```env
PORT=3001
VITE_API_KEY=您的通义千问API密钥
VITE_MIMO_API_KEY=您的MIMO API密钥
```

### 启动应用

1. **启动后端服务**：

```bash
cd chat-back
npm run dev
```

2. **启动前端应用**：

```bash
cd chat-platform
npm run dev
```

3. **访问应用**：
   打开浏览器访问 `http://localhost:5173`

### 构建生产版本

```bash
npm run build
npm run preview
```

## 📖 使用指南

### 基本功能

1. **新建会话**：点击侧边栏"新建聊天"按钮
2. **发送消息**：在输入框中输入内容，按 Enter 或点击发送按钮
3. **切换模型**：点击模型选择器切换不同的 AI 模型
4. **文件上传**：点击附件图标上传文本文件
5. **会话管理**：在侧边栏查看、搜索、删除会话

### 快捷键

- `Enter`：发送消息
- `Shift + Enter`：换行
- `Ctrl/Cmd + K`：快速搜索会话

### 支持的模型

- **通义千问 Plus**：高性能中文模型
- **MIMO**：快速响应模型

## 🔧 开发指南

### 项目配置

- **前端端口**：5173 (开发模式)
- **后端端口**：3001
- **API 代理**：通过 Vite 配置代理到后端

### 核心组件

- `ChatView`：主聊天界面
- `ChatInput`：消息输入组件
- `MessageBubble`：消息气泡组件
- `Sidebar`：侧边栏组件

### 状态管理

使用 Pinia 进行状态管理，主要 store：

- `chatStore`：管理聊天会话、消息、连接状态

### API 服务

- `llm.ts`：AI 模型 API 调用
- WebSocket 连接管理

## 🐛 故障排除

### 常见问题

1. **端口占用错误**

   ```bash
   # 检查端口占用
   netstat -ano | findstr :3000
   # 杀死占用进程
   taskkill /PID <PID> /F
   ```

2. **API 密钥错误**
   - 检查 `.env` 文件中的 API 密钥配置
   - 确保密钥有效且未过期

3. **连接失败**
   - 确保后端服务正在运行
   - 检查网络连接和防火墙设置

### 性能优化

- 启用虚拟滚动处理大量消息
- 使用防抖存储减少 IndexedDB 写入频率
- 限制搜索范围优化搜索性能

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 Vue 3 组合式 API 最佳实践
- 添加必要的注释和文档

## 📄 许可证

本项目采用 MIT 许可证。

### 构建生产版本

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```
