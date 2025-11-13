# 🚀 Python 环境搭建完成！下一步操作指南

## ✅ 已完成的工作

1. ✅ 创建了完整的 Python 服务目录结构
2. ✅ 配置了共享工具（config.py, mongodb.py）
3. ✅ 创建了 3 个 FastAPI 服务框架（RAG、Agent、Quiz）
4. ✅ 配置了所有依赖（requirements.txt）
5. ✅ 更新了 package.json 添加启动脚本

## 📋 下一步操作（按顺序执行）

### Step 1: 安装 Node.js 依赖（如果还没安装）

```bash
npm install
```

这将安装新添加的依赖：
- `zod` - 参数验证库
- `concurrently` - 同时运行多个进程
- `@types/node` - Node.js 类型定义

### Step 2: 创建 Python 虚拟环境

```bash
# 进入 Python 服务目录
cd server/python-services

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # macOS/Linux
# 或者在 Windows 上：
# .\venv\Scripts\activate
```

### Step 3: 安装 Python 依赖

```bash
# 确保虚拟环境已激活（命令行前面有 (venv) 标记）
pip install -r requirements.txt
```

**这将安装所有必需的包（约 23 个）**：
- FastAPI + Uvicorn（Web 框架）
- LlamaIndex（RAG 引擎）
- LangChain（Agent 框架）
- OpenAI（LLM 和 Embeddings）
- PyMongo + Motor（MongoDB 驱动）
- PDF 处理库
- 等等...

**预计安装时间：3-5 分钟**

### Step 4: 测试 Python 服务

**方式 1：分别测试每个服务（推荐）**

```bash
# 测试 RAG Service（新开一个终端）
cd server/python-services/rag-service
python main.py
# 看到 "Application startup complete" 表示成功
# 访问 http://localhost:8001/docs 查看 API 文档

# 测试 Agent Service（新开一个终端）
cd server/python-services/agent-service
python main.py
# 访问 http://localhost:8002/docs 查看 API 文档

# 测试 Quiz Service（新开一个终端）
cd server/python-services/quiz-service
python main.py
# 访问 http://localhost:8003/docs 查看 API 文档
```

**方式 2：使用 npm 脚本启动**

```bash
# 回到项目根目录
cd /Users/yanggao/Downloads/AI-Study-Assistant-1

# 启动单个服务
npm run dev:rag     # 启动 RAG 服务
npm run dev:agent   # 启动 Agent 服务
npm run dev:quiz    # 启动 Quiz 服务

# 或者一键启动所有服务（包括 Nuxt）
npm run dev:all
```

### Step 5: 验证服务健康状态

在新终端中运行：

```bash
# 测试 RAG Service
curl http://localhost:8001/health

# 测试 Agent Service
curl http://localhost:8002/health

# 测试 Quiz Service
curl http://localhost:8003/health
```

**预期输出**（每个服务）：
```json
{
  "status": "healthy",
  "service": "xxx-service",
  "version": "1.0.0"
}
```

## 🎯 当前进度

| 阶段 | 状态 | 说明 |
|------|------|------|
| ✅ Week 1: Day 1-2 | 完成 | 外部服务配置 |
| ✅ Week 1: Day 3-4 | 完成 | Python 环境搭建 |
| 🔄 Week 1: Day 5 | 进行中 | 测试和验证 |
| ⏳ Week 2 | 待开始 | RAG 核心功能实现 |

## 📝 验证清单

完成上述步骤后，请确认：

- [ ] Node.js 依赖已安装（`zod`, `concurrently` 等）
- [ ] Python 虚拟环境已创建
- [ ] Python 依赖已安装（23 个包）
- [ ] RAG Service 可以启动（端口 8001）
- [ ] Agent Service 可以启动（端口 8002）
- [ ] Quiz Service 可以启动（端口 8003）
- [ ] 所有服务的 `/health` 端点返回正常
- [ ] 可以访问 Swagger API 文档（/docs）

## 🐛 常见问题

### Q1: `pip install` 很慢？
**A**: 使用国内镜像源：
```bash
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### Q2: Python 版本不对？
**A**: 确保使用 Python 3.9+：
```bash
python3 --version  # 应该显示 3.9 或更高
```

### Q3: 端口被占用？
**A**: 修改服务端口（在各服务的 main.py 中）：
```python
uvicorn.run("main:app", port=8011)  # 改为其他端口
```

### Q4: 找不到 `shared` 模块？
**A**: 确保在正确的目录启动服务，或检查 `sys.path.append` 路径

### Q5: MongoDB 连接失败？
**A**: 检查 `.env` 文件中的 `MONGODB_URI` 是否正确

## 📚 下一步学习资源

完成验证后，可以先了解：
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [LlamaIndex 快速开始](https://docs.llamaindex.ai/en/stable/)
- [LangChain 教程](https://python.langchain.com/docs/get_started/introduction)

## 🎉 完成后的下一步

当所有服务都能正常启动后，我们将进入 **Week 2: RAG 核心功能实现**：

1. 实现 PDF 文件处理（LlamaIndex）
2. 实现向量化和存储（MongoDB Vector Store）
3. 实现语义检索（RAG Query）
4. 创建 TypeScript API 集成

---

**需要帮助？** 如果遇到任何问题，请告诉我！
