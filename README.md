# ro-Aichat - AI 聊天应用后端服务

一个基于 Node.js 和 Socket.IO 的 AI 聊天应用后端服务，支持多种 AI 模型接口。

## 项目特性

- 🚀 **实时通信**：基于 Socket.IO 的实时双向通信
- 🤖 **多模型支持**：支持通义千问、Mimo 等多种 AI 模型
- 🔧 **模块化设计**：易于扩展新的 AI 模型接口
- 🔒 **环境配置**：通过环境变量管理敏感信息
- 🌐 **CORS 支持**：跨域请求支持

## 技术栈

- **运行时**: Node.js (ES Modules)
- **Web框架**: Express.js 5.x
- **实时通信**: Socket.IO 4.x
- **环境管理**: dotenv
- **跨域处理**: CORS

## 项目结构

```
ro-Aichat/
├── chat-back/                 # 后端服务目录
│   ├── server.js             # 主服务器文件
│   ├── package.json          # 项目配置和依赖
│   ├── .env                  # 环境变量文件（需要手动创建）
│   └── node_modules/         # 依赖包目录（自动生成）
└── README.md                 # 项目说明文档
```

## 快速开始

### 环境要求

- Node.js 16.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. **克隆项目**

   ```bash
   git clone <repository-url>
   cd ro-Aichat/chat-back
   ```

2. **安装依赖**

   ```bash
   npm install
   ```

3. **配置环境变量**

   创建 `.env` 文件并配置以下变量：

   ```env
   # 服务器端口
   PORT=3001

   # 通义千问 API 配置
   VITE_API_KEY=your_qwen_api_key_here
   VITE_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions

   # Mimo API 配置
   VITE_MIMO_API_KEY=your_mimo_api_key_here
   VITE_MIMO_API_URL=https://api.xiaomimimo.com/v1/chat/completions
   ```

4. **启动服务**

   ```bash
   npm start
   ```

   服务将在 http://localhost:3001 启动

## API 接口

### Socket.IO 事件

#### 客户端发送事件

**chat_request** - 发送聊天请求

```javascript
socket.emit("chat_request", {
  messageId: "unique-message-id",
  model: "qwen-plus", // 或 'mimo'
  messages: [
    {
      role: "user",
      content: "你好，请介绍一下你自己",
    },
  ],
});
```

#### 服务器发送事件

**chat_response** - 接收聊天响应

```javascript
socket.on("chat_response", (data) => {
  console.log("收到响应:", data);
});
```

**chat_error** - 错误响应

```javascript
socket.on("chat_error", (error) => {
  console.error("发生错误:", error);
});
```

## 支持的 AI 模型

### 1. 通义千问 (qwen-plus)

- 模型名称: `qwen-plus`
- API 端点: 阿里云 DashScope
- 配置变量: `VITE_API_KEY`, `VITE_API_URL`

### 2. Mimo (mimo-v2-flash)

- 模型名称: `mimo`
- API 端点: 小觅 Mimo API
- 配置变量: `VITE_MIMO_API_KEY`, `VITE_MIMO_API_URL`

## 开发指南

### 添加新的 AI 模型

1. 在 `MODEL_CONFIGS` 对象中添加新模型配置：

   ```javascript
   const MODEL_CONFIGS = {
     // 现有模型...
     "new-model": {
       apiKey: process.env.NEW_MODEL_API_KEY,
       apiUrl: process.env.NEW_MODEL_API_URL,
       modelName: "new-model-name",
     },
   };
   ```

2. 在聊天请求处理逻辑中添加对新模型的支持

### 环境变量说明

| 变量名            | 说明              | 示例        |
| ----------------- | ----------------- | ----------- |
| PORT              | 服务器端口        | 3001        |
| VITE_API_KEY      | 通义千问 API 密钥 | sk-xxx      |
| VITE_API_URL      | 通义千问 API 地址 | https://... |
| VITE_MIMO_API_KEY | Mimo API 密钥     | sk-xxx      |
| VITE_MIMO_API_URL | Mimo API 地址     | https://... |

## 部署说明

### 生产环境部署

1. 设置生产环境变量
2. 使用 PM2 等进程管理器运行服务
3. 配置反向代理（如 Nginx）
4. 设置 SSL 证书

### Docker 部署（可选）

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 故障排除

### 常见问题

1. **端口被占用**

   ```bash
   # 查找占用端口的进程
   netstat -ano | findstr :3001
   # 终止进程或更改 PORT 环境变量
   ```

2. **API 密钥错误**
   - 检查 `.env` 文件中的 API 密钥配置
   - 确认 API 服务商账户状态

3. **CORS 错误**
   - 检查前端请求的 Origin 头
   - 确认 Socket.IO CORS 配置

## 贡献指南

1. Fork 本项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

本项目采用 ISC 许可证。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件

---

**注意**: 使用前请确保已获得相应 AI 服务的 API 访问权限，并妥善保管 API 密钥。
