// @ts-check

import path from 'path';
import { Model } from 'objection';

export default class Task extends Model {
  $parseJson(json, options) {
    const parsed = super.$parseJson(json, options);
    const obj = {
      ...(parsed.id && { id: Number(parsed.id) }),
      ...(parsed.name && { name: parsed.name.trim() }),
      ...(parsed.description && { description: parsed.description.trim() }),
      ...(parsed.statusId && { statusId: Number(parsed.statusId) }),
      ...(parsed.executorId && { executorId: Number(parsed.executorId) }),
      ...(parsed.creatorId && { creatorId: Number(parsed.creatorId) }),
      ...(parsed.labels && { labels: parsed.labels }),
    };
    return obj;
  }

  static get tableName() {
    return 'tasks';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'creatorId', 'statusId'],

      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1, maxLength: 30 },
        description: { type: 'string' },
        creatorId: { type: 'integer' },
        statusId: { type: 'integer' },
        executorId: { type: 'integer' },
      },
    };
  }

  static get relationMappings() {
    return {
      creator: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'User'),
        join: {
          from: 'tasks.creatorId',
          to: 'users.id',
        },
      },
      executor: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'User'),
        join: {
          from: 'tasks.executorId',
          to: 'users.id',
        },
      },
      status: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'TaskStatus'),
        join: {
          from: 'tasks.statusId',
          to: 'statuses.id',
        },
      },
      labels: {
        relation: Model.ManyToManyRelation,
        modelClass: path.join(__dirname, 'Label'),
        join: {
          from: 'tasks.id',
          through: {
            from: 'tasks_labels.taskId',
            to: 'tasks_labels.labelId',
          },
          to: 'labels.id',
        },
      },
    };
  }

  static modifiers = {
    filterStatus(query, id) {
      query.where('statusId', id);
    },

    filterExecutor(query, id) {
      query.where('executorId', id);
    },

    filterLabel(query, id) {
      query.where('labels.id', id);
    },

    filterCreator(query, id) {
      query.where('creatorId', id);
    },
  };
}
