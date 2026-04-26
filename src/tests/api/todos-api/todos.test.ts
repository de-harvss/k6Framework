// Todo API tests — full CRUD cycle.
// __VU and __ITER are combined to generate unique titles so concurrent VUs don't collide. 

import { Options } from 'k6/options';
import { group, sleep } from 'k6';
import { get, post, put, del } from '../../../lib/http';
import { checkResponse, commonChecks } from '../../../lib/checks';
import { smokeOptions } from '../../../scenarios/smoke';
import { loadOptions } from '../../../scenarios/load';
import { stressOptions } from '../../../scenarios/stress';
import { spikeOptions } from '../../../scenarios/spike';
import { baseThresholds, taggedThreshold } from '../../../lib/thresholds';

const SCENARIO = __ENV.SCENARIO || 'smoke';

const scenarioOptions: Record<string, Options> = {
  smoke:  smokeOptions,
  load:   loadOptions,
  stress: stressOptions,
  spike:  spikeOptions,
};

export const options: Options = {
  ...(scenarioOptions[SCENARIO] ?? smokeOptions),
  thresholds: {
    ...baseThresholds,
    ...taggedThreshold('getTodos',   200),
    ...taggedThreshold('createTodo', 300),
    ...taggedThreshold('getTodo',    150),
    ...taggedThreshold('updateTodo', 300),
    ...taggedThreshold('deleteTodo', 200),
  },
};

export default function (): void {
  let createdId: number | null = null;

  group('Get All Todos', () => {
    const res = get('/todos', { tags: { name: 'getTodos' } });

    checkResponse(res, 'GET /todos', {
      'status is 200':    commonChecks.isOk,
      'response is JSON': commonChecks.isJson,
    });
  });

  sleep(0.5);

  group('Create Todo', () => {
    const res = post('/todos', { title: `Load test todo ${__VU}-${__ITER}` }, {
      tags: { name: 'createTodo' },
    });

    checkResponse(res, 'POST /todos', {
      'status is 201': commonChecks.isCreated,
      'has id field':  commonChecks.hasField('id'),
    });

    if (res.status === 201) {
      createdId = (JSON.parse(res.body as string) as { id: number }).id;
    }
  });

  sleep(0.5);

  group('Get Todo by ID', () => {
    if (createdId === null) return;

    const res = get(`/todos/${createdId}`, { tags: { name: 'getTodo' } });

    checkResponse(res, `GET /todos/${createdId}`, {
      'status is 200': commonChecks.isOk,
    });
  });

  sleep(0.5);

  group('Update Todo', () => {
    if (createdId === null) return;

    const res = put(`/todos/${createdId}`, {
      title: `Updated ${__VU}-${__ITER}`,
      completed: true,
    }, { tags: { name: 'updateTodo' } });

    checkResponse(res, `PUT /todos/${createdId}`, {
      'status is 200':     commonChecks.isOk,
      'completed is true': (r) => {
        const body = JSON.parse(r.body as string) as { completed: boolean };
        return body.completed === true;
      },
    });
  });

  sleep(0.5);

  group('Delete Todo', () => {
    if (createdId === null) return;

    const res = del(`/todos/${createdId}`, { tags: { name: 'deleteTodo' } });

    checkResponse(res, `DELETE /todos/${createdId}`, {
      'status is 204': commonChecks.isNoContent,
    });
  });

  sleep(1);
}
