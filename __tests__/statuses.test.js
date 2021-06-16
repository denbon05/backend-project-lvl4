// @ts-check

import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import getApp from '../server/index.js';
import { getTestData, prepareData, getCookie } from './helpers/index.js';

describe('test statuses CRUD', () => {
  let app;
  let knex;
  let cookie;
  const testData = getTestData();

  beforeAll(async () => {
    app = await getApp();
    // @ts-ignore
    knex = app.objection.knex;
  });

  beforeEach(async () => {
    await knex.migrate.latest();
    await prepareData(app);
    cookie = await getCookie(app, testData.users.existing)
  });

  it('create status', async () => {
    const params = testData.statuses.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('statuses'),
      payload: {
        cookies: cookie,
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);

    const response2 = await app.inject({
      method: 'POST',
      url: app.reverse('statuses'),
      payload: {
        cookies: cookie,
        data: { name: '' },
      },
    });

    expect(response2.statusCode).toBe(302);
  });

  it('edit status', async () => {
    const { id } = testData.statuses.existing;
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editStatus', { id }),
      payload: {
        cookies: cookie,
        data: { name: '' },
      },
    });

    expect(response.statusCode).toBe(302);

    const response2 = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateStatus', { id }),
      payload: {
        cookies: cookie,
        data: { name: 'new status' },
      },
    });
    expect(response2.statusCode).toBe(302);
  });

  it('delete status', async () => {
    const { id } = testData.statuses.existing;
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteStatus', { id }),
      payload: {
        cookies: cookie,
      },
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
