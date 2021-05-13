// @ts-check

import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import getApp from '../server/index.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('labels statuses CRUD', () => {
  let app;
  let knex;
  const testData = getTestData();

  const { existing1: existedLabel } = testData.labels;

  beforeAll(async () => {
    app = await getApp();
    // @ts-ignore
    knex = app.objection.knex;
  });

  beforeEach(async () => {
    await knex.migrate.latest();
    await prepareData(app);
    await signIn(app);
  });

  it('create label', async () => {
    const params = testData.labels.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('labels'),
      payload: {
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);

    const response2 = await app.inject({
      method: 'POST',
      url: app.reverse('labels'),
      payload: {
        data: { name: '' },
      },
    });

    expect(response2.statusCode).toBe(302);
  });

  it('edit label', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editLabel', { id: existedLabel.id }),
    });
    expect(response.statusCode).toBe(302);

    const response2 = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateLabel', { id: existedLabel.id }),
      payload: {
        data: { name: 'wontfix' },
      },
    });
    expect(response2.statusCode).toBe(302);
  });

  it('delete label', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteLabel', { id: existedLabel.id }),
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
