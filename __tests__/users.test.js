// @ts-check

import _ from 'lodash';
import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import getApp from '../server/index.js';
import encrypt from '../server/lib/secure.js';
import { getTestData, prepareData, getCookie } from './helpers/index.js';

describe('test users CRUD', () => {
  let app;
  let knex;
  let models;
  let cookie;
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
    cookie = await getCookie(app, testData.users.existing);
  });

  it('new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newUser'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const newUserData = testData.users.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('users'),
      cookies: cookie,
      payload: {
        data: newUserData,
      },
    });
    expect(response.statusCode).toBe(302);

    const expected = {
      ..._.omit(newUserData, 'password'),
      passwordDigest: encrypt(newUserData.password),
    };
    const user = await models.user.query().findOne({ email: newUserData.email });
    expect(user).toMatchObject(expected);
  });

  it('create with the same email', async () => {
    const { existing } = testData.users;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('users'),
      cookies: cookie,
      payload: {
        data: existing,
      },
    });
    expect(response.statusCode).toBe(403);
  });

  it('Permision denied edit user', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editUser', { id: exitedUser2.id }),
      cookies: cookie,
    });
    expect(response.statusCode).toBe(302);
  });

  it('Permision denied delete user', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteUser', { id: exitedUser2.id }),
      cookies: cookie,
    });
    expect(response.statusCode).toBe(302);
  });

  it('edit own data', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editUser', { id: exitedUser.id }),
      cookies: cookie,
    });
    expect(response.statusCode).toBe(200);

    const newData = {
      firstName: 'Napoleon',
      lastName: 'Bonaparte',
      email: 'war@di.com',
      password: 'password',
    };

    const response2 = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateUserData', { id: exitedUser.id }),
      cookies: cookie,
      payload: {
        data: newData,
      },
    });
    expect(response2.statusCode).toBe(302);

    const userData = await models.user.query().findById(exitedUser.id);
    const expected = {
      ..._.omit(newData, 'password'),
      passwordDigest: encrypt(newData.password),
    };
    expect(userData).toMatchObject(expected);
  });

  it('delete own account', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteUser', { id: exitedUser.id }),
      cookies: cookie,
    });
    expect(response.statusCode).toBe(302);

    const user = await models.user.query().findById(exitedUser.id);
    expect(user).toBeUndefined();
  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
