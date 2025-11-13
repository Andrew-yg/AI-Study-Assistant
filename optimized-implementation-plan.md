# AI Agent 学习助手 - 最优化实施方案（混合架构版）

## 🎯 核心原则：能用库就用库，能用 MCP 就用 MCP，用对的语言做对的事

---

## 🏗️ 架构决策：TypeScript + Python 混合架构 ⭐

### 为什么采用混合架构？

**核心原因**：
- ✅ **AI/ML 生态**：Python 拥有最成熟的 AI 库（LlamaIndex、LangChain）
- ✅ **功能完整性**：Python 版本是主版本，功能远超 TypeScript 版本
- ✅ **开发效率**：使用主流库，文档丰富，社区支持强
- ✅ **最佳实践**：Web 层用 TypeScript，AI 核心用 Python
- ✅ **未来扩展**：ML/数据分析必须用 Python

### 技术栈对比

| 组件 | Python 版本 | TypeScript 版本 | 推荐 |
|------|------------|----------------|------|
| **LlamaIndex** | ⭐⭐⭐⭐⭐（主版本） | ⭐⭐（功能有限） | 🐍 Python |
| **LangChain** | ⭐⭐⭐⭐⭐（原生版本） | ⭐⭐⭐（生态弱） | 🐍 Python |
| **PDF 处理** | pypdf, pdfplumber | pdf-parse（简单） | 🐍 Python |
| **向量处理** | numpy, faiss | 无成熟库 | 🐍 Python |
| **Nuxt/Vue** | ❌ | ⭐⭐⭐⭐⭐ | 💚 TypeScript |
| **API Gateway** | FastAPI/Django | Nuxt Server | 💚 TypeScript |
| **MongoDB CRUD** | Motor/PyMongo | Mongoose | 💚 TypeScript |

---

## 📦 技术栈选择（分层架构）

### 🐍 Python 服务层（AI 核心）

#### RAG 引擎：**LlamaIndex Python** 🦙
**为什么选 Python 版本**：
- ✅ **主版本**：功能最完整，更新最快
- ✅ **开箱即用的 RAG**：3 行代码完成 PDF → 向量 → 查询
- ✅ **内置 PDF 处理**：`SimpleDirectoryReader` 支持多种格式
- ✅ **自动文本切分**：智能语义切分，支持自定义策略
- ✅ **MongoDB Atlas 集成**：原生支持，配置简单
- ✅ **社区支持**：大量示例和教程

#### Agent 框架：**LangChain Python + MCP** 🔗
**为什么用 Python 版本**：
- ✅ **原生版本**：功能最全，100+ 内置工具
- ✅ **工具调用成熟**：Function Calling 原生支持
- ✅ **Agent 类型丰富**：ReAct, Plan-and-Execute, Self-Ask 等
- ✅ **MCP 集成**：Python MCP SDK 更成熟
- ✅ **生态完善**：与 LlamaIndex 无缝集成

#### 题库生成：**直接用 LLM** + **Prompt Template**
**为什么用 Python**：
- ✅ LangChain Python 的 Prompt 模板更强大
- ✅ 与 Agent 系统在同一服务中，无需跨语言调用
- ✅ GPT-4 直接生成 JSON 格式题目

---

### 💚 TypeScript 服务层（Web 核心）

#### API Gateway：**Nuxt Server Routes**
**为什么用 TypeScript**：
- ✅ 与前端 Vue 3 共享类型定义
- ✅ 认证中间件已实现
- ✅ 统一的开发体验
- ✅ 部署简单（单一 Node.js 进程）

#### 数据库操作：**Mongoose + MongoDB**
**为什么用 TypeScript**：
- ✅ Mongoose 已配置完成
- ✅ Schema 类型安全
- ✅ 与 Python 服务共享同一 MongoDB 实例
- ✅ 简单 CRUD 操作无需 Python

#### 文件存储：**Cloudflare R2 SDK**
**为什么用 TypeScript**：
- ✅ AWS SDK 已配置好
- ✅ 与 API Gateway 在同一进程
- ✅ 文件上传逻辑简单

---

## 🏗️ 完整架构（混合架构版）

