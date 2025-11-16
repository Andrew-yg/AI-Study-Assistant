# MongoDB Atlas Vector Search 设置指南

## 问题诊断

您的 RAG 系统已经成功：
- ✅ 连接到 MongoDB Atlas
- ✅ 存储了 392 个文档向量（3072 维）
- ✅ PDF 文件已上传到 Cloudflare R2
- ✅ 文档已经过 embedding 处理

**但缺少关键配置：MongoDB Atlas Vector Search Index**

## 必需步骤：创建 Vector Search Index

### 1. 登录 MongoDB Atlas
访问：https://cloud.mongodb.com/

### 2. 导航到集群
1. 选择您的集群：`PersonalizedForYou`
2. 点击 **Browse Collections**
3. 找到数据库：`AIAssistant`
4. 找到集合：`rag_vectors`

### 3. 创建 Search Index
1. 点击 **Search Indexes** 标签页（在 Browse Collections 页面顶部）
2. 点击 **Create Search Index**
3. 选择 **JSON Editor**
4. 使用以下配置：

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

5. **Index Name（重要）**: 输入 `vector_index`（必须与 .env 中的 MONGODB_VECTOR_INDEX 匹配）
6. **Database**: `AIAssistant`
7. **Collection**: `rag_vectors`
8. 点击 **Create Search Index**

### 4. 等待索引构建完成
- 索引创建需要几分钟时间
- 状态从 "Building" 变为 "Active" 后即可使用

## 验证配置

确保 `.env` 文件包含：

```env
MONGODB_VECTOR_DB=AIAssistant
MONGODB_VECTOR_COLLECTION=rag_vectors
MONGODB_VECTOR_INDEX=vector_index
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

**注意**：`text-embedding-3-small` 生成 **1536 维**向量，但您当前的数据是 **3072 维**（可能是 `text-embedding-3-large`）。

如果您使用的是 `text-embedding-3-large`，请更新 `.env`：

```env
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
```

## 重启服务

索引创建完成后：

```bash
npm run dev
```

## 测试 Quiz 生成

1. 访问 http://localhost:3000
2. 进入对话并上传 PDF
3. 尝试生成 Quiz

## 常见问题

### Q: 为什么需要 Vector Search Index？
A: MongoDB Atlas Vector Search 使用专门的向量索引来进行高效的相似度搜索。普通索引无法支持向量查询。

### Q: numDimensions 应该设置为多少？
A: 
- `text-embedding-3-small`: 1536
- `text-embedding-3-large`: 3072
- `text-embedding-ada-002`: 1536

### Q: 如果维度不匹配怎么办？
A: 需要：
1. 删除现有的 `rag_vectors` 集合
2. 更新 `.env` 中的 embedding model
3. 重新上传 PDF 文件

## 当前系统状态

根据诊断脚本输出：
- 集合有 392 个文档
- 每个文档有 3072 维向量
- 建议使用 `text-embedding-3-large`

## 索引配置（3072 维版本）

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

Index Name: `vector_index`
