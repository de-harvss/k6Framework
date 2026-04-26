// Todo lifecycle flow — models a realistic user session with think-time between steps.
// Creates a todo, marks it complete, then deletes it.

import { Options } from 'k6/options';
import { group, sleep } from 'k6';
import { get, post, put, del } from '../../lib/http';
import { checkResponse, commonChecks } from '../../lib/checks';
import { smokeOptions } from '../../scenarios/smoke';
import { baseThresholds } from '../../lib/thresholds';

export const options: Options = {
  ...smokeOptions,
  thresholds: baseThresholds,
};

export default function (): void {
  let todoId: number | null = null;

  group('Browse Todos', () => {
    const res = get('/todos', { tags: { name: 'browseTodos' } });
    checkResponse(res, 'GET /todos', { 'status is 200': commonChecks.isOk });
  });

  // Simulate time spent reading the list
  sleep(2);

  group('Create Todo', () => {
    const res = post('/todos', { title: `Flow test ${__VU}-${__ITER}` }, {
      tags: { name: 'createTodo' },
    });

    checkResponse(res, 'POST /todos', {
      'status is 201': commonChecks.isCreated,
      'has id field':  commonChecks.hasField('id'),
    });

    if (res.status === 201) {
      todoId = (JSON.parse(res.body as string) as { id: number }).id;
    }
  });

  sleep(1);

  group('Complete Todo', () => {
    if (todoId === null) return;

    const res = put(`/todos/${todoId}`, {
      title: `Flow test ${__VU}-${__ITER}`,
      completed: true,
    }, { tags: { name: 'completeTodo' } });

    checkResponse(res, `PUT /todos/${todoId}`, { 'status is 200': commonChecks.isOk });
  });

  // Simulate reviewing the completed item before deleting
  sleep(2);

  group('Delete Todo', () => {
    if (todoId === null) return;

    const res = del(`/todos/${todoId}`, { tags: { name: 'deleteTodo' } });
    checkResponse(res, `DELETE /todos/${todoId}`, { 'status is 204': commonChecks.isNoContent });
  });

  sleep(1);
}
