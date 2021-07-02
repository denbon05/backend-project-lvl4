// @ts-check

import i18next from 'i18next';
import debug from 'debug';
import { omit } from 'lodash';

const logApp = debug('app:routes:users');

export default (app) => {
  app
    .get('/users', { name: 'users' }, async (req, reply) => {
      const users = await app.objection.models.user.query();
      reply.render('users/index', { users });
      return reply;
    })

    .get('/users/new', { name: 'newUser' }, (req, reply) => {
      const user = new app.objection.models.user();
      reply.render('users/new', { user });
    })

    .post('/users', async (req, reply) => {
      try {
        const user = await app.objection.models.user.fromJson(req.body.data);
        await app.objection.models.user.query().insert(user);
        req.flash('info', i18next.t('flash.users.create.success'));
        reply.redirect(app.reverse('root'));
      } catch ({ data }) {
        logApp('post error.data %O', data);
        logApp('POST users req.body.data %O', req.body.data);
        req.flash('error', i18next.t('flash.users.create.error'));
        reply.render('users/new', { user: req.body.data, errors: data });
      }
      return reply;
    })

    .get('/users/:id/edit', {
      name: 'editUser', preValidation: app.authorize,
    }, async (req, reply) => {
      const { id } = req.params;
      const user = await app.objection.models.user.query().findById(id);
      reply.render('users/edit', { user });
      return reply;
    })

    .patch('/users/:id', {
      name: 'updateUserData',
      preValidation: app.authorize,
    }, async (req, reply) => {
      const { id } = req.params;
      logApp('patch req.body.data-> %O', req.body.data);
      const user = await app.objection.models.user.query().findById(id);
      logApp('patch user from db %O', user);
      try {
        await user.$query().update(req.body.data);
        req.flash('info', i18next.t('flash.users.update.success'));
        reply.redirect(app.reverse('users'));
      } catch ({ data }) {
        logApp('patch error.data %O', data);
        req.flash('error', i18next.t('flash.users.update.error'));
        const userWithoutPassword = omit(user, ['passwordDigest']);
        logApp('patch error omited user %O', userWithoutPassword);
        reply.render('users/edit', {
          user: { ...userWithoutPassword, ...req.body.data },
          errors: data,
        });
        reply.code(422);
      }
      return reply;
    })

    .delete('/users/:id', {
      name: 'deleteUser',
      preValidation: app.authorize,
    }, async (req, reply) => {
      logApp('req.user %O', req.user);
      const user = await app.objection.models.user.query().findById(req.user.id);
      const notExecutedTasks = await user.$relatedQuery('executorTasks');
      const createdByUserTasks = await user.$relatedQuery('creatorTasks');
      logApp('user %O', user);
      logApp('user notExecutedTasks %O', notExecutedTasks);
      logApp('user createdByUserTasks %O', createdByUserTasks);
      if (notExecutedTasks.length > 0 || createdByUserTasks.length > 0) {
        req.flash('error', i18next.t('flash.users.delete.error'));
      } else {
        req.logOut();
        await app.objection.models.user.query().deleteById(req.params.id);
        req.flash('info', i18next.t('flash.users.delete.success'));
      }
      reply.redirect(app.reverse('users'));
      return reply;
    });
};
