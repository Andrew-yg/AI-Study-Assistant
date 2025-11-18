# 🚀 本地开发快速启动指南

如果您不需要 Kubernetes 部署，只想在本地运行和测试应用，按照以下步骤操作。

---

## ✅ 您已经完成的准备工作

根据之前的输出，您的环境已经正确配置：
- ✅ Node.js 20.19.5 (通过 nvm)
- ✅ npm 10.8.2
- ✅ Python 环境
- ✅ 所有依赖已安装
- ✅ MongoDB 连接成功
- ✅ 所有服务都能正常启动

---

## 🎯 直接运行应用（无需 Docker/Kubernetes）

### 启动所有服务

只需一个命令：

```bash
npm run dev
```

这会同时启动：
- 🌐 Nuxt Web 应用 (http://localhost:3000)
- 🔍 RAG 服务 (http://localhost:8001)
- 🤖 Agent 服务 (http://localhost:8002)
- 📝 Quiz 服务 (http://localhost:8003)

### 访问应用

打开浏览器访问：**http://localhost:3000**

从您刚才的日志看，应用已经成功运行并且：
- ✅ MongoDB 连接成功
- ✅ 用户认证正常
- ✅ 对话功能正常
- ✅ 所有 Python 服务启动成功

---

## 🔄 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动所有服务（开发模式） |
| `npm run dev:web` | 只启动 Nuxt Web 应用 |
| `npm run dev:rag` | 只启动 RAG 服务 |
| `npm run dev:agent` | 只启动 Agent 服务 |
| `npm run dev:quiz` | 只启动 Quiz 服务 |
| `npm run build` | 构建生产版本 |
| `npm run test:e2e` | 运行端到端测试 |

---

## 🛑 停止服务

在终端按 `Ctrl+C` 即可停止所有服务。

---

## 📊 服务状态检查

### 检查 Web 应用健康状态
```bash
curl http://localhost:3000/api/health
```

### 检查 Python 服务
```bash
# RAG 服务
curl http://localhost:8001/health

# Agent 服务
curl http://localhost:8002/health

# Quiz 服务
curl http://localhost:8003/health
```

---

## 🐛 常见问题

### Q: 端口被占用

**症状**: 错误信息显示 "Port 3000 is already in use"

**解决**:
```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程（替换 PID 为实际进程 ID）
kill -9 <PID>
```

### Q: Python 服务启动失败

**检查 Python 依赖**:
```bash
pip list | grep -E "(fastapi|langchain|openai|pymongo)"
```

**重新安装依赖**:
```bash
pip install -r server/python-services/requirements.txt
```

### Q: MongoDB 连接失败

**检查环境变量**:
```bash
cat .env | grep MONGODB_URI
```

**确保 MongoDB Atlas 白名单包含您的 IP**:
1. 登录 MongoDB Atlas
2. Network Access → Add IP Address
3. 添加当前 IP 或 `0.0.0.0/0`（仅用于开发）

---

## 🎓 功能测试

1. **登录**: 使用 Google OAuth 登录
2. **创建对话**: 点击侧边栏 "New Conversation"
3. **上传材料**: Materials 页面上传 PDF
4. **聊天**: 在对话中提问
5. **生成测验**: Quiz 页面创建练习题

---

## 🚀 想要部署到生产环境？

### 选项 A: Docker Desktop + Kubernetes（本地测试）

参考：`docs/DOCKER_DESKTOP_GUIDE.md`

**前置条件**: 安装 Docker Desktop

### 选项 B: 云端 Kubernetes（生产部署）

参考：`docs/DEPLOY_TO_K8S.md`

**适用于**: AWS EKS, Google GKE, Azure AKS 等

### 选项 C: 传统服务器部署

```bash
# 1. 构建生产版本
npm run build

# 2. 启动 Nuxt 服务器
node .output/server/index.mjs &

# 3. 启动 Python 服务（使用 gunicorn）
cd server/python-services/rag-service
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8001 &

# 其他服务类似...
```

---

## 💡 提示

当前您的应用**已经可以完全正常使用**，不需要 Kubernetes 也能运行！

Kubernetes 主要用于：
- 🏢 生产环境部署
- 📈 自动扩缩容
- 🔄 高可用性
- 🌍 多节点分布式部署

如果只是开发或小规模使用，`npm run dev` 就足够了！

---

需要帮助？查看其他文档：
- 📖 [完整运行指南](./HOW_TO_RUN.md)
- 🚀 [快速开始](./QUICK_START.md)
- 🐳 [Docker Desktop 指南](./DOCKER_DESKTOP_GUIDE.md)
