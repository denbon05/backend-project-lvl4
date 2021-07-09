import { omit } from 'lodash';
import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import getApp from '../server/index.js';
import encrypt from '../server/lib/secure.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('users CRUD', () => {
  let app;
  let knex;
  let models;
  let cookie;
  const testData = getTestData();

  const existedUser = testData.users.existing;

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

  it('GET /users', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('users'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('GET /users/new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newUser'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('POST /users', async () => {
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
      ...omit(newUserData, 'password'),
      passwordDigest: encrypt(newUserData.password),
    };
    const user = await models.user.query().findOne({ email: newUserData.email });
    expect(user).toMatchObject(expected);
  });

  it('GET /users/:id/edit', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editUser', { id: existedUser.id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('PATCH /user/:id (own account)', async () => {
    const newData = {
      firstName: 'Napoleon',
      lastName: 'Bonaparte',
      email: 'war@di.com',
      password: 'password',
    };

    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateUserData', { id: existedUser.id }),
      cookies: cookie,
      payload: {
        data: newData,
      },
    });
    expect(response.statusCode).toBe(302);

    const userData = await models.user.query().findById(existedUser.id);
    const expected = {
      ...omit(newData, 'password'),
      passwordDigest: encrypt(newData.password),
    };
    expect(userData).toMatchObject(expected);
  });

  it('DELETE /user/:id (own account)', async () => {
    const existingUserBob =testData.users.existing3;
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteUser', { id: existingUserBob.id }),
      cookies: await signIn(app, testData.users.existing3), // bob marley user
    });
    expect(response.statusCode).toBe(302);

    const user = await models.user.query().findById(existingUserBob.id);
    expect(user).toBeUndefined();
  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
