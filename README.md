# k6Framework

k6 performance testing framework targeting [DummyApi](../DummyApi). Covers smoke, load, stress, and spike scenarios.

---

## Project structure

```
k6Framework/
├── azure-pipelines.yml
├── package.json
├── tsconfig.json
│
├── scripts/
│   ├── build.mjs             # esbuild bundler — lists all test entry points
│   └── run.sh                # Local run helper
│
├── src/
│   ├── config/
│   │   └── environments.ts   # Base URLs per environment, selected via --env ENV=<name>
│   │
│   ├── lib/
│   │   ├── http.ts           # get/post/put/patch/del/delWithBody wrappers around k6/http
│   │   ├── checks.ts         # check() wrapper with failure logging and custom metric
│   │   └── thresholds.ts     # Shared SLA threshold definitions
│   │
│   ├── scenarios/
│   │   ├── smoke.ts          # 1 VU, 30s
│   │   ├── load.ts           # Ramp to 50 VUs
│   │   ├── stress.ts         # Ramp to 300 VUs
│   │   └── spike.ts          # Burst to 500 VUs
│   │
│   └── tests/
│       ├── api/
│       │   └── todos-api/
│       │       ├── health.test.ts          # GET /health
│       │       └── todos.test.ts           # Full CRUD — GET /todos, POST, PUT, DELETE
│       └── flows/
│           └── todo-lifecycle.test.ts  # Browse → create → complete → delete
```

---

## How it fits together

**`config/environments.ts`** — resolves the active config from `--env ENV=<name>`. All scripts target `dev` (localhost). In a pipeline, pass `--env DEV_BASE_URL=<staging-url>` to override the URL without changing the config.

**`lib/`** — building blocks used by every test. You should not need to change these when adding new tests.

**`scenarios/`** — VU ramp profiles. Spread one into a test file's `options` export to set the load shape.

**`tests/api/<service-name>/`** — API tests for a specific microservice. Each file is a standalone k6 script.

**`tests/flows/`** — multi-step user journeys that span multiple API endpoints.

**`scripts/build.mjs`** — bundles TypeScript into k6-runnable JS using esbuild. k6 modules (`k6`, `k6/*`) are marked external. Add new entry points here when adding new test files.

---

## Prerequisites

- **Node.js** 20+
- **k6**

```bash
# macOS
brew install k6

# Windows
winget install k6 --source winget
```

---

## Local setup

```bash
npm install
npm run build

# Start DummyApi first
cd ../DummyApi && dotnet run   # http://localhost:5058
```

---

## Running tests

`dev` scripts target localhost. `staging` scripts target the URL set in `STAGING_BASE_URL` (see Environment configuration).

| Command | What it runs | Target |
|---|---|---|
| `npm test` | All tests | dev |
| `npm run test:staging` | All tests | staging |
| `npm run test:smoke` | All — smoke scenario | dev |
| `npm run test:load` | Todos — load scenario | dev |
| `npm run test:stress` | Todos — stress scenario | dev |
| `npm run test:spike` | Todos — spike scenario | dev |
| `npm run test:smoke:staging` | All — smoke scenario | staging |
| `npm run test:load:staging` | Todos — load scenario | staging |
| `npm run test:stress:staging` | Todos — stress scenario | staging |
| `npm run test:spike:staging` | Todos — spike scenario | staging |
| `npm run test:smoke:health` | Health only | dev |
| `npm run test:smoke:todos` | Todos only | dev |
| `npm run test:smoke:lifecycle` | Lifecycle only | dev |
| `npm run test:smoke:health:staging` | Health only | staging |
| `npm run test:smoke:todos:staging` | Todos only | staging |
| `npm run test:smoke:lifecycle:staging` | Lifecycle only | staging |

> **Note on `test:smoke:*` naming:** the individual `test:smoke:<name>` scripts do **not** pass `--env SCENARIO=smoke`. They run each test file in isolation using that file's default scenario (typically smoke), making them useful for quickly targeting a single test. The `smoke:` prefix in the name reflects their intended use — fast, targeted runs — rather than explicitly enforcing the smoke scenario profile. To run a specific file with an explicit scenario, use the raw k6 command directly:
> ```bash
> npm run build && k6 run --env ENV=dev --env SCENARIO=load dist/tests/api/todos-api/todos.test.js
> ```
>
> **Note on `test:load`, `test:stress`, `test:spike`:** these target the Todos CRUD endpoints. Load, stress, and spike testing a health-check endpoint or an end-to-end flow script is not meaningful — those are covered by the smoke run. When new microservices are added, extend these scripts to include their test files.

---

## Adding tests

### New MS > New API > New test(s)

**New MS** — testing a new microservice for the first time:

1. Create `src/tests/api/<ms-name>/`
2. Add test files (copy `todos-api/todos.test.ts` as a template; update imports from `../../lib/` to `../../../lib/`)
3. Register the new entry points in `scripts/build.mjs`
4. Add `test:smoke:<ms-name>` and `test:smoke:<ms-name>:staging` scripts in `package.json`
5. Add pipeline steps in `azure-pipelines.yml`

