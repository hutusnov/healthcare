import http from 'k6/http';
import { check, sleep } from 'k6';

const targetUrl = __ENV.TARGET_URL || 'http://localhost:4000/api/health';
const vus = Number(__ENV.VUS || 10);
const duration = __ENV.DURATION || '1m';
const maxP95Ms = Number(__ENV.MAX_P95_MS || 1000);
const minSuccessRate = Number(__ENV.MIN_SUCCESS_RATE || 0.99);

export const options = {
  vus,
  duration,
  thresholds: {
    http_req_failed: [`rate<${1 - minSuccessRate}`],
    http_req_duration: [`p(95)<${maxP95Ms}`],
  },
};

export default function () {
  const response = http.get(targetUrl, {
    tags: {
      service: 'backend',
      endpoint: 'health',
    },
  });

  check(response, {
    'status is 200': (res) => res.status === 200,
    'response contains health payload': (res) =>
      String(res.body || '').includes('Server is running'),
  });

  sleep(1);
}
