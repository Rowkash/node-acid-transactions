import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
  stages: [
    { duration: '10s', target: 50 },
    { duration: '30s', target: 200 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // less than 1% errors
    http_req_duration: ['p(95)<200'], // 95% requests should complete less than 200ms
  },
};

export function setup() {
  const res = http.get('http://localhost:4000/users');
  if (res.status !== 200) {
    throw new Error(`Failed to fetch users: ${res.body}`);
  }

  const body = JSON.parse(res.body);
  const userIds = body.result;

  if (!userIds || userIds.length < 2) {
    throw new Error('Not enough users in the database to run the test!');
  }

  console.log(`Loaded ${userIds.length} users for the load test.`);
  return { userIds };
}

export default function (data) {
  const { userIds } = data;

  const fromUserId = randomItem(userIds);
  let toUserId = randomItem(userIds);
  while (toUserId === fromUserId) {
    toUserId = randomItem(userIds);
  }

  const payload = JSON.stringify({
    idempotencyKey: crypto.randomUUID(),
    fromUserId: fromUserId,
    toUserId: toUserId,
    amount: '1.32',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const url = 'http://localhost:4000/transactions';
  const res = http.post(url, payload, params);

  check(res, {
    'status is 200/201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(0.01);
}
