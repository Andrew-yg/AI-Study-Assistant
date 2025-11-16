# 🚀 快速开始指南

## 重构完成！

项目已成功从 Supabase 重构到 MongoDB + MongoDB Atlas，使用 Google OAuth 和 JWT 认证。

## ✅ 已完成的改动

### 后端
- ✅ 安装 MongoDB、Mongoose、JWT、Passport 等依赖
- ✅ 创建 MongoDB 连接工具 (`server/utils/mongodb.ts`)
- ✅ 创建 Cloudflare R2 存储工具 (`server/utils/r2.ts`)
- ✅ 创建 4 个 Mongoose 模型：User, Conversation, Message, LearningMaterial
- ✅ 实现 JWT 认证中间件 (`server/utils/auth.ts`)
- ✅ 实现 Google OAuth 登录流程
  - `/api/auth/google` - 发起 OAuth
  - `/api/auth/google/callback` - 回调处理
  - `/api/auth/me` - 获取当前用户
  - `/api/auth/logout` - 登出
- ✅ 重构所有 API endpoints 使用 MongoDB
  - Conversations (CRUD)
  - Messages (CRUD)
  - Materials (CRUD)
  - Upload (使用 Cloudflare R2)

### 前端
- ✅ 删除 Supabase 客户端插件
- ✅ 重构 `composables/useAuth.ts` 使用 JWT
- ✅ 重构 `composables/useConversations.ts`
- ✅ 更新 `pages/auth/callback.vue` 处理 token
- ✅ 更新 `components/AuthModal.vue` (移除 GitHub，仅保留 Google)
- ✅ 创建 `composables/useAuthFetch.ts` 辅助函数

### 配置
- ✅ 更新 `nuxt.config.ts`
- ✅ 创建 `.env.example`
- ✅ 更新 `package.json`

## 📋 下一步操作

### 1. 配置环境变量

复制 `.env.example` 为 `.env`:
```bash
cp .env.example .env
```

然后填写以下信息：

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-study-assistant

# JWT (生成一个强随机密钥)
JWT_SECRET=your-super-secret-jwt-key

# Google OAuth (从 Google Cloud Console 获取)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-key-id
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=ai-study-materials

# 应用 URL
BASE_URL=http://localhost:3000
```

### 2. 设置 MongoDB Atlas

1. 访问 https://www.mongodb.com/cloud/atlas
2. 创建免费集群
3. 创建数据库用户
4. 添加 IP 地址到白名单 (0.0.0.0/0 用于开发)
5. 获取连接字符串

### 3. 设置 Google OAuth

1. 访问 https://console.cloud.google.com/
2. 创建项目 → APIs & Services → Credentials
3. 创建 OAuth 2.0 Client ID
4. 应用类型：Web application
5. 授权重定向 URI：
   - `http://localhost:3000/api/auth/google/callback`
6. 复制 Client ID 和 Client Secret

### 4. 设置 Cloudflare R2

1. 登录 Cloudflare Dashboard
2. R2 → Create bucket (`ai-study-materials`)
3. Manage R2 API Tokens → Create API Token
4. 复制 Account ID, Access Key ID, Secret Access Key

### 5. 启动开发服务器

```bash
npm run dev
```

该命令会同时启动 Nuxt、RAG、Agent、Quiz 四个服务：

- Web 应用：http://localhost:3000
- RAG 服务：http://localhost:8001
- Agent 服务：http://localhost:8002
- Quiz 服务：http://localhost:8003

> 只想运行前端？使用 `npm run dev:web`。

## 🧪 测试流程

1. **测试登录**
   - 点击 "Log In" 或 "Sign Up"
   - 选择 "Continue with Google"
   - 授权后应重定向到 `/chat`

2. **测试对话**
   - 创建新对话
   - 发送消息
   - 查看对话列表

3. **测试文件上传**
   - 上传 PDF 文件
   - 查看材料列表
   - 删除材料

## 🔍 关键变化

### 认证流程
```
旧：Supabase Auth (OAuth)
  ↓
新：Google OAuth → JWT Token → localStorage
```

### 数据库
```
旧：PostgreSQL (Supabase)
  ↓
新：MongoDB (Atlas) + Mongoose
```

### 文件存储
```
旧：Supabase Storage
  ↓
新：Cloudflare R2 (S3-compatible)
```

### 字段命名
```
旧：snake_case (user_id, created_at)
  ↓
新：camelCase (userId, createdAt)
```

## 📚 重要文件

- `server/models/` - Mongoose 数据模型
- `server/utils/mongodb.ts` - MongoDB 连接
- `server/utils/auth.ts` - JWT 认证
- `server/utils/r2.ts` - Cloudflare R2 存储
- `server/api/auth/` - 认证 API
- `composables/useAuth.ts` - 前端认证逻辑
- `MONGODB_MIGRATION.md` - 详细迁移文档

## ⚠️ 注意事项

1. **开发环境**：确保所有环境变量都已配置
2. **MongoDB Atlas**：免费层有存储限制 (512MB)
3. **Cloudflare R2**：免费层每月 10GB 存储
4. **JWT Secret**：生产环境务必使用强随机密钥
5. **Google OAuth**：生产环境需更新 redirect URI

## 🐛 常见问题

### 1. "Cannot connect to MongoDB"
- 检查 `MONGODB_URI` 是否正确
- 确认 IP 地址在 Atlas 白名单中
- 验证数据库用户密码

### 2. "Google OAuth failed"
- 确认 redirect URI 完全匹配
- 检查 Client ID 和 Secret
- 确保启用了 Google+ API

### 3. "Token expired"
- 登出后重新登录
- 检查 `JWT_SECRET` 是否一致

### 4. "R2 upload failed"
- 验证 R2 凭据
- 确认 bucket 名称正确
- 检查文件大小限制 (当前 10MB)

## 🎉 完成！

项目已完全迁移到新的架构。查看 `MONGODB_MIGRATION.md` 了解更多详细信息。

如有问题，请检查：
1. 所有环境变量是否正确配置
2. MongoDB、Google OAuth、R2 是否正确设置
3. 查看浏览器控制台和服务器日志

祝开发愉快！🚀
