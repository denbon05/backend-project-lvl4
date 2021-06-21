// @ts-check

import i18next from 'i18next';
import debug from 'debug';

const logApp = debug('app:routes:statuses');

export default (app) => {
  app
    .get('/statuses', { name: 'statuses', preValidation: app.authenticate }, async (req, reply) => {
      const statuses = await app.objection.models.taskStatus.query();
      logApp('list statuses %O', statuses);
      logApp('req.cookies %O', req.cookies);
      reply.render('statuses/index', { statuses });
      return reply;
    })

    .get('/statuses/new', { name: 'newStatus', preValidation: app.authenticate }, async (req, reply) => {
      const status = await new app.objection.models.taskStatus(); // eslint-disable-line
      logApp('status %O', status);
      reply.render('statuses/new', { status });
      return reply;
    })

    .post('/statuses', { name: 'statusCreate', preValidation: app.authenticate }, async (req, reply) => {
      logApp('post data %O', req.body.data);
      try {
        const status = await app.objection.models.taskStatus.fromJson(req.body.data);
        logApp('status is %O', status);
        await app.objection.models.taskStatus.query().insert(status);
        req.flash('info', i18next.t('flash.status.create.success'));
        reply.redirect(app.reverse('statuses'));
        return reply;
      } catch (err) {
        logApp('post error %O', err);
        req.flash('error', i18next.t('flash.status.create.error'));
        reply.render(app.reverse('newStatus'), { status: req.body.data, errors: err.data });
        return reply.code(422); // ?
      }
    })

    .get('/statuses/:id/edit', { name: 'editStatus', preValidation: app.authenticate }, async (req, reply) => {
      logApp('req.params in edit %O', req.params);
      const { id } = req.params;
      const status = await app.objection.models.taskStatus.query().findById(id);
      return reply.render('statuses/edit', { status });
    })

    .delete('/statuses/:id', { name: 'deleteStatus', preValidation: app.authenticate }, async (req, reply) => {
      const status = await app.objection.models.taskStatus.query().findById(req.params.id);
      const tasksWithStatus = await app.objection.models.task.query()
        .where('statusId', status.id);
      logApp('tasksWithStatus %O', tasksWithStatus);
      if (tasksWithStatus.length === 0) {
        await app.objection.models.taskStatus.query().deleteById(req.params.id);
        req.flash('info', i18next.t('flash.status.delete.success'));
      } else req.flash('error', i18next.t('flash.status.delete.error'));
      return reply.redirect(app.reverse('statuses'));
    })

    .patch('/statuses/:id', { name: 'updateStatus', preValidation: app.authenticate }, async (req, reply) => {
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
        logApp('PATCH error %O', err);
        req.flash('error', i18next.t('flash.status.update.error'));
        reply.render('statuses/edit', { status: { ...status, ...req.body.data }, errors: err.data });
        return reply.code(422);
      }
    });
};
