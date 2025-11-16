# 🚨 紧急修复：Quiz 生成失败

## 问题诊断结果

您的系统诊断显示：

```
✓ MongoDB 连接正常
✓ 已存储 392 个向量文档
✓ 04-Digital Arithmetic.pdf 已处理 (336 个文本块)
✓ 元数据过滤正常
✗ 缺少 MongoDB Atlas Vector Search 索引
```

## 根本原因

**MongoDB Atlas Vector Search Index 未创建**

您的 RAG 服务虽然成功：
1. ✅ 将 PDF 上传到 Cloudflare R2
2. ✅ 提取文本并切分为块
3. ✅ 使用 OpenAI API 生成 3072 维向量
4. ✅ 存储向量到 MongoDB

但是 Quiz 生成失败，因为：
- ❌ 没有向量搜索索引，无法执行相似度查询
- ❌ RAG query 返回空的 sources 列表
- ❌ Quiz Generator 抛出"无法从学习资料中检索到内容"错误

## 立即修复步骤

### 步骤 1: 登录 MongoDB Atlas

访问 https://cloud.mongodb.com/ 并登录您的账户

### 步骤 2: 导航到集群

1. 点击左侧 **Database**
2. 找到您的集群（应该包含 `personalizedforyou.h48t9sm.mongodb.net`）
3. 点击 **Browse Collections**

### 步骤 3: 创建 Vector Search Index

1. 在左侧选择数据库：`AIAssistant`
2. 选择集合：`rag_vectors`
3. 点击顶部的 **Search Indexes** 标签
4. 点击 **Create Search Index** 按钮
5. 选择 **JSON Editor**（不是 Visual Editor）
6. 粘贴以下 JSON 配置：

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

7. **重要**: Index Name 输入 `vector_index` (必须完全匹配)
8. Database 自动填充为 `AIAssistant`
9. Collection 自动填充为 `rag_vectors`
10. 点击 **Create Search Index**

### 步骤 4: 等待索引构建

- 索引状态会显示为 "Building"（构建中）
- 大约需要 2-5 分钟
- 等待状态变为 **"Active"**（绿色）

### 步骤 5: 重启开发服务器

索引 Active 后，在终端运行：

```bash
npm run dev
```

### 步骤 6: 测试 Quiz 生成

1. 访问 http://localhost:3000
2. 进入包含 "04-Digital Arithmetic.pdf" 的对话
3. 点击生成 Quiz
4. 应该成功生成基于 PDF 内容的题目

## 验证索引配置

确保索引配置完全匹配：

| 配置项 | 值 |
|--------|-----|
| Index Name | `vector_index` |
| Database | `AIAssistant` |
| Collection | `rag_vectors` |
| numDimensions | `3072` |
| similarity | `cosine` |

## 常见错误

### ❌ 错误 1: Index Name 不匹配
如果您输入了其他名称（如 `default`），RAG 查询会失败。
**解决**: 删除索引并用正确名称 `vector_index` 重新创建。

### ❌ 错误 2: numDimensions 不正确
如果设置为 1536（适用于 text-embedding-3-small），会失败。
**解决**: 必须设置为 `3072`（当前数据使用 text-embedding-3-large）。

### ❌ 错误 3: 在索引 Active 前测试
**解决**: 等待索引状态从 "Building" 变为 "Active"。

## 技术说明

### 为什么需要 Vector Search Index？

普通 MongoDB 索引（如 `_id_` 索引）只支持精确匹配和范围查询。

Vector Search Index 使用 **Hierarchical Navigable Small World (HNSW)** 算法进行：
- 高维向量的近似最近邻搜索
- 余弦相似度计算
- 高效的 top-k 检索

### 当前系统配置

```env
OPENAI_EMBEDDING_MODEL=text-embedding-3-large  # 3072 维
MONGODB_VECTOR_INDEX=vector_index
MONGODB_VECTOR_COLLECTION=rag_vectors
```

### 数据统计

```
总文档数: 392
用户文档: 392
材料分布:
  - 04-Digital Arithmetic.pdf: 336 chunks ← 您的 PDF
  - 05-Storage and Clocking.pdf: 54 chunks
  - YangGao_Resume__SDE_ (5).pdf: 2 chunks
```

## 完成后的工作流程

索引创建后，工作流程为：

1. **用户上传 PDF** → 存储到 R2
2. **RAG Processing** → 提取文本 → 生成 embeddings → 存储到 MongoDB
3. **Quiz Generation** → 
   - Quiz Service 调用 RAG Service
   - RAG Service 使用 Vector Search 查询相似内容
   - 返回 top-k 最相关的文本块
   - Quiz Generator 使用这些内容生成题目

4. **用户看到** → 基于 PDF 内容的 Quiz 题目

## 需要帮助？

如果索引创建后仍然失败，运行诊断：

```bash
python3 diagnose_rag_pipeline.py
```

并查看 RAG service 日志中的调试信息。

---

**预计修复时间**: 5 分钟（创建索引） + 2-5 分钟（索引构建）
