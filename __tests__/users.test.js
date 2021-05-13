// @ts-check

import _ from 'lodash';
import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import getApp from '../server/index.js';
import encrypt from '../server/lib/secure.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('test users CRUD', () => {
  let app;
  let knex;
  let models;
  const testData = getTestData();

  const exitedUser = testData.users.existing;
  const exitedUser2 = testData.users.existing2;

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
  });

  it('new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newUser'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const params = testData.users.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('users'),
      payload: {
        data: params,
      },
    });
    expect(response.statusCode).toBe(302);

    const expected = {
      ..._.omit(params, 'password'),
      passwordDigest: encrypt(params.password),
    };
    const user = await models.user.query().findOne({ email: params.email });
    expect(user).toMatchObject(expected);
  });

  it('create with the same email', async () => {
    const { existing } = testData.users;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('users'),
      payload: {
        data: existing,
      },
    });
    expect(response.statusCode).toBe(403);
  });

  it('Permision denied edit user', async () => {
    await signIn(app);
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editUser', { id: exitedUser2.id }),
    });
    expect(response.statusCode).toBe(302);
  });

  it('Permision denied delete user', async () => {
    await signIn(app);
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteUser', { id: exitedUser2.id }),
    });
    expect(response.statusCode).toBe(302);
  });

  it('edit own data', async () => {
    await signIn(app);
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editUser', { id: exitedUser.id }),
    });
    expect(response.statusCode).toBe(302);
  });

  it('delete own account', async () => {
    await signIn(app);
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteUser', { id: exitedUser.id }),
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