**New API** — a new endpoint on an existing microservice (start here if the MS already has a folder):

Add a `group()` block to the existing test file:

```ts
group('Search Todos', () => {
  const res = get('/todos?q=test', { tags: { name: 'searchTodos' } });
  checkResponse(res, 'GET /todos?q=test', { 'status is 200': commonChecks.isOk });
});
```

Add a tagged threshold if you need per-endpoint SLA tracking:

```ts
...taggedThreshold('searchTodos', 200),
```

**New test(s)** — additional coverage for an existing endpoint, or a new test file for an existing service (start here if the endpoint is already covered):

Create the file under `src/tests/api/<ms-name>/`, add it to `scripts/build.mjs`, and add matching npm scripts and a pipeline step.

### Key rules

- **`options` must be a named export** — k6 reads it before starting VUs.
- **`new Rate(...)` and other custom metrics must be at module scope** — not inside `default`.
- **Use `sleep()`** between requests to simulate think-time.
- **Use `__VU` and `__ITER`** to generate unique test data: `todo-${__VU}-${__ITER}`.
- **DELETE endpoints that require a body** — use `delWithBody(path, body, opts)` from `lib/http.ts`. The plain `del()` wrapper always sends a null body; `delWithBody()` serialises the body to JSON exactly like `post`/`put`/`patch`.

---

## Environment configuration

| `ENV` | Default base URL |
|---|---|
| `dev` | `http://localhost:5058` |
| `staging` | `https://staging-api.example.com` |

Override without editing code:

```bash
k6 run --env ENV=dev --env DEV_BASE_URL=http://other-host:5058 dist/tests/api/todos-api/health.test.js
```

---

## Thresholds

Thresholds are quality gates. A breached threshold causes k6 to exit with code 99, failing the pipeline step.

| Threshold | Meaning |
|---|---|
| `http_req_duration: ['p(95)<500']` | 95% of requests must finish within 500ms |
| `http_req_failed: ['rate<0.01']` | Fewer than 1% of requests may fail |
| `check_failure_rate: ['rate<0.05']` | Fewer than 5% of assertions may fail |
| `http_req_duration{name:getTodos}: ['p(95)<200']` | p95 for requests tagged `name=getTodos` must be under 200ms |

Three preset sets are in `lib/thresholds.ts`: `strictThresholds`, `baseThresholds`, `relaxedThresholds`.

> **Note on negative test cases in performance tests:** k6 counts non-2xx responses as `http_req_failed` by default. To include expected-error assertions without inflating the failure rate, pass `responseCallback: (r) => r.status === <expected>` in the request options — this tells k6 to treat that status as a success for metric purposes. The `responseCallback` option is supported on all `lib/http` helpers (`get`, `post`, `del`, `delWithBody`, etc.).

---

## Azure DevOps

In your deployment pipeline, add these steps after the step that deploys to staging. Set `STAGING_BASE_URL` as a secret pipeline variable pointing to your staging API URL.

k6 must be installed on the agent — add the install step once per job, before any k6 steps:

```yaml
- script: |
    wget -q https://github.com/grafana/k6/releases/download/v0.54.0/k6-v0.54.0-linux-amd64.tar.gz
    tar -xzf k6-v0.54.0-linux-amd64.tar.gz
    sudo mv k6-v0.54.0-linux-amd64/k6 /usr/local/bin/k6
    npm ci && npm run build
  displayName: Install k6 and build
  workingDirectory: k6Framework
```

Then add one step per test file. Each step runs against staging via `STAGING_BASE_URL`:

```yaml
- script: k6 run --env ENV=staging dist/tests/api/todos-api/health.test.js
  displayName: k6 smoke — todos-api health
  workingDirectory: k6Framework
  env:
    STAGING_BASE_URL: $(STAGING_BASE_URL)

- script: k6 run --env ENV=staging dist/tests/api/todos-api/todos.test.js
  displayName: k6 smoke — todos-api CRUD
  workingDirectory: k6Framework
  env:
    STAGING_BASE_URL: $(STAGING_BASE_URL)
```

Add a step for each file under `src/tests/api/<ms-name>/` when adding a new service. To run a heavier scenario, add `--env SCENARIO=load` (or `stress`, `spike`).

---

## Interpreting results

```
✓ status is 200
✓ response is JSON

http_req_duration..............: avg=48ms  p(95)=82ms  p(99)=120ms
http_req_failed................: 0.00%
http_reqs......................: 240  4.0/s
```

| Metric | What it means |
|---|---|
| `http_req_duration p(95)` | 95% of requests finished within this time — primary SLA metric |
| `http_req_failed` | Proportion of non-2xx/3xx responses |
| `http_reqs` | Total requests and throughput |
| `check_failure_rate` | Proportion of failed assertions |
