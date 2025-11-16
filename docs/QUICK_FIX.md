# ⚡ Quick Fix - MongoDB Atlas Vector Search Index

## 问题
```
Error: 无法从学习资料中检索到内容
```

## 原因
MongoDB Atlas Vector Search Index 未创建

> ✅ 代码现已增加“应急降级模式”：如果索引缺失，RAG 会直接从 MongoDB 中按用户/资料提取原始文本块，Quiz 仍可生成。但因为没有向量相似度排序，只能提供粗糙片段，准确性和覆盖面都会降低。因此仍然 **必须** 创建并激活 Atlas Vector Search 索引。

## 快速修复（5 分钟）

### 1. 打开浏览器
https://cloud.mongodb.com/

### 2. 导航
Database → Browse Collections → `AIAssistant` → `rag_vectors` → **Search Indexes** 标签

### 3. Create Search Index → JSON Editor

### 4. 粘贴配置
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

### 5. 设置名称
**Index Name**: `vector_index` （必须完全匹配！）

### 6. 创建并等待
点击 "Create Search Index"，等待状态变为 **Active**（绿色）

### 7. 重启服务
```bash
npm run dev
```

### 8. 测试
访问 http://localhost:3000 并生成 Quiz

---

## 诊断命令
```bash
python3 diagnose_rag_pipeline.py
```

## 详细文档
- ATLAS_VECTOR_SEARCH_SETUP.md
- URGENT_FIX_QUIZ_GENERATION.md
