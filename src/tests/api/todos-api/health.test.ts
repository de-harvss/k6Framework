// GET /health smoke test.
// Always run this first — fastest check that the API is up before a longer run.

import { Options } from 'k6/options';
import { sleep } from 'k6';
import { get } from '../../../lib/http';
import { checkResponse, commonChecks } from '../../../lib/checks';
import { smokeOptions } from '../../../scenarios/smoke';

export const options: Options = smokeOptions;

export default function (): void {
  const res = get('/health', { tags: { name: 'healthCheck' } });

  checkResponse(res, 'GET /health', {
    'status is 200': commonChecks.isOk,
    'body is JSON':  commonChecks.isJson,
    'has status field': commonChecks.hasField('status'),
  });

  sleep(1);
}
