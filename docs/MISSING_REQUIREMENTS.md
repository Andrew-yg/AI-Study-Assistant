# 缺失功能清单

## ❌ 1. E2E 测试套件

### 需要安装的依赖
```bash
npm install -D @playwright/test @nuxt/test-utils vitest
```

### 建议的测试文件结构
```
tests/
├── e2e/
│   ├── auth.spec.ts          # 测试 Google OAuth 登录流程
│   ├── conversations.spec.ts # 测试对话 CRUD
│   ├── messages.spec.ts      # 测试消息发送和接收
│   └── materials.spec.ts     # 测试材料上传和管理
└── playwright.config.ts
```

### 最小测试覆盖
- ✅ 用户登录流程
- ✅ 创建对话
- ✅ 发送消息
- ✅ 上传材料（包含 4 个字段的表单）
- ✅ 更新材料
- ✅ 删除材料

---

## ❌ 2. Kubernetes 部署配置

### 需要创建的文件

#### `Dockerfile`
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.output /app/.output
EXPOSE 3000
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
CMD ["node", ".output/server/index.mjs"]
```

#### `k8s/deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-study-assistant
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-study-assistant
  template:
    metadata:
      labels:
        app: ai-study-assistant
    spec:
      containers:
      - name: app
        image: ai-study-assistant:latest
        ports:
        - containerPort: 3000
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: mongodb-uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        - name: GOOGLE_CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: google-client-id
        - name: GOOGLE_CLIENT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: google-client-secret
        - name: BASE_URL
          value: "https://your-domain.com"
```

#### `k8s/service.yaml`
```yaml
apiVersion: v1
kind: Service
metadata:
  name: ai-study-assistant-service
spec:
  selector:
    app: ai-study-assistant
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

#### `k8s/secrets.yaml` (示例)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  mongodb-uri: "mongodb+srv://..."
  jwt-secret: "your-jwt-secret"
  google-client-id: "your-client-id"
  google-client-secret: "your-client-secret"
```

### 部署命令
```bash
# 构建 Docker 镜像
docker build -t ai-study-assistant:latest .

# 应用 Kubernetes 配置
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# 检查部署状态
kubectl get pods
kubectl get services
```

### Kubernetes 特性
- **水平扩展**: `replicas: 3` (可根据负载调整)
- **滚动更新**: Kubernetes 默认支持
- **健康检查**: 可添加 `livenessProbe` 和 `readinessProbe`
- **资源限制**: 可添加 `resources.limits` 和 `resources.requests`

---

## 📋 完成清单

- [ ] 安装测试依赖 (Playwright / Vitest)
- [ ] 创建 E2E 测试文件
- [ ] 编写至少 5 个基本测试用例
- [ ] 创建 Dockerfile
- [ ] 创建 Kubernetes 配置文件
- [ ] 在本地测试 Docker 构建
- [ ] (可选) 使用 Minikube 测试 K8s 部署

---

## 🎯 优先级建议

1. **高优先级**: E2E 测试套件
   - 更容易实现
   - 直接提升代码质量
   - 验证现有功能完整性

2. **中优先级**: Kubernetes 配置
   - 需要 Docker 环境
   - 需要 K8s 集群（Minikube/Kind/云服务）
   - 主要用于生产部署

---

## 📚 参考资源

### E2E 测试
- [Playwright 文档](https://playwright.dev/)
- [Nuxt Testing Utils](https://nuxt.com/docs/getting-started/testing)
- [Vitest 文档](https://vitest.dev/)

### Kubernetes
- [Kubernetes 官方文档](https://kubernetes.io/docs/home/)
- [Nuxt Deployment on K8s](https://nuxt.com/docs/getting-started/deployment)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
