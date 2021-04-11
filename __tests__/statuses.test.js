// @ts-check

import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import getApp from '../server/index.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

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

  it('statuses list', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('statuses'),
    });

    expect(response.statusCode).toBe(302);
  });

  it('create status', async () => {
    await signIn(app);
    const params = testData.statuses.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('statuses'),
      payload: {
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);

    const response2 = await app.inject({
      method: 'POST',
      url: app.reverse('statuses'),
      payload: {
        data: { name: '' },
      },
    });

    expect(response2.statusCode).toBe(302); // ! 422 - have to be
  });

  it('edit status', async () => {
    await signIn(app);
    const id = 1;
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editStatus', { id }),
    });

    expect(response.statusCode).toBe(302);

    const response2 = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateStatus', { id }),
      payload: {
        data: { name: 'new status' },
      },
    });
    expect(response2.statusCode).toBe(302);
  });

  it('delete status', async () => {
    await signIn(app);
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteStatus', { id: 1 }),
    });

    expect(response.statusCode).toBe(302);
  });

  afterEach(async () => {
    await knex.migrate.rollback(); // * после каждого теста откатываем миграции
  });

  afterAll(() => {
    app.close();
  });
});
