#!/usr/bin/env node
import debug from 'debug';
import getApp from '../index.js';

const logApp = debug('app');

const port = process.env.PORT || 5000;
const address = '0.0.0.0';

getApp().listen(port, address, () => {
  logApp('Server is running on port %O', port);
});
