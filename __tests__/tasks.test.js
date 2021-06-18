// @ts-check

import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import getApp from '../server/index.js';
import { prepareData, getCookie, getTestData } from './helpers/index.js';

describe('test tasks CRUD', () => {
  let app;
  let knex;
  let models;
  let cookie;
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
    cookie = await getCookie(app, testData.users.existing);
  });

  it('GET /tasks/new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newTask'),
    });
    expect(response.statusCode).toBe(302);

    const response2 = await app.inject({
      method: 'GET',
      url: app.reverse('newTask'),
      cookies: cookie,
    });
    expect(response2.statusCode).toBe(200);
  });

  it('create tasks', async () => {
    const newTaskData = testData.tasks.new; // удалил в testData.tasks.existing.id
    const response = await app.inject({ // с id возникает ошибка:
      method: 'POST', // "Error: Timeout - Async callback was not invoked within the 5000 ms"
      url: app.reverse('createTask'),
      cookies: cookie,
      payload: {
        data: newTaskData,
      },
    });
    expect(response.statusCode).toBe(302);

    const task = await models.task.query().findOne({ name: newTaskData.name });
    expect(task).toMatchObject(newTaskData);

    const response2 = await app.inject({
      method: 'POST',
      url: app.reverse('createTask'),
      cookies: cookie,
      payload: {
        data: { name: '' },
      },
    });
    expect(response2.statusCode).toBe(422);
  });

  it('edit tasks', async () => {
    const {
      tasks: { existing: existedTask, existing2: existedTask2 },
      statuses: { existing2: anotherStatus },
      users: { existing: user1 },
    } = testData;
    const response = await app.inject({
      method: 'GET',
      cookies: cookie,
      url: app.reverse('editTask', { id: existedTask.id }),
    });
    expect(response.statusCode).toBe(200);

    const newTaskData = { name: 'Fix bug', statusId: parseInt(anotherStatus.id, 10) };

    const response2 = await app.inject({ // own task
      method: 'PATCH',
      url: app.reverse('updateTask', { id: existedTask.id }),
      cookies: cookie,
      payload: {
        data: newTaskData,
      },
    });
    expect(response2.statusCode).toBe(302);

    const task = await models.task.query().findById(existedTask.id);
    expect(task).toMatchObject(newTaskData);

    const newTaskData2 = { name: 'Write tests', executorId: user1.id };

    const response3 = await app.inject({ // foreign task
      method: 'PATCH',
      url: app.reverse('updateTask', { id: existedTask2.id }),
      cookies: cookie,
      payload: {
        data: newTaskData2,
      },
    });
    expect(response3.statusCode).toBe(302);

    const task2 = await models.task.query().findById(existedTask2.id);
    expect(task2).toMatchObject(newTaskData2);
  });

  it('delete own task', async () => {
    const {
      existing: ownTask,
    } = testData.tasks;
    const response = await app.inject({
      method: 'DELETE',
      cookies: cookie,
      url: app.reverse('deleteTask', { id: ownTask.id }),
    });
    expect(response.statusCode).toBe(302);

    const task = await models.task.query().findById(ownTask.id);
    expect(task).toBeUndefined();
  });

  it('delete foreign task', async () => {
    const {
      existing2: foreignTask,
    } = testData.tasks;

    const response2 = await app.inject({
      method: 'DELETE',
      cookies: cookie,
      url: app.reverse('deleteTask', { id: foreignTask.id }),
    });
    expect(response2.statusCode).toBe(302);

    const anotherTask = await models.task.query().findById(foreignTask.id);
    expect(anotherTask).toMatchObject(foreignTask);
  });

  it('filter tasks', async () => {
    const {
      statuses: { existing2: existingStatus2 },
      users: { existing2: existingUser2 },
      labels: { existing2: existingLabel },
    } = testData;

    const response2 = await app.inject({
      method: 'GET',
      cookies: cookie,
      url: app.reverse('tasks'),
      query: {
        status: existingStatus2.id, // related with 2 existing users
        executor: existingUser2.id, // compare 1 item
        label: existingLabel.id, // should stay one item
      },
    });
    expect(response2.statusCode).toBe(200);

    const tasksQuery = models.task.query()
      .withGraphJoined('[creator, executor, status, labels]');

    tasksQuery.modify('filterStatus', existingStatus2.id);
    tasksQuery.modify('filterExecutor', existingUser2.id);
    tasksQuery.modify('filterLabel', existingLabel.id);
    const tasks = await tasksQuery;
    expect(tasks).toHaveLength(1);

    tasksQuery.modify('filterCreator', existingUser2.id);
    const tasks2 = await tasksQuery;
    expect(tasks2).toHaveLength(0);
  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
