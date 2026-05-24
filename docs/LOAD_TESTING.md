# Load Testing

Load testing is manual-only so it does not add noise or cost to every CI run.

## Local k6

```bash
TARGET_URL=http://uit-healthcare-staging-alb-1465788081.ap-southeast-2.elb.amazonaws.com/api/health \
VUS=10 \
DURATION=1m \
MAX_P95_MS=1000 \
k6 run tests/load/backend-health.k6.js
```

## Docker

```bash
docker run --rm \
  -e TARGET_URL=http://uit-healthcare-staging-alb-1465788081.ap-southeast-2.elb.amazonaws.com/api/health \
  -e VUS=10 \
  -e DURATION=1m \
  -e MAX_P95_MS=1000 \
  -v "$PWD/tests/load:/scripts:ro" \
  grafana/k6:0.56.0 run /scripts/backend-health.k6.js
```

## GitHub Actions

Run `Load Test Staging` manually from the Actions tab. The workflow checks:

- HTTP failure rate below 1%.
- p95 latency below the configured threshold.
- Backend health payload is returned.

Keep this workflow manual until staging capacity and budget are explicitly
approved.
