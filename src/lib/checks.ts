// Assertion helpers built on top of k6's check() API.
// Adds failure logging and a custom check_failure_rate metric.
//
// checkFailureRate must be declared at module scope — k6 metrics must be
// initialised during the init phase, not inside the default function.
//
// Usage:
//   checkResponse(res, 'GET /todos', {
//     'status is 200': commonChecks.isOk,
//     'has body':      commonChecks.hasBody,
//   });

import { check } from 'k6';
import { Rate } from 'k6/metrics';
import { RefinedResponse, ResponseType } from 'k6/http';

// Tracks the proportion of failed check() calls across the entire run.
// Add a threshold to enforce a quality gate: check_failure_rate: ['rate<0.01']
export const checkFailureRate = new Rate('check_failure_rate');

export function checkResponse(
  res: RefinedResponse<ResponseType | undefined>,
  label: string,
  assertions: Record<string, (r: RefinedResponse<ResponseType | undefined>) => boolean>
): boolean {
  const allPassed = check(res, assertions);

  checkFailureRate.add(!allPassed);

  if (!allPassed) {
    console.error(`[FAIL] ${label} — HTTP ${res.status} — body: ${String(res.body).slice(0, 200)}`);
  }

  return allPassed;
}

export const commonChecks = {
  isOk:        (r: RefinedResponse<ResponseType | undefined>) => r.status === 200,
  isCreated:   (r: RefinedResponse<ResponseType | undefined>) => r.status === 201,
  isNoContent: (r: RefinedResponse<ResponseType | undefined>) => r.status === 204,
  isNotFound:  (r: RefinedResponse<ResponseType | undefined>) => r.status === 404,
  hasBody:     (r: RefinedResponse<ResponseType | undefined>) => String(r.body).length > 0,
  isJson: (r: RefinedResponse<ResponseType | undefined>) => {
    try { JSON.parse(r.body as string); return true; } catch { return false; }
  },
  hasField: (field: string) => (r: RefinedResponse<ResponseType | undefined>) => {
    try {
      const body = JSON.parse(r.body as string) as Record<string, unknown>;
      return field in body;
    } catch { return false; }
  },
};
