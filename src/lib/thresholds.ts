// Shared SLA threshold definitions.
// Spread into a test file's options.thresholds:
//
//   thresholds: {
//     ...baseThresholds,
//     ...taggedThreshold('getTodos', 200),
//   }
//
// A breached threshold causes k6 to exit with code 99, failing the pipeline step.

import { Options } from 'k6/options';

export const baseThresholds: Options['thresholds'] = {
  http_req_duration:  ['p(95)<500', 'p(99)<1500'],
  http_req_failed:    ['rate<0.01'],
  check_failure_rate: ['rate<0.05'],
};

// Tighter thresholds for smoke tests.
export const strictThresholds: Options['thresholds'] = {
  ...baseThresholds,
  http_req_duration: ['p(95)<300', 'p(99)<800'],
  http_req_failed:   ['rate<0.005'],
};

// Relaxed thresholds for stress and spike scenarios where degradation is expected.
export const relaxedThresholds: Options['thresholds'] = {
  http_req_duration:  ['p(95)<2000', 'p(99)<5000'],
  http_req_failed:    ['rate<0.10'],
  check_failure_rate: ['rate<0.15'],
};

// Creates a per-endpoint threshold using the request's name tag.
// Tag requests with { tags: { name: 'getTodos' } }, then add the threshold:
//   ...taggedThreshold('getTodos', 200)  →  p95 must be under 200ms
export function taggedThreshold(tagName: string, p95ms: number): Options['thresholds'] {
  return {
    [`http_req_duration{name:${tagName}}`]: [`p(95)<${p95ms}`],
  };
}
