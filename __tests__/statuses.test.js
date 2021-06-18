// @ts-check

import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import getApp from '../server/index.js';
import { getTestData, prepareData, getCookie } from './helpers/index.js';

describe('test statuses CRUD', () => {
  let app;
  let knex;
  let models;
  let cookie;
  const testData = getTestData();

  beforeAll(async () => {
    app = await getApp();
    // @ts-ignore
    knex = app.objection.knex;
    // @ts-ignore
    models = app.objection.models;
  });

  beforeEach(async () => {
    await knex.migrate.latest();
    await prepareData(app);
    cookie = await getCookie(app, testData.users.existing);
  });

  it('create status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newStatus'),
      cookies: cookie,
    });
    expect(response.statusCode).toBe(200);

    const newStatusData = testData.statuses.new;
    const response2 = await app.inject({
      method: 'POST',
      url: app.reverse('statusCreate'),
      cookies: cookie,
      payload: {
        data: newStatusData,
      },
    });
    expect(response2.statusCode).toBe(302);

    const status = await models.taskStatus.query().findById(newStatusData.id);
    expect(status).toMatchObject(newStatusData);
    /* eslint-disable */
    for (const data of [{ name: '' }, { name: testData.statuses.existing.name }]) {
      const response3 = await app.inject({
        method: 'POST',
        url: app.reverse('statuses'),
        cookies: cookie,
        payload: {
          data, // empty field and the same name
        },
      });
      expect(response3.statusCode).toBe(422);
    }
    /* eslint-enable */
  });

  it('edit status', async () => {
    const { id } = testData.statuses.existing;
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editStatus', { id }),
      cookies: cookie,
    });
    expect(response.statusCode).toBe(200);

    const newStatusData = { name: 'new status' };

    const response2 = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateStatus', { id }),
      cookies: cookie,
      payload: {
        data: newStatusData,
      },
    });
    expect(response2.statusCode).toBe(302);

    const status = await models.taskStatus.query().findById(id);
    expect(status).toMatchObject(newStatusData);
  });

  it('delete status', async () => {
    const { existing: independentStatus } = testData.statuses;

    const response2 = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteStatus', { id: independentStatus.id }),
      cookies: cookie,
    });
    expect(response2.statusCode).toBe(302);

    const status2 = await models.taskStatus.query().findById(independentStatus.id);
    expect(status2).toBeUndefined();
  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
