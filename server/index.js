// @ts-check

import debug from 'debug';
import dotenv from 'dotenv';
import path from 'path';
import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import fastifyReverseRoutes from 'fastify-reverse-routes';
import fastifyObjectionjs from 'fastify-objectionjs';
import fastifyErrorPage from 'fastify-error-page';
import fastifySensible from 'fastify-sensible';
import fastifySecureSession from 'fastify-secure-session';
import fastifyFormbody from 'fastify-formbody';
import fastifyPassport from 'fastify-passport';
import fastifyMethodOverride from 'fastify-method-override';
import qs from 'qs';
import pointOfView from 'point-of-view';
import Pug from 'pug';
import i18next from 'i18next';
// @ts-ignore
import webpackConfig from '../webpack.config.babel.js';
import resources from './locales/index.js';

import addRoutes from './routes/index.js';
import getHelpers from './helpers/index.js';
// @ts-ignore
import knexConfig from '../knexfile.js';
import models from './models/index.js';
import FormStrategy from './lib/passportStrategies/FormStrategy.js';

// heroku pg:psql - connect db
// heroku pg:credentials:url DATABASE - all info
// pg_stat_activity - monitoring all activity in db

const logApp = debug('task-manager');

dotenv.config();
const mode = process.env.NODE_ENV || 'development';
// const isProduction = mode === 'production';
const isDevelopment = mode === 'development';
logApp('Mode app: %o', mode);

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

const registerPlugins = (app) => {
  app.register(fastifySensible);
  app.register(fastifyErrorPage);
  // @ts-ignore
  app.register(fastifyReverseRoutes.plugin);
  app.register(fastifyFormbody, { parser: qs.parse });
  app.register(fastifySecureSession, {
    secret: process.env.SESSION_KEY,
    cookie: {
      path: '/',
    },
  });

  fastifyPassport.registerUserDeserializer(
    (user) => app.objection.models.user.query().findById(user.id),
  );
  fastifyPassport.registerUserSerializer((user) => Promise.resolve(user));
  fastifyPassport.use(new FormStrategy('form', app));
  app.register(fastifyPassport.initialize());
  app.register(fastifyPassport.secureSession());
  app.decorate('fp', fastifyPassport);
  app.decorate('authenticate', (...args) => fastifyPassport.authenticate(
    'form',
    {
      failureRedirect: app.reverse('root'),
      failureFlash: i18next.t('flash.authError'),
    },
  // @ts-ignore
  )(...args));

  app.register(fastifyMethodOverride);
  logApp('knexConfig[mode]: %O', knexConfig[mode]);
  app.register(fastifyObjectionjs, {
    knexConfig: knexConfig[mode],
    models,
  });
};

const addHooks = (app) => {
  app.addHook('preHandler', async (req, reply) => {
    logApp('req.isAuthenticated() %o', req.isAuthenticated());
    reply.locals = { // eslint-disable-line
      isAuthenticated: () => req.isAuthenticated(),
    };
  });
};

export default () => {
  const app = fastify({
    logger: {
      prettyPrint: isDevelopment,
    },
  });

  registerPlugins(app);

  setupLocalization();
  setUpViews(app);
  setUpStaticAssets(app);
  addRoutes(app);
  addHooks(app);

  return app;
};
