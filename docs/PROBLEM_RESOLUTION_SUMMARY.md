# Quiz Generation 问题修复总结

## 问题诊断

运行诊断脚本发现的问题：

```bash
python3 diagnose_rag_pipeline.py
```

**诊断结果**：
```
✓ MongoDB 连接: 正常
✓ 向量文档: 392 个（包含 336 个来自 04-Digital Arithmetic.pdf 的文本块）
✓ 向量维度: 3072（text-embedding-3-large）
✓ 元数据结构: 正常
✓ 元数据过滤: 正常
✗ MongoDB Atlas Vector Search Index: 缺失（关键问题！）
```

## 根本原因

**MongoDB Atlas Vector Search Index 未创建**

您的系统已经：
1. ✅ 成功上传 PDF 到 Cloudflare R2
2. ✅ 成功提取并切分文本（336 chunks）
3. ✅ 成功生成 embeddings（3072 维向量）
4. ✅ 成功存储到 MongoDB（392 个文档）

但是：
- ❌ **没有创建 Vector Search Index**
- ❌ RAG 查询无法执行向量相似度搜索
- ❌ 返回空的 sources 列表
- ❌ Quiz Generator 报错："无法从学习资料中检索到内容"

## 技术原理

### 为什么需要 Vector Search Index？

MongoDB 的普通索引（如 `_id_` 索引）只能：
- 精确匹配查询
- 范围查询
- 排序

**无法进行**：
- 高维向量相似度搜索
- 余弦相似度计算
- k-最近邻（k-NN）查询

MongoDB Atlas Vector Search Index 使用 **HNSW（Hierarchical Navigable Small World）** 算法：
- 支持高维向量（本例中为 3072 维）
- 快速近似最近邻搜索
- 余弦相似度计算
- 支持元数据过滤（user_id, material_id）

### RAG 工作流程

```
用户请求生成 Quiz
    ↓
Quiz Service 查询 RAG Service
    ↓
RAG Service 执行向量搜索:
  1. 将问题转换为 3072 维向量（使用 OpenAI API）
  2. 在 MongoDB Atlas 中执行向量搜索【需要 Vector Search Index】
  3. 返回 top-k 最相似的文本块
    ↓
Quiz Generator 使用返回的文本块生成题目
    ↓
返回给用户
```

**当前问题**：步骤 2 失败，因为没有 Vector Search Index

## 修复步骤

### 方法 1：通过 MongoDB Atlas UI 创建索引（推荐）

#### 详细步骤见：
- **QUICK_FIX.md**（最快速指南）
- **ATLAS_VECTOR_SEARCH_SETUP.md**（详细说明）
- **URGENT_FIX_QUIZ_GENERATION.md**（完整文档）

#### 关键配置：

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 3072,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "metadata.user_id"
    },
    {
      "type": "filter",
      "path": "metadata.material_id"
    }
  ]
}
```

**Index Name**: `vector_index`（必须匹配 `.env` 中的 `MONGODB_VECTOR_INDEX`）

### 方法 2：验证配置

确保 `.env` 文件包含：

```env
# MongoDB Vector Search
MONGODB_VECTOR_DB=AIAssistant
MONGODB_VECTOR_COLLECTION=rag_vectors
MONGODB_VECTOR_INDEX=vector_index

# OpenAI（注意：使用 large 模型以匹配 3072 维）
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
OPENAI_COMPLETION_MODEL=gpt-4o-mini
```

## 代码改进

### 1. 添加诊断日志

**RAG Service** (`server/python-services/rag-service/service.py`):
```python
print(f"[RAG Query Debug] Found {len(sources)} sources")
if not sources:
    print(f"[RAG Query Debug] ⚠️  NO SOURCES RETURNED!")
    print(f"[RAG Query Debug] MongoDB Atlas Vector Search Index is missing")
```

**Quiz Generator** (`server/python-services/quiz-service/generator.py`):
```python
print(f"[Quiz Generator Debug] Initial sources count: {len(sources)}")
print(f"[Quiz Generator Debug] Fallback query for material={material_id}: ...")
```

### 2. 改进错误消息

之前：
```
ValueError: 无法从学习资料中检索到内容，请确认 PDF 已完成解析后再试一次。
```

现在：
```
ValueError: 无法从学习资料中检索到内容。
可能原因：MongoDB Atlas Vector Search Index 未创建或未激活。
请查看 ATLAS_VECTOR_SEARCH_SETUP.md 文件了解如何创建索引。
```

### 3. 添加诊断工具

创建了两个 Python 脚本：
- `test_vector_search.py` - 快速检查 MongoDB 连接和集合状态
- `diagnose_rag_pipeline.py` - 完整的 RAG 管道诊断

## 测试流程

### 1. 创建索引后，重启服务

```bash
npm run dev
```

### 2. 观察日志

您应该看到：

**RAG Service 日志**：
```
[RAG Query Debug] question=Summarize the most important concepts..., user_id=6912bed37173a5c358a1bbda
[RAG Query Debug] Found 8 sources
[RAG Query Debug] First source metadata: {...material_id: '691797ccc77a64612f4907ef'...}
```

**Quiz Service 日志**：
```
[Quiz Generator Debug] Initial RAG query for materials=[...]
[Quiz Generator Debug] Initial sources count: 8
```

### 3. 测试 Quiz 生成

1. 访问 http://localhost:3000
2. 进入包含 "04-Digital Arithmetic.pdf" 的对话
3. 点击生成 Quiz
4. **预期结果**：成功生成基于 PDF 内容的题目

## 验证成功的标志

✅ RAG Service 返回 sources（不为空）
✅ Quiz Service 日志显示 "Initial sources count: 8"（或其他正数）
✅ 生成的题目包含 `source_summary` 字段，引用 PDF 内容
✅ 题目与 "04-Digital Arithmetic.pdf" 主题相关（数字运算、电路设计等）

## 如果仍然失败

### 检查索引状态

1. 登录 MongoDB Atlas
2. 确认索引状态为 **Active**（绿色）
3. 索引名称为 `vector_index`
4. `numDimensions` 为 `3072`

### 重新运行诊断

```bash
python3 diagnose_rag_pipeline.py
```

### 检查服务日志

```bash
# 在运行 npm run dev 的终端中查看
# 或使用
./manage-services.sh logs rag
./manage-services.sh logs quiz
```

### 清空并重建（最后手段）

如果索引配置错误（如 dimension 不匹配）：

```bash
# 1. 删除集合中的所有文档
# 在 MongoDB Atlas UI: AIAssistant.rag_vectors → Delete All

# 2. 删除并重建索引（使用正确配置）

# 3. 重新上传 PDF
```

## 技术支持文档

- `QUICK_FIX.md` - 5 分钟快速修复
- `ATLAS_VECTOR_SEARCH_SETUP.md` - 详细设置指南
- `URGENT_FIX_QUIZ_GENERATION.md` - 完整故障排查
- `diagnose_rag_pipeline.py` - 自动诊断脚本

## 预计修复时间

- 创建索引：2 分钟
- 索引构建：2-5 分钟
- 测试验证：1 分钟
- **总计：5-10 分钟**

---

**最后更新**: 2025-11-15
**状态**: 待用户创建 Vector Search Index
