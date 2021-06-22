import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import getApp from '../server/index.js';
import { prepareData } from './helpers/index.js';

describe('main paths', () => {
  let app;
  let knex;

  beforeAll(async () => {
    app = await getApp();
    knex = app.objection.knex;
  });

  beforeEach(async () => {
    await knex.migrate.latest();
    await prepareData(app);
  });

  it('GET /', async () => {
    const res = await app.inject({
      method: 'GET',
      url: app.reverse('root'),
    });
    expect(res.statusCode).toBe(200);
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
