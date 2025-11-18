# 🐳 Docker Desktop 本地 Kubernetes 部署指南

本指南专为使用 Docker Desktop 的用户编写，帮助您在本地 Kubernetes 环境中运行 AI Study Assistant。

---

## 📋 前置要求

- ✅ Docker Desktop 已安装（macOS/Windows）
- ✅ 至少 8GB 内存分配给 Docker Desktop
- ✅ 20GB 可用磁盘空间

---

## 第一步：启用 Kubernetes

1. 打开 **Docker Desktop**
2. 点击右上角 **⚙️ Settings/Preferences**
3. 左侧菜单选择 **Kubernetes**
4. 勾选 ☑️ **"Enable Kubernetes"**
5. 点击 **"Apply & Restart"**
6. 等待 2-5 分钟，直到 Docker Desktop 状态栏显示 **Kubernetes is running** ✅

### 验证 Kubernetes 已启动

```bash
kubectl version --short
kubectl cluster-info
kubectl get nodes
```

应该看到类似输出：
```
NAME             STATUS   ROLES           AGE   VERSION
docker-desktop   Ready    control-plane   1d    v1.29.1
```

---

## 第二步：构建 Docker 镜像

从项目根目录开始：

### 2.1 构建 Nuxt Web 应用镜像

> 📝 **提示**：Nuxt 构建需要根目录的 `package-lock.json`，因此务必在项目根目录执行，并通过 `-f docker/nuxt/Dockerfile` 指定 Dockerfile。

```bash
# 位于仓库根目录
docker build \
  -f docker/nuxt/Dockerfile \
  -t ai-study-assistant-web:1.0.0 \
  .
```

预计时间：3-5 分钟

### 2.2 构建 Python 微服务镜像

```bash
# 仍位于仓库根目录

# RAG 服务
docker build \
  -f docker/python/Dockerfile \
  --build-arg SERVICE=rag-service \
  --build-arg PORT=8001 \
  -t ai-study-assistant-rag:1.0.0 \
  .

# Agent 服务
docker build \
  -f docker/python/Dockerfile \
  --build-arg SERVICE=agent-service \
  --build-arg PORT=8002 \
  -t ai-study-assistant-agent:1.0.0 \
  .

# Quiz 服务
docker build \
  -f docker/python/Dockerfile \
  --build-arg SERVICE=quiz-service \
  --build-arg PORT=8003 \
  -t ai-study-assistant-quiz:1.0.0 \
  .
```

每个服务约 2-3 分钟

### 2.3 验证镜像已构建

```bash
docker images | grep ai-study-assistant
```

应该看到 4 个镜像：
```
ai-study-assistant-web      1.0.0
ai-study-assistant-rag      1.0.0
ai-study-assistant-agent    1.0.0
ai-study-assistant-quiz     1.0.0
```

---

## 第三步：配置环境变量和密钥

### 3.1 创建 secrets.yaml

```bash
cd ../../  # 回到项目根目录
cp k8s/secrets.example.yaml k8s/secrets.yaml
```

### 3.2 编辑 secrets.yaml

用文本编辑器打开 `k8s/secrets.yaml`，填入真实值：

```yaml
stringData:
  # MongoDB Atlas 连接字符串
  MONGODB_URI: "mongodb+srv://username:password@cluster.mongodb.net/AIAssistant"
  
  # JWT 密钥（任意长字符串）
  JWT_SECRET: "your-super-secret-jwt-key-change-me"
  
  # Google OAuth 凭证（从 Google Cloud Console 获取）
  GOOGLE_CLIENT_ID: "xxx.apps.googleusercontent.com"
  GOOGLE_CLIENT_SECRET: "GOCSPX-xxx"
  
  # OpenAI API Key（必需）
  OPENAI_API_KEY: "sk-proj-xxx"
  
  # Brave Search API Key（可选）
  BRAVE_SEARCH_API_KEY: ""
  
  # Cloudflare R2 存储凭证
  R2_ACCOUNT_ID: "your-r2-account-id"
  R2_ACCESS_KEY_ID: "your-r2-access-key"
  R2_SECRET_ACCESS_KEY: "your-r2-secret-key"
  R2_BUCKET_NAME: "ai-study-materials"
  R2_PUBLIC_BASE_URL: "https://pub-xxx.r2.dev"
```

⚠️ **重要**: 不要把 `secrets.yaml` 提交到 Git！它已经在 `.gitignore` 中。

### 3.3 修改 ConfigMap（可选）

如果需要自定义配置，编辑 `k8s/configmap.yaml`：

```yaml
data:
  BASE_URL: "http://localhost"  # 本地环境用 localhost
  # 其他配置保持默认即可
```

---

## 第四步：部署到 Kubernetes

### 4.1 创建命名空间

```bash
kubectl apply -f k8s/namespace.yaml
```

### 4.2 应用 ConfigMap 和 Secrets

```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
```

### 4.3 部署所有服务

```bash
kubectl apply -f k8s/rag-deployment.yaml
kubectl apply -f k8s/agent-deployment.yaml
kubectl apply -f k8s/quiz-deployment.yaml
kubectl apply -f k8s/nuxt-deployment.yaml
```

### 4.4 检查部署状态

```bash
kubectl get pods -n ai-study-assistant
```

等待所有 Pod 状态变为 `Running`（约 1-2 分钟）：

