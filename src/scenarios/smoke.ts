// Smoke scenario — 1 VU, 30s.
// Run on every deployment as a quick sanity check before committing to a longer run.

import { Options } from 'k6/options';
import { strictThresholds } from '../lib/thresholds';

export const smokeOptions: Options = {
  vus: 1,
  duration: '30s',
  thresholds: strictThresholds,
};
