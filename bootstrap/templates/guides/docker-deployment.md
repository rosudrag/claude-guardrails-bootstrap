# Docker & Deployment Patterns

Containers are only as good as the practices that build them. These patterns ensure images are small, secure, and production-ready.

---

## 1. Dockerfile Best Practices

### Multi-Stage Builds

Separate build dependencies from runtime. The production image should contain only what is needed to run.

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

```dockerfile
# Multi-stage for compiled languages (Go example)
FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /app/server ./cmd/server

FROM gcr.io/distroless/static-debian12
COPY --from=build /app/server /server
USER nonroot:nonroot
ENTRYPOINT ["/server"]
```

### Minimal Base Images

Choose the smallest image that satisfies your runtime needs.

| Base Image | Size | Use When |
|------------|------|----------|
| `alpine` | ~5 MB | General purpose, most languages |
| `distroless` | ~2 MB | Compiled binaries (Go, Rust, Java) |
| `slim` (Debian) | ~80 MB | Need apt packages but want smaller than full |
| `bookworm` / full | ~200 MB+ | Need full OS tooling (avoid in production) |

### Layer Caching Optimization

Docker caches each layer. Copy dependency manifests before source code so that `npm install` (or equivalent) is cached when only source files change.

```dockerfile
# Good: Dependencies cached separately from source
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Bad: Any source change invalidates the npm install layer
COPY . .
RUN npm ci
```

The same principle applies to every ecosystem:

```dockerfile
# Python
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# .NET
COPY *.csproj ./
RUN dotnet restore
COPY . .

# Go
COPY go.mod go.sum ./
RUN go mod download
COPY . .
```

### Non-Root User Execution

Never run containers as root in production. Create or use an existing non-root user.

```dockerfile
# Node.js - built-in "node" user
FROM node:20-alpine
USER node

# Python - create a user
FROM python:3.12-slim
RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid appuser --create-home appuser
USER appuser

# Distroless - built-in "nonroot" user
FROM gcr.io/distroless/static-debian12
USER nonroot:nonroot
```

### .dockerignore

Always include a `.dockerignore` to keep build context small and prevent leaking secrets.

```
# Version control
.git
.gitignore

# Dependencies (rebuilt in container)
node_modules
__pycache__
.venv

# Environment and secrets
.env
.env.*
*.pem
*.key

# IDE and OS files
.vscode
.idea
*.swp
.DS_Store
Thumbs.db

# Build artifacts
dist
build
coverage
*.log
```

### Health Checks

Let Docker monitor container health natively.

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
```

For images without `wget` or `curl`, use a dedicated health binary or a language-native check:

```dockerfile
# Go binary with built-in health endpoint
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD ["/server", "--healthcheck"]
```

### Proper Signal Handling

Use exec form for `CMD` so the process receives signals directly as PID 1.

```dockerfile
# Good: exec form - process is PID 1, receives SIGTERM
CMD ["node", "server.js"]

# Bad: shell form - sh is PID 1, node never gets SIGTERM
CMD node server.js
```

If your process does not handle `SIGTERM` natively, use an init system:

```dockerfile
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
```

---

## 2. Docker Compose for Development

### Service Definitions

Structure services so each has a single responsibility.

```yaml
# docker-compose.yml
services:
  app:
    build:
      context: .
      target: build
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/app
      - REDIS_URL=redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d app"]
      interval: 5s
      timeout: 3s
      retries: 5

  cache:
    image: redis:7-alpine
    volumes:
      - cache_data:/data

  queue:
    image: rabbitmq:3-management-alpine
    ports:
      - "15672:15672"
    volumes:
      - queue_data:/var/lib/rabbitmq

volumes:
  db_data:
  cache_data:
  queue_data:
```

### Volume Strategies

| Type | Purpose | Example |
|------|---------|---------|
| Named volume | Persist data across restarts | `db_data:/var/lib/postgresql/data` |
| Bind mount | Live-reload source code in dev | `.:/app` |
| Anonymous volume | Prevent bind mount from overwriting | `/app/node_modules` |

**Key rule:** Named volumes for data, bind mounts for code (development only).

### Network Configuration

Services in the same Compose file share a default network and can reach each other by service name.

```yaml
# No explicit network needed for basic setups.
# Service "app" connects to "db" via hostname "db".

# For multi-project setups, define an explicit network:
networks:
  shared:
    name: my-shared-network

services:
  app:
    networks:
      - shared
