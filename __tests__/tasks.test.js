// @ts-check

import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import getApp from '../server/index.js';
import {
  getTestData, prepareData, signIn, getTableData,
} from './helpers/index.js';

describe('test statuses CRUD', () => {
  let app;
  let knex;
  const testData = getTestData();

  beforeAll(async () => {
    app = await getApp();
    // @ts-ignore
    knex = app.objection.knex;
  });

  beforeEach(async () => {
    await knex.migrate.latest();
    await prepareData(app);
  });

  it('tasks list', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('tasks'),
    });

    expect(response.statusCode).toBe(302);
  });

  it('create task', async () => {
    await signIn(app);
    const params = testData.tasks.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('tasks'),
      payload: {
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);

    const response2 = await app.inject({
      method: 'POST',
      url: app.reverse('tasks'),
      payload: {
        data: { name: '' },
      },
    });
    expect(response2.statusCode).toBe(302);
  });

  it('edit task', async () => {
    await signIn(app);
    const ids = await getTableData(app, 'tasks');
    const { id } = ids[0];
    const statusIds = await getTableData(app, 'tasks', 'statusId');
    const { statusId } = statusIds[0];
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editTask', { id }),
    });

    expect(response.statusCode).toBe(302);

    const response2 = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateTask', { id }),
      payload: {
        data: { name: 'do something useful', statusId },
      },
    });
    expect(response2.statusCode).toBe(302);
  });

  it('delete task', async () => {
    await signIn(app);
    const ids = await getTableData(app, 'tasks');
    const { id } = ids[1];
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteTask', { id }),
    });

    expect(response.statusCode).toBe(302);
  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
