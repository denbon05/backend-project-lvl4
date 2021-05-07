// @ts-check

import { Model } from 'objection';
import objectionUnique from 'objection-unique';
import path from 'path';

const unique = objectionUnique({ fields: ['name'] });

export default class Label extends unique(Model) {
  $parseJson(json, options) {
    const parsed = super.$parseJson(json, options);
    return {
      ...parsed,
      ...(parsed.name && { name: parsed.name.trim() }),
    };
  }

  static get tableName() {
    return 'labels';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],

      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1, errorMessage: 'Have to be at least 1 character' },
        creatorId: { type: 'integer' },
      },
    };
  }

  static get relationMappings() {
    return {
      creator: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'User'),
        join: {
          from: 'labels.creatorId',
          to: 'users.id',
        },
      },
    };
  }
}
