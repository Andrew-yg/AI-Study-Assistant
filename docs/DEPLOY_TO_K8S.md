# Deploying AI Study Assistant to Kubernetes

This guide walks through building Docker images, configuring secrets, and deploying all four services (Nuxt web + three Python microservices) onto a Kubernetes cluster. Adjust any values that reference `example.com` or placeholder registry paths to match your environment.

---

## 1. Prerequisites

- A Kubernetes cluster (1.25+) with `kubectl` context configured.
- Container registry credentials (GitHub Container Registry, Amazon ECR, etc.). The examples below assume `ghcr.io/your-org/ai-study-assistant`.
- `docker` or compatible CLI with access to the registry.
- DNS entry pointing your domain (e.g., `study.example.com`) at the Kubernetes ingress controller.
- TLS certificate for HTTPS. You can bring an existing secret (`asa-tls`) or install cert-manager + Lets Encrypt.

Optional but recommended:
- NGINX ingress controller (the provided `k8s/ingress.yaml` is annotated for it).
- Metrics server for horizontal auto-scaling.

---

## 2. Set environment convenience variables

```bash
export REGISTRY="ghcr.io/your-org/ai-study-assistant"
export APP_VERSION="1.0.0"
```

These will be referenced in subsequent build and push commands.

---

## 3. Build and push container images

### 3.1 Nuxt web app

> Run this from the repository root so `package-lock.json` is included in the context.

```bash
docker build \
   -f docker/nuxt/Dockerfile \
   -t "$REGISTRY-web:$APP_VERSION" \
   -t "$REGISTRY-web:latest" \
   .

docker push "$REGISTRY-web:$APP_VERSION"
docker push "$REGISTRY-web:latest"
```

### 3.2 Python microservices

All Python services share the same `docker/python/Dockerfile`; pass the service folder through `--build-arg SERVICE=`:

```bash
for SERVICE in rag-service agent-service quiz-service; do
   PORT="8001"
   if [ "$SERVICE" = "agent-service" ]; then PORT="8002"; fi
   if [ "$SERVICE" = "quiz-service" ]; then PORT="8003"; fi

   docker build \
      -f docker/python/Dockerfile \
      --build-arg SERVICE="$SERVICE" \
      --build-arg PORT="$PORT" \
      -t "$REGISTRY-${SERVICE/:/-}:$APP_VERSION" \
      -t "$REGISTRY-${SERVICE/:/-}:latest" \
      .

   docker push "$REGISTRY-${SERVICE/:/-}:$APP_VERSION"
   docker push "$REGISTRY-${SERVICE/:/-}:latest"
done
```

> **Tip:** Replace `${SERVICE/:/-}` if your registry forbids underscores; alternatively rename the tags manually.

Once the images are published, update the `image:` fields in
- `k8s/nuxt-deployment.yaml`
- `k8s/rag-deployment.yaml`
- `k8s/agent-deployment.yaml`
- `k8s/quiz-deployment.yaml`

to reference the pushed image names.

---

## 4. Configure Kubernetes namespace, ConfigMap, and secrets

1. **Namespace**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   ```

2. **ConfigMap**
   - Edit `k8s/configmap.yaml` to match your domain (`BASE_URL`, `RAG_SERVICE_URL`, etc.).
   - Apply it:
     ```bash
     kubectl apply -f k8s/configmap.yaml
     ```

3. **Secrets**
   - Copy `k8s/secrets.example.yaml` to `k8s/secrets.yaml` and fill in real credentials (MongoDB, OpenAI, Brave Search, Cloudflare R2, Google OAuth, JWT secret).
   - Apply it:
     ```bash
     kubectl apply -f k8s/secrets.yaml
     ```
   - For production, consider storing secrets with an external secrets manager (e.g., SOPS, External Secrets Operator) instead of plain YAML files in Git.

---

## 5. Deploy the workloads

Apply each deployment + service manifest in any order after updating image references:

```bash
kubectl apply -f k8s/rag-deployment.yaml
kubectl apply -f k8s/agent-deployment.yaml
kubectl apply -f k8s/quiz-deployment.yaml
kubectl apply -f k8s/nuxt-deployment.yaml
```

Confirm Pods reach `Running`:

```bash
kubectl get pods -n ai-study-assistant
```

Troubleshoot failing pods with:
```bash
kubectl logs -n ai-study-assistant <pod-name>
```

---

## 6. Expose the web application via ingress

1. Update `k8s/ingress.yaml` with your domain (`spec.rules[0].host`) and, if you already created a TLS secret, ensure `spec.tls[0].secretName` matches.
2. Apply the ingress:
   ```bash
   kubectl apply -f k8s/ingress.yaml
   ```
3. Verify the rule:
   ```bash
   kubectl describe ingress asa-ingress -n ai-study-assistant
   ```
4. Point your DNS `A`/`CNAME` record for the domain at the ingress controllers load balancer IP.

If youre using cert-manager, you can annotate the ingress for automatic certificates (`cert-manager.io/cluster-issuer`).

---

## 7. Post-deployment checks

1. Hit the Nuxt health endpoint through the ingress:
   ```bash
   curl -I https://study.example.com/api/health
   ```
2. Call each Python service internally:
   ```bash
   kubectl port-forward service/rag-service 8001:8001 -n ai-study-assistant
   curl http://localhost:8001/health
   ```
3. Run Playwright smoke tests against the ingress URL (see `tests/e2e/chat.spec.ts`).

---

## 8. Operational tips

- **Scaling:** Adjust `.spec.replicas` or add HPAs (e.g., `kubectl autoscale deployment web --cpu-percent=70 --min=2 --max=6 -n ai-study-assistant`).
- **Resources:** Tune container `resources.requests/limits` to match the cluster capacity.
- **Logging:** Integrate a log collector (Loki, ELK, etc.) by configuring sidecars or cluster-wide DaemonSets.
- **Backups:** Snapshot MongoDB Atlas and R2 buckets regularly.
- **Secrets rotation:** Use sealed secrets or secret operators for automated rotation.

---

## 9. Clean up

When you need to tear everything down:

```bash
kubectl delete namespace ai-study-assistant
```

This removes all resources created inside the namespace (deployments, services, ingress, configmaps, secrets, etc.).
