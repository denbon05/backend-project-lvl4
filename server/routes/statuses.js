import i18next from 'i18next';
import debug from 'debug';

const logApp = debug('app:routes:statuses');

export default (app) => {
  app
    .get('/statuses', { name: 'statuses', preValidation: app.authenticate }, async (req, reply) => {
      const statuses = await app.objection.models.taskStatus.query();
      reply.render('statuses/index', { statuses });
      return reply;
    })

    .get('/statuses/new', { name: 'newStatus', preValidation: app.authenticate }, async (req, reply) => {
      const status = await new app.objection.models.taskStatus();
      reply.render('statuses/new', { status });
      return reply;
    })

    .post('/statuses', { name: 'statusCreate', preValidation: app.authenticate }, async (req, reply) => {
      logApp('post data %O', req.body.data);
      try {
        const statusData = await app.objection.models.taskStatus.fromJson(req.body.data);
        await app.objection.models.taskStatus.query().insert(statusData);
        req.flash('info', i18next.t('flash.status.create.success'));
        reply.redirect(app.reverse('statuses'));
      } catch (err) {
        logApp('post error %O', err);
        req.flash('error', i18next.t('flash.status.create.error'));
        const status = new app.objection.models.taskStatus().$set(req.body.data);
        reply.render(app.reverse('newStatus'), { status, errors: err.data });
        reply.code(422);
      }
      return reply;
    })

    .get('/statuses/:id/edit', { name: 'editStatus', preValidation: app.authenticate }, async (req, reply) => {
      logApp('req.params in edit %O', req.params);
      const { id } = req.params;
      const status = await app.objection.models.taskStatus.query().findById(id);
      reply.render('statuses/edit', { status });
      return reply;
    })

    .delete('/statuses/:id', { name: 'deleteStatus', preValidation: app.authenticate }, async (req, reply) => {
      const status = await app.objection.models.taskStatus.query().findById(req.params.id);
      const tasks = await status.$relatedQuery('tasks');
      logApp('DELETE statuses - number of tasks dependents %O', tasks.length);
      if (tasks.length === 0) {
        await app.objection.models.taskStatus.query().deleteById(req.params.id);
        req.flash('info', i18next.t('flash.status.delete.success'));
      } else {
        req.flash('error', i18next.t('flash.status.delete.error'));
      }
      reply.redirect(app.reverse('statuses'));
      return reply;
    })

    .patch('/statuses/:id', {
      name: 'updateStatus', preValidation: app.authenticate,
    }, async (req, reply) => {
      const { id } = req.params;
      const oldStatus = await app.objection.models.taskStatus.query().findById(id);
      try {
        await oldStatus.$query().update(req.body.data);
        req.flash('info', i18next.t('flash.status.update.success'));
        reply.redirect(app.reverse('statuses'));
      } catch (err) {
        logApp('PATCH error %O', err);
        req.flash('error', i18next.t('flash.status.update.error'));
        const status = new app.objection.models.taskStatus()
          .$set({ ...oldStatus, ...req.body.data });
        reply.render('statuses/edit', { status, errors: err.data });
        reply.code(422);
      }
      return reply;
    });
};
