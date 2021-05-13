// @ts-check

import i18next from 'i18next';
import debug from 'debug';

const logApp = debug('app:routes:session');

export default (app) => {
  app
    .get('/session/new', { name: 'newSession' }, (req, reply) => {
      const signInForm = {};
      reply.render('session/new', { signInForm });
    })

    .post('/session', { name: 'session' }, app.fp.authenticate('form', async (req, reply, err, user) => {
      if (err) return app.httpErrors.internalServerError(err);
      if (!user) {
        const signInForm = req.body.data;
        const errors = {
          email: [{ message: i18next.t('flash.session.create.error') }],
        };
        return reply.render('session/new', { signInForm, errors });
      }
      const logInUser = await req.logIn(user);
      logApp('logInUser %O', logInUser);
      req.flash('success', i18next.t('flash.session.create.success'));
      return reply.redirect(app.reverse('root'));
    }))

    .delete('/session', (req, reply) => {
      req.logOut();
      req.flash('info', i18next.t('flash.session.delete.success'));
      reply.redirect(app.reverse('root'));
    });
};