```
┌─────────────────────────────────────────────────────────┐
│  前端层（TypeScript）                                      │
│  Vue 3 + Nuxt 3                                          │
│  - 页面渲染                                               │
│  - 用户交互                                               │
│  - 状态管理                                               │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP/WebSocket
┌───────────────────────────▼─────────────────────────────┐
│  API Gateway 层（TypeScript - Nuxt Server）              │
│  Port: 3000                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 认证/授权    │  │ 请求路由     │  │ 错误处理     │  │
│  │ JWT 验证     │  │ API 转发     │  │ 日志记录     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ 简单 CRUD    │  │ 文件上传     │                    │
│  │ Mongoose     │  │ R2 存储      │                    │
│  └──────────────┘  └──────────────┘                    │
└────┬────────────────────┬────────────────────┬─────────┘
     │                    │                    │
     │ HTTP REST          │ HTTP REST          │ HTTP REST
     │                    │                    │
┌────▼────────┐   ┌──────▼────────┐   ┌──────▼─────────┐
│Python 微服务│   │Python 微服务  │   │Python 微服务   │
│RAG Engine   │   │Agent Core     │   │Quiz Generator  │
│Port: 8001   │   │Port: 8002     │   │Port: 8003      │
│             │   │               │   │                │
│🦙 LlamaIndex│   │🔗 LangChain   │   │🎯 LLM Direct   │
│             │   │               │   │                │
│- PDF 处理   │   │- 工具编排     │   │- 题目生成      │
│- 文本切分   │   │- MCP 集成     │   │- 答案评估      │
│- 向量化     │   │- 决策引擎     │   │- 难度分级      │
│- 语义检索   │◄──┤- 调用 RAG    │   │                │
│             │   │- 调用 Search  │   │                │
└─────────────┘   └───────┬───────┘   └────────────────┘
      │                   │
      │                   │
      └───────┬───────────┘
              │
┌─────────────▼─────────────────────────────────────────┐
│  共享资源层                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ MongoDB      │  │ OpenAI API   │  │ Brave Search│ │
│  │ - 业务数据   │  │ - LLM        │  │ - 网络搜索  │ │
│  │ - 向量存储   │  │ - Embeddings │  │             │ │
│  └──────────────┘  └──────────────┘  └─────────────┘ │
│                                                        │
│  ┌──────────────┐                                     │
│  │ Cloudflare R2│                                     │
│  │ - 文件存储   │                                     │
│  └──────────────┘                                     │
└────────────────────────────────────────────────────────┘
```

### 架构特点

**分层职责**：
- 🌐 **前端层**：用户体验和交互（Vue 3 + TypeScript）
- 🚪 **API Gateway**：统一入口、认证、简单业务（Nuxt Server + TypeScript）
- 🤖 **AI 服务层**：智能核心、复杂算法（Python 微服务）
- 💾 **资源层**：数据存储和外部 API（共享服务）

**通信方式**：
- 前端 ↔ Gateway：HTTP/REST + WebSocket
- Gateway ↔ Python：HTTP/REST（JSON）
- Python ↔ 资源：直接 SDK 调用

---

## 📋 详细实施计划（混合架构版）

### Phase 1：环境配置 + Python 服务搭建（Week 1）

#### 1.1 外部服务配置 🔧
**全部都是外部配置，一个都不用自己实现**

| 服务 | 用途 | 免费额度 | 配置难度 | 备注 |
|------|------|----------|---------|------|
| **Cloudflare R2** | 文件存储 | 10GB | ⭐ 简单 | ✅ 已配置 |
| **OpenAI API** | LLM + Embedding | $5 试用 | ⭐ 简单 | 🆕 需添加 |
| **MongoDB Atlas** | 数据库 + 向量搜索 | 512MB | ⭐⭐ 中等 | ✅ 已配置 |
| **Brave Search API** | 网络搜索 | 2000次/月 | ⭐ 简单 | 🆕 需添加 |

**环境变量清单**：
```bash
# .env（更新版本）

# ===== 已有配置 =====
# MongoDB
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=your-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=ai-study-materials

# ===== 新增配置 =====
# OpenAI
OPENAI_API_KEY=sk-...

# Brave Search
BRAVE_SEARCH_API_KEY=...

# Python 服务端口（开发环境）
RAG_SERVICE_URL=http://localhost:8001
AGENT_SERVICE_URL=http://localhost:8002
QUIZ_SERVICE_URL=http://localhost:8003

# 生产环境可以改为 Docker 内部地址
# RAG_SERVICE_URL=http://rag-service:8001
# AGENT_SERVICE_URL=http://agent-service:8002
```

