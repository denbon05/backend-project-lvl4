// @ts-check

import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import getApp from '../server/index.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('test relations CRUD', () => {
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
    await knex.migrate.latest();
    await prepareData(app);
    await signIn(app);
  });

  it('Create task with relations: labels, statuses, executor', async () => {
    const taskNewData = testData.tasks.new;

    const response = await app.inject({
      method: 'POST',
      url: app.reverse('createTask'),
      payload: {
        data: {
          ...taskNewData,
          labelIds: [1, 2],
        },
      },
    });
    // console.log("response ->>", response.statusCode);
    console.log('taskData ->>', taskNewData);

    const task = await models.task // ? не находит task withGraphJoined('labels')
      .query()
      .findOne({ 'tasks.name': taskNewData.name })
      .withGraphJoined('labels');
    
    console.log('task ->>', task);
    // console.log('labels ->>', task.labels);

    // const newTask = await models.task.query().findOne({ 'tasks.name': taskData.name });
    // console.log('new task ->>', newTask);

  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
