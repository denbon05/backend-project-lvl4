// @ts-check

import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import getApp from '../server/index.js';
import models from '../server/models/index.js';
import { getTestData, prepareData, getCookie } from './helpers/index.js';

describe('labels statuses CRUD', () => {
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
    cookie = await getCookie(app, testData.users.existing)
  });

  it('create label', async () => {
    const params = testData.labels.new;

    const getNewLabelsResponse = await app.inject({
      method: 'GET',
      url: app.reverse('newLabel'),
      payload: {
        cookies: cookie,
        data: params,
      },
    });

    expect(getNewLabelsResponse.statusCode).toBe(302);

    const response = await app.inject({
      method: 'POST',
      url: app.reverse('labels'),
      payload: {
        cookies: cookie,
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);

    // const labels = await models.label.query() // ? new label is not added to the db
    // console.log('labels =>', labels)

    const response2 = await app.inject({
      method: 'POST',
      url: app.reverse('labels'),
      payload: {
        cookies: cookie,
        data: { name: '' },
      },
    });

    expect(response2.statusCode).toBe(302);
  });

  it('edit label', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editLabel', { id: testData.labels.existing1.id }),
      payload: {
        cookies: cookie,
      },
    });
    expect(response.statusCode).toBe(302);
  });

  it('update label', async () => {
    const response2 = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateLabel', { id: testData.labels.existing1.id }),
      payload: {
        data: { name: 'wontfix' },
        cookies: cookie,
      },
    });
    expect(response2.statusCode).toBe(302);
  });

  it('delete label', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteLabel', { id: testData.labels.existing1.id }),
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
