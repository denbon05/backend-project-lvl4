// @ts-check

exports.up = (knex) => (
  knex.schema.table('statuses', (table) => {
    table.timestamp('created_at').defaultTo(knex.fn.now());
  })
);

exports.down = (knex) => knex.schema.table('statuses', (table) => {
  table.dropColumn('created_at');
});
