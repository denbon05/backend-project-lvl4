// @ts-check

exports.up = (knex) => (
  knex.schema.createTable('tasks_labels', (table) => {
    table.integer('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.integer('label_id').references('id').inTable('labels').onDelete('CASCADE');
  })
);

exports.down = (knex) => knex.schema.dropTable('tasks_labels');
