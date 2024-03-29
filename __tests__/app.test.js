import {
  describe, beforeAll, it, expect, afterAll,
} from '@jest/globals';
import getApp from '../server/index.js';

describe('main paths', () => {
  let app;

  beforeAll(async () => {
    app = await getApp();
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

  afterAll(() => {
    app.close();
  });
});
