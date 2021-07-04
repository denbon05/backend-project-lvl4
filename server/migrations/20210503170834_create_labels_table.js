// @ts-check

exports.up = (knex) => (
  knex.schema.createTable('labels', (table) => {
    table.increments('id').primary();
    table.string('name').unique();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  })
);

exports.down = (knex) => knex.schema.dropTable('labels');
