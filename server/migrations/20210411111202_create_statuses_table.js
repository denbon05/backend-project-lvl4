// @ts-check

exports.up = (knex) => (
  knex.schema.createTable('statuses', (table) => {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users');
    table.string('name');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  })
);

exports.down = (knex) => knex.schema.dropTable('statuses');
