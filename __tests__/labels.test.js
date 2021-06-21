import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import getApp from '../server/index.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('labels CRUD', () => {
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

  it('GET /labels', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('labels'),
    });
    expect(response.statusCode).toBe(302);

    const response2 = await app.inject({
      method: 'GET',
      url: app.reverse('labels'),
      cookies: cookie,
    });
    expect(response2.statusCode).toBe(200);
  });

  it('GET create label', async () => {
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
  });

  it('POST new label', async () => {
    const newLabel = testData.labels.new;

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
  });

  it('GET edit label', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editLabel', { id: testData.labels.existing.id }),
      cookies: cookie,
    });
    expect(response.statusCode).toBe(200);
  });

  it('update label', async () => {
    const updatedData = { name: 'wontfix' };
    const response2 = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateLabel', { id: testData.labels.existing.id }),
      cookies: cookie,
      payload: {
        data: updatedData,
      },
    });
    expect(response2.statusCode).toBe(302);

    const label = await models.label.query().findById(testData.labels.existing.id);
    expect(label).toMatchObject({ ...testData.labels.existing, ...updatedData });
  });

  it('delete label', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteLabel', { id: testData.labels.existing.id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const label = await models.label.query().findById(testData.labels.existing.id);
    expect(label).toBeUndefined();
  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