```
NAME                            READY   STATUS    RESTARTS   AGE
web-xxxxx-xxxxx                 1/1     Running   0          30s
rag-service-xxxxx-xxxxx         1/1     Running   0          30s
agent-service-xxxxx-xxxxx       1/1     Running   0          30s
quiz-service-xxxxx-xxxxx        1/1     Running   0          30s
```

如果 Pod 状态是 `ImagePullBackOff` 或 `ErrImagePull`，说明镜像名称不匹配，请检查部署文件中的 `image:` 字段。

---

## 第五步：访问应用

### 5.1 端口转发方式（推荐用于本地测试）

```bash
kubectl port-forward service/web 3000:80 -n ai-study-assistant
```

然后在浏览器打开：**http://localhost:3000**

### 5.2 使用 LoadBalancer（Docker Desktop 支持）

如果您想使用 `http://localhost` 访问（不带端口号），可以修改 `k8s/nuxt-deployment.yaml` 中的 Service 部分：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: ai-study-assistant
spec:
  type: LoadBalancer  # 添加这一行
  selector:
    app: web
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: 3000
```

然后重新应用：
```bash
kubectl apply -f k8s/nuxt-deployment.yaml
kubectl get service web -n ai-study-assistant
```

等待 `EXTERNAL-IP` 显示为 `localhost`，然后直接访问 **http://localhost**

---

## 第六步：验证和调试

### 查看日志

```bash
# Web 应用日志
kubectl logs -n ai-study-assistant -l app=web --tail=50

# RAG 服务日志
kubectl logs -n ai-study-assistant -l app=rag-service --tail=50

# Agent 服务日志
kubectl logs -n ai-study-assistant -l app=agent-service --tail=50

# Quiz 服务日志
kubectl logs -n ai-study-assistant -l app=quiz-service --tail=50
```

### 检查健康状态

```bash
# 端口转发后
curl http://localhost:3000/api/health

# 或者直接在 Pod 内检查
kubectl exec -n ai-study-assistant deployment/web -- curl -s http://localhost:3000/api/health
```

### 进入 Pod 调试

```bash
kubectl exec -it -n ai-study-assistant deployment/web -- sh
```

---

## 常见问题

### Q1: Pod 一直处于 Pending 状态

**原因**: Docker Desktop 资源不足

**解决方案**:
1. Docker Desktop → Settings → Resources
2. 增加 Memory 到 8GB
3. 增加 CPUs 到 4 核
4. 点击 "Apply & Restart"

### Q2: Pod 报错 "ImagePullBackOff"

**原因**: Kubernetes 尝试从远程拉取镜像，但本地镜像未正确配置

**解决方案**:
确保部署文件中设置了 `imagePullPolicy: Never`，并且镜像名称与本地构建的完全一致：

```yaml
image: ai-study-assistant-web:1.0.0
imagePullPolicy: Never
```

### Q3: Web 应用无法连接到 Python 服务

**原因**: 服务未启动或 DNS 解析失败

**调试步骤**:
```bash
# 1. 检查服务是否存在
kubectl get services -n ai-study-assistant

# 2. 检查 Pod 是否运行
kubectl get pods -n ai-study-assistant

# 3. 测试服务连通性
kubectl exec -n ai-study-assistant deployment/web -- curl -s http://rag-service:8001/health
```

### Q4: MongoDB 连接失败

**原因**: MongoDB Atlas IP 白名单未配置

**解决方案**:
1. 登录 MongoDB Atlas
2. Network Access → Add IP Address
3. 添加 `0.0.0.0/0`（仅用于测试）或您的公网 IP
4. 重启 Pods: `kubectl rollout restart deployment -n ai-study-assistant`

---

## 更新应用

### 重新构建镜像

```bash
# 修改代码后重新构建（仍在仓库根目录）
docker build \
  -f docker/nuxt/Dockerfile \
  -t ai-study-assistant-web:1.0.1 \
  .

# 更新部署文件中的版本号，然后
kubectl apply -f k8s/nuxt-deployment.yaml
kubectl rollout restart deployment/web -n ai-study-assistant
```

### 更新配置

```bash
# 修改 ConfigMap 或 Secrets 后
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# 重启所有部署以应用新配置
kubectl rollout restart deployment -n ai-study-assistant
```

---

## 清理资源

### 删除所有部署（保留镜像）

```bash
kubectl delete namespace ai-study-assistant
```

### 删除 Docker 镜像

```bash
docker rmi ai-study-assistant-web:1.0.0
docker rmi ai-study-assistant-rag:1.0.0
docker rmi ai-study-assistant-agent:1.0.0
docker rmi ai-study-assistant-quiz:1.0.0
```

### 完全清理

```bash
# 删除 Kubernetes 资源
kubectl delete namespace ai-study-assistant

# 删除镜像
docker rmi $(docker images | grep ai-study-assistant | awk '{print $3}')

# 清理未使用的资源
docker system prune -a
```

---

## 🎯 下一步

- 📖 查看 [完整部署文档](./DEPLOY_TO_K8S.md) 了解生产环境部署
- 🧪 运行 E2E 测试: `npm run test:e2e`
- 🔍 查看 [项目结构](../PROJECT_STRUCTURE.md)

---

## 🆘 需要帮助？

遇到问题？
1. 查看日志: `kubectl logs -n ai-study-assistant -l app=web --tail=100`
2. 检查事件: `kubectl get events -n ai-study-assistant --sort-by='.lastTimestamp'`
3. 提交 Issue: [GitHub Issues](https://github.com/Andrew-yg/AI-Study-Assistant/issues)

Happy learning! 🚀
