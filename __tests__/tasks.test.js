import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import { omit } from 'lodash';
import getApp from '../server/index.js';
import { prepareData, signIn, getTestData } from './helpers/index.js';

describe('tasks CRUD', () => {
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
    knex = app.objection.knex;
    models = app.objection.models;
  });

  beforeEach(async () => {
    await knex.migrate.latest();
    await prepareData(app);
    cookie = await signIn(app, testData.users.existing);
    taskNewData = testData.tasks.new;
    existingStatus = testData.statuses.existing;
    existingUser = testData.users.existing;
    existingLabel = testData.labels.existing;

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

  it('GET /tasks', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('tasks'),
    });
    expect(response.statusCode).toBe(302);

    const response2 = await app.inject({
      method: 'GET',
      url: app.reverse('tasks'),
      cookies: cookie,
    });
    expect(response2.statusCode).toBe(200);
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

  it('POST /tasks', async () => {
    const updatedTaskData = testData.tasks.new; // удалил в testData.tasks.existing.id
    const response = await app.inject({ // с id возникает ошибка:
      method: 'POST', // "Error: Timeout - Async callback was not invoked within the 5000 ms"
      url: app.reverse('createTask'),
      cookies: cookie,
      payload: {
        data: updatedTaskData,
      },
    });
    expect(response.statusCode).toBe(302);

    const task = await models.task.query().findOne({ name: updatedTaskData.name });
    expect(task).toMatchObject(updatedTaskData);
  });

  it('GET edit tasks', async () => {
    const existedTask = testData.tasks.existing;
    const response = await app.inject({
      method: 'GET',
      cookies: cookie,
      url: app.reverse('editTask', { id: existedTask.id }),
    });
    expect(response.statusCode).toBe(200);
  });

  it('PATCH own task', async () => {
    const {
      tasks: { existing: existedTask },
      statuses: { existing2: anotherStatus },
    } = testData;

    const updatedTaskData = { name: 'Fix bug', statusId: parseInt(anotherStatus.id, 10) };

    const response2 = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateTask', { id: existedTask.id }),
      cookies: cookie,
      payload: {
        data: updatedTaskData,
      },
    });
    expect(response2.statusCode).toBe(302);

    const task = await models.task.query().findById(existedTask.id);
    expect(task).toMatchObject(updatedTaskData);
  });

  it('PATCH foreign task', async () => {
    const {
      tasks: { existing2: existedTask2 },
      users: { existing: user1 },
      statuses: { existing: status },
    } = testData;

    const updatedTaskData2 = { name: 'Write tests', executorId: user1.id, statusId: status.id };

    const response3 = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateTask', { id: existedTask2.id }),
      cookies: cookie,
      payload: {
        data: updatedTaskData2,
      },
    });
    expect(response3.statusCode).toBe(302);

    const task2 = await models.task.query().findById(existedTask2.id);
    expect(task2).toMatchObject(updatedTaskData2);
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
      labels: { existing2: existingLabel2 },
    } = testData;

    const response2 = await app.inject({
      method: 'GET',
      cookies: cookie,
      url: app.reverse('tasks'),
      query: {
        status: existingStatus2.id, // related with 2 existing users
        executor: existingUser2.id, // compare 1 item
        label: existingLabel2.id, // should stay one item
      },
    });
    expect(response2.statusCode).toBe(200);

    const tasksQuery = models.task.query()
      .withGraphJoined('[creator, executor, status, labels]');

    tasksQuery.modify('filterStatus', existingStatus2.id);
    tasksQuery.modify('filterExecutor', existingUser2.id);
    tasksQuery.modify('filterLabel', existingLabel2.id);
    const tasks = await tasksQuery;
    expect(tasks).toHaveLength(1);

    tasksQuery.modify('filterCreator', existingUser2.id);
    const tasks2 = await tasksQuery;
    expect(tasks2).toHaveLength(0);
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
