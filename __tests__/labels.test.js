// @ts-check

import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import getApp from '../server/index.js';
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
    cookie = await getCookie(app, testData.users.existing);
  });

  it('create label', async () => {
    const newLabel = testData.labels.new;

    const getNewLabelsResponse = await app.inject({
      method: 'GET',
      url: app.reverse('newLabel'),
      cookies: cookie,
      payload: {
        data: newLabel,
      },
    });

    expect(getNewLabelsResponse.statusCode).toBe(200);

    const response = await app.inject({
      method: 'POST',
      url: app.reverse('labels'),
      cookies: cookie,
      payload: {
        data: newLabel,
      },
    });

    expect(response.statusCode).toBe(302);

    const label = await models.label.query().findById(newLabel.id);
    expect(label).toMatchObject(newLabel);

    const response2 = await app.inject({
      method: 'POST',
      url: app.reverse('labels'),
      cookies: cookie,
      payload: {
        data: { name: '' },
      },
    });

    expect(response2.statusCode).toBe(422);
  });

  it('edit label', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editLabel', { id: testData.labels.existing1.id }),
      cookies: cookie,
    });
    expect(response.statusCode).toBe(200);
  });

  const newData = { name: 'wontfix' };

  it('update label', async () => {
    const response2 = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateLabel', { id: testData.labels.existing1.id }),
      cookies: cookie,
      payload: {
        data: newData,
      },
    });
    expect(response2.statusCode).toBe(302);

    const label = await models.label.query().findById(testData.labels.existing1.id);
    expect(label).toMatchObject({ ...testData.labels.existing1, ...newData });
  });

  it('delete label', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteLabel', { id: testData.labels.existing1.id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const label = await models.label.query().findById(testData.labels.existing1.id);
    expect(label).toBeUndefined();
  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
