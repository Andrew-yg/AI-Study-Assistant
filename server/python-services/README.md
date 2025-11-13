# Python 微服务

AI Study Assistant 的 Python 微服务层，提供 AI 核心功能。

## 📦 服务列表

### 1. RAG Service (端口 8001)
- **功能**：文档处理和语义检索
- **技术栈**：LlamaIndex + MongoDB Vector Store
- **端点**：
  - `POST /process` - 处理 PDF 文件
  - `POST /query` - RAG 语义查询
  - `GET /health` - 健康检查

### 2. Agent Service (端口 8002)
- **功能**：AI Agent 对话和工具调用
- **技术栈**：LangChain + GPT-4
- **端点**：
  - `POST /chat` - Agent 对话
  - `GET /health` - 健康检查

### 3. Quiz Service (端口 8003)
- **功能**：题目生成和答案评估
- **技术栈**：OpenAI GPT-4
- **端点**：
  - `POST /generate` - 生成题目
  - `POST /evaluate` - 评估答案
  - `GET /health` - 健康检查

## 🚀 快速开始

### 1. 创建虚拟环境
```bash
cd server/python-services
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# 或
.\venv\Scripts\activate  # Windows
```

### 2. 安装依赖
```bash
pip install -r requirements.txt
```

### 3. 启动服务

**方式 1：分别启动（推荐用于开发）**
```bash
# Terminal 1 - RAG Service
cd rag-service
python main.py

# Terminal 2 - Agent Service
cd agent-service
python main.py

# Terminal 3 - Quiz Service
cd quiz-service
python main.py
```

**方式 2：使用 uvicorn 启动（可自定义参数）**
```bash
# RAG Service
uvicorn rag-service.main:app --host 0.0.0.0 --port 8001 --reload

# Agent Service
uvicorn agent-service.main:app --host 0.0.0.0 --port 8002 --reload

# Quiz Service
uvicorn quiz-service.main:app --host 0.0.0.0 --port 8003 --reload
```

### 4. 验证服务
```bash
# 检查 RAG Service
curl http://localhost:8001/health

# 检查 Agent Service
curl http://localhost:8002/health

# 检查 Quiz Service
curl http://localhost:8003/health
```

## 📁 目录结构

```
python-services/
├── requirements.txt          # 共享依赖
├── shared/                   # 共享工具
│   ├── __init__.py
│   ├── config.py            # 环境变量配置
│   └── mongodb.py           # MongoDB 连接管理
│
├── rag-service/             # RAG 引擎
│   └── main.py              # FastAPI 应用
│
├── agent-service/           # Agent 系统
│   └── main.py              # FastAPI 应用
│
└── quiz-service/            # 题库生成
    └── main.py              # FastAPI 应用
```

## 🔧 配置说明

所有配置通过项目根目录的 `.env` 文件管理。

**必需的环境变量**：
- `MONGODB_URI` - MongoDB 连接字符串
- `OPENAI_API_KEY` - OpenAI API 密钥

**可选的环境变量**：
- `BRAVE_SEARCH_API_KEY` - Brave Search API 密钥
- `RAG_SERVICE_URL` - RAG 服务 URL（默认：http://localhost:8001）
- `AGENT_SERVICE_URL` - Agent 服务 URL（默认：http://localhost:8002）
- `QUIZ_SERVICE_URL` - Quiz 服务 URL（默认：http://localhost:8003）

## 📝 开发状态

| 服务 | 状态 | 进度 |
|------|------|------|
| RAG Service | 🟡 框架完成 | Week 2 待实现 |
| Agent Service | 🟡 框架完成 | Week 3 待实现 |
| Quiz Service | 🟡 框架完成 | Week 4 待实现 |

## 🐳 Docker 部署（可选）

TODO: 添加 Dockerfile 和 docker-compose.yml

## 📚 API 文档

每个服务启动后，可以访问自动生成的 API 文档：

- RAG Service: http://localhost:8001/docs
- Agent Service: http://localhost:8002/docs
- Quiz Service: http://localhost:8003/docs

## 🔍 调试技巧

1. **查看日志**：所有服务都会输出详细的日志信息
2. **交互式 API 文档**：访问 `/docs` 端点测试 API
3. **健康检查**：使用 `/health` 端点验证服务状态

## 🛠️ 下一步

- [ ] Week 2: 实现 RAG 服务核心逻辑
- [ ] Week 3: 实现 Agent 服务和工具系统
- [ ] Week 4: 实现 Quiz 服务
- [ ] Week 5: 集成测试和优化
