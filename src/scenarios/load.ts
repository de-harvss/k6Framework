// Load scenario — normal expected traffic.
// 2m ramp to 50 VUs → 5m hold → 2m ramp-down (~9 minutes total).

import { Options } from 'k6/options';
import { baseThresholds } from '../lib/thresholds';

export const loadOptions: Options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 0 },
  ],
  thresholds: baseThresholds,
};
