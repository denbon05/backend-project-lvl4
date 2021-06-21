import {
  describe, beforeAll, it, expect, afterAll,
} from '@jest/globals';
import getApp from '../server/index.js';
import { prepareData, signIn, getTestData } from './helpers/index.js';

describe('test session', () => {
  let app;
  let knex;
  let testData;

  beforeAll(async () => {
    app = await getApp();
    knex = app.objection.knex;
    await knex.migrate.latest();
    await prepareData(app);
    testData = getTestData();
  });

  it('GET /session/new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newSession'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('POST /session', async () => {
    const responseSignIn = await app.inject({
      method: 'POST',
      url: app.reverse('session'),
      payload: {
        data: getTestData().users.existing,
      },
    });
    expect(responseSignIn.statusCode).toBe(302);
  });

  it('DELETE /session', async () => {
    const cookie = await signIn(app, testData.users.existing);

    const responseSignOut = await app.inject({
      method: 'DELETE',
      url: app.reverse('session'),
      cookies: cookie,
    });

    expect(responseSignOut.statusCode).toBe(302);
  });

  afterAll(async () => {
    await knex.migrate.rollback();
    app.close();
  });
});
