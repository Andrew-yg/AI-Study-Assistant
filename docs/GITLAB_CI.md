# GitLab CI/CD Pipeline

This repository now ships with a GitLab pipeline that validates the Nuxt app, executes Playwright smoke tests, builds & publishes four container images (web + 3 Python services), and can optionally deploy them to Kubernetes. The configuration lives in `.gitlab-ci.yml` and follows the same prod / test / cleanup flow used in the lecture reference projects.

## Stage Overview

| Stage   | Job                | Purpose |
|---------|--------------------|---------|
| `lint`  | `lint:typecheck`   | Installs dependencies and runs `tsc --noEmit` to catch type regressions early. |
| `build` | `nuxt-build`       | Ensures `npm run build` succeeds and produces `.output/`. |
| `test`  | `playwright-e2e`   | Spins up Nuxt dev server + Mongo service and executes `npm run test:e2e` inside the Playwright container. Artifacts (HTML report + results JSON) are retained for 14 days. |
| `package` | `docker-build`   | Uses `docker:dind` to build/push the Nuxt image plus the three Python service images. Tags are suffixed with the short commit SHA and optionally `latest` on the default branch. |
| `deploy` | `k8s:deploy`      | Applies manifests in `k8s/` and updates running deployments via `kubectl set image`. Triggered manually on the default branch once images exist. |
| `cleanup` | `cleanup:registry`, `cleanup:k8s` | Scheduled jobs that prune old container tags via the GitLab API and remove succeeded Jobs/Pods from the target namespace. |

## Required CI/CD Variables

| Variable | Scope | Description |
|----------|-------|-------------|
| `KUBECONFIG_DATA` | protected, masked | Base64-encoded kubeconfig with permissions to manage the `ai-study-assistant` namespace (used by `k8s:deploy` and `cleanup:k8s`). |
| `PRODUCTION_BASE_URL` | protected | Optional URL shown in the GitLab environment panel (e.g., `https://study.example.com`). |
| `REGISTRY_CLEANUP_TOKEN` | masked | Personal Access Token (API scope) that allows the `cleanup:registry` job to call the GitLab API and prune stale tags. |
| `WERF_*` | *not used* | The new pipeline replaces the Werf-based examples; no Werf secrets are required. |

> **Note:** The built-in `CI_REGISTRY_USER` and `CI_REGISTRY_PASSWORD` variables are automatically provided by GitLab and are used to log in to the Container Registry during `docker-build`.

## Kubernetes Secrets

The deploy job applies `k8s/secrets.yaml` only when the file exists. Copy `k8s/secrets.example.yaml` to `k8s/secrets.yaml`, populate the real credentials (MongoDB URI, OpenAI key, Cloudflare R2 keys, Google OAuth, JWT secret), and keep the file encrypted or stored with GitLab CI/CD variables if you do not want to commit it.

### Setting up GitLab Registry Access

**Important:** Your Kubernetes cluster needs credentials to pull images from GitLab's Container Registry.

1. **Create a GitLab Deploy Token:**
   - Go to **Settings → Repository → Deploy tokens** in your GitLab project
   - Name: `k8s-registry-pull`
   - Scopes: Check `read_registry`
   - Click **Create deploy token** and save the username + token

2. **Update `k8s/registry-secret.yaml`:**
   ```bash
   # Generate base64 auth string for Duke GitLab
   echo -n "YOUR_DEPLOY_TOKEN_USERNAME:YOUR_DEPLOY_TOKEN" | base64
   ```
   
   Replace the placeholders in `k8s/registry-secret.yaml`:
   ```yaml
   stringData:
     .dockerconfigjson: |
       {
         "auths": {
           "registry.gitlab.oit.duke.edu": {
             "username": "gitlab+deploy-token-123",  # From step 1
             "password": "your-deploy-token-value",   # From step 1
             "auth": "Z2l0bGFiK2RlcGxveS10b2tlbi0xMjM6..."  # From base64 command
           }
         }
       }
   ```

3. **Apply manually** (before first deploy):
   ```bash
   kubectl apply -f k8s/registry-secret.yaml
   ```

> **Note:** Keep `registry-secret.yaml` out of version control (add to `.gitignore`) or encrypt it with SOPS/sealed-secrets.

## Running the Deploy Job

1. Ensure `docker-build` has pushed images (i.e., run the pipeline on `main` or trigger the job manually with `SHOULD_PUSH=true`).
2. In GitLab → Deploy → Environments, click **Run** on the `production` environment (or trigger the `k8s:deploy` job from the pipeline) to ship the freshly tagged images.
3. Watch the job logs for the `kubectl rollout status` output to confirm the four deployments (`web`, `rag-service`, `agent-service`, `quiz-service`) reach a healthy state.

## Scheduled Maintenance Jobs

Create two schedules (e.g., weekly) so the cleanup stage runs automatically.

- **Registry cleanup**: Executes the GitLab API call to keep the newest 20 tags younger than 30 days per repository.
- **Kubernetes cleanup**: Deletes Completed Pods and successful Jobs inside the namespace to keep the cluster tidy when batch jobs are introduced.

Adjust the cadence as needed for your project scale.