**配置步骤**：
1. ✅ MongoDB 和 R2 已完成
2. 🆕 注册 OpenAI API 账号，获取 API Key
3. 🆕 注册 Brave Search API 账号，获取 API Key
4. 🆕 更新 `.env` 文件
5. 🆕 更新 `nuxt.config.ts` 添加新的环境变量

---

#### 1.2 Python 开发环境搭建 �

**创建 Python 服务目录结构**：
```
server/python-services/
├── requirements.txt（共享依赖）
├── shared/（共享工具）
│   ├── __init__.py
│   ├── config.py（环境变量加载）
│   └── mongodb.py（MongoDB 连接）
│
├── rag-service/（RAG 引擎）
│   ├── main.py（FastAPI 应用）
│   ├── service.py（LlamaIndex 核心）
│   ├── models.py（数据模型）
│   └── requirements.txt
│
├── agent-service/（Agent 系统）
│   ├── main.py（FastAPI 应用）
│   ├── agent.py（LangChain Agent）
│   ├── tools.py（工具定义）
│   └── requirements.txt
│
└── quiz-service/（题库生成）
    ├── main.py（FastAPI 应用）
    ├── generator.py（题目生成器）
    └── requirements.txt
```

**安装 Python 依赖**：
```bash
# 创建虚拟环境
cd server/python-services
python3 -m venv venv
source venv/bin/activate  # macOS/Linux

# 安装共享依赖
pip install -r requirements.txt
```

**共享依赖清单（`requirements.txt`）**：
```txt
# Web 框架
fastapi==0.115.0
uvicorn[standard]==0.32.0
python-dotenv==1.0.1

# MongoDB
pymongo==4.10.1
motor==3.6.0  # 异步 MongoDB 驱动

# OpenAI
openai==1.54.0

# RAG 引擎
llama-index==0.11.20
llama-index-vector-stores-mongodb==0.3.0
llama-index-embeddings-openai==0.2.0

# Agent 框架
langchain==0.3.7
langchain-openai==0.2.8
langchain-community==0.3.5

# MCP SDK
mcp==1.1.0

# PDF 处理
pypdf==5.1.0
pdfplumber==0.11.4

# 工具库
pydantic==2.10.0
pydantic-settings==2.6.0
requests==2.32.3
```

---

#### 1.3 TypeScript 依赖更新 📦

**更新 `package.json`**：
```bash
# 安装新依赖（只需要少量）
npm install zod  # 参数验证
npm install @types/node --save-dev
```

**注意**：
- ❌ **不再安装** `llamaindex`（用 Python 版本）
- ❌ **不再安装** `langchain`（用 Python 版本）
- ❌ **不再安装** `@modelcontextprotocol/sdk`（用 Python 版本）
- ✅ **保留** Mongoose、AWS SDK 等已有依赖

---

#### 1.4 MongoDB Vector Search 配置 🔧
**在 Atlas 控制台配置，不需要写代码**

1. 登录 MongoDB Atlas
2. 进入你的 Cluster → Atlas Search
3. 点击 "Create Search Index"
4. 选择 "JSON Editor"
5. 使用以下配置：

```json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "embedding": {
        "type": "knnVector",
        "dimensions": 1536,
        "similarity": "cosine"
      },
      "text": {
        "type": "string"
      },
      "metadata": {
        "type": "document",
        "dynamic": true
      }
    }
  }
}
```

6. 索引名称：`vector_index`
7. 数据库名称：你的数据库名（如 `ai_study_assistant`）
8. 集合名称：`vector_store`

**完成！等待索引构建完成（约 1-2 分钟）**

---

### Phase 2：RAG 引擎 - Python 服务（Week 2）⚡

#### 2.1 创建 RAG 微服务 🦙

**文件结构**：
```
server/python-services/rag-service/
├── main.py（FastAPI 应用，约 60 行）
├── service.py（LlamaIndex 核心，约 120 行）
├── models.py（Pydantic 模型，约 40 行）
└── requirements.txt
```

**核心功能模块**：

