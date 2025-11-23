# GitLab CI/CD Pre-Deployment Checklist

Before running your first pipeline, complete these steps:

## ✅ Quick Validation Results

Your `.gitlab-ci.yml` has been validated and **all critical issues are now fixed**:

- ✅ YAML syntax is valid
- ✅ Image names corrected to use GitLab registry paths
- ✅ `imagePullPolicy: Always` set for all deployments
- ✅ `imagePullSecrets` added to all 4 deployments
- ✅ Deploy job will apply registry credentials

## 📋 Required Actions Before First Deploy

### 1. GitLab CI/CD Variables

Set these in **Settings → CI/CD → Variables**:

| Variable | Type | Protected | Masked | Value |
|----------|------|-----------|--------|-------|
| `KUBECONFIG_DATA` | Variable | ✅ Yes | ✅ Yes | Base64 kubeconfig: `cat ~/.kube/config \| base64 \| tr -d '\n'` |
| `PRODUCTION_BASE_URL` | Variable | ✅ Yes | ❌ No | Your domain, e.g., `https://study.example.com` |
| `REGISTRY_CLEANUP_TOKEN` | Variable | ❌ No | ✅ Yes | GitLab Personal Access Token with `api` scope |

### 2. Container Registry Access

**Create a Deploy Token** (Settings → Repository → Deploy tokens):
- Name: `k8s-registry-pull`
- Username will be auto-generated (e.g., `gitlab+deploy-token-123`)
- Scopes: ✅ `read_registry`
- Expiration: Optional (recommend 1 year)

**Then update `k8s/registry-secret.yaml`:**
```bash
# Generate the auth string for Duke GitLab
echo -n "gitlab+deploy-token-123:gldt-your-token-here" | base64

# Result example: Z2l0bGFiK2RlcGxveS10b2tlbi0xMjM6Z2xkdC15b3VyLXRva2VuLWhlcmU=
```

Replace placeholders in the file:
```yaml
stringData:
  .dockerconfigjson: |
    {
      "auths": {
        "registry.gitlab.oit.duke.edu": {
          "username": "gitlab+deploy-token-123",
          "password": "gldt-your-token-here",
          "auth": "Z2l0bGFiK2RlcGxveS10b2tlbi0xMjM6Z2xkdC15b3VyLXRva2VuLWhlcmU="
        }
      }
    }
```

**Important:** Add to `.gitignore`:
```bash
echo "k8s/registry-secret.yaml" >> .gitignore
echo "k8s/secrets.yaml" >> .gitignore
```

### 3. Application Secrets

Copy and fill `k8s/secrets.yaml`:
```bash
cp k8s/secrets.example.yaml k8s/secrets.yaml
```

Update with real values:
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - Random 64-character string: `openssl rand -hex 32`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `OPENAI_API_KEY` - Your OpenAI API key (sk-...)
- `R2_*` - Cloudflare R2 credentials (if using file uploads)

### 4. Update Image Registry Path

**✅ ALREADY CONFIGURED** for Duke GitLab!

All deployment files now use:
```yaml
image: registry.gitlab.oit.duke.edu/yang.gao/ai-study-assistant/web:latest
```

If your Duke GitLab project path is different, update these files:
- `k8s/nuxt-deployment.yaml`
- `k8s/rag-deployment.yaml`
- `k8s/agent-deployment.yaml`
- `k8s/quiz-deployment.yaml`

Find your exact path at: **Settings → General** in your Duke GitLab project.

### 5. ConfigMap Adjustment

Edit `k8s/configmap.yaml`:
```yaml
data:
  BASE_URL: "https://your-actual-domain.com"  # Update this
```

## 🚀 First Pipeline Run

Once all variables and secrets are configured:

1. **Push to trigger pipeline:**
   ```bash
   git add .gitlab-ci.yml k8s/
   git commit -m "feat: add GitLab CI/CD pipeline"
   git push origin main
   ```

2. **Watch the pipeline:**
   - Go to **CI/CD → Pipelines**
   - Stages will run: lint → build → test → package
   - `docker-build` will push images to registry

3. **Manual deploy:**
   - After `docker-build` succeeds, click **▶ Run** on `k8s:deploy`
   - Monitor logs for `kubectl rollout status` confirmations

## 🔄 Scheduled Cleanup (Optional)

Create two pipeline schedules (CI/CD → Schedules):

**Schedule 1: Registry Cleanup**
- Interval: `0 2 * * 0` (Sundays at 2 AM)
- Target: `main`
- Variables: None (uses `REGISTRY_CLEANUP_TOKEN`)

**Schedule 2: Kubernetes Cleanup**
- Interval: `0 3 * * 0` (Sundays at 3 AM)
- Target: `main`
- Variables: None (uses `KUBECONFIG_DATA`)

## 🐛 Troubleshooting

### Images won't pull
```bash
# Check if secret exists
kubectl get secret gitlab-registry -n ai-study-assistant

# Verify it's correctly formatted
kubectl get secret gitlab-registry -n ai-study-assistant -o yaml

# Test manually with Duke GitLab registry
kubectl run test --image=registry.gitlab.oit.duke.edu/yang.gao/ai-study-assistant/web:latest \
  --image-pull-policy=Always \
  --overrides='{"spec":{"imagePullSecrets":[{"name":"gitlab-registry"}]}}' \
  -n ai-study-assistant
```

### Deploy job fails with "unauthorized"
- Regenerate deploy token with `read_registry` scope
- Verify username/password in `registry-secret.yaml`
- Ensure secret is applied: `kubectl apply -f k8s/registry-secret.yaml`

### Kubernetes connection fails
```bash
# Test kubeconfig locally
export KUBECONFIG_DATA=$(cat ~/.kube/config | base64 | tr -d '\n')
echo $KUBECONFIG_DATA | base64 -d > /tmp/test-kubeconfig
KUBECONFIG=/tmp/test-kubeconfig kubectl get nodes
```

## 📊 Pipeline Status

After first successful run, you should see:
- ✅ `lint:typecheck` - TypeScript validated
- ✅ `nuxt-build` - Build artifacts created
- ✅ `playwright-e2e` - E2E tests passed
- ✅ `docker-build` - 4 images pushed to registry
- ✅ `k8s:deploy` - All pods running and healthy

Check pod status:
```bash
kubectl get pods -n ai-study-assistant
```

Expected output:
```
NAME                             READY   STATUS    RESTARTS   AGE
agent-service-xxx-yyy            1/1     Running   0          2m
quiz-service-xxx-yyy             1/1     Running   0          2m
rag-service-xxx-yyy              1/1     Running   0          2m
web-xxx-yyy                      1/1     Running   0          2m
web-xxx-zzz                      1/1     Running   0          2m
```
