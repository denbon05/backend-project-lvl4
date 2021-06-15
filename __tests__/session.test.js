// @ts-check

import {
  describe, beforeAll, it, expect, afterAll,
} from '@jest/globals';
import getApp from '../server/index.js';
import { prepareData, signIn } from './helpers/index.js';

describe('test session', () => {
  let app;
  let knex;
  // let testData;

  beforeAll(async () => {
    app = await getApp();
    // @ts-ignore
    knex = app.objection.knex;
    await knex.migrate.latest();
    await prepareData(app);
    // testData = getTestData();
  });

  it('test sign in / sign out', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newSession'),
    });

    expect(response.statusCode).toBe(200);

    const responseSignIn = await signIn(app);

    expect(responseSignIn.statusCode).toBe(302);
    // after successful authentication, we get cookies from the response,
    // they will be needed to execute requests for routes that require
    // pre-authentication
    const [sessionCookie] = responseSignIn.cookies;
    const { name, value } = sessionCookie;
    const cookie = { [name]: value };

    const responseSignOut = await app.inject({
      method: 'DELETE',
      url: app.reverse('session'),
      // we use previously received cookies
      cookies: cookie,
    });

    expect(responseSignOut.statusCode).toBe(302);
  });

  afterAll(async () => {
    await knex.migrate.rollback();
    app.close();
  });
});
