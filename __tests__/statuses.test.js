import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import getApp from '../server/index.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('statuses CRUD', () => {
  let app;
  let knex;
  let models;
  let cookie;
  const testData = getTestData();

  beforeAll(async () => {
    app = await getApp();
    knex = app.objection.knex;
    models = app.objection.models;
  });

  beforeEach(async () => {
    await knex.migrate.latest();
    await prepareData(app);
    cookie = await signIn(app, testData.users.existing);
  });

  it('GET /statuses', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('statuses'),
    });
    expect(response.statusCode).toBe(302);

    const response2 = await app.inject({
      method: 'GET',
      url: app.reverse('statuses'),
      cookies: cookie,
    });
    expect(response2.statusCode).toBe(200);
  });

  it('GET new status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newStatus'),
      cookies: cookie,
    });
    expect(response.statusCode).toBe(200);
  });

  it('POST new status', async () => {
    const updatedData = testData.statuses.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('statusCreate'),
      cookies: cookie,
      payload: {
        data: updatedData,
      },
    });
    expect(response.statusCode).toBe(302);

    const status = await models.taskStatus.query().findById(updatedData.id);
    expect(status).toMatchObject(updatedData);

    const response2 = await app.inject({
      method: 'POST',
      url: app.reverse('statuses'),
      cookies: cookie,
      payload: {
        data: { name: testData.statuses.existing.name },
      },
    });
    expect(response2.statusCode).toBe(422);
  });

  it('GET edit status', async () => {
    const { id } = testData.statuses.existing;
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editStatus', { id }),
      cookies: cookie,
    });
    expect(response.statusCode).toBe(200);
  });

  it('PATCH status', async () => {
    const { id } = testData.statuses.existing;
    const updatedData = { name: 'new status' };
    const response2 = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateStatus', { id }),
      cookies: cookie,
      payload: {
        data: updatedData,
      },
    });
    expect(response2.statusCode).toBe(302);

    const status = await models.taskStatus.query().findById(id);
    expect(status).toMatchObject(updatedData);
  });

  it('delete status', async () => {
    const { existing } = testData.statuses;

    const response2 = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteStatus', { id: existing.id }),
      cookies: cookie,
    });
    expect(response2.statusCode).toBe(302);

    const status2 = await models.taskStatus.query().findById(existing.id);
    expect(status2).toBeUndefined();
  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
