// Spike scenario — sudden burst to 500 VUs, then recovery.
// Tests how the system reacts to a flash traffic event and whether it recovers cleanly.
// Thresholds are very lenient — the interesting metric is recovery after the burst.

import { Options } from 'k6/options';

export const spikeOptions: Options = {
  stages: [
    { duration: '1m',  target: 10  },
    { duration: '10s', target: 500 },
    { duration: '3m',  target: 500 },
    { duration: '10s', target: 10  },
    { duration: '3m',  target: 10  },
    { duration: '10s', target: 0   },
  ],
  thresholds: {
    http_req_failed:   ['rate<0.30'],
    http_req_duration: ['p(99)<10000'],
  },
};