**`service.py` - RAG 核心服务**：
- LlamaIndex 初始化配置
- MongoDB Vector Store 连接
- PDF 处理函数（自动提取、切分、向量化）
- 语义检索查询函数

**`main.py` - FastAPI 应用**：
- `/process` 端点：处理上传的 PDF 文件
- `/query` 端点：RAG 语义查询
- `/health` 端点：健康检查
- 文件上传和临时存储处理

**`models.py` - 数据模型**：
- 查询请求模型
- 处理响应模型
- 配置模型

**代码量统计**：
- `main.py`：~60 行
- `service.py`：~120 行
- `models.py`：~40 行
- **总计：~220 行**（vs 自己实现需要 800+ 行！）

**你不需要写的代码**：
- ❌ PDF 文本提取（LlamaIndex 自动）
- ❌ 文本切分算法（LlamaIndex 自动）
- ❌ 向量化逻辑（OpenAI Embedding 自动）
- ❌ 向量存储和检索（MongoDB + LlamaIndex 自动）
- ❌ LLM 调用和提示词工程（LlamaIndex 自动）

---

#### 2.2 TypeScript API 集成 💚

**创建 TypeScript 端点调用 Python 服务**：
```
server/api/rag/
├── process.post.ts（触发 PDF 处理，约 35 行）
└── query.post.ts（RAG 查询，约 30 行）
```

**功能概述**：
- 验证用户身份和权限
- 获取材料信息
- 调用 Python RAG 服务（HTTP REST）
- 更新数据库状态
- 返回处理结果

---

#### 2.3 启动脚本配置

**更新 `package.json` 脚本**：
- `dev`：启动 Nuxt 开发服务器
- `dev:rag`：启动 RAG Python 服务
- `dev:all`：同时启动所有服务（使用 concurrently）

**开发模式启动方式**：
- 方式 1：分别在不同终端启动各个服务
- 方式 2：使用 concurrently 一键启动所有服务

---

### Phase 3：AI Agent 系统 - Python 服务（Week 3-4）

#### 3.1 创建 Agent 微服务 🤖

**文件结构**：
```
server/python-services/agent-service/
├── main.py（FastAPI 应用，约 80 行）
├── agent.py（LangChain Agent，约 100 行）
├── tools.py（工具定义，约 200 行）
├── mcp_client.py（MCP 集成，约 60 行，可选）
└── requirements.txt
```

**核心功能模块**：

**`tools.py` - 工具定义**：
- `query_materials`：查询学习材料（调用 RAG 服务）
- `search_web`：网络搜索（Brave Search API 或 MCP）
- `generate_quiz`：生成练习题（调用 Quiz 服务）
- `evaluate_answer`：评估答案（调用 Quiz 服务）
- 每个工具包含：名称、描述、参数模式、执行函数

**`agent.py` - Agent 核心**：
- LangChain Agent 初始化
- GPT-4 LLM 配置
- 系统 Prompt 模板设计
- Agent Executor 配置
- 对话历史管理
- 工具调用编排

**`main.py` - FastAPI 应用**：
- `/chat` 端点：Agent 对话接口
- `/health` 端点：健康检查
- 请求/响应模型定义

**`mcp_client.py` - MCP 集成（可选）**：
- MCP Server 配置
- 工具调用封装
- 错误处理

**代码量统计**：
- `tools.py`：~200 行
- `agent.py`：~100 行
- `main.py`：~80 行
- `mcp_client.py`：~60 行
- **总计：~440 行**（vs 自己实现需要 1200+ 行！）

**你不需要写的代码**：
- ❌ Agent 决策逻辑（GPT-4 自动）
- ❌ 工具调用编排（LangChain 自动）
- ❌ 错误处理和重试（LangChain 自动）
- ❌ 对话历史管理（LangChain 自动）

---

#### 3.2 MCP 集成（可选）🔌

**MCP Client 封装**：
- MCP Server 配置管理
- 工具调用接口
- 错误处理和重试
- 支持多个 MCP Server

**注意**：MCP 可以后续添加，初期可以直接调用 Brave Search API

---

#### 3.3 TypeScript API 集成 💚

**创建 Agent API**：
```
server/api/agent/
└── chat.post.ts（Agent 对话接口，约 50 行）
```

