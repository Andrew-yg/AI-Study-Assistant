# 🔐 Google OAuth 配置指南

## ❌ 当前错误

```
Error 400: redirect_uri_mismatch
```

**原因**: Google Cloud Console 中的授权重定向 URI 与应用实际使用的 URI 不匹配。

---

## ✅ 解决方案

### 步骤 1: 打开 Google Cloud Console

1. 访问：https://console.cloud.google.com/
2. 确保选择了正确的项目

### 步骤 2: 进入凭据设置

1. 左侧菜单：点击 **APIs & Services** > **Credentials**
2. 在 "OAuth 2.0 Client IDs" 部分找到您的客户端
3. 客户端 ID 开头应该是：`your-google-client-id`
4. 点击编辑图标 ✏️

### 步骤 3: 添加授权重定向 URI

在 **Authorized redirect URIs** 部分，添加以下 URI：

```
http://localhost:3001/api/auth/google/callback
```

**可选（推荐）** - 同时添加 3000 端口作为备用：
```
http://localhost:3000/api/auth/google/callback
```

![示例图](https://i.imgur.com/example.png)

### 步骤 4: 保存配置

1. 点击页面底部的 **SAVE** 按钮
2. 等待几秒钟让配置生效

---

## 🔄 重启应用

配置完成后，重启开发服务器：

```bash
# 1. 停止当前服务器（在终端按 Ctrl+C）

# 2. 重新启动
npm run dev
```

---

## ✅ 测试 OAuth 流程

1. 打开浏览器访问：http://localhost:3001
2. 点击 **"Sign in with Google"** 按钮
3. 应该会看到 Google 账户选择页面
4. 选择账户后正常登录

---

## 📋 完整的重定向 URI 配置

### 开发环境（必须添加）
✅ `http://localhost:3001/api/auth/google/callback` - 当前端口  
✅ `http://localhost:3000/api/auth/google/callback` - 备用端口

### 生产环境（部署时添加）
⏸️ `https://yourdomain.com/api/auth/google/callback`

---

## 🐛 故障排查

### 问题 1: redirect_uri_mismatch

**检查清单：**
- [ ] Google Console 中的 URI 是否**完全匹配**（包括 `http://`、端口号、路径）
- [ ] 是否点击了 **SAVE** 按钮
- [ ] 是否等待了几秒让配置生效
- [ ] 是否重启了开发服务器

**解决方法：**
```bash
# 1. 清除浏览器缓存或使用无痕模式
# 2. 确认 .env 文件中 BASE_URL=http://localhost:3001
# 3. 重启服务器
npm run dev
```

### 问题 2: 无法选择 Google 账户

**原因**: OAuth 请求中 `prompt` 参数设置不正确

**状态**: ✅ 已修复
- 代码已更新为 `prompt: 'select_account'`
- 重启服务器后生效

### 问题 3: Error - User validation failed: googleId is required

**错误信息：**
```
ERROR  [Auth] Google OAuth callback error: User validation failed: googleId: Path googleId is required.
```

**原因**: Google OAuth API v2 返回的用户 ID 字段名是 `id`，而不是 `sub`（v3 使用 `sub`）

**状态**: ✅ 已修复
- 代码已更新为同时支持 `id`（v2）和 `sub`（v3）
- 使用 `const googleId = userInfo.sub || userInfo.id`

**示例返回数据：**
```json
{
  "id": "101670607206132064082",
  "email": "andrewyg1101@gmail.com",
  "verified_email": true,
  "name": "Yang Gao",
  "picture": "https://lh3.googleusercontent.com/..."
}
```

### 问题 4: 授权后无法跳转回应用

**检查：**
- [ ] 回调端点是否正常：http://localhost:3001/api/auth/google/callback
- [ ] MongoDB 连接是否正常
- [ ] 浏览器控制台是否有错误

---

## 📸 Google Cloud Console 截图说明

### 1. 找到凭据页面
```
Google Cloud Console
└── APIs & Services
    └── Credentials
        └── OAuth 2.0 Client IDs
            └── [您的客户端名称]
```

### 2. 编辑客户端配置
点击客户端名称右侧的 ✏️ 编辑图标

### 3. 添加重定向 URI
在 "Authorized redirect URIs" 部分：
- 点击 "+ ADD URI" 按钮
- 输入：`http://localhost:3001/api/auth/google/callback`
- 再次点击 "+ ADD URI" 添加：`http://localhost:3000/api/auth/google/callback`
- 点击底部 "SAVE" 按钮

---

## 📝 当前配置摘要

### 环境变量 (.env)
```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
BASE_URL=http://localhost:3001
```

### OAuth 参数
- **Client ID**: `your-google-client-id.apps.googleusercontent.com`
- **Redirect URI**: `http://localhost:3001/api/auth/google/callback`
- **Scopes**: `openid email profile`
- **Prompt**: `select_account` ✅ 允许选择账户

---

## ✨ 配置完成后的效果

1. ✅ 点击登录会跳转到 Google 账户选择页面
2. ✅ 可以选择任意 Google 账户（不限于默认账户）
3. ✅ 授权后正确跳转回应用
4. ✅ 自动创建用户并登录
5. ✅ JWT token 保存到 localStorage

---

## 🎯 下一步

配置完成后，您就可以：
- 使用 Google 账户登录
- 创建和管理对话
- 发送消息
- 测试所有功能（除了文件上传需要 R2 配置）

祝配置顺利！🚀
