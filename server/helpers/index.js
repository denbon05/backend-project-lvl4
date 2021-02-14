import i18next from 'i18next';
import _ from 'lodash';
import debug from 'debug';

const logApp = debug('task-manager');

export default (app) => ({
	route(name) {
		logApp('URN path o%', app.reverse(name));
    return app.reverse(name);
  },
  t(key) {
    return i18next.t(key);
  },
	_,
	getAlertClass(type) {
		logApp('Alert class is o%', type);
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
