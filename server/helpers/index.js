import i18next from 'i18next';
import _ from 'lodash';
import debug from 'debug';

const log = debug('app:helpers');

export default (app) => ({
  route(name, params) {
    return app.reverse(name, params);
  },
  t(key, options = {}) {
    return i18next.t(key, options);
  },
  _,
  getAlertClass(type) {
    switch (type) {
      case 'error':
        return 'danger';
      case 'success':
        return 'success';
      case 'info':
        return 'info';
      default:
        throw new Error(`Unknown flash type: '${type}'`);
    }
  },
  formatDate(str) {
    const date = new Date(str);
    const newDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
    const offset = date.getTimezoneOffset() / 60;
    const hours = date.getHours();

    newDate.setHours(hours - offset);

    return newDate.toUTCString();
  },
  log,
  sliceId(str) {
    return str.replace(/[Id]/ig, '');
  },
});
