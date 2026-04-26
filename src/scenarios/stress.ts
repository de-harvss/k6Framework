// Stress scenario — push beyond normal capacity to find the breaking point.
// Ramp 0 → 100 → 200 → 300 VUs, then a long ramp-down to observe recovery (~19 minutes total).
// Thresholds are relaxed — some degradation under extreme load is expected.

import { Options } from 'k6/options';
import { relaxedThresholds } from '../lib/thresholds';

export const stressOptions: Options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '3m', target: 200 },
    { duration: '2m', target: 300 },
    { duration: '2m', target: 300 },
    { duration: '5m', target: 0 },
  ],
  thresholds: relaxedThresholds,
};