**功能概述**：
- 验证用户身份
- 获取对话历史（从数据库）
- 调用 Python Agent 服务
- 保存消息到数据库
- 返回 Agent 响应

---

### Phase 4：题库系统 - Python 服务（Week 5）

#### 4.1 创建 Quiz 微服务 🎯

**文件结构**：
```
server/python-services/quiz-service/
├── main.py（FastAPI 应用，约 70 行）
├── generator.py（题目生成器，约 100 行）
└── requirements.txt
```

**核心功能模块**：

**`generator.py` - 题目生成器**：
- QuizGenerator 类
- GPT-4 配置
- 题目生成 Prompt 模板
- 答案评估 Prompt 模板
- JSON 格式解析
- 题型支持：选择题、判断题、简答题

**`main.py` - FastAPI 应用**：
- `/generate` 端点：生成题目
- `/evaluate` 端点：评估答案
- `/health` 端点：健康检查
- 请求/响应模型定义

**代码量统计**：
- `generator.py`：~100 行
- `main.py`：~70 行
- **总计：~170 行**（vs 自己实现需要 400+ 行！）

---

#### 4.2 题库 CRUD API（TypeScript）💚

**文件结构**：
```
server/api/questions/
├── index.get.ts（获取题目列表，约 25 行）
├── index.post.ts（创建题目，约 35 行）
├── [id].get.ts（获取单个题目，约 20 行）
├── [id].put.ts（更新题目，约 25 行）
└── [id].delete.ts（删除题目，约 20 行）
```

**功能概述**：
- 验证用户身份和权限
- 调用 Quiz Python 服务生成题目
- 保存题目到 MongoDB
- 提供完整的 CRUD 操作
- 支持题目筛选和分页

**代码量**：每个文件 20-35 行

---

#### 4.3 Question Model（TypeScript）

**创建数据模型**：
```
server/models/Question.ts（约 30 行）
```

**模型字段**：
- 基础信息：userId, materialIds, type, question
- 答案信息：options, correctAnswer, explanation
- 元数据：difficulty, attempts, correctAttempts
- 时间戳：createdAt, updatedAt

---

## 📊 工作量对比表（混合架构版）

| 模块 | 纯 TS 实现 | Python 实现 | 节省代码量 | 功能完整度 |
|------|-----------|-------------|-----------|-----------|
| **PDF 处理** | 200 行（功能弱） | 20 行（LlamaIndex） | 90% | ⭐⭐⭐⭐⭐ |
| **文本切分** | 150 行（简单切分） | 0 行（自动） | 100% | ⭐⭐⭐⭐⭐ |
| **向量化** | 100 行 | 5 行（LlamaIndex） | 95% | ⭐⭐⭐⭐⭐ |
| **向量搜索** | 180 行 | 1 行（LlamaIndex） | 99% | ⭐⭐⭐⭐⭐ |
| **RAG 服务** | 500+ 行 | 220 行（Python） | 56% | ⭐⭐⭐⭐⭐ |
| **Agent 编排** | 300 行（功能有限） | 440 行（Python） | -47%* | ⭐⭐⭐⭐⭐ |
| **工具系统** | 250 行 | 200 行（tools.py） | 20% | ⭐⭐⭐⭐⭐ |
| **题目生成** | 150 行 | 170 行（Python） | -13%* | ⭐⭐⭐⭐⭐ |
| **MCP 集成** | 120 行（TS SDK） | 60 行（Python SDK） | 50% | ⭐⭐⭐⭐⭐ |
| **API Gateway** | 200 行 | 200 行（TS 保留） | 0% | ⭐⭐⭐⭐⭐ |
| **CRUD 操作** | 200 行 | 200 行（TS 保留） | 0% | ⭐⭐⭐⭐⭐ |

**总计**：
- 纯 TypeScript 方案：~2,350 行（功能受限）
- 混合架构方案：
  - Python 服务：~830 行（AI 核心）
  - TypeScript API：~400 行（Web 层）
  - **总计：~1,230 行**
- **节省 48% 代码量！**
- **功能完整度提升 80%！** 🎉

**注**：*标记的模块虽然代码量略多，但功能完整度远超 TS 版本

---

## 🎯 你真正需要自己写的部分（混合架构版）

### Python 服务层（~830 行）：

