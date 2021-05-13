// @ts-check

const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const migrations = {
  directory: path.join(__dirname, 'server', 'migrations'),
};

const herokuConfig = {
  client: 'postgresql',
  connection: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 5432,
    host: 'ec2-54-247-158-179.eu-west-1.compute.amazonaws.com',
    ssl: {
      rejectUnauthorized: false,
    },
  },
  useNullAsDefault: true,
  migrations,
};

const githubConfig = {
  client: 'sqlite3',
  connection: {
    filename: './database.sqlite',
  },
  useNullAsDefault: true,
  migrations,
};

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './database.sqlite',
    },
    useNullAsDefault: true,
    migrations,
  },
  test: {
    client: 'sqlite3',
    connection: ':memory:',
    useNullAsDefault: true,
    migrations,
  },
  production: process.env.IS_HEROKU_ENV ? herokuConfig : githubConfig,
};
