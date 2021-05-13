// @ts-check

import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import getApp from '../server/index.js';
import { signIn, prepareData } from './helpers/index.js';

describe('requests', () => {
  let app;
  let knex;

  beforeAll(async () => {
    app = await getApp();
    // @ts-ignore
    knex = app.objection.knex;
  });

  beforeEach(async () => {
    await knex.migrate.latest();
    await prepareData(app);
    await signIn(app); // * sign in as 1 existing user
  });

  it('GET /', async () => {
    const res = await app.inject({
      method: 'GET',
      url: app.reverse('root'),
    });
    expect(res.statusCode).toBe(200);
  });

  it('GET /users', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('users'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('GET /statuses', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('statuses'),
    });

    expect(response.statusCode).toBe(302);
  });

  it('GET /tasks', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('tasks'),
    });

    expect(response.statusCode).toBe(302);
  });

  it('GET /labels', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('labels'),
    });

    expect(response.statusCode).toBe(302);
  });

  it('GET 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/wrong-path',
    });
    expect(res.statusCode).toBe(404);
  });

  afterEach(async () => {
    await knex.migrate.rollback(); // * rollback migrations
  });

  afterAll(() => {
    app.close();
  });
});
