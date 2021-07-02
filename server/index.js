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
import fastifyAuth from 'fastify-auth';
import qs from 'qs';
import pointOfView from 'point-of-view';
import Pug from 'pug';
import i18next from 'i18next';
import Rollbar from 'rollbar';
import webpackConfig from '../webpack.config.babel.js';
import resources from './locales/index.js';
import addRoutes from './routes/index.js';
import getHelpers from './helpers/index.js';
import knexConfig from '../knexfile.js';
import models from './models/index.js';
import FormStrategy from './lib/passportStrategies/FormStrategy.js';
import AuthorizeStrategy from './lib/passportStrategies/AuthorizeStrategy.js';

const logApp = debug('app');

dotenv.config();
const mode = process.env.NODE_ENV || 'development';
const isProduction = mode === 'production';
const isDevelopment = mode === 'development';
logApp('Mode app: %o', mode);

const setUpErrorHandling = (app) => {
  const rollbar = new Rollbar({
    accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
    captureUncaught: true,
    captureUnhandledRejections: true,
  });

  app.setErrorHandler((err, req, reply) => {
    req.log.error(err);
    rollbar.log(err);
    req.flash('error', err.message);
    reply.redirect('/');
  });
};

const setUpViews = (app) => {
  const { devServer } = webpackConfig;
  const devHost = `http://${devServer.host}:${devServer.port}`;
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
  app.register(fastifyStatic, {
    root: pathPublic,
    prefix: '/assets/',
  });
};

const setupLocalization = () => {
  i18next
    .init({
      lng: 'en',
      fallbackLng: 'ru',
      debug: false,
      resources,
      interpolation: {
        escapeValue: false,
      },
    });
};

const registerPlugins = (app) => {
  app.register(fastifyAuth);
  app.register(fastifySensible);
  app.register(fastifyErrorPage);
  // @ts-ignore
  app.register(fastifyReverseRoutes.plugin);
  app.register(fastifyFormbody, { parser: qs.parse });
  app.register(fastifySecureSession, {
    secret: process.env.SESSION_KEY || '�!4@�I#Vcۛ�b]��4H՝p2�~�*p',
    cookie: {
      path: '/',
    },
  });

  fastifyPassport.registerUserDeserializer( // ?
    (user) => app.objection.models.user.query().findById(user.id),
  );
  fastifyPassport.registerUserSerializer((user) => Promise.resolve(user));
  fastifyPassport.use(new FormStrategy('form', app));
  fastifyPassport.use(new AuthorizeStrategy('permissions'));
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
  app.decorate('authorize', (...args) => fastifyPassport.authenticate(
    'permissions',
    {
      failureRedirect: app.reverse('users'),
      failureFlash: i18next.t('flash.users.authError'),
    },
  // @ts-ignore
  )(...args));

  app.register(fastifyMethodOverride);
  app.register(fastifyObjectionjs, {
    knexConfig: knexConfig[mode],
    models,
  });
};

const addHooks = (app) => {
  app.addHook('preHandler', async (req, reply) => {
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

  if (isProduction) setUpErrorHandling(app);
  registerPlugins(app);
  setupLocalization();
  setUpViews(app);
  setUpStaticAssets(app);
  addHooks(app);

  app.after(() => {
    addRoutes(app);
  });
  addHooks(app);

  return app;
};
