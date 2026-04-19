# YAML & Dockerfile Inventory — current branch

Date: 2026-04-19

This document lists all Docker Compose, Kubernetes YAML and Dockerfile locations in this branch, describes their purpose, and notes known build/runtime constraints we discovered while testing `docker-compose up --build`.

---

## 1) Compose files

- docker-compose.yml (root)
  - Path: docker-compose.yml
  - Purpose: single-file docker-compose that brings up infrastructure (Postgres, Zookeeper, Kafka, Kafka-UI), backend services (auth, patient, doctor, appointments, notification, payment, ai-symptom, api-gateway) and the frontend.
  - Notes:
    - Postgres host inside compose is `postgres` (container port 5432). Host mapping is `5433:5432`.
    - `backend/init-dbs.sql` is mounted into the Postgres container and will run on first start.
    - Backend services' `SPRING_DATASOURCE_URL` values point to `jdbc:postgresql://postgres:5432/<db>` (correct for container networking).
    - Backend Dockerfiles expect pre-built JARs in `target/*.jar` (see "Dockerfiles" below).
    - Frontend environment `NEXT_PUBLIC_API_URL` was originally `http://localhost:8080` (problematic for in-container routing) — updated to `http://api-gateway:8080`.

- backend/docker-compose.yml
  - Path: backend/docker-compose.yml
  - Purpose: an alternate (or earlier) compose file focused on infra (postgres, zookeeper, kafka, kafka-ui).


## 2) Kubernetes manifests

Location: `backend/k8s/`
Files present:
- backend/k8s/configmap-secret.yaml
  - Purpose: shared ConfigMap (`shared-config`) and Secret (`shared-secret`) used by k8s deployments. Note: ConfigMap uses `POSTGRES_HOST: "postgres-service"` which differs from docker-compose `postgres` service name (potential mismatch between k8s vs compose).
- backend/k8s/api-gateway.yaml
- backend/k8s/auth-service.yaml
- backend/k8s/ai-symptom-service.yaml
- backend/k8s/appointments-service.yaml
- backend/k8s/doctor-service.yaml
- backend/k8s/frontend.yaml
- backend/k8s/notification-service.yaml
- backend/k8s/patient-service.yaml
- backend/k8s/payment-service.yaml
- backend/k8s/postgres.yaml

Each deployment file references images of the form `carelabs/<service>:latest` and uses `shared-config`/`shared-secret` (api-gateway uses envFrom).

## 3) Dockerfiles

- frontend/Dockerfile
  - Path: frontend/Dockerfile
  - Multi-stage build: `deps` (npm install), `builder` (npm run build / Next.js), `runner` (npm start).
  - Original Node base used in repo was 18; Next.js 16 requires Node >= 20.9. We updated Dockerfile to `node:20-alpine` to satisfy engine constraints.
  - The build fails if TypeScript/compile-time errors exist in source; we encountered TS errors during build and addressed some with small patches, but further TS fixes may be required.

- backend service Dockerfiles (for each service):
  - backend/auth-service/Dockerfile
  - backend/patient-service/Dockerfile
  - backend/doctor-service/Dockerfile
  - backend/appointments-service/Dockerfile
  - backend/payment-service/Dockerfile
  - backend/notification-service/Dockerfile
  - backend/ai-symptom-service/Dockerfile
  - backend/api-gateway/Dockerfile
  - All use `eclipse-temurin:17-jdk-alpine`, `WORKDIR /app`, then `COPY target/*.jar app.jar` and `ENTRYPOINT ["java", "-jar", "app.jar"]`.
  - Implication: images will fail to build unless `target/*.jar` exists (i.e., Maven `package` run has been performed locally before `docker-compose build`).

## 4) DB init script

- backend/init-dbs.sql
  - Creates the following databases: `carelabs_auth`, `carelabs_doctors`, `carelabs_patients`, `carelabs_appointments`, `carelabs_payments`, `carelabs_notifications`.

## 5) Known issues & important observations (from working run)

- Backend Dockerfiles expect already-built JARs in `target/`:
  - Action: run each service's Maven wrapper to create `target/*.jar` before `docker-compose up --build`.
    - Example (PowerShell):

      ```powershell
      .\backend\auth-service\mvnw.cmd -DskipTests package
      .\backend\patient-service\mvnw.cmd -DskipTests package
      # ...repeat for each backend service
      ```

  - Alternative: convert backend Dockerfiles to multi-stage builds that run Maven inside the image (bigger images, but reproducible builds).

- Frontend Node version and TypeScript build errors:
  - Next.js 16 requires Node >= 20.9; using Node 18 causes `next build` to fail. We updated to Node 20 in `frontend/Dockerfile`.
  - After Node fix, `npm run build` still failed due to TypeScript errors in frontend sources (we applied a few small type fixes and added `frontend/types.d.ts` to help). There may be more TS errors to address before the production build succeeds.

- `NEXT_PUBLIC_API_URL` inside the frontend container must target the API gateway service name, not `localhost`. In compose we changed it to `http://api-gateway:8080` to allow in-container requests to reach the `api-gateway` service.

- Kafka advertised listener uses `PLAINTEXT://localhost:9092` in `KAFKA_ADVERTISED_LISTENERS` (compose). This is acceptable for desktop/local testing but may cause problems when services or external tools attempt to connect to Kafka from other hosts. The internal bootstrap server `kafka:29092` is provided for container-to-container communication.

- K8s vs Compose hostnames:
  - `backend/k8s/configmap-secret.yaml` config uses `POSTGRES_HOST: "postgres-service"`, while compose uses `postgres` as the service name. When comparing branches or moving to k8s, watch for these hostname differences.

## 6) How to compare this branch with `containerize` branch (commands)

Run these locally from repo root to fetch and compare branches (adjust `origin` if your remote is differently named):

```bash
# fetch remote branches
git fetch --all

# show whether containerize branch exists locally/remotely
git branch --list containerize
git branch -r --list origin/containerize

# list files changed between current HEAD and containerize (limit to YAML/Dockerfile)
git diff --name-only containerize..HEAD | grep -E '\.ya?ml$|Dockerfile$|docker-compose.yml'

# full diff for YAML/Dockerfile files
git diff containerize..HEAD -- '*.yml' '*.yaml' 'docker-compose.yml' 'frontend/Dockerfile' 'backend/*/Dockerfile' > compare-yml-diff.patch

# or get a concise name/status list
git diff --name-status containerize..HEAD > branch-file-changes.txt

# to inspect a specific file's diff:
git diff containerize..HEAD -- docker-compose.yml
```

Notes:
- If the `containerize` branch only exists on remote, use `origin/containerize` instead of `containerize` in the commands above.
- Use `git difftool` if you'd like side-by-side visual diffs (requires difftool installed and configured).

## 7) Next steps (suggested)

- I can run the `git diff` comparison now and produce a short report of all YAML/Dockerfile differences between current branch and `containerize` (or `origin/containerize`) and highlight changes that likely cause containerization failures (e.g., Dockerfile changes, Node version changes, missing prebuilt JARs, env var changes).
- Or you can run the commands above locally and paste the results here.

---

Generated by the repository auditor helper. If you want, I can now run the branch comparison and create a focused `diff` report and action list.
