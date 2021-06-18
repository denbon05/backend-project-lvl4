// @ts-check

import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import { omit } from 'lodash';
import getApp from '../server/index.js';
import {
  getTestData, prepareData, getCookie,
} from './helpers/index.js';

describe('test relations CRUD', () => {
  let app;
  let knex;
  let models;
  let cookie;
  const testData = getTestData();

  let taskNewData;
  let existingStatus;
  let existingUser;
  let existingLabel;

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
    taskNewData = testData.tasks.new;
    existingStatus = testData.statuses.existing;
    existingUser = testData.users.existing;
    existingLabel = testData.labels.existing1;

    await app.inject({
      method: 'POST',
      url: app.reverse('createTask'),
      cookies: cookie,
      payload: {
        data: {
          ...taskNewData,
          statusId: existingStatus.id,
          executorId: existingUser.id,
          labelIds: existingLabel.id,
        },
      },
    });
  });

  it('Tasks relations with labels, statuses, executor', async () => {
    const task = await models.task
      .query()
      .findOne({ 'tasks.name': taskNewData.name })
      .withGraphJoined('labels');

    expect(task.labels[0].id).toEqual(existingLabel.id);
    expect(task.statusId).toEqual(existingStatus.id);
    expect(task.executorId).toEqual(existingUser.id);
  });

  it("Can't delete statuse dependent on task", async () => {
    await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteStatus', { id: existingStatus.id }),
      cookies: cookie,
    });

    const status = await models.taskStatus.query().findById(existingStatus.id);
    expect(status).toMatchObject(existingStatus);
  });

  it("Can't delete user dependent on task", async () => {
    await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteUser', { id: existingUser.id }), // own account
      cookies: cookie,
    });

    const user = await models.user.query().findById(existingUser.id);
    expect(user).toMatchObject(omit(existingUser, 'password'));
  });

  it("Can't delete label dependent on task", async () => {
    await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteLabel', { id: existingLabel.id }),
      cookies: cookie,
    });

    const label = await models.label.query().findById(existingLabel.id);
    expect(label).toMatchObject(existingLabel);
  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
