import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = __ENV.BASE_URL;
if (!baseUrl) {
  throw new Error('BASE_URL env is required');
}

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function healthSmoke() {
  const live = http.get(`${baseUrl}/api/v1/health/live`);
  check(live, { 'live 200': (r) => r.status === 200 });
  const ready = http.get(`${baseUrl}/api/v1/health/ready`);
  check(ready, { 'ready 200': (r) => r.status === 200 });
  sleep(1);
}