```

### Environment Variable Management

```yaml
services:
  app:
    # Option 1: Inline (visible in docker-compose.yml)
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug

    # Option 2: From .env file (secrets stay out of compose file)
    env_file:
      - .env

    # Option 3: Interpolation from host environment or .env
    environment:
      - DATABASE_URL=${DATABASE_URL}
```

**Always** commit a `.env.example` with placeholder values. **Never** commit `.env`.

### Health Checks and depends_on

Use `condition` to wait for real readiness, not just container start.

```yaml
services:
  app:
    depends_on:
      db:
        condition: service_healthy
      migrations:
        condition: service_completed_successfully

  db:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 10s

  migrations:
    build: .
    command: ["npm", "run", "migrate"]
    depends_on:
      db:
        condition: service_healthy
```

### Development Overrides

Keep production-like defaults in `docker-compose.yml` and override for development.

```yaml
# docker-compose.override.yml (auto-loaded in development)
services:
  app:
    build:
      target: build
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DEBUG=true
    command: ["npm", "run", "dev"]
```

Production deploys use only the base file or an explicit production override:

```bash
# Development (auto-loads override)
docker compose up

# Production (explicit file, no override)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 3. Deployment Strategies

### Rolling Updates

Replace instances one at a time. This is the default for most orchestrators.

```yaml
# Docker Swarm / Compose deploy config
deploy:
  replicas: 3
  update_config:
    parallelism: 1
    delay: 10s
    failure_action: rollback
    order: start-first
```

**Requirements:** Application must handle running two versions simultaneously. Database migrations must be backward-compatible.

### Blue-Green Deployment

Run two identical environments. Switch traffic after validation.

```
1. "Blue" (current) serves all traffic
2. Deploy new version to "Green"
3. Run smoke tests against Green
4. Switch load balancer from Blue to Green
5. Keep Blue running for quick rollback
6. Tear down Blue after confidence period
```

```yaml
# Simplified with Compose and a reverse proxy
services:
  green:
    image: myapp:2.1.0
    # New version, not yet receiving traffic

  blue:
    image: myapp:2.0.0
    # Current version, serving traffic

  proxy:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    # Switch upstream from blue to green when ready
```

### Canary Deployment

Route a small percentage of traffic to the new version. Increase gradually while monitoring.

```
1. Deploy canary (1 instance of new version alongside N old)
2. Route ~5% of traffic to canary
3. Monitor error rates, latency, business metrics
4. If healthy, increase to 25%, then 50%, then 100%
5. If unhealthy, route all traffic back to old version
```

### Health Check Endpoints

Implement two distinct endpoints:

```
GET /health  (liveness)  -> Is the process alive?
GET /ready   (readiness) -> Can it accept traffic?
```

```javascript
// Liveness: process is running and not deadlocked
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// Readiness: dependencies are connected, can serve requests
app.get('/ready', async (req, res) => {
  try {
    await db.query('SELECT 1');
    await cache.ping();
    res.status(200).json({ status: 'ready' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', error: err.message });
  }
});
```

**Liveness** failures cause restarts. **Readiness** failures remove the instance from the load balancer without killing it.

### Graceful Shutdown

Handle `SIGTERM` to finish in-flight requests before exiting.

```javascript
const server = app.listen(3000);

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');

  // Stop accepting new connections
  server.close(() => {
    console.log('All connections closed. Exiting.');
    process.exit(0);
  });

  // Force exit after timeout
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 30_000);
});
```

```python
import signal
import sys

def shutdown_handler(signum, frame):
    print("SIGTERM received. Finishing in-flight requests...")
    server.shutdown()
    sys.exit(0)

signal.signal(signal.SIGTERM, shutdown_handler)
```

---

## 4. Production Considerations

### Secret Management

**Never** bake secrets into images. Pass them at runtime.

| Method | When to Use |
|--------|-------------|
| Environment variables | Simple deployments, CI/CD injection |
| Docker secrets | Swarm-mode native secret management |
| Mounted volumes | External secret managers (Vault, AWS SM) |
| `.env` file (runtime) | Local/staging only, never in images |

```yaml
# Docker Swarm secrets
services:
  app:
    secrets:
      - db_password

secrets:
  db_password:
    external: true
```

### Logging to stdout/stderr

Follow the 12-factor app model. Let the orchestrator collect logs.

```dockerfile
# Do not write to log files inside the container
# Bad
CMD ["node", "server.js", ">>", "/var/log/app.log"]

# Good - stdout/stderr captured by Docker
CMD ["node", "server.js"]
```

Configure your application logger to write to stdout:

```javascript
// Winston example
const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
  format: winston.format.json(),
});
```

### Resource Limits