#### RAG 服务（~220 行）：
1. **service.py**（120 行）
   - LlamaIndex 配置
   - PDF 处理逻辑
   - 查询接口

2. **main.py**（60 行）
   - FastAPI 路由
   - 文件上传处理

3. **models.py**（40 行）
   - Pydantic 数据模型

#### Agent 服务（~440 行）：
1. **tools.py**（200 行）
   - 4-5 个工具定义
   - 调用其他服务

2. **agent.py**（100 行）
   - LangChain Agent 配置
   - Prompt 模板

3. **main.py**（80 行）
   - FastAPI 路由
   - 对话处理

4. **mcp_client.py**（60 行，可选）
   - MCP 集成

#### Quiz 服务（~170 行）：
1. **generator.py**（100 行）
   - 题目生成
   - 答案评估

2. **main.py**（70 行）
   - FastAPI 路由

---

### TypeScript 层（~400 行）：

#### API Gateway（~150 行）：
1. **server/api/rag/**（60 行）
   - process.post.ts（30 行）
   - query.post.ts（30 行）

2. **server/api/agent/**（50 行）
   - chat.post.ts（50 行）

3. **server/api/questions/**（100 行）
   - index.get.ts（20 行）
   - index.post.ts（30 行）
   - [id].get.ts（15 行）
   - [id].put.ts（20 行）
   - [id].delete.ts（15 行）

#### 业务逻辑（~200 行）：
1. **材料管理**（已有，可能需要小改）
2. **对话管理**（已有，可能需要小改）
3. **题库 Model**（50 行，新增）

#### 配置和工具（~50 行）：
1. **nuxt.config.ts**（更新环境变量）
2. **启动脚本**（package.json）

---

### 不需要自己写（全部用库）：

#### AI/ML 核心：
- ❌ PDF 解析算法 → **LlamaIndex**
- ❌ 文本切分策略 → **LlamaIndex**
- ❌ 向量化算法 → **OpenAI Embeddings**
- ❌ 相似度搜索 → **MongoDB Atlas + LlamaIndex**
- ❌ Agent 决策逻辑 → **GPT-4 + LangChain**
- ❌ 工具调用编排 → **LangChain**
- ❌ Prompt 工程 → **LangChain Templates**

#### 基础设施：
- ❌ MongoDB 连接池 → **PyMongo/Motor**
- ❌ HTTP 服务器 → **FastAPI + Uvicorn**
- ❌ API 路由 → **FastAPI**
- ❌ 数据验证 → **Pydantic**
- ❌ 错误处理 → **FastAPI**

---

## 📦 最终依赖清单（混合架构版）

### Python 依赖（`server/python-services/requirements.txt`）

```txt
# ===== Web 框架 =====
fastapi==0.115.0
uvicorn[standard]==0.32.0
python-dotenv==1.0.1
python-multipart==0.0.18  # 文件上传

# ===== 数据库 =====
pymongo==4.10.1
motor==3.6.0  # 异步 MongoDB 驱动

# ===== OpenAI =====
openai==1.54.0

# ===== RAG 引擎（LlamaIndex）=====
llama-index==0.11.20
llama-index-core==0.11.20
llama-index-vector-stores-mongodb==0.3.0
llama-index-embeddings-openai==0.2.0
llama-index-llms-openai==0.2.0

# ===== Agent 框架（LangChain）=====
langchain==0.3.7
langchain-core==0.3.15
langchain-openai==0.2.8
langchain-community==0.3.5

# ===== MCP SDK（可选）=====
mcp==1.1.0

# ===== PDF 处理 =====
pypdf==5.1.0
pdfplumber==0.11.4

# ===== 工具库 =====
pydantic==2.10.0
pydantic-settings==2.6.0
requests==2.32.3
aiohttp==3.11.0  # 异步 HTTP 客户端
```

**总共 23 个 Python 包**

---

### TypeScript/Node.js 依赖（`package.json`）

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.928.0",
    "@aws-sdk/s3-request-presigner": "^3.928.0",
    "bcryptjs": "^3.0.3",
    "cookie-parser": "^1.4.7",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.19.3",
    "multer": "^2.0.2",
    "nuxt": "^3.13.0",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/multer": "^2.0.0",
    "@types/passport": "^1.0.17",
    "@types/passport-google-oauth20": "^2.0.17",
    "@types/node": "^20.0.0",
    "concurrently": "^9.0.0"
  }
}
```

**变化**：
- ✅ 保留所有已有依赖
- ✅ 新增 `zod`（参数验证）
- ✅ 新增 `concurrently`（同时运行多个进程）
- ❌ **不需要** `llamaindex`（用 Python 版本）
- ❌ **不需要** `langchain`（用 Python 版本）
- ❌ **不需要** `@modelcontextprotocol/sdk`（用 Python 版本）

**总共 11 个核心依赖 + 6 个开发依赖**

---

## 🚀 实施优先级（混合架构版）

### Week 1：环境配置 + Python 框架搭建 🔧

**Day 1-2：外部服务配置**
- ✅ 注册 OpenAI API（已有可跳过）
- ✅ 注册 Brave Search API
- ✅ 配置 MongoDB Atlas Vector Search Index
- ✅ 更新 `.env` 环境变量
- ✅ 更新 `nuxt.config.ts`

**Day 3-4：Python 环境搭建**
- 🐍 创建 Python 服务目录结构
- 🐍 创建虚拟环境
- 🐍 安装所有 Python 依赖
- 🐍 创建共享配置（config.py, mongodb.py）
- 🐍 编写基础 FastAPI 应用模板（3 个服务）

**Day 5：启动脚本和测试**
- 💚 更新 `package.json` 添加启动脚本
- 💚 安装 `concurrently`
- 🧪 测试所有服务能否启动
- 🧪 测试 TypeScript 能否调用 Python 服务

**产出**：
- ✅ 所有外部服务配置完成
- ✅ Python 开发环境就绪
- ✅ 3 个空的 FastAPI 服务可以启动
- ✅ TypeScript 可以调用 Python 服务

---

### Week 2：RAG 核心功能（Python）🦙

**Day 1-2：LlamaIndex 服务实现**
- 🐍 实现 `rag-service/service.py`
  - LlamaIndex 初始化
  - MongoDB Vector Store 配置
  - PDF 处理函数
  - 查询函数
- 🐍 实现 `rag-service/main.py`
  - `/process` 端点
  - `/query` 端点
  - 错误处理

**Day 3：TypeScript 集成**
- 💚 创建 `server/api/rag/process.post.ts`
- 💚 创建 `server/api/rag/query.post.ts`
- 💚 更新 Material Model（添加处理状态）

**Day 4-5：测试和优化**
- 🧪 上传 PDF 测试
- 🧪 向量化测试
- 🧪 查询准确度测试
- 🔧 调整 chunk size、top_k 等参数
- 🔧 优化查询速度

**产出**：
- ✅ 完整的 RAG 功能
- ✅ PDF 自动处理
- ✅ 语义检索可用
- ✅ API 端点完成

---

### Week 3：Agent 系统基础（Python）🤖

**Day 1-2：工具系统实现**
- 🐍 实现 `agent-service/tools.py`
  - `query_materials` 工具
  - `search_web` 工具（直接调用 Brave API）
  - `generate_quiz` 工具
  - `evaluate_answer` 工具
- 🧪 单独测试每个工具

**Day 3-4：Agent 核心**
- 🐍 实现 `agent-service/agent.py`
  - LangChain Agent 配置
  - Prompt 模板设计
  - 对话历史管理
- 🐍 实现 `agent-service/main.py`
  - `/chat` 端点
  - 流式响应（可选）

**Day 5：TypeScript 集成**
- 💚 创建 `server/api/agent/chat.post.ts`
- 💚 更新 Message Model
- 💚 集成对话历史

**产出**：
- ✅ Agent 可以调用工具
- ✅ 基本对话功能
- ✅ 可以查询材料和搜索网络

---

### Week 4：Agent 优化 + Quiz 服务 🎯

**Day 1-2：Agent 优化**
- 🔧 优化 Prompt 提高准确度
- 🔧 添加错误重试机制
- 🔧 添加工具调用日志
- 🧪 测试复杂对话场景

**Day 3-4：Quiz 服务实现**
- 🐍 实现 `quiz-service/generator.py`
  - 题目生成函数
  - 答案评估函数
- 🐍 实现 `quiz-service/main.py`
  - `/generate` 端点
  - `/evaluate` 端点

**Day 5：TypeScript 集成**
- 💚 创建 Question Model
- 💚 创建 `server/api/questions/` 所有端点
- 💚 集成到 Agent 工具中

**产出**：
- ✅ Agent 优化完成
- ✅ 题目生成功能
- ✅ 答案评估功能
- ✅ 题库 CRUD API

---

### Week 5：集成测试 + 前端对接 🧪

**Day 1-2：后端集成测试**
- 🧪 端到端测试（上传 → 处理 → 查询 → 对话 → 生成题目）
- 🧪 性能测试（响应时间、并发）
- 🧪 错误处理测试
- 🔧 修复发现的问题

**Day 3-4：前端集成**
- 🎨 更新前端调用新的 API
- 🎨 添加加载状态
- 🎨 添加错误提示
- 🎨 优化用户体验

**Day 5：文档和部署准备**
- 📝 编写 API 文档
- 📝 编写部署文档
- 🐳 编写 Dockerfile（可选）
- 🐳 编写 docker-compose.yml（可选）

**产出**：
- ✅ 完整功能测试通过
- ✅ 前端完全集成
- ✅ 部署文档完成
- ✅ 可以演示完整流程

---


### 技术选型原则

**用 TypeScript 的场景**：
- ✅ API Gateway 和路由
- ✅ 认证和授权
- ✅ 简单 CRUD 操作
- ✅ 业务逻辑（非 AI）
- ✅ 与前端共享的类型定义

**用 Python 的场景**：
- ✅ RAG（向量搜索、语义检索）
- ✅ Agent（工具调用、决策）
- ✅ LLM 调用和 Prompt 工程
- ✅ PDF/文档处理
- ✅ 机器学习和数据分析
- ✅ 复杂的 NLP 任务

---

---

### 部署方案

#### 开发环境（本地）：
**方式 1：分别启动**
- Terminal 1: Nuxt 开发服务器
- Terminal 2: RAG Python 服务
- Terminal 3: Agent Python 服务
- Terminal 4: Quiz Python 服务

**方式 2：一键启动**
- 使用 concurrently 同时启动所有服务
- 配置在 package.json 中

#### 生产环境（Docker Compose）：
- Nuxt 服务容器
- RAG 服务容器
- Agent 服务容器
- Quiz 服务容器
- 通过内部网络通信
- 统一的环境变量管理

**一键启动：`docker-compose up`**

---

## 🎉 总结

### 核心方案：TypeScript + Python 混合架构 ⭐

**架构概览**：
```
前端（Vue + TypeScript）
    ↓
API Gateway（Nuxt Server + TypeScript）
    ↓
微服务层（Python FastAPI）
    ├─ RAG Service（LlamaIndex）
    ├─ Agent Service（LangChain）
    └─ Quiz Service（OpenAI）
    ↓
共享资源（MongoDB, OpenAI, R2）
```

---


### 关键技术栈

**Python 核心库**：
- 🦙 **LlamaIndex**：RAG 引擎（PDF → 向量 → 查询）
- 🔗 **LangChain**：Agent 框架（工具 + 决策）
- ⚡ **FastAPI**：高性能 Web 框架
- 🤖 **OpenAI**：LLM + Embeddings

**TypeScript 核心库**：
- 🌐 **Nuxt 3**：全栈框架
- 🍃 **Mongoose**：MongoDB ORM
- 📦 **AWS SDK**：R2 存储

**外部服务**：
- �️ **MongoDB Atlas**：数据库 + 向量搜索
- 🗃️ **Cloudflare R2**：文件存储
- 🔍 **Brave Search**：网络搜索

---

### 最终交付

**功能清单**：
- ✅ PDF 上传和自动处理
- ✅ 语义检索（RAG）
- ✅ AI Agent 对话
- ✅ 工具调用（查材料、搜网络、生成题目）
- ✅ 题库生成和管理
- ✅ 答案评估和反馈
- ✅ 用户认证和授权
- ✅ 完整的 CRUD API

**技术指标**：
- ⚡ RAG 查询：< 2 秒
- ⚡ Agent 响应：< 5 秒
- ⚡ 题目生成：< 3 秒
- 📊 代码覆盖率：> 80%
- 🔒 安全性：JWT + OAuth

---
