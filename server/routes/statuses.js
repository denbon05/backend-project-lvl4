// @ts-check

import i18next from 'i18next';
import debug from 'debug';

const logApp = debug('task-manager:statuses');

export default (app) => {
  app
    .get('/statuses', { name: 'statuses' }, async (req, reply) => {
      if (!req.isAuthenticated()) { // !
        req.flash('error', i18next.t('flash.authError'));
        return reply.redirect(app.reverse('root'));
      }
      const statuses = await app.objection.models.taskStatus.query();
      reply.render('statuses/index', { statuses });
      return reply;
    })

    .get('/statuses/new', { name: 'newStatus' }, async (req, reply) => {
      if (!req.isAuthenticated()) { // !
        req.flash('error', i18next.t('flash.authError'));
        return reply.redirect(app.reverse('root'));
      }
      const status = await new app.objection.models.taskStatus(); // eslint-disable-line
      logApp('status %O', status);
      reply.render('statuses/new', { status });
      return reply;
    })

    .post('/statuses', async (req, reply) => {
      if (!req.isAuthenticated()) { // !
        req.flash('error', i18next.t('flash.authError'));
        return reply.redirect(app.reverse('root'));
      }
      logApp('post data %O', req.body.data);
      logApp('userId %O', req.user.id);
      if (!req.isAuthenticated()) {
        req.flash('error', i18next.t('flash.authError'));
        reply.code(403);
        return reply.redirect(app.reverse('root'));
      }
      try {
        const status = await app.objection.models.taskStatus.fromJson(req.body.data);
        logApp('status is %O', status);
        await app.objection.models.taskStatus.query().insert({ ...status, userId: req.user.id });
        req.flash('info', i18next.t('flash.status.create.success'));
        reply.redirect(app.reverse('root'));
        return reply;
      } catch (err) {
        logApp('post error %O', err);
        req.flash('error', i18next.t('flash.status.create.error'));
        reply.render(app.reverse('newStatus'), { status: req.body.data, errors: err.data });
        return reply.code(422); // ?
      }
    })

    .get('/statuses/:id/edit', { name: 'editStatus' }, async (req, reply) => {
      if (!req.isAuthenticated()) {
        req.flash('error', i18next.t('flash.authError'));
        return reply.redirect(app.reverse('root'));
      }
      logApp('req.params in edit %O', req.params);
      const { id } = req.params;
      const status = await app.objection.models.taskStatus.query().findById(id);
      return reply.render('statuses/edit', { status });
    })

    .delete('/statuses/:id', { name: 'deleteStatus' }, async (req, reply) => {
      if (!req.isAuthenticated()) {
        req.flash('error', i18next.t('flash.authError'));
        return reply.redirect(app.reverse('root'));
      }
      const { id } = req.params;
      await app.objection.models.taskStatus.query().deleteById(id);
      req.flash('info', i18next.t('flash.status.update.success'));
      return reply.redirect(app.reverse('statuses'));
    })

    .patch('/statuses/:id', { name: 'updateStatus' }, async (req, reply) => {
      if (!req.isAuthenticated()) {
        req.flash('error', i18next.t('flash.authError'));
        return reply.redirect(app.reverse('root'));
      }
      const { id } = req.params;
      const status = await app.objection.models.taskStatus.query().findById(id);
      logApp('in PATCH status %O', status);
      try {
        logApp('patch finded by id status-> %O', status);
        await status.$query().update(req.body.data);
        req.flash('info', i18next.t('flash.status.update.success'));
        reply.redirect(app.reverse('statuses'));
        return reply;
      } catch (err) {
        req.flash('error', i18next.t('flash.status.update.error'));
        reply.render('statuses/edit', { status, errors: err.data });
        return reply.code(422); // ? not working in tests
      }
    });
};
