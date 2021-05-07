// @ts-check

exports.up = (knex) => (
  knex.schema.createTable('labels', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.integer('creator_id').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  })
);

exports.down = (knex) => knex.schema.dropTable('labels');
