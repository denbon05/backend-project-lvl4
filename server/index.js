// @ts-check

import debug from 'debug';
import dotenv from 'dotenv';
import path from 'path';
import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import pointOfView from 'point-of-view';
import Pug from 'pug';
import i18next from 'i18next';
// @ts-ignore
import webpackConfig from '../webpack.config.babel.js';
import resources from './locales/index.js';

import addRoutes from './routes/index.js';
import getHelpers from './helpers/index.js';

const logApp = debug('task-manager');

dotenv.config();
const mode = process.env.NODE_ENV || 'development';
const isProduction = mode === 'production';
const isDevelopment = mode === 'development';

const setUpViews = (app) => {
  const { devServer } = webpackConfig;
  const devHost = `http://${devServer.host}:${devServer.port}`;
  logApp('devHost: %o', devHost);
  const domain = isDevelopment ? devHost : '';
  const helpers = getHelpers(app);
	const defaultContext = { ...helpers, assetPath: (filename) => `${domain}/assets/${filename}` };
  app.register(pointOfView, {
    engine: {
      pug: Pug,
    },
    includeViewExtension: true,
    defaultContext,
    templates: path.join(__dirname, '..', 'server', 'views'),
  });

  app.decorateReply('render', function render(viewPath, locals) {
    this.view(viewPath, { ...locals, reply: this });
  });
};

const setUpStaticAssets = (app) => {
	const pathPublic = path.join(__dirname, '..', 'dist', 'public');
  // const pathPublic = isProduction
  //   ? path.join(__dirname, '..', 'public')
  //   : path.join(__dirname, '..', 'dist', 'public');
  logApp('pathPublic: %o', pathPublic);
  app.register(fastifyStatic, {
    root: pathPublic,
    prefix: '/assets/',
  });
};

const setupLocalization = () => {
  i18next
    .init({
      lng: 'ru',
      fallbackLng: 'en',
      debug: isDevelopment,
      resources,
    });
};

export default () => {
  const app = fastify({
    logger: {
      prettyPrint: isDevelopment,
    },
  });

  setupLocalization();
  setUpViews(app);
  setUpStaticAssets(app);
  addRoutes(app);

  return app;
};
