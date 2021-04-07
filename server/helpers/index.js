import i18next from 'i18next';
import _ from 'lodash';
// import debug from 'debug';

// const logApp = debug('task-manager');

export default (app) => ({
  route(name, params) {
    // if (params) {
    //   logApp('in route name %O', name);
    //   logApp('in route params %O', params);
    // }
    return app.reverse(name, params);
  },
  t(key) {
    return i18next.t(key);
  },
  _,
  getAlertClass(type) {
    switch (type) {
      // case 'failure':
      //   return 'danger';
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
    return date.toLocaleString();
  },
});
