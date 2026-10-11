# PartOn load tests (CASE-PERF)

k6 scripts against **staging** API. Do not run against production without ops approval.

## Prerequisites

- [k6](https://k6.io/docs/get-started/installation/) installed locally
- Staging `BASE_URL` (e.g. `https://staging-api.parton.com.tr`)
- Valid worker JWT for feed scenarios (obtain via OTP sandbox)

## Scripts

| Script | Cases | Purpose |
| --- | --- | --- |
| `k6-health-smoke.js` | operability | `GET /api/v1/health/live` + `ready` |
| `k6-jobs-feed.js` | T-226–T-228 (skeleton) | Authenticated `GET /api/v1/jobs/feed` ramp |

## Run

```bash
export BASE_URL=https://staging.example.com
export WORKER_ACCESS_TOKEN=eyJ...
k6 run deploy/load-tests/k6-health-smoke.js
k6 run deploy/load-tests/k6-jobs-feed.js
```

Metrics surface on admin `w.admin.perf.metrics` and `w.admin.devops.*` during staged runs.
