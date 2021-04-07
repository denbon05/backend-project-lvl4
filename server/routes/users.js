// @ts-check

import i18next from 'i18next';
import debug from 'debug';

const logApp = debug('task-manager');

export default (app) => {
  app
    .get('/users', { name: 'users' }, async (req, reply) => {
      // logApp('req SEESION %O', req.session)
      // logApp('req IN req.session %O', req.session.passport)
      const users = await app.objection.models.user.query();
      reply.render('users/index', { users });
      return reply;
    })
    .get('/users/new', { name: 'newUser' }, (req, reply) => {
      const user = new app.objection.models.user(); // eslint-disable-line
      reply.render('users/new', { user });
    })
    .post('/users', async (req, reply) => {
      try {
        const user = await app.objection.models.user.fromJson(req.body.data);
        await app.objection.models.user.query().insert(user);
        req.flash('info', i18next.t('flash.users.create.success'));
        reply.redirect(app.reverse('root'));
        return reply;
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.users.create.error'));
        reply.render('users/new', { user: req.body.data, errors: data });
        return reply;
      }
    })
    .get('/users/:id/edit', { name: 'editUser' }, async (req, reply) => {
      if (!req.isAuthenticated() || req.user.id.toString() !== req.params.id) { // !
        req.flash('error', i18next.t('flash.users.update.notAuthErr'));
        // reply.code(403);
        return reply.redirect(app.reverse('users'));
      }
      const { id } = req.params;
      const user = await app.objection.models.user.query().findById(id);
      // logApp('IN USERS/EDIT user data %O', user);
      reply.render('users/edit', { user });
      return reply;
    })
    .patch('/users/:id', { name: 'updateUserData' }, async (req, reply) => {
      const { id } = req.params;
      logApp('I am in patch req.body.data-> %O', req.body.data);
      const user = await app.objection.models.user.query().findById(id);
      try {
        await user.$query().update(req.body.data);
        // logApp('I am in patch newUSER from db-> %O', user)
        req.flash('info', i18next.t('flash.users.update.success'));
        reply.redirect(app.reverse('root'));
        return reply;
      } catch (err) {
        // throw Error(err);
        // logApp('I am in patch err.data -> %O', err.data)
        req.flash('error', i18next.t('flash.users.update.error'));
        reply.render('users/edit', { user, errors: err.data });
        return reply;
      }
    })
    .delete('/users/:id', { name: 'deleteUser' }, async (req, reply) => {
      if (!req.isAuthenticated() || req.user.id.toString() !== req.params.id) { // !
        req.flash('error', i18next.t('flash.users.update.notAuthErr'));
        return reply.redirect(app.reverse('users'));
      }
      const { id } = req.params;
      await app.objection.models.user.query().deleteById(id);
      return reply.redirect(302, '/users');
    });
};
