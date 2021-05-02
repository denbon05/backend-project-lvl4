// @ts-check

import i18next from 'i18next';
import debug from 'debug';

const logApp = debug('app:routes:users');

export default (app) => {
  app
    .get('/users', { name: 'users' }, async (req, reply) => {
      const users = await app.objection.models.user.query();
      reply.render('users/index', { users });
      return reply;
    })

    .get('/users/new', { name: 'newUser' }, (req, reply) => {
      const user = new app.objection.models.user(); // eslint-disable-line
      reply.render('users/new', { user });
    })

    .post('/users', async (req, reply) => { // ?
      try {
        const user = await app.objection.models.user.fromJson(req.body.data);
        await app.objection.models.user.query().insert(user);
        req.flash('info', i18next.t('flash.users.create.success'));
        reply.redirect(app.reverse('root'));
        return reply;
      } catch (err) {
        logApp('post error %O', err);
        req.flash('error', i18next.t('flash.users.create.error'));
        reply.render('users/new', { user: req.body.data, errors: err.data });
        return reply.code(403);
      }
    })

    .get('/users/:id/edit', {
      name: 'editUser', preValidation: app.auth([app.checkIfUserCanEditProfile, app.authenticate])
    }, async (req, reply) => {
      const { id } = req.params;
      const user = await app.objection.models.user.query().findById(id);
      reply.render('users/edit', { user });
      return reply;
    })

    .patch('/users/:id', {
      name: 'updateUserData',
      preValidation: app.auth([app.checkIfUserCanEditProfile, app.authenticate])
    }, async (req, reply) => {
      const { id } = req.params;
      logApp('patch req.body.data-> %O', req.body.data);
      const user = await app.objection.models.user.query().findById(id);
      try {
        await user.$query().update(req.body.data);
        req.flash('info', i18next.t('flash.users.update.success'));
        reply.redirect(app.reverse('root'));
        return reply;
      } catch (err) {
        logApp('patch error %O', err);
        req.flash('error', i18next.t('flash.users.update.error'));
        reply.render('users/edit', { user, errors: err.data });
        return reply.code(422);
      }
    })

    .delete('/users/:id', { name: 'deleteUser', preValidation: app.auth([app.checkIfUserCanEditProfile, app.authenticate]) }, async (req, reply) => {
      req.logOut();
      const { id } = req.params;
      await app.objection.models.user.query().deleteById(id);
      req.flash('info', i18next.t('flash.users.update.success'));
      return reply.redirect(app.reverse('users'));
    });
};
