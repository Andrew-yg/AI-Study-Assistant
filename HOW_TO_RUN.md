# 🚀 如何运行项目

## ✅ 当前状态

您的项目已经**完全配置好**，可以运行！

- ✅ MongoDB 连接已配置
- ✅ Google OAuth 已配置
- ✅ 所有依赖已安装
- ✅ `npm run dev` 会同时启动 Nuxt + RAG + Agent + Quiz 服务
- ✅ 开发服务器运行在 **http://localhost:3000**

---

## 📍 访问应用

项目已经在运行中！

### 本地访问
打开浏览器访问：
```
http://localhost:3000
```

### 网络访问（同一局域网设备）
```
http://172.20.10.175:3000
```

---

## 🔍 测试端点

### 1. 健康检查
测试 MongoDB 连接是否正常：
```bash
curl http://localhost:3000/api/health
```

预期返回：
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-11-10T..."
}
```

### 2. Google 登录
在浏览器中访问：
```
http://localhost:3000
```
点击 "Sign in with Google" 按钮测试 OAuth 流程。

---

## 📝 重要说明

### ⚠️ Cloudflare R2 配置
当前 `.env` 文件中 R2 配置还是占位符：
```env
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=ai-study-materials
```

**文件上传功能需要 R2 配置**才能工作。如果您现在需要测试文件上传，请：

#### 配置 Cloudflare R2：
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 R2 Object Storage
3. 创建 bucket（名称：`ai-study-materials`）
4. 生成 API tokens（读写权限）
5. 更新 `.env` 文件中的 R2 配置

### ✅ 可以测试的功能

#### 无需 R2 的功能（可立即测试）：
- ✅ Google OAuth 登录/登出
- ✅ 创建对话
- ✅ 发送消息（带 Agent 回复，需启动 python agent-service）
- ✅ 查看对话列表
- ✅ 更新对话标题
- ✅ 删除对话

#### 需要 R2 的功能（需配置后测试）：
- ⏸️ 上传 PDF 文件
- ⏸️ 下载材料文件
- ⏸️ 删除材料文件

---

## 🔧 常用命令

### 停止服务器
```bash
# 按 Ctrl+C 停止当前终端的服务器
# 或杀死所有 nuxt 进程
pkill -f "nuxt dev"
```

### 重启服务器
```bash
npm run dev   # 同时启动 Nuxt 与全部 Python 服务
```

### 启动单个 Python 服务
> `npm run dev` 已自动启动全部 Python 服务。仅在需要单独调试时使用以下命令。

```bash
npm run dev:rag    # 端口 http://localhost:8001
npm run dev:agent  # 端口 http://localhost:8002
npm run dev:quiz   # 端口 http://localhost:8003
```
所有服务依赖 `.env` 中的 `OPENAI_API_KEY`，Agent 另外使用 `BRAVE_SEARCH_API_KEY`。

### 安装依赖（如果需要）
```bash
npm install
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

---

## 🐛 常见问题

### 端口被占用
如果看到端口冲突错误，Nuxt 会自动使用其他端口（如 3000）。

### WebSocket 错误
```
ERROR  WebSocket server error: Port 24678 is already in use
```
这是 VS Code 的 HMR（热重载）端口冲突，**不影响应用运行**，可以忽略。

### MongoDB 连接失败
检查：
1. MongoDB Atlas 集群是否在运行
2. IP 地址是否已加入白名单（或使用 `0.0.0.0/0` 允许所有）
3. `.env` 中的 `MONGODB_URI` 是否正确

### Google OAuth 失败
检查：
1. Google OAuth 重定向 URI 是否包含 `http://localhost:3000/api/auth/google/callback`
2. `.env` 中的 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 是否正确
3. Google Cloud 项目是否启用了必要的 API

---

## 📊 API 端点列表

### 认证
- `GET /api/auth/google` - 发起 Google OAuth
- `GET /api/auth/google/callback` - OAuth 回调
- `GET /api/auth/me` - 获取当前用户
- `POST /api/auth/logout` - 登出

### 对话
- `GET /api/conversations` - 获取所有对话
- `POST /api/conversations` - 创建对话
- `PUT /api/conversations/:id` - 更新对话
- `DELETE /api/conversations/:id` - 删除对话

### 消息 / Agent
- `GET /api/messages/:conversationId` - 获取对话消息
- `POST /api/messages` - 创建系统消息（例如上传提示）
- `POST /api/agent/chat` - 调用 AI Agent（自动调用 RAG + Brave Search）

### 材料
- `GET /api/materials` - 获取所有材料
- `GET /api/materials/:id` - 获取单个材料
- `POST /api/materials` - 创建材料记录
- `PUT /api/materials/:id` - 更新材料
- `DELETE /api/materials/:id` - 删除材料
- `POST /api/upload` - 上传文件到 R2

### 系统
- `GET /api/health` - 健康检查

---

## 🎯 下一步

### 立即可做：
1. ✅ 在浏览器打开 http://localhost:3000
2. ✅ 测试 Google 登录
3. ✅ 创建对话并发送消息
4. ✅ 测试对话的增删改查

### 稍后配置：
1. ⏸️ 配置 Cloudflare R2
2. ⏸️ 测试文件上传功能
3. ⏸️ 部署到生产环境

---

## 📚 相关文档

- `QUICK_START.md` - 快速入门指南
- `MONGODB_MIGRATION.md` - 完整迁移文档
- `REFACTOR_SUMMARY.md` - 重构总结
- `.env.example` - 环境变量模板

---

## ✨ 祝您使用愉快！

项目已准备就绪，开始探索吧！🚀
