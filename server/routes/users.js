// @ts-check

import i18next from 'i18next';
import debug from 'debug';

const logApp = debug('task-manager');

export default (app) => {
  app
    .get('/users', { name: 'users' }, async (req, reply) => {
			const users = await app.objection.models.user.query();
			logApp('users %O', users);
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
    });
};
