import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = __ENV.BASE_URL;
const token = __ENV.WORKER_ACCESS_TOKEN;
if (!baseUrl) {
  throw new Error('BASE_URL env is required');
}
if (!token) {
  throw new Error('WORKER_ACCESS_TOKEN env is required');
}

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function jobsFeed() {
  const res = http.get(`${baseUrl}/api/v1/jobs/feed?limit=20`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  check(res, {
    'feed 200': (r) => r.status === 200,
    'envelope success': (r) => {
      try {
        const body = r.json();
        return body && body.success === true;
      } catch {
        return false;
      }
    },
  });
  sleep(0.5);
}
