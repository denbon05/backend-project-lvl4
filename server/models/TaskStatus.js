// @ts-check

import { Model } from 'objection';
import path from 'path';

export default class TaskStatus extends Model {
  // @ts-ignore
  static get tableName() {
    return 'statuses';
  }

  // @ts-ignore
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1, errorMessage: 'Have be at least 1 characters' },
        userId: { type: 'integer' },
      },
    };
  }

  static get relationMappings() {
    return {
      autor: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'User.js'),
        join: {
          from: 'status.user_id',
          to: 'user.id',
        },
      },
    };
  }
}
