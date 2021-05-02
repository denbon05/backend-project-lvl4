// @ts-check

import _ from 'lodash';
import debug from 'debug';

const logApp = debug('app:formObjBuilder');

/**
 * @param {Object} object
 * @param {Object} errors
 */
export const buildFromObj = (object, errors = {}) => {
  logApp('buildFromObj %O', object);
  return {
    init: false,
    name: 'form',
    form: object,
    errors: _.groupBy(errors, 'path'),
  };
};

/**
 * @param {Object} object
 * @param {Object} errors
 */
export const buildFromModel = (object, errors = {}) => {
  logApp('buildFromModel %O', object);
  return {
    init: true,
    name: 'form',
    form: Object.keys(object).reduce((acc, field) => ({ ...acc, [field]: '' }), {}),
    errors,
  };
};
