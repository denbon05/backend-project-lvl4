// @ts-check

import { Model } from 'objection';
import objectionUnique from 'objection-unique';

import encrypt from '../lib/secure.js';
import TaskStatus from './TaskStatus.js';

const unique = objectionUnique({ fields: ['email'] });

export default class User extends unique(Model) {
  // @ts-ignore
  static get tableName() {
    return 'users';
  }

  // @ts-ignore
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        id: { type: 'integer' },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 3, errorMessage: 'Have be at least 3 characters' },
      },
    };
  }

  // @ts-ignore
  set password(value) {
    this.passwordDigest = encrypt(value);
  }

  verifyPassword(password) {
    return encrypt(password) === this.passwordDigest;
  }

  static get relationMappings() {
    return {
      statuses: {
        relation: Model.HasManyRelation,
        modelClass: TaskStatus,
        join: {
          from: 'user.id',
          to: 'status.user_id',
        },
      },
    };
  }
}
