// @ts-check

import fs from 'fs';
import path from 'path';

const getFixturePath = (filename) => path.join(__dirname, '..', '..', '__fixtures__', filename);
const readFixture = (filename) => fs.readFileSync(getFixturePath(filename), 'utf-8').trim();
const getFixtureData = (filename) => JSON.parse(readFixture(filename));

export const getTestData = () => getFixtureData('testData.json');

export const prepareData = async (app) => {
  const { knex } = app.objection;
  // * заполняем БД
  await knex('users').insert(getFixtureData('users.json'));
  await knex('statuses').insert(getFixtureData('statuses.json'));
  await knex('tasks').insert(getFixtureData('tasks.json'));
  await knex('labels').insert(getFixtureData('labels.json'));
};

export const getUserIdByEmail = async (app, email) => {
  const { knex } = app.objection;
  const [user] = await knex('users').select().where('email', email);
  return user.id.toString();
};

export const signIn = (app) => app.inject({
  method: 'POST',
  url: app.reverse('session'),
  payload: {
    data: getTestData().users.existing,
  },
});

export const getTableData = async (app, tableName, dataType = 'id') => {
  const data = await app.objection.knex(tableName).select(dataType);
  return data;
};
