// @ts-check

import _ from 'lodash';
import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import getApp from '../server/index.js';
import encrypt from '../server/lib/secure.js';
import { getTestData, prepareData, getUserIdByEmail } from './helpers/index.js';

describe('test users CRUD', () => {
  let app;
  let knex;
  let models;
  const testData = getTestData();

  beforeAll(async () => {
    app = await getApp();
    // @ts-ignore
    knex = app.objection.knex;
    // @ts-ignore
    models = app.objection.models;
  });

  beforeEach(async () => {
    // тесты не должны зависеть друг от друга
    // перед каждым тестом выполняем миграции
    // и заполняем БД тестовыми данными
    await knex.migrate.latest();
    await prepareData(app);
  });

  it('index', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('users'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newUser'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('manage users', async () => {
    const { new: newUser } = testData.users;
    let response = await app.inject({
      method: 'POST',
      url: app.reverse('users'),
      payload: {
        data: newUser,
      },
    });

    expect(response.statusCode).toBe(302);
    const expected = {
      ..._.omit(newUser, 'password'),
      passwordDigest: encrypt(newUser.password),
    };
    const user = await models.user.query().findOne({ email: newUser.email });

    expect(user).toMatchObject(expected);
    const { existing: exitedUser } = testData.users;
    await app.inject({ // * Sign in
      method: 'POST',
      url: app.reverse('session'),
      payload: {
        data: newUser,
      },
    });
    const currentUserId = await getUserIdByEmail(app, newUser.email);
    response = await app.inject({
      method: 'GET',
      url: app.reverse('editUser', { id: currentUserId }),
    });

    expect(response.statusCode).toBe(302);
    const anotherUserId = await getUserIdByEmail(app, exitedUser.email);
    response = await app.inject({
      method: 'GET',
      url: app.reverse('editUser', { id: anotherUserId }),
    });
    expect(response.statusCode).toBe(302); // !
  });

  afterEach(async () => {
    await knex.migrate.rollback(); // * после каждого теста откатываем миграции
  });

  afterAll(() => {
    app.close();
  });
});