Always set memory and CPU limits to prevent a single container from starving the host.

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M
```

```bash
# Docker run equivalent
docker run --memory=512m --cpus=1.0 myapp:1.0.0
```

### Restart Policies

```yaml
services:
  app:
    restart: unless-stopped   # Restart always, except when manually stopped

  worker:
    restart: on-failure       # Restart only on non-zero exit code
    deploy:
      restart_policy:
        condition: on-failure
        max_attempts: 5
        delay: 5s
```

| Policy | Behavior |
|--------|----------|
| `no` | Never restart (default) |
| `on-failure` | Restart on non-zero exit code |
| `unless-stopped` | Always restart unless manually stopped |
| `always` | Always restart, even after manual stop |

### Image Tagging Strategy

```bash
# Good: Immutable, traceable tags
myapp:1.2.3           # Semantic version
myapp:1.2.3-abc1234   # Semver + git SHA
myapp:abc1234          # Git SHA only

# Bad: Mutable, untraceable
myapp:latest           # Which version? When was it built?
myapp:stable           # Means different things at different times
```

**Rules:**
- Tag every image with a version or commit SHA
- Never deploy `:latest` to production
- Use `:latest` only for local development convenience
- Pin base image versions in Dockerfiles (`node:20.11.1-alpine`, not `node:alpine`)

---

## 5. Anti-Patterns

### Running as Root

```dockerfile
# Anti-pattern: container runs as root by default
FROM node:20-alpine
COPY . .
CMD ["node", "server.js"]

# Fix: switch to non-root user
FROM node:20-alpine
COPY . .
USER node
CMD ["node", "server.js"]
```

**Risk:** A container escape with root gives root on the host.

### Using :latest in Production

```yaml
# Anti-pattern
image: myapp:latest

# Fix
image: myapp:1.2.3
```

**Risk:** Unpredictable deployments. No way to reproduce or roll back.

### Baking Secrets into Images

```dockerfile
# Anti-pattern: secret visible in image layers
ENV API_KEY=sk-real-secret-key
COPY credentials.json /app/

# Fix: inject at runtime
# (no ENV for secrets in Dockerfile, pass via -e or secrets)
```

**Risk:** Anyone with image access can extract every secret.

### Skipping Multi-Stage Builds

```dockerfile
# Anti-pattern: build tools in production image
FROM node:20
COPY . .
RUN npm install
RUN npm run build
CMD ["node", "dist/server.js"]
# Image contains devDependencies, source code, build tools

# Fix: multi-stage (see Section 1)
```

**Risk:** Bloated images (often 1 GB+), larger attack surface, slower deploys.

### Missing Health Checks

Without health checks, the orchestrator cannot distinguish a running container from a hung one. Dead containers keep receiving traffic.

### Ignoring .dockerignore

```bash
# Without .dockerignore, the build context includes everything:
# .git (often 100 MB+), node_modules, .env, test fixtures...
# Result: slow builds, bloated layers, leaked secrets
```

### Shell Form CMD (PID 1 Problem)

```dockerfile
# Anti-pattern: shell form
CMD npm start
# Translates to: /bin/sh -c "npm start"
# sh is PID 1, node is a child process
# SIGTERM goes to sh, which does NOT forward it to node

# Fix: exec form
CMD ["npm", "start"]
# npm is PID 1 and receives SIGTERM directly
```

---

## Quick Reference

| Topic | Do | Do Not |
|-------|----|--------|
| Base image | `node:20-alpine`, distroless | `node:latest`, full Debian |
| Build | Multi-stage: build then copy artifacts | Single stage with all build tools |
| User | `USER node` / `USER nonroot` | Run as root (default) |
| Secrets | Runtime env vars, Docker secrets | `ENV SECRET=...` in Dockerfile |
| CMD | Exec form: `["node", "server.js"]` | Shell form: `node server.js` |
| Tags | Semver or git SHA: `1.2.3`, `abc1234` | `:latest` in production |
| Logs | Write to stdout/stderr | Write to files inside container |
| Health | `HEALTHCHECK` + `/health` endpoint | No health checks |
| .dockerignore | Include `.git`, `node_modules`, `.env` | Skip it (huge build context) |
| Volumes | Named for data, bind for dev code | Bind mounts for production data |
| Deps | Copy manifests first, then source | Copy everything, then install |
| Shutdown | Handle SIGTERM, drain connections | Hard kill with no cleanup |
| Resources | Set `--memory` and `--cpus` limits | No limits (risk host starvation) |
| Restart | `unless-stopped` or `on-failure` | `always` without thought |
| Compose override | `docker-compose.override.yml` for dev | Dev config in production compose |
