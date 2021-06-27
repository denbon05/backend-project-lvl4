import {
  describe, beforeAll, it, expect, afterAll, beforeEach, afterEach,
} from '@jest/globals';
import getApp from '../server/index.js';
import { prepareData, signIn, getTestData } from './helpers/index.js';

describe('tasks CRUD', () => {
  let app;
  let knex;
  let models;
  let cookie;
  const testData = getTestData();

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

  it('GET /tasks', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('tasks'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('GET /tasks/new', async () => {
    const response2 = await app.inject({
      method: 'GET',
      url: app.reverse('newTask'),
      cookies: cookie,
    });

    expect(response2.statusCode).toBe(200);
  });

  it('POST /tasks', async () => {
    const {
      labels: { existing: existingLabel },
      tasks: { new: updatedTaskData },
    } = testData;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('createTask'),
      cookies: cookie,
      payload: {
        data: {
          ...updatedTaskData,
          labelIds: [existingLabel.id],
        },
      },
    });
    expect(response.statusCode).toBe(302);
    const task = await models.task.query().findOne({ name: updatedTaskData.name });
    const [relatedLabel] = await task.$relatedQuery('labels');
    expect(task).toMatchObject(updatedTaskData);
    expect(relatedLabel).toMatchObject(existingLabel);
  });

  it('GET /tasks/:id/edit', async () => {
    const existedTask = testData.tasks.existing;
    const response = await app.inject({
      method: 'GET',
      cookies: cookie,
      url: app.reverse('editTask', { id: existedTask.id }),
    });
    expect(response.statusCode).toBe(200);
  });

  it('PATCH /tasks/:id (own task)', async () => {
    const {
      tasks: { existing: existedTask },
      statuses: { existing2: anotherStatus },
    } = testData;

    const updatedTaskData = { name: 'Fix bug', statusId: parseInt(anotherStatus.id, 10) };

    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateTask', { id: existedTask.id }),
      cookies: cookie,
      payload: {
        data: updatedTaskData,
      },
    });
    expect(response.statusCode).toBe(302);

    const task = await models.task.query().findById(existedTask.id);
    const relatedStatus = await task.$relatedQuery('status');
    expect(task).toMatchObject(updatedTaskData);
    expect(relatedStatus).toMatchObject(anotherStatus);
  });

  it('PATCH /tasks/:id (foreign task)', async () => {
    const {
      tasks: { existing2: existedTask2 },
      users: { existing: user1 },
      statuses: { existing: status },
    } = testData;

    const updatedTaskData = { name: 'Write tests', executorId: user1.id, statusId: status.id };

    const response3 = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateTask', { id: existedTask2.id }),
      cookies: cookie,
      payload: {
        data: updatedTaskData,
      },
    });
    expect(response3.statusCode).toBe(302);

    const task2 = await models.task.query().findById(existedTask2.id);
    expect(task2).toMatchObject(updatedTaskData);
  });

  it('DELETE /tasks/:id (own task)', async () => {
    const {
      tasks: { existing: ownTask },
      labels: { existing2: relatedLabel },
    } = testData;
    const response = await app.inject({
      method: 'DELETE',
      cookies: cookie,
      url: app.reverse('deleteTask', { id: ownTask.id }),
    });
    expect(response.statusCode).toBe(302);

    const task = await models.task.query().findById(ownTask.id);
    expect(task).toBeUndefined();

    const label = await models.label.query().findById(relatedLabel.id);
    expect(await label.$relatedQuery('tasks')).toHaveLength(0);
  });

  it('DELETE /tasks/:id (foreign task)', async () => {
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

  it('GET /task with searchParams (filter tasks)', async () => {
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

    tasksQuery
      .modify('filterStatus', existingStatus2.id)
      .modify('filterExecutor', existingUser2.id)
      .modify('filterLabel', existingLabel2.id);

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
