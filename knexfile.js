// @ts-check

const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const migrations = {
  directory: path.join(__dirname, 'server', 'migrations'),
};

module.exports = {
  development: {
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
  },
  test: {
    client: 'sqlite3',
    connection: ':memory:',
    useNullAsDefault: true,
    migrations,
  },
  production: {
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
  },
};
